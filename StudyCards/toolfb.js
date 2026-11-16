'use strict';
/* ================= 🐞 "Report a problem" strip under every tool page =================
   Uses the same GitHub issue form as the Feedback page (community.js), filled in with which tool and tab you were on. */
const TOOL_FB = { math: ['🧮 Math', () => S.settings.math?.tab], music: ['🎵 Music studio', () => S.settings.music?.tab], science: ['🔬 Science lab', () => S.settings.sci?.tab], art: ['🎨 Art studio', () => S.settings.art?.tab],
  code: ['💻 Code lab', () => S.settings.code?.tab], timeline: ['🕰️ Timeline', () => ''], keys: ['⌨️ Keyboard shortcuts', () => ''], world: ['🌎 Social Studies', () => S.settings.world?.tab], dictionary: ['📖 Dictionary', () => ''] };
function toolFbWhere() { const t = TOOL_FB[view.name]; if (!t) return ''; let tab = ''; try { tab = t[1]() || ''; } catch {} return t[0].replace(/^\S+\s/, '') + (tab ? ` (${tab} tab)` : ''); }
function toolFbHtml() {
  return `<div class="tool-fb" role="contentinfo"><span>Something not working, or an idea for ${esc(toolFbWhere())}?</span>
    <button type="button" class="btn sm" data-act="toolIssue" data-kind="bug">🐞 Report a problem</button><button type="button" class="btn sm ghost" data-act="toolIssue" data-kind="idea">💡 Suggest an idea</button></div>`;
}
Object.assign(actions, {
  toolIssue: el => {
    if (typeof ghUrl !== 'function' || !ghUrl()) return go({ name: 'feedback' });
    const i = typeof cmDeviceInfo === 'function' ? cmDeviceInfo() : {}, bug = el.dataset.kind === 'bug', where = toolFbWhere();
    const info = `**Page:** ${where} · **App version:** ${i.version || '?'} · **Device:** ${i.device || '?'} · **Browser:** ${i.browser || '?'}${i.app ? ` (${i.app})` : ''}`;
    const body = bug ? `${info}\n\n### What happened?\n\n\n### What did you expect?\n\n\n### Steps to make it happen again\n1. \n2. \n` : `${info}\n\n### Your idea\n\n\n### Why would it help you?\n\n`;
    window.open(ghUrl(`/issues/new?labels=${bug ? 'bug' : 'idea'}&title=${encodeURIComponent(`${bug ? 'Problem' : 'Idea'} in ${where}: `)}&body=${encodeURIComponent(body)}`), '_blank', 'noopener');
  },
});
{ const r = window.render; if (typeof r === 'function') window.render = function () { const out = r.apply(this, arguments);
    try { const main = document.getElementById('main'); if (TOOL_FB[view.name] && main && !main.querySelector('.tool-fb')) main.insertAdjacentHTML('beforeend', toolFbHtml()); } catch {} return out; }; }
