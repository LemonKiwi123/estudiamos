'use strict';
/* ================= Sync merge core (shared by the app and the PC server) =================
   The saved data is split into small "records" so two devices can change different things at the same time:
   every card field, deck setting, history entry, daily log number, etc. is its own record.
   Key = JSON array of segments:  'P' (profile list) or 'S',<profileId> (a profile's data), then
     '.name'  object key        '#id'  item of a list whose items have ids (cards, decks, history…)
     '{}'     "this object exists" marker        '[]'  the order of an id-list
   Counters (peanuts, points, reviews…) merge by adding each device's change; bests merge by max. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api; else root.SyncCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const SKIP = { S: [/^savedAt$/, /^lastBackup$/], P: [/^lastId$/, /^setup$/] };
  const LOCAL_ONLY = { S: [/^settings\.voices(\.|$)/, /^decks\.#\.voices(\.|$)/], P: [] };   // voices differ per device
  const ADD = [/^rewards\.(points|peanuts|peanutProgress)$/, /^rewards\.stats\.[^.]+$/, /^log\.[^.]+\.(reviews|practice|points)$/,
    /^log\.[^.]+\.(intro|extra)\.[^.]+$/, /^streak\.freezes$/, /^packs\.opened$/];
  const MAX = [/^runnerBest\.[^.]+$/, /^rewards\.trophy\.best$/, /^streak\.best$/];

  const K = segs => JSON.stringify(segs);
  const isPlain = v => v && typeof v === 'object' && !Array.isArray(v) && !(typeof Blob !== 'undefined' && v instanceof Blob) && !(v instanceof Date);
  function isIdArray(a) {
    if (!a.length) return false;
    const seen = new Set();
    for (const x of a) {
      if (!isPlain(x) || (typeof x.id !== 'string' && typeof x.id !== 'number')) return false;
      const id = String(x.id); if (seen.has(id)) return false; seen.add(id);
    }
    return true;
  }
  function splitKey(key) {
    const segs = JSON.parse(key);
    const scope = segs[0], prefixLen = scope === 'S' ? 2 : 1;
    const rest = segs.slice(prefixLen);
    const rp = rest.filter(s => s !== '{}' && s !== '[]').map(s => s[0] === '#' ? '#' : s.slice(1)).join('.');
    return { segs, scope, pid: scope === 'S' ? segs[1] : null, prefix: segs.slice(0, prefixLen), rest, rp };
  }
  const test = (list, rp) => list.some(r => r.test(rp));
  const isSkipped = (scope, rp, includeLocal) => test(SKIP[scope] || [], rp) || (!includeLocal && test(LOCAL_ONLY[scope] || [], rp));
  const isLocalOnly = (scope, rp) => test(LOCAL_ONLY[scope] || [], rp);
  const modeFor = (scope, rp) => scope !== 'S' ? 'set' : test(ADD, rp) ? 'add' : test(MAX, rp) ? 'max' : 'set';

  /* value tree -> { key: value } */
  function flatten(out, segs, rp, v, scope, includeLocal) {
    if (rp.length && isSkipped(scope, rp.join('.'), includeLocal)) return;
    if (v === undefined || typeof v === 'function') return;
    if (Array.isArray(v)) {
      if (isIdArray(v)) {
        out[K([...segs, '[]'])] = v.map(x => String(x.id));
        for (const x of v) flatten(out, [...segs, '#' + x.id], [...rp, '#'], x, scope, includeLocal);
      } else out[K(segs)] = v;
      return;
    }
    if (isPlain(v)) {
      out[K([...segs, '{}'])] = 1;
      for (const k of Object.keys(v)) flatten(out, [...segs, '.' + k], [...rp, k], v[k], scope, includeLocal);
      return;
    }
    if (typeof Blob !== 'undefined' && v instanceof Blob) return;
    out[K(segs)] = v;
  }
  function flattenAll(profiles, states, includeLocal) {
    const out = {};
    if (profiles) flatten(out, ['P'], [], profiles, 'P', includeLocal);
    for (const [pid, st] of Object.entries(states || {})) if (st) flatten(out, ['S', pid], [], st, 'S', includeLocal);
    return out;
  }

  /* Apply record changes to live objects in place (keeps object identity so open screens keep working).
     ops: [{ key, del, v }]; finalHas(key) tells whether a key exists after the merge (for parent checks).
     getRoot(info, create) returns the root object for a key's scope/profile. */
  // Fast lookup of list items by id (big decks have thousands of cards); rebuilt for each applyOps call
  let idIndex = new WeakMap();
  function indexOf(arr) {
    let m = idIndex.get(arr);
    if (!m) { m = new Map(); for (const x of arr) if (x && x.id != null && !m.has(String(x.id))) m.set(String(x.id), x); idIndex.set(arr, m); }
    return m;
  }
  function childOf(node, seg) {
    if (node == null) return undefined;
    if (seg[0] === '#') return Array.isArray(node) ? indexOf(node).get(seg.slice(1)) : undefined;
    return node[seg.slice(1)];
  }
  function pushItem(arr, item) { arr.push(item); indexOf(arr).set(String(item.id), item); }
  function removeChild(node, seg) {
    if (node == null) return;
    if (seg[0] === '#') { if (Array.isArray(node)) { const id = seg.slice(1), it = indexOf(node).get(id); if (it) { const i = node.indexOf(it); if (i >= 0) node.splice(i, 1); indexOf(node).delete(id); } } }
    else if (typeof node === 'object') delete node[seg.slice(1)];
  }
  function containerFor(nextSeg) { return nextSeg && (nextSeg[0] === '#' || nextSeg === '[]') ? [] : {}; }
  function applyOps(ops, finalHas, getRoot) {
    idIndex = new WeakMap();
    const parsed = ops.map(o => ({ ...o, info: splitKey(o.key) }));
    const dels = parsed.filter(o => o.del).sort((a, b) => b.info.rest.length - a.info.rest.length);
    const sets = parsed.filter(o => !o.del).sort((a, b) => {
      const ao = a.info.rest.at(-1) === '[]', bo = b.info.rest.at(-1) === '[]';
      return ao !== bo ? (ao ? 1 : -1) : a.info.rest.length - b.info.rest.length;
    });
    for (const o of dels) {
      const { rest } = o.info, root = getRoot(o.info, false); if (!root) continue;
      if (rest.length === 1 && rest[0] === '{}') { o.info.rootDeleted = true; continue; }
      const last = rest.at(-1), containerPath = last === '{}' || last === '[]' ? rest.slice(0, -1) : rest;
      let node = root;
      for (let i = 0; i < containerPath.length - 1 && node != null; i++) node = childOf(node, containerPath[i]);
      const seg = containerPath.at(-1);
      if (last === '[]') { const cur = childOf(node, seg); if (Array.isArray(cur) && !finalHas(o.info.prefix, rest.slice(0, -1), 'leaf')) removeChild(node, seg); }
      else if (last === '{}') { const cur = childOf(node, seg); if (isPlain(cur)) removeChild(node, seg); }
      else { const cur = childOf(node, seg); if (!isPlain(cur) && !finalHas(o.info.prefix, rest, 'obj') && !finalHas(o.info.prefix, rest, 'arr')) removeChild(node, seg); }
    }
    for (const o of sets) {
      const { rest } = o.info, root = getRoot(o.info, true); if (!root) continue;
      if (rest.length === 1 && rest[0] === '{}') continue;
      const last = rest.at(-1), path = last === '{}' || last === '[]' ? rest.slice(0, -1) : rest;
      // every parent must still exist after the merge
      let ok = true;
      for (let j = 0; j < path.length - 1 && ok; j++) ok = finalHas(o.info.prefix, path.slice(0, j + 1), path[j + 1][0] === '#' ? 'arr' : 'obj');
      if (last !== '{}' && last !== '[]' && path.length && path.at(-1)[0] === '#') ok = false;
      if (!ok) continue;
      let node = root;
      for (let i = 0; i < path.length - 1; i++) {
        const seg = path[i]; let nx = childOf(node, seg);
        const want = containerFor(path[i + 1]);
        if (nx == null || typeof nx !== 'object' || Array.isArray(nx) !== Array.isArray(want)) {
          nx = seg[0] === '#' ? { id: seg.slice(1) } : want;
          if (seg[0] === '#') pushItem(node, nx); else node[seg.slice(1)] = nx;
        }
        node = nx;
      }
      const seg = path.at(-1);
      if (last === '{}') {
        if (!seg) continue;
        const cur = childOf(node, seg);
        if (!isPlain(cur)) { const obj = seg[0] === '#' ? { id: seg.slice(1) } : {}; if (seg[0] === '#') { if (Array.isArray(node)) pushItem(node, obj); } else node[seg.slice(1)] = obj; }
      } else if (last === '[]') {
        let arr = seg ? childOf(node, seg) : node;
        if (!Array.isArray(arr)) { arr = []; node[seg.slice(1)] = arr; }
        const order = new Map((o.v || []).map((id, i) => [String(id), i]));
        const idx = new Map(arr.map((x, i) => [x, i]));
        arr.sort((a, b) => (order.has(String(a?.id)) ? order.get(String(a.id)) : 1e9 + idx.get(a)) - (order.has(String(b?.id)) ? order.get(String(b.id)) : 1e9 + idx.get(b)));
      } else {
        node[seg.slice(1)] = o.v && typeof o.v === 'object' ? JSON.parse(JSON.stringify(o.v)) : o.v;
      }
    }
    return parsed;
  }
  /* Build a finalHas() checker from a final key map */
  function hasChecker(finalMap) {
    return (prefix, path, kind) => {
      const base = [...prefix, ...path];
      if (kind === 'obj') return K([...base, '{}']) in finalMap;
      if (kind === 'arr') return K([...base, '[]']) in finalMap;
      return K(base) in finalMap;
    };
  }
  /* Small fast content hash for pictures (works without crypto.subtle) */
  function fnvHash(bytes) {
    let h1 = 0x811c9dc5, h2 = 0x01000193 ^ bytes.length;
    for (let i = 0; i < bytes.length; i++) { h1 = Math.imul(h1 ^ bytes[i], 16777619); h2 = Math.imul(h2 ^ bytes[(bytes.length - 1 - i)], 2246822519); }
    return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0') + bytes.length.toString(16);
  }
  return { K, splitKey, flatten, flattenAll, applyOps, hasChecker, modeFor, isLocalOnly, isSkipped, fnvHash, isIdArray };
});
