'use strict';
/* ================= Wordling Trails: all 151 Wordlings (original) =================
   The first 23 are drawn by hand (trails.js). The rest are built from a "creature kit":
   body shape + ears + horns + wings + tail + pattern + eyes + accessory + shade.
   Spec string: "body ears horns wings tail pattern eyes accessory shade" ("-" = none).
   Evolutions: a Wordling grows into the next form when it reaches the level shown. */
const TR_KIT_SPECS = {};

/* Evolutions for the original Wordlings */
const TR_EVO_OLD = [
  ['quillip', 16, 'quillwren', 'Quillwren', 'Its quill tail is longer now, and it writes whole sentences in the sky.', 'bird - - feather long none round scarf 1', [48, 64, 48]],
  ['quillwren', 32, 'penhawk', 'Penhawk', 'A proud bird of prey whose feathers are sharp as pen nibs.', 'bird pointy - feather long stripes angry - 2', [58, 82, 58]],
  ['mossling', 16, 'mossback', 'Mossback', 'The garden on its shell now has tiny flowers. Bees visit it.', 'golem round - - leaf spots sleepy - 2', [66, 52, 66]],
  ['mossback', 32, 'gardenshell', 'Gardenshell', 'A walking garden. Whole families of birds live on its back.', 'golem round double - leaf spots round crown 2', [82, 62, 80]],
  ['petalwisp', 16, 'bloomwisp', 'Bloomwisp', 'It glows in all the colors of a sunrise when it is excited.', 'plant - - - leaf spots big bow 1', [56, 62, 54]],
  ['bloomwisp', 32, 'blossomira', 'Blossomira', 'A graceful flower spirit. Its petals sparkle like tiny stars.', 'plant - - bug leaf spots big crown 0', [68, 78, 64]],
  ['inkblob', 18, 'inkwave', 'Inkwave', 'A big rolling wave of ink. It writes long stories on the beach.', 'blob - - - fin spots round - 2', [62, 52, 56]],
  ['buzzlet', 14, 'buzzwing', 'Buzzwing', 'Its wings buzz so fast that it hums a little tune.', 'bug - single bug - stripes round - 1', [50, 60, 46]],
  ['bookmite', 20, 'tomecrawler', 'Tomecrawler', 'It has read every dictionary in town and still wants more.', 'serpent - - - - letters round glasses 2', [58, 54, 62]],
  ['hushmoth', 22, 'hushwing', 'Hushwing', 'Its wings make the whole room go quiet and calm.', 'bug long - bug - spots sleepy - 1', [58, 64, 58]],
  ['fernfox', 24, 'fernvixen', 'Fernvixen', 'Its fern tail has grown into a whole little forest.', 'beast pointy - - leaf none angry - 1', [62, 70, 54]],
  ['zapwick', 22, 'zaplantern', 'Zaplantern', 'A bright lantern spirit. Its flame never goes out.', 'object - - - flame none big candle 0', [54, 76, 50]],
  ['folduck', 24, 'foldswan', 'Foldswan', 'A beautiful swan folded from a love letter.', 'bird - - feather long none round - 0', [60, 70, 58]],
  ['cobblepup', 22, 'cobblehound', 'Cobblehound', 'A loyal stone dog that guards the town gate.', 'beast pointy - - long spots angry scarf 2', [70, 64, 72]],
  ['lumabat', 24, 'lumawing', 'Lumawing', 'It carries a big lantern and guides lost travelers home.', 'wisp pointy - bat - none big candle 2', [60, 72, 58]],
  ['ripplet', 24, 'tidewisp', 'Tidewisp', 'A water spirit that dances on the waves at night.', 'wisp - - - fin spots round - 1', [60, 68, 54]],
  ['gustling', 25, 'galeling', 'Galeling', 'A strong breeze that can blow a whole book open.', 'wisp - - feather long stripes round - 0', [56, 74, 52]],
  ['sparkhorn', 30, 'stormhorn', 'Stormhorn', 'A tall deer whose antlers crackle with thunder.', 'beast - antler - long stripes angry - 1', [66, 80, 62]],
  ['anchorcrab', 28, 'anchorkrak', 'Anchorkrak', 'A huge crab with an anchor for a shell. It never moves unless it wants to.', 'bug - double - - spots angry - 2', [68, 66, 80]],
  ['emberling', 26, 'emberlynx', 'Emberlynx', 'A fast fire cat. Its tail flame burns bright blue when it is happy.', 'beast pointy - - flame spots angry - 1', [62, 80, 58]],
];

/* New families: [type, spec, bias (h/a/d/b), where stage 1 lives, [[id, name, blurb], …], [evolution levels]] */
const TR_FAMILIES = [
  ['verb', 'beast long - - fluffy none round - 1', 'a', 'route', [['hopscot', 'Hopscot', 'A bunny that hops in little squares, like a game of hopscotch.'], ['bounderoo', 'Bounderoo', 'It can bounce over a house in one jump.'], ['skybounder', 'Skybounder', 'It jumps so high that it says hello to the clouds.']], [18, 34]],
  ['verb', 'beast round - - long none round - 2', 'a', 'woods', [['scurrit', 'Scurrit', 'A tiny mouse that never walks when it can run.'], ['scurrion', 'Scurrion', 'It runs so fast it leaves little dust words behind it.']], [20]],
  ['verb', 'bird - - feather long none round - 0', 'a', 'route', [['skiplet', 'Skiplet', 'A small bird that skips across puddles.'], ['skipswift', 'Skipswift', 'It skips across whole lakes without getting wet.']], [18]],
  ['verb', 'bug long - bug - stripes round - 1', 'b', 'route', [['jumpjack', 'Jumpjack', 'A grasshopper that loves jumping rope.'], ['leaplocust', 'Leaplocust', 'One leap and it is on the other side of the field.']], [22]],
  ['verb', 'wisp - - - long stripes round - 0', 'a', 'highland', [['twirlet', 'Twirlet', 'A little spinning breeze. It makes leaves dance.'], ['whirlwisp', 'Whirlwisp', 'A swirling wind spirit that spins like a top.']], [20]],
  ['verb', 'beast pointy - - fluffy none round - 1', 'a', 'ember', [['sprintail', 'Sprintail', 'A fox that races the wind every morning.'], ['sprintrix', 'Sprintrix', 'It has never lost a race. Not even once.']], [24]],
  ['verb', 'fish - - - fin spots round - 1', 'h', 'bridge', [['splashkin', 'Splashkin', 'A playful fish that splashes anyone who walks by.'], ['torrentail', 'Torrentail', 'Its tail makes waves big enough to surf on.'], ['tidalord', 'Tidalord', 'A great fish that rules the tides. Sailors bow when it passes.']], [24, 36]],
  ['verb', 'beast - double - long none angry - 2', 'd', 'ember', [['climbit', 'Climbit', 'A little goat that climbs anything, even bookshelves.'], ['cragclimber', 'Cragclimber', 'It climbs straight up cliffs without slipping.']], [26]],
  ['verb', 'bug - - bug flame none big - 1', 'a', 'woods', [['flickfly', 'Flickfly', 'A firefly that blinks messages in the dark.'], ['flareflit', 'Flareflit', 'Its light flashes so bright it can be seen from the next town.']], [18]],
  ['verb', 'beast long - - fluffy spots round - 1', 'h', 'ember', [['drumbuck', 'Drumbuck', 'It thumps its feet to a beat only it can hear.'], ['thumpdrum', 'Thumpdrum', 'When it stomps, the ground plays music.']], [24]],
  ['verb', 'beast round - - - none sleepy - 2', 'a', 'cave', [['zoomole', 'Zoomole', 'A mole that digs tunnels faster than anyone can walk.'], ['burrowroar', 'Burrowroar', 'It digs through rock with a mighty roar.']], [24]],
  ['verb', 'bug long - - - stripes round - 2', 'a', 'woods', [['kickit', 'Kickit', 'A cricket that kicks a tiny ball of dew around.'], ['chirpquake', 'Chirpquake', 'Its chirp is so loud it shakes the leaves off trees.']], [22]],
  ['verb', 'plant round - - - none round - 1', 'b', 'highland', [['tumblit', 'Tumblit', 'A round little bush that rolls wherever the wind goes.'], ['tumbleroo', 'Tumbleroo', 'It rolls up hills on purpose, just for fun.']], [20]],
  ['verb', 'fish - - - fin stripes round - 0', 'a', 'bridge', [['wavelet', 'Wavelet', 'A tiny wave with eyes. It loves to race boats.'], ['crestwave', 'Crestwave', 'A tall wave spirit with a foamy crown.']], [25]],
  ['verb', 'object - - feather - letters round - 0', 'a', 'highland', [['glidelet', 'Glidelet', 'A paper airplane that came to life during a long lesson.'], ['soarscroll', 'Soarscroll', 'A flying scroll that carries messages across the sky.'], ['skyquill', 'Skyquill', 'A giant flying quill that writes poems in the clouds.']], [22, 38]],
  ['noun', 'golem - - - - spots sleepy - 2', 'd', 'route', [['pebblet', 'Pebblet', 'A round pebble that rolls after anyone who is kind to it.'], ['stonewright', 'Stonewright', 'It builds little stone towers wherever it rests.'], ['monolore', 'Monolore', 'A giant standing stone covered in ancient words.']], [20, 36]],
  ['noun', 'object - - - - spots round - 1', 'h', 'route', [['crumbun', 'Crumbun', 'A little bread roll that smells like breakfast.'], ['loafguard', 'Loafguard', 'A big loaf of bread that protects the bakery.']], [22]],
  ['noun', 'object round - - - none round - 0', 'd', 'bridge', [['teapotto', 'Teapotto', 'A tiny teapot that whistles when it is happy.'], ['kettlebrew', 'Kettlebrew', 'It brews tea for tired travelers. It tastes like honey.']], [24]],
  ['noun', 'object - - - flame none big candle 1', 'b', 'cave', [['lampkin', 'Lampkin', 'A little lantern that lights up dark caves.'], ['beaconeer', 'Beaconeer', 'A tall lamp that guides ships home at night.'], ['lumenarch', 'Lumenarch', 'Its light is so warm that whole towns gather around it.']], [22, 36]],
  ['noun', 'serpent - - - - letters round - 1', 'b', 'library', [['scrollworm', 'Scrollworm', 'A worm made of a rolled-up page. It reads itself out loud.'], ['parchmentail', 'Parchmentail', 'A long paper serpent with stories written down its back.'], ['codexwyrm', 'Codexwyrm', 'An ancient book dragon that remembers every word ever written.']], [22, 38]],
  ['noun', 'bug - double - - none round - 2', 'd', 'cave', [['clockrab', 'Clockrab', 'A crab with a ticking clock on its shell. It is never late.'], ['tickshell', 'Tickshell', 'Its shell chimes every hour, on the hour.']], [26]],
  ['noun', 'plant - - - leaf none sleepy - 2', 'h', 'woods', [['rootlet', 'Rootlet', 'A tiny root that wiggles out of the ground to say hi.'], ['oakenroot', 'Oakenroot', 'A young tree that walks around at night.'], ['elderbark', 'Elderbark', 'A wise old tree. Birds come from far away to hear its stories.']], [18, 34]],
  ['noun', 'fish - single - - spots sleepy - 1', 'd', 'bridge', [['shellbit', 'Shellbit', 'A tiny snail with a shell like a spiral staircase.'], ['conchord', 'Conchord', 'Hold its shell to your ear and you can hear the sea sing.']], [22]],
  ['noun', 'object - - - - none round bow 1', 'd', 'cave', [['bellbud', 'Bellbud', 'A little bell that rings when someone tells the truth.'], ['chimeguard', 'Chimeguard', 'A great bell that rings to warn the town of danger.']], [28]],
  ['noun', 'golem - - - - stripes angry - 2', 'd', 'ember', [['bricklet', 'Bricklet', 'A single brick that wants to be part of something bigger.'], ['wallwarden', 'Wallwarden', 'A stone wall that walks. Nothing gets past it.'], ['fortressor', 'Fortressor', 'A living castle. Little Bricklets live inside it.']], [22, 38]],
  ['noun', 'object - single - - none round - 0', 'b', 'cave', [['keykin', 'Keykin', 'A little key that can open any lock, but only for friends.'], ['keystoneer', 'Keystoneer', 'It holds the key to the biggest gate in the land.']], [28]],
  ['noun', 'object - - - - spots round - 2', 'a', 'library', [['penpot', 'Penpot', 'A pot full of pens that writes on its own.'], ['inkwellion', 'Inkwellion', 'A proud ink-well lion. Its mane drips with ink.']], [26]],
  ['noun', 'plant pointy - - leaf none round - 2', 'b', 'route', [['twigit', 'Twigit', 'A little stick creature. It loves being thrown and fetched.'], ['branchbeast', 'Branchbeast', 'A beast of branches and leaves that guards the forest.'], ['grovekeeper', 'Grovekeeper', 'A huge tree giant. A whole grove grows on its shoulders.']], [18, 34]],
  ['noun', 'object - - feather - stripes round - 0', 'b', 'highland', [['chalkit', 'Chalkit', 'A stick of chalk that draws pictures on rocks.'], ['slatewing', 'Slatewing', 'A flying chalkboard. It teaches birds to spell.']], [24]],
  ['noun', 'beast round - - long letters round glasses 1', 'b', 'library', [['mapmouse', 'Mapmouse', 'A tiny mouse that never gets lost.'], ['cartographox', 'Cartographox', 'A clever fox that draws maps of everywhere it goes.'], ['atlasaur', 'Atlasaur', 'A big friendly dinosaur with a map of the whole world on its back.']], [22, 38]],
  ['adj', 'beast round - - fluffy none big - 0', 'h', 'route', [['fuzzlet', 'Fuzzlet', 'A soft little ball of fluff. Hugging it is very relaxing.'], ['fluffmane', 'Fluffmane', 'Its mane is so fluffy that birds nest in it.'], ['cloudmane', 'Cloudmane', 'A gentle beast as soft as a cloud. It floats when it is happy.']], [18, 34]],
  ['adj', 'fish - - - fin spots big - 0', 'a', 'bridge', [['shimmerling', 'Shimmerling', 'A small fish that shimmers in the sunlight.'], ['opalfin', 'Opalfin', 'Its scales change color like opals.']], [24]],
  ['adj', 'blob - - - - none sleepy - 2', 'b', 'cave', [['dimdrop', 'Dimdrop', 'A little drop of shadow. It is shy, but very kind.'], ['duskdrop', 'Duskdrop', 'It comes out at sunset and paints the sky purple.']], [22]],
  ['adj', 'bug - - bug - spots big - 0', 'a', 'highland', [['brightbug', 'Brightbug', 'A beetle with a shiny, bright shell.'], ['prismwing', 'Prismwing', 'Its wings split sunlight into rainbows.']], [24]],
  ['adj', 'beast round - - - none sleepy scarf 1', 'h', 'ember', [['cozycub', 'Cozycub', 'A sleepy bear cub. It is always looking for a warm spot.'], ['snugbear', 'Snugbear', 'A big cuddly bear that keeps everyone warm in winter.']], [26]],
  ['adj', 'plant - - - leaf stripes round - 1', 'b', 'ember', [['crispleaf', 'Crispleaf', 'A crunchy autumn leaf that loves to be stepped on.'], ['rustlefern', 'Rustlefern', 'It rustles softly to sing the forest to sleep.']], [24]],
  ['adj', 'wisp - - - long spots big - 0', 'a', 'highland', [['twinklit', 'Twinklit', 'A tiny star that fell from the sky. It is very rare.'], ['starlume', 'Starlume', 'It glows so bright it can light up a whole field.'], ['novaluxe', 'Novaluxe', 'A dazzling star spirit. Its light can be seen from very far away.']], [24, 40]],
  ['adj', 'bird - - feather - none round scarf 0', 'a', 'bridge', [['chillpip', 'Chillpip', 'A little bird that loves cold mornings.'], ['frostfinch', 'Frostfinch', 'Its feathers are covered in sparkly frost.'], ['blizzarion', 'Blizzarion', 'A great snowy bird. Snowflakes fall wherever it flies.']], [22, 36]],
  ['adj', 'bug - single bug - stripes round - 1', 'b', 'woods', [['honeymote', 'Honeymote', 'A sweet little bee that smells like honey.'], ['nectarix', 'Nectarix', 'It makes the sweetest honey in the whole land.']], [20]],
  ['adj', 'plant round - - - stripes angry - 1', 'd', 'ember', [['grumpkin', 'Grumpkin', 'A grumpy little pumpkin. It is secretly very nice.'], ['sourgourd', 'Sourgourd', 'A big sour gourd. It frowns, but it shares its seeds.']], [26]],
  ['adj', 'bug - - - - stripes sleepy - 0', 'b', 'route', [['silkit', 'Silkit', 'A soft caterpillar that spins silky threads.'], ['satinwing', 'Satinwing', 'A moth with wings as smooth as satin.'], ['royalsilk', 'Royalsilk', 'A graceful moth queen with shimmering silk wings.']], [16, 30]],
  ['adj', 'bird round - feather - spots big - 1', 'b', 'woods', [['chucklet', 'Chucklet', 'A little owl that giggles at everything.'], ['guffawl', 'Guffawl', 'Its laugh is so loud that the whole forest laughs too.']], [22]],
  ['adj', 'beast pointy - - long none sleepy - 2', 'a', 'woods', [['mufflekit', 'Mufflekit', 'A quiet kitten. Its paws never make a sound.'], ['hushcat', 'Hushcat', 'A silent cat that sneaks up on bad guys.']], [20]],
  ['adj', 'bird - - feather long stripes angry - 1', 'a', 'highland', [['blarebird', 'Blarebird', 'A loud bird that wakes up the whole town every morning.'], ['fanfaron', 'Fanfaron', 'Its song sounds like trumpets.']], [26]],
  ['adj', 'plant - - - leaf none big - 1', 'h', 'woods', [['minikin', 'Minikin', 'A teeny tiny sprout. It is the smallest Wordling of all.'], ['sproutkin', 'Sproutkin', 'It is growing fast and is very proud of it.'], ['grandfrond', 'Grandfrond', 'A tall, kind plant giant. Its leaves give shade to travelers.']], [16, 34]],
  ['adj', 'blob - - - - spots big bow 0', 'h', 'library', [['jellywob', 'Jellywob', 'A wobbly little jelly. It jiggles when it laughs.'], ['wobblob', 'Wobblob', 'A big wobbly jelly that bounces around the library.'], ['wobbleking', 'Wobbleking', 'The king of all jellies. Its crown is made of sugar.']], [18, 32]],
];

/* Turn all of that into species entries (stats grow with each stage) */
(function trBuildDex() {
  const W = { h: [0.40, 0.30, 0.30], a: [0.30, 0.40, 0.30], d: [0.30, 0.30, 0.40], b: [0.33, 0.34, 0.33] }, SUM = [138, 172, 206];
  for (const [from, lv, id, name, blurb, spec, [hp, atk, def]] of TR_EVO_OLD) {
    TR_SPECIES[id] = { name, type: TR_SPECIES[from].type, hp, atk, def, blurb, kit: spec, stage: TR_SPECIES[from].stage ? TR_SPECIES[from].stage + 1 : 2 };
    TR_SPECIES[from].evo = [id, lv]; TR_SPECIES[id].from = from;
  }
  for (const [type, spec, bias, area, members, levels] of TR_FAMILIES) {
    members.forEach(([id, name, blurb], i) => {
      const w = W[bias], sum = members.length === 2 ? [SUM[0], 186][i] : SUM[i];   // a 2-stage family's final form is a bit stronger than a middle stage
      TR_SPECIES[id] = { name, type, hp: Math.round(sum * w[0]), atk: Math.round(sum * w[1]), def: Math.round(sum * w[2]), blurb, kit: spec, stage: i + 1 };
      if (i < members.length - 1) TR_SPECIES[id].evo = [members[i + 1][0], levels[i]];
      if (i > 0) TR_SPECIES[id].from = members[i - 1][0];
      if (i === 0) TR_SPECIES[id].area = area;
    });
  }
})();
/* ---------- Legendary Wordlings: rare, strong, and each has a special ability in battle ---------- */
const TR_ABILITIES = {
  swift:   { name: 'Swift Strike', desc: 'Every attack hits twice (the second hit is weaker).' },
  bedrock: { name: 'Bedrock', desc: 'Takes a third less damage from every attack.' },
  radiant: { name: 'Radiant Glow', desc: 'Heals a little HP at the end of every turn.' },
};
Object.assign(TR_SPECIES, {
  voltquill: { name: 'Voltquill', type: 'verb', hp: 96, atk: 118, def: 84, legend: true, ability: 'swift', kit: 'bird pointy single feather long stripes angry crown 1', stage: 3,
    blurb: 'A legendary storm bird. It writes lightning across the sky faster than anyone can read it.' },
  grammadon: { name: 'Grammadon', type: 'noun', hp: 118, atk: 96, def: 120, legend: true, ability: 'bedrock', kit: 'serpent pointy double bat long letters angry crown 2', stage: 3,
    blurb: 'A legendary dragon made of the oldest words. Its scales are carved with forgotten letters.' },
  aurorune: { name: 'Aurorune', type: 'adj', hp: 104, atk: 104, def: 104, legend: true, ability: 'radiant', kit: 'wisp long - feather fluffy spots big crown 0', stage: 3,
    blurb: 'A legendary spirit of dawn. Wherever it shines, tired Wordlings feel brand new.' },
});
/* Spirit Log order: families together, legends last */
const TR_DEX = (() => {
  const out = [], add = id => { if (!out.includes(id)) out.push(id); let e = TR_SPECIES[id].evo; while (e) { if (!out.includes(e[0])) out.push(e[0]); e = TR_SPECIES[e[0]].evo; } };
  for (const id of Object.keys(TR_SPECIES)) if (!TR_SPECIES[id].from && !['grammaroth', 'mutewyrm', 'voltquill', 'grammadon', 'aurorune'].includes(id)) add(id);
  out.push('grammaroth', 'mutewyrm', 'voltquill', 'grammadon', 'aurorune');
  return out;
})();
const trDexNo = sp => String(TR_DEX.indexOf(sp) + 1).padStart(3, '0');
/* A Wordling at a level it would already have grown at shows up in its grown form */
function trGrownForm(sp, lv) { let s = sp, e = TR_SPECIES[s].evo; while (e && lv >= e[1]) { s = e[0]; e = TR_SPECIES[s].evo; } return s; }

/* Put the new families into the wild (and the water) */
(function trSpreadWild() {
  const LV = { route: [2, 5], woods: [4, 7], bridge: [9, 12], ember: [13, 16], cave: [15, 18], highland: [19, 22], library: [21, 24] };
  for (const [id, sp] of Object.entries(TR_SPECIES)) if (sp.area && TR_MAPS[sp.area]) {
    const [lo, hi] = LV[sp.area], m = TR_MAPS[sp.area]; m.wild ||= [];
    m.wild.push([id, lo, hi, id === 'twinklit' ? 0.3 : 1]);
  }
  // later forms sometimes show up in the late areas, and rare finds appear after the story ends
  TR_MAPS.highland.wild.push(['fluffmane', 19, 21, 0.5], ['oakenroot', 19, 21, 0.5], ['stonewright', 20, 22, 0.5]);
  TR_MAPS.library.wild.push(['parchmentail', 22, 24, 0.4], ['inkwave', 22, 24, 0.5]);
  for (const [map, list] of Object.entries({ highland: [['novaluxe', 40, 44], ['skybounder', 36, 40]], library: [['codexwyrm', 40, 44], ['atlasaur', 40, 44]], cave: [['lumenarch', 38, 42], ['fortressor', 40, 44]], woods: [['elderbark', 36, 40], ['grandfrond', 36, 40]] }))
    for (const [sp, lo, hi] of list) TR_MAPS[map].wild.push([sp, lo, hi, 0.15, 'after']);
  // fishing spots: face the water and press A
  const water = { town: [['splashkin', 3, 5], ['shimmerling', 3, 5], ['ripplet', 4, 6]], route: [['splashkin', 4, 6], ['shellbit', 4, 6], ['wavelet', 5, 6]], bridge: [['torrentail', 24, 26, 0.3], ['splashkin', 10, 12], ['shimmerling', 10, 12], ['shellbit', 10, 12], ['wavelet', 10, 12], ['glimmeray', 11, 13]],
    saltwick: [['anchorcrab', 12, 14], ['wavelet', 12, 14], ['shellbit', 12, 14], ['opalfin', 24, 26, 0.3], ['tidewisp', 24, 26, 0.3]] };
  for (const [map, list] of Object.entries(water)) TR_MAPS[map].water = list;
})();

/* ---------- Signature moves: every Wordling family learns its own attack as it levels up ---------- */
Object.assign(TR_MOVES, {
  sig_quillip: { name: 'Quill Flurry', power: 38, sig: 'quillip', hits: 2 },
  sig_mossling: { name: 'Garden Wall', power: 60, sig: 'mossling', guardUp: 1 },
  sig_petalwisp: { name: 'Petal Glow', power: 55, sig: 'petalwisp', drain: 0.5 },
  sig_inkblob: { name: 'Ink Splat', power: 60, sig: 'inkblob', stun: 0.3 },
  sig_buzzlet: { name: 'Busy Buzz', power: 36, sig: 'buzzlet', hits: 2 },
  sig_bookmite: { name: 'Bookmark Bite', power: 66, sig: 'bookmite' },
  sig_hushmoth: { name: 'Lullaby Dust', power: 50, sig: 'hushmoth', stun: 0.45 },
  sig_fernfox: { name: 'Fern Whip', power: 66, sig: 'fernfox' },
  sig_zapwick: { name: 'Wick Flare', power: 72, sig: 'zapwick', recoil: 0.1 },
  sig_folduck: { name: 'Origami Peck', power: 66, sig: 'folduck' },
  sig_cobblepup: { name: 'Pebble Fetch', power: 64, sig: 'cobblepup' },
  sig_lumabat: { name: 'Lantern Flash', power: 52, sig: 'lumabat', stun: 0.35 },
  sig_ripplet: { name: 'Splash Spin', power: 66, sig: 'ripplet' },
  sig_gustling: { name: 'Page Gust', power: 40, sig: 'gustling', hits: 2 },
  sig_sparkhorn: { name: 'Spark Charge', power: 74, sig: 'sparkhorn', recoil: 0.15 },
  sig_anchorcrab: { name: 'Anchor Pinch', power: 64, sig: 'anchorcrab', guardUp: 1 },
  sig_boulderbear: { name: 'Boulder Hug', power: 66, sig: 'boulderbear', guardUp: 1 },
  sig_tomeguard: { name: 'Armored Index', power: 62, sig: 'tomeguard', guardUp: 1 },
  sig_glimmeray: { name: 'Sunlit Wave', power: 64, sig: 'glimmeray', drain: 0.4 },
  sig_emberling: { name: 'Candle Pounce', power: 70, sig: 'emberling' },
  sig_shadeowl: { name: 'Midnight Hoot', power: 54, sig: 'shadeowl', stun: 0.4 },
  sig_grammaroth: { name: 'Lexicon Crush', power: 80, sig: 'grammaroth' },
  sig_mutewyrm: { name: 'Silent Swallow', power: 62, sig: 'mutewyrm', drain: 0.5 },
  sig_hopscot: { name: 'Hopscotch Kick', power: 36, sig: 'hopscot', hits: 2 },
  sig_scurrit: { name: 'Scurry Nip', power: 64, sig: 'scurrit' },
  sig_skiplet: { name: 'Puddle Skip', power: 62, sig: 'skiplet', focusUp: 1 },
  sig_jumpjack: { name: 'Jump-Rope Lash', power: 38, sig: 'jumpjack', hits: 2 },
  sig_twirlet: { name: 'Leaf Twirl', power: 58, sig: 'twirlet', stun: 0.25 },
  sig_sprintail: { name: 'Wind Race', power: 70, sig: 'sprintail' },
  sig_splashkin: { name: 'Prank Splash', power: 56, sig: 'splashkin', stun: 0.3 },
  sig_climbit: { name: 'Shelf Leap', power: 70, sig: 'climbit' },
  sig_flickfly: { name: 'Blink Code', power: 52, sig: 'flickfly', stun: 0.35 },
  sig_drumbuck: { name: 'Drum Stomp', power: 72, sig: 'drumbuck', recoil: 0.1 },
  sig_zoomole: { name: 'Tunnel Rush', power: 68, sig: 'zoomole' },
  sig_kickit: { name: 'Dewdrop Kick', power: 64, sig: 'kickit' },
  sig_tumblit: { name: 'Tumbleweed Roll', power: 38, sig: 'tumblit', hits: 2 },
  sig_wavelet: { name: 'Wake Rider', power: 66, sig: 'wavelet' },
  sig_glidelet: { name: 'Paper Glide', power: 64, sig: 'glidelet', focusUp: 1 },
  sig_pebblet: { name: 'Pebble Roll', power: 62, sig: 'pebblet' },
  sig_crumbun: { name: 'Breakfast Bounce', power: 52, sig: 'crumbun', drain: 0.5 },
  sig_teapotto: { name: 'Steam Whistle', power: 56, sig: 'teapotto', stun: 0.3 },
  sig_lampkin: { name: 'Cave Beacon', power: 62, sig: 'lampkin', focusUp: 1 },
  sig_scrollworm: { name: 'Read-Aloud Roll', power: 60, sig: 'scrollworm', focusUp: 1 },
  sig_clockrab: { name: 'Tick-Tock Pinch', power: 36, sig: 'clockrab', hits: 2 },
  sig_rootlet: { name: 'Root Wiggle', power: 54, sig: 'rootlet', drain: 0.4 },
  sig_shellbit: { name: 'Spiral Stair', power: 60, sig: 'shellbit', guardUp: 1 },
  sig_bellbud: { name: 'Truth Toll', power: 56, sig: 'bellbud', stun: 0.35 },
  sig_bricklet: { name: 'Brick Wall', power: 62, sig: 'bricklet', guardUp: 1 },
  sig_keykin: { name: 'Lock Pick', power: 70, sig: 'keykin' },
  sig_penpot: { name: 'Pen Volley', power: 36, sig: 'penpot', hits: 2 },
  sig_twigit: { name: 'Fetch Fling', power: 64, sig: 'twigit' },
  sig_chalkit: { name: 'Chalk Doodle', power: 56, sig: 'chalkit', stun: 0.3 },
  sig_mapmouse: { name: 'Shortcut Strike', power: 66, sig: 'mapmouse' },
  sig_fuzzlet: { name: 'Fluff Hug', power: 50, sig: 'fuzzlet', drain: 0.5 },
  sig_shimmerling: { name: 'Shimmer Dart', power: 64, sig: 'shimmerling' },
  sig_dimdrop: { name: 'Shadow Drip', power: 58, sig: 'dimdrop', drain: 0.3 },
  sig_brightbug: { name: 'Shell Shine', power: 54, sig: 'brightbug', stun: 0.35 },
  sig_cozycub: { name: 'Warm Bear Hug', power: 60, sig: 'cozycub', guardUp: 1 },
  sig_crispleaf: { name: 'Autumn Crunch', power: 66, sig: 'crispleaf' },
  sig_twinklit: { name: 'Wishing Star', power: 64, sig: 'twinklit', drain: 0.3 },
  sig_chillpip: { name: 'Frosty Chirp', power: 54, sig: 'chillpip', stun: 0.4 },
  sig_honeymote: { name: 'Honey Drizzle', power: 52, sig: 'honeymote', drain: 0.5 },
  sig_grumpkin: { name: 'Grumpy Thump', power: 72, sig: 'grumpkin', recoil: 0.1 },
  sig_silkit: { name: 'Silk Snare', power: 50, sig: 'silkit', stun: 0.4 },
  sig_chucklet: { name: 'Giggle Fit', power: 36, sig: 'chucklet', hits: 2 },
  sig_mufflekit: { name: 'Silent Paw', power: 66, sig: 'mufflekit' },
  sig_blarebird: { name: 'Morning Alarm', power: 74, sig: 'blarebird', recoil: 0.15 },
  sig_minikin: { name: 'Tiny Might', power: 60, sig: 'minikin', focusUp: 1 },
  sig_jellywob: { name: 'Jiggle Jab', power: 36, sig: 'jellywob', hits: 2 },
  sig_voltquill: { name: 'Thunder Script', power: 90, sig: 'voltquill' },
  sig_grammadon: { name: 'Ancient Syntax', power: 90, sig: 'grammadon' },
  sig_aurorune: { name: 'Dawnlight', power: 80, sig: 'aurorune', drain: 0.4 },
  vt2: { name: 'Rapid Rewrite', power: 76, type: 'verb', desc: 'A fast, strong Verb move. Learned at level 30.' },
  vt3: { name: 'Verb Avalanche', power: 96, type: 'verb', desc: 'A massive Verb move. Learned at level 45.' },
  nt2: { name: 'Monument Slam', power: 76, type: 'noun', desc: 'A solid, strong Noun move. Learned at level 30.' },
  nt3: { name: 'Bedrock Bash', power: 96, type: 'noun', desc: 'A massive Noun move. Learned at level 45.' },
  at2: { name: 'Vivid Burst', power: 76, type: 'adj', desc: 'A bright, strong Adjective move. Learned at level 30.' },
  at3: { name: 'Superlative Beam', power: 96, type: 'adj', desc: 'A massive Adjective move. Learned at level 45.' },
});
const TR_SIG_DESC = { hits: 'Hits twice in a row.', guardUp: 'Hits, then braces to take less damage from the next attack.', drain: 'Hits, then takes back some of the damage as HP.', stun: 'Sometimes freezes the foe so it skips a turn.', recoil: 'Hits very hard, but hurts itself a little.', focusUp: 'Hits, then focuses so the next hit is much stronger.' };
const trFamilyOf = sp => { let x = sp; while (TR_SPECIES[x]?.from) x = TR_SPECIES[x].from; return x; };
for (const [k, mv] of Object.entries(TR_MOVES)) if (mv.sig) {
  const fam = TR_SPECIES[mv.sig]; mv.type = fam.type; mv.learn = fam.legend ? 1 : fam.evo ? fam.evo[1] : 15;
  const fx = Object.keys(TR_SIG_DESC).find(e => mv[e]);
  mv.desc = `${fam.name}’s own ${({ verb: 'Verb', noun: 'Noun', adj: 'Adjective' })[fam.type]} move. ${fx ? TR_SIG_DESC[fx] : 'A strong hit.'} Learned at level ${mv.learn}.`;
}
/* Every move a Wordling learns by levelling up, in order: [level, move] */
const TR_TIER = { verb: ['vt2', 'vt3'], noun: ['nt2', 'nt3'], adj: ['at2', 'at3'] };
function trLearnset(sp) {
  const t = TR_SPECIES[sp].type, sig = TR_MOVES['sig_' + trFamilyOf(sp)];
  return [[1, 'strike'], [1, 'guard'], [5, TR_SPECIAL[t]], [8, 'focus'], ...(sig ? [[sig.learn, 'sig_' + trFamilyOf(sp)]] : []), [18, 'surge'], [30, TR_TIER[t][0]], [45, TR_TIER[t][1]]].sort((a, b) => a[0] - b[0]);
}
