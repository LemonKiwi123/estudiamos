'use strict';
/* ================= Lexicon Saga: more music =================
   Original songs so regions, kinds of town, castles, dungeons and kinds of battle each sound a little different.
   Same sound chip as the other songs (trmusic.js). Extras used here: wave (the lead's tone: 'square', 'thin', 'triangle')
   and harm (a quieter second melody line). */
Object.assign(TRM_SONGS, {
  /* ---------- regions ---------- */
  sg_highlands: { bpm: 140, wave: 'square', vol: 0.8, drums: ['k . h k s . h h'],
    lead: ['D5 - A4 - D5 E5 F5 -', 'E5 - D5 - C5 - A4 -', 'G4 - C5 - E5 - G5 -', 'F5 E5 D5 - E5 - . .', 'D5 - F5 A5 - G5 F5 -', 'E5 - G5 - C6 - B5 -', 'A5 G5 F5 E5 D5 C5 E5 -', 'D5 - - - A4 - . .'],
    bass: ['D3 - A3 - D3 - A3 -', 'C3 - G3 - A2 - E3 -', 'C3 - G3 - C3 - G3 -', 'D3 - A3 - A2 - . .', 'D3 - A3 - F3 - A3 -', 'C3 - G3 - G2 - D3 -', 'F2 - C3 - G2 - A2 -', 'D3 - A3 - D3 - . .'] },
  sg_wastes: { bpm: 76, wave: 'triangle', vol: 0.85, drums: ['k . . . . . . h'],
    lead: ['C5 - - Eb5 - - D5 -', 'B4 - - - - - . .', 'Ab4 - - C5 - - B4 -', 'G4 - - - - - . .', 'C5 - Eb5 - G5 - F#5 -', 'G5 - - - Eb5 - . .', 'F5 - Eb5 - D5 - B4 -', 'C5 - - - - - . .'],
    harm: ['G4 - - G4 - - Ab4 -', 'G4 - - - - - . .', 'Eb4 - - Eb4 - - D4 -', 'D4 - - - - - . .', 'G4 - C5 - Eb5 - C5 -', 'Eb5 - - - C5 - . .', 'Ab4 - G4 - F4 - D4 -', 'Eb4 - - - - - . .'],
    bass: ['C3 - - - G2 - - -', 'G2 - - - D3 - - -', 'Ab2 - - - Eb3 - - -', 'G2 - - - B2 - - -', 'C3 - - - Eb3 - - -', 'C3 - - - G2 - - -', 'Ab2 - - - G2 - - -', 'C3 - - - - - . .'] },
  sg_canyon: { bpm: 116, wave: 'square', vol: 0.8, drums: ['k h k k s h k .'],
    lead: ['E5 - - B4 E5 - G5 -', 'F#5 - E5 - D5 - B4 -', 'C5 - - G4 C5 - E5 -', 'D5 - - - B4 - . .', 'E5 - G5 - B5 - A5 G5', 'F#5 - D5 - A4 - D5 -', 'C5 B4 A4 - B4 - D#5 -', 'E5 - - - - - . .'],
    bass: ['E2 - B2 - E2 - B2 -', 'D2 - A2 - D2 - A2 -', 'C2 - G2 - C2 - G2 -', 'B2 - F#2 - B2 - D#3 -', 'E2 - B2 - G2 - B2 -', 'D2 - A2 - F#2 - A2 -', 'A2 - E3 - B2 - F#3 -', 'E2 - B2 - E2 - . .'] },

  /* ---------- kinds of town ---------- */
  sg_village: { bpm: 108, wave: 'triangle', vol: 0.9, drums: ['k . . h s . . h'],
    lead: ['B4 - D5 - G5 - - F#5', 'E5 - D5 - B4 - - -', 'C5 - E5 - A5 - - G5', 'F#5 - E5 - D5 - . .', 'B4 - D5 - G5 - B5 -', 'A5 - G5 - E5 - C5 -', 'D5 - E5 - F#5 - A5 -', 'G5 - - - - - . .'],
    bass: ['G2 - D3 - G3 - D3 -', 'C3 - G3 - G2 - D3 -', 'A2 - E3 - C3 - E3 -', 'D3 - A3 - D3 - F#3 -', 'G2 - D3 - E3 - B3 -', 'C3 - G3 - A2 - E3 -', 'D3 - A3 - D3 - C3 -', 'G2 - D3 - G2 - . .'] },
  sg_town_snow: { bpm: 92, wave: 'thin', vol: 0.85, drums: ['k . . . . . h .'],
    lead: ['E5 - A5 - C#6 - B5 -', 'A5 - - - E5 - . .', 'F#5 - A5 - D6 - C#6 -', 'B5 - - - - - . .', 'C#6 - B5 - A5 - E5 -', 'D5 - F#5 - A5 - G#5 -', 'A5 - B5 - C#6 - B5 G#5', 'A5 - - - - - . .'],
    harm: ['C#5 - E5 - E5 - E5 -', 'C#5 - - - C#5 - . .', 'D5 - F#5 - A5 - A5 -', 'E5 - - - - - . .', 'E5 - E5 - C#5 - C#5 -', 'B4 - D5 - F#5 - E5 -', 'E5 - E5 - E5 - D5 E5', 'C#5 - - - - - . .'],
    bass: ['A2 - E3 - A2 - E3 -', 'A2 - E3 - C#3 - E3 -', 'D3 - A3 - D3 - A3 -', 'E2 - B2 - E2 - B2 -', 'A2 - E3 - F#2 - C#3 -', 'D3 - A3 - B2 - E3 -', 'D3 - A3 - E3 - B3 -', 'A2 - E3 - A2 - . .'] },
  sg_bazaar: { bpm: 118, wave: 'square', vol: 0.75, drums: ['k . s k . k s .'],
    lead: ['D5 Eb5 F#5 - G5 F#5 Eb5 D5', 'Eb5 - D5 - C5 - D5 -', 'A4 Bb4 C5 - D5 C5 Bb4 A4', 'Bb4 - A4 - G4 - A4 -', 'D5 - F#5 G5 A5 - G5 F#5', 'G5 - F#5 Eb5 D5 - C5 -', 'Bb4 C5 D5 Eb5 F#5 - Eb5 -', 'D5 - - - - - . .'],
    bass: ['D3 - A2 - D3 - A2 -', 'Eb3 - Bb2 - D3 - A2 -', 'D3 - A2 - D3 - A2 -', 'G2 - D3 - D3 - A2 -', 'D3 - A2 - D3 - A2 -', 'C3 - G2 - D3 - A2 -', 'G2 - D3 - Eb3 - Bb2 -', 'D3 - A2 - D3 - . .'] },
  sg_town_wild: { bpm: 124, wave: 'square', vol: 0.75, drums: ['k . h s . k s h'],
    lead: ['C5 - F5 - A5 - G5 F5', 'G5 - - E5 - C5 - .', 'D5 - F5 - Bb5 - A5 G5', 'A5 - - F5 - . . .', 'C6 - A5 - F5 - A5 C6', 'D6 - C6 - Bb5 - A5 -', 'G5 - A5 Bb5 - A5 G5 E5', 'F5 - - - - - . .'],
    bass: ['F2 - C3 F3 - C3 A2 -', 'C3 - G3 C3 - G2 E3 -', 'Bb2 - F3 Bb3 - F3 D3 -', 'F2 - C3 F3 - C3 A2 -', 'F2 - C3 F3 - C3 A2 -', 'Bb2 - F3 Bb3 - F3 D3 -', 'C3 - G3 C3 - G2 E3 -', 'F2 - C3 F3 - . . .'] },
  sg_town_marsh: { bpm: 96, vol: 0.8, drums: ['k . . h k . s .'],
    lead: ['G4 - Bb4 - D5 - C5 Bb4', 'A4 - - - F4 - . .', 'G4 - Bb4 - D5 - F5 -', 'Eb5 - D5 - C5 - . .', 'Bb4 - D5 - G5 - F5 Eb5', 'D5 - C5 - Bb4 - A4 -', 'C5 - Bb4 - A4 - F#4 -', 'G4 - - - - - . .'],
    bass: ['G2 - - D3 G2 - D3 -', 'F2 - - C3 F2 - C3 -', 'Eb2 - - Bb2 Eb2 - Bb2 -', 'F2 - - C3 F2 - A2 -', 'G2 - - D3 G2 - D3 -', 'Bb2 - - F3 Bb2 - F3 -', 'C3 - - G3 D3 - A2 -', 'G2 - - D3 G2 - . .'] },
  sg_town_dusk: { bpm: 84, wave: 'triangle', vol: 0.9, drums: ['k . . . . h . .'],
    lead: ['B4 - - E5 - - G5 -', 'F#5 - - - E5 - . .', 'C5 - - E5 - - A5 -', 'G5 - - - F#5 - . .', 'E5 - G5 - B5 - A5 -', 'G5 - F#5 - E5 - D5 -', 'C5 - E5 - D5 - B4 -', 'E5 - - - - - . .'],
    harm: ['G4 - - B4 - - E5 -', 'D#5 - - - B4 - . .', 'A4 - - C5 - - E5 -', 'E5 - - - D#5 - . .', 'B4 - E5 - G5 - E5 -', 'E5 - D5 - C5 - B4 -', 'A4 - C5 - A4 - G4 -', 'G4 - - - - - . .'],
    bass: ['E3 - B3 - E3 - B3 -', 'B2 - F#3 - B2 - F#3 -', 'A2 - E3 - A2 - E3 -', 'B2 - F#3 - B2 - D#3 -', 'E3 - B3 - C3 - G3 -', 'C3 - G3 - G2 - D3 -', 'A2 - E3 - B2 - F#3 -', 'E3 - B3 - E3 - . .'] },
  sg_forge: { bpm: 112, wave: 'square', vol: 0.75, drums: ['k . s . k k s .'],
    lead: ['Bb4 - D5 - F5 - - D5', 'Eb5 - G5 - F5 - - -', 'D5 - F5 - Bb5 - A5 G5', 'F5 - - - C5 - . .', 'Bb4 - D5 - F5 - Bb5 -', 'C6 - Bb5 - A5 - G5 -', 'F5 - Eb5 - D5 - C5 -', 'Bb4 - - - - - . .'],
    bass: ['Bb2 - F3 - Bb2 - F3 -', 'Eb3 - Bb3 - Bb2 - F3 -', 'Bb2 - F3 - G2 - D3 -', 'F2 - C3 - F2 - A2 -', 'Bb2 - F3 - D3 - F3 -', 'F2 - C3 - F2 - C3 -', 'Eb3 - Bb3 - F2 - C3 -', 'Bb2 - F3 - Bb2 - . .'] },

  /* ---------- castles ---------- */
  sg_palace: { bpm: 96, wave: 'square', vol: 0.75, drums: ['k . h . s . h h'],
    lead: ['D5 - - A4 D5 - F#5 -', 'A5 - - - F#5 - D5 -', 'G5 - - E5 G5 - B5 -', 'A5 - - - - - . .', 'B5 - A5 - G5 - F#5 -', 'E5 - F#5 - G5 - A5 -', 'B5 - A5 G5 F#5 - E5 -', 'D5 - - - - - . .'],
    harm: ['F#4 - - F#4 A4 - D5 -', 'F#5 - - - D5 - A4 -', 'B4 - - B4 E5 - G5 -', 'E5 - - - - - . .', 'G5 - F#5 - E5 - D5 -', 'C#5 - D5 - E5 - F#5 -', 'G5 - F#5 E5 D5 - C#5 -', 'A4 - - - - - . .'],
    bass: ['D3 - A3 - D3 - A3 -', 'D3 - A3 - B2 - F#3 -', 'G2 - D3 - E3 - B3 -', 'A2 - E3 - A2 - C#3 -', 'G2 - D3 - D3 - A3 -', 'A2 - E3 - A2 - E3 -', 'G2 - D3 - A2 - E3 -', 'D3 - A3 - D3 - . .'] },
  sg_unwritten: { bpm: 100, wave: 'square', vol: 0.8, drums: ['k . h k s . h .'],
    lead: ['C5 - G4 - C5 D5 Eb5 -', 'D5 - B4 - G4 - . .', 'Ab4 - C5 - Eb5 - D5 C5', 'B4 - - - G4 - . .', 'C5 - Eb5 - G5 - Ab5 -', 'G5 - F5 - Eb5 - D5 -', 'Eb5 - D5 - C5 - B4 -', 'C5 - - - - - . .'],
    bass: ['C3 C3 G2 G2 C3 C3 G2 G2', 'G2 G2 D3 D3 G2 G2 B2 B2', 'Ab2 Ab2 Eb3 Eb3 Ab2 Ab2 Eb3 Eb3', 'G2 G2 D3 D3 G2 G2 B2 B2', 'C3 C3 G2 G2 Eb3 Eb3 C3 C3', 'Bb2 Bb2 F2 F2 Bb2 Bb2 F2 F2', 'Ab2 Ab2 Eb3 Eb3 G2 G2 D3 D3', 'C3 C3 G2 G2 C3 - . .'] },

  /* ---------- dungeons ---------- */
  sg_icecave: { bpm: 80, wave: 'thin', vol: 0.85, drums: ['k . . . . . h .'],
    lead: ['F#5 - - - D5 - B4 -', 'C#5 - - - F#4 - . .', 'G5 - - - E5 - C#5 -', 'D5 - - - B4 - . .', 'B5 - A5 - F#5 - D5 -', 'E5 - - G5 - - F#5 -', 'E5 - D5 - C#5 - A#4 -', 'B4 - - - - - . .'],
    bass: ['B2 - F#3 - B2 - F#3 -', 'F#2 - C#3 - F#2 - C#3 -', 'E2 - B2 - E2 - B2 -', 'B2 - F#3 - B2 - F#3 -', 'G2 - D3 - B2 - F#3 -', 'E2 - B2 - D3 - A3 -', 'G2 - D3 - F#2 - C#3 -', 'B2 - F#3 - B2 - . .'] },
  sg_mine: { bpm: 126, wave: 'square', vol: 0.75, drums: ['k h s h k h s h'],
    lead: ['A4 - A4 C5 - A4 E5 -', 'D5 - C5 - B4 - G4 -', 'A4 - A4 C5 - E5 A5 -', 'G5 - E5 - D5 - . .', 'F5 - F5 E5 - D5 C5 -', 'E5 - E5 D5 - C5 B4 -', 'C5 - D5 - E5 - G#4 -', 'A4 - - - - - . .'],
    bass: ['A2 E3 A2 E3 A2 E3 A2 E3', 'G2 D3 G2 D3 G2 D3 G2 D3', 'A2 E3 A2 E3 A2 E3 A2 E3', 'C3 G3 C3 G3 G2 D3 G2 D3', 'F2 C3 F2 C3 F2 C3 F2 C3', 'C3 G3 C3 G3 G2 D3 G2 D3', 'F2 C3 F2 C3 E2 B2 E2 B2', 'A2 E3 A2 E3 A2 - . .'] },
  sg_crypt: { bpm: 66, wave: 'triangle', vol: 0.9, drums: ['k . . . . . . .'],
    lead: ['F5 - - - E5 - - -', 'Db5 - - - C5 - - -', 'Bb4 - - - Db5 - C5 -', 'C5 - - - - - . .', 'Ab5 - - - G5 - - -', 'F5 - - - E5 - - -', 'Db5 - C5 - Bb4 - E4 -', 'F4 - - - - - . .'],
    harm: ['C5 - - - C5 - - -', 'Bb4 - - - Ab4 - - -', 'F4 - - - F4 - E4 -', 'E4 - - - - - . .', 'C5 - - - C5 - - -', 'Db5 - - - C5 - - -', 'Bb4 - Ab4 - G4 - C4 -', 'C4 - - - - - . .'],
    bass: ['F2 - - - C3 - - -', 'Bb2 - - - F2 - - -', 'Db3 - - - Bb2 - - -', 'C3 - - - - - . .', 'F2 - - - C3 - - -', 'Db3 - - - C3 - - -', 'Bb2 - - - C3 - - -', 'F2 - - - - - . .'] },
  sg_temple: { bpm: 100, wave: 'thin', vol: 0.85, drums: ['k . . h . . s .'],
    lead: ['E5 - G5 A5 - G5 E5 -', 'D5 - - C5 - A4 - -', 'C5 - D5 E5 - G5 E5 D5', 'E5 - - - - - . .', 'A5 - G5 E5 - D5 E5 -', 'G5 - - E5 - D5 - -', 'C5 - D5 - E5 G5 E5 D5', 'A4 - - - - - . .'],
    bass: ['A2 - - E3 - - A2 -', 'G2 - - D3 - - G2 -', 'F2 - - C3 - - F2 -', 'E2 - - B2 - - E2 -', 'A2 - - E3 - - A2 -', 'C3 - - G3 - - C3 -', 'D3 - - A3 - - E3 -', 'A2 - - E3 - - . .'] },
  sg_barrow: { bpm: 84, wave: 'triangle', vol: 0.9, drums: ['k . . h . . h .'],
    lead: ['D5 - Bb4 - G4 - Bb4 D5', 'C5 - - - A4 - . .', 'Eb5 - C5 - A4 - C5 Eb5', 'D5 - - - - - . .', 'G5 - F5 - D5 - Bb4 -', 'A4 - Bb4 - C5 - D5 -', 'Eb5 - D5 - C5 - A4 -', 'G4 - - - - - . .'],
    bass: ['G2 - D3 - G3 - D3 -', 'F2 - C3 - F3 - C3 -', 'C3 - G3 - C4 - G3 -', 'D3 - A3 - F#3 - A3 -', 'G2 - D3 - G3 - D3 -', 'F2 - C3 - Bb2 - F3 -', 'C3 - G3 - D3 - A3 -', 'G2 - D3 - G2 - . .'] },

  /* ---------- kinds of battle ---------- */
  sg_battle_cold: { bpm: 168, wave: 'thin', vol: 0.85, drums: ['k h s h k h s h'],
    lead: ['B4 D5 F#5 B5 A5 - F#5 -', 'G5 - E5 - C#5 - E5 -', 'F#5 - D5 - B4 - D5 F#5', 'E5 - - - C#5 - . .', 'B5 - A5 - G5 - F#5 -', 'E5 F#5 G5 - A5 - G5 -', 'F#5 E5 D5 C#5 D5 E5 A#4 C#5', 'B4 - - - F#4 - . .'],
    bass: ['B2 B3 B2 B3 B2 B3 B2 B3', 'E2 E3 E2 E3 A2 A3 A2 A3', 'B2 B3 B2 B3 G2 G3 G2 G3', 'A2 A3 A2 A3 F#2 F#3 F#2 F#3', 'G2 G3 G2 G3 D2 D3 D2 D3', 'E2 E3 E2 E3 A2 A3 A2 A3', 'D2 D3 D2 D3 F#2 F#3 F#2 F#3', 'B2 B3 B2 B3 B2 - . .'] },
  sg_battle_wild: { bpm: 164, wave: 'square', vol: 0.8, drums: ['k . s k k . s s'],
    lead: ['D5 - D5 F5 - D5 A5 -', 'G5 F5 E5 - C5 - E5 -', 'D5 - D5 F5 - A5 D6 -', 'C6 - A5 - G5 - . .', 'Bb5 - A5 - G5 - F5 -', 'E5 - G5 - A5 - C6 -', 'D6 C6 A5 G5 F5 E5 C#5 E5', 'D5 - - - A4 - . .'],
    bass: ['D2 D3 . D3 D2 D3 . D3', 'C2 C3 . C3 C2 C3 . C3', 'D2 D3 . D3 D2 D3 . D3', 'F2 F3 . F3 C2 C3 . C3', 'Bb2 Bb3 . Bb3 Bb2 Bb3 . Bb3', 'C3 C4 . C4 A2 A3 . A3', 'Bb2 Bb3 . Bb3 A2 A3 . A3', 'D2 D3 . D3 D2 - . .'] },
  sg_battle_sea: { bpm: 176, vol: 0.85, drums: ['k h s h k k s h'],
    lead: ['D5 G5 - G5 A5 B5 - G5', 'F5 - D5 - C5 - D5 -', 'D5 G5 - G5 A5 B5 - D6', 'C6 - A5 - F5 - . .', 'E5 - G5 - C6 - B5 -', 'A5 - F5 - D5 - F5 -', 'G5 A5 B5 C6 D6 C6 B5 A5', 'G5 - - - D5 - . .'],
    bass: ['G2 G3 G2 G3 G2 G3 G2 G3', 'F2 F3 F2 F3 F2 F3 F2 F3', 'G2 G3 G2 G3 G2 G3 G2 G3', 'F2 F3 F2 F3 D2 D3 D2 D3', 'C3 C4 C3 C4 C3 C4 C3 C4', 'D3 D4 D3 D4 D3 D4 D3 D4', 'C3 C4 C3 C4 D3 D4 D3 D4', 'G2 G3 G2 G3 G2 - . .'] },
  sg_battle_deep: { bpm: 160, wave: 'square', vol: 0.8, drums: ['k . s h k . s h'],
    lead: ['E5 - F5 - E5 - B4 -', 'C5 - D5 - B4 - G4 -', 'E5 - F5 - A5 - G5 F5', 'E5 - - - - - . .', 'A5 - G5 - F5 - E5 -', 'D5 - E5 - F5 - G#5 -', 'A5 G#5 F5 E5 D5 C5 B4 C5', 'E5 - - - B4 - . .'],
    bass: ['E2 E3 E2 E3 F2 F3 F2 F3', 'A2 A3 A2 A3 G2 G3 G2 G3', 'E2 E3 E2 E3 D2 D3 D2 D3', 'E2 E3 E2 E3 E2 E3 E2 E3', 'F2 F3 F2 F3 C3 C4 C3 C4', 'D2 D3 D2 D3 E2 E3 E2 E3', 'F2 F3 F2 F3 G2 G3 G2 G3', 'E2 E3 E2 E3 E2 - . .'] },
  sg_battle_elite: { bpm: 180, wave: 'square', vol: 0.85, drums: ['k h s h k h s s'],
    lead: ['G4 Bb4 D5 G5 F#5 - D5 -', 'Eb5 - C5 - A4 - F#4 -', 'G4 Bb4 D5 G5 Bb5 - A5 G5', 'F#5 - - - D5 - . .', 'Eb5 - G5 - C6 - Bb5 -', 'A5 - F5 - D5 - F5 -', 'G5 F#5 G5 A5 Bb5 A5 G5 F#5', 'G5 - - - D5 - . .'],
    bass: ['G2 G3 G2 G3 G2 G3 G2 G3', 'C3 C4 C3 C4 D3 D4 D3 D4', 'G2 G3 G2 G3 G2 G3 G2 G3', 'D3 D4 D3 D4 D3 D4 D3 D4', 'C3 C4 C3 C4 C3 C4 C3 C4', 'F2 F3 F2 F3 Bb2 Bb3 Bb2 Bb3', 'Eb3 Eb4 Eb3 Eb4 D3 D4 D3 D4', 'G2 G3 G2 G3 G2 - . .'] },
});

/* which places get which song (anything not listed keeps its own) */
const SG_MAP_SONGS = {
  north2: 'sg_highlands', north3: 'sg_wastes', south3: 'sg_canyon',
  briar: 'sg_village', frost: 'sg_town_snow', rimeholt: 'sg_town_snow', frostport: 'sg_town_snow',
  sandmere: 'sg_bazaar', redrock: 'sg_bazaar', well: 'sg_bazaar', thornvale: 'sg_town_wild', palmcove: 'sg_town_wild',
  bogsend: 'sg_town_marsh', tidewater: 'sg_town_marsh', hollowmere: 'sg_town_dusk', lastlight: 'sg_town_dusk', lantern: 'sg_town_dusk',
  emberfall: 'sg_forge', stormwatch: 'sg_forge',
  castle_s: 'sg_palace', castle1: 'sg_unwritten', castle2: 'sg_unwritten', castle3: 'sg_unwritten',
  frost1: 'sg_icecave', frost2: 'sg_icecave', mine1: 'sg_mine', mine2: 'sg_mine', crypt1: 'sg_crypt', crypt2: 'sg_crypt',
  temple1: 'sg_temple', temple2: 'sg_temple', barrow1: 'sg_barrow', barrow2: 'sg_barrow',
};
const SG_DEEP_SONGS = new Set(['sg_cave', 'sg_ember', 'sg_tower', 'sg_archive', 'sg_icecave', 'sg_mine', 'sg_crypt', 'sg_temple', 'sg_barrow', 'sg_unwritten', 'sg_castle']);
const SG_COLD_SONGS = new Set(['sg_snow', 'sg_town_snow', 'sg_highlands']);
const SG_WILD_SONGS = new Set(['sg_jungle', 'sg_swamp', 'sg_town_wild', 'sg_town_marsh']);
/* the song for a place */
function sgSongOf(id) { return SG_MAP_SONGS[id] || SG_MAPS[id]?.song || 'sg_town'; }
/* the song for a battle: the final boss, bosses, then fights with monsters you can see on the map, then by where you are */
function sgBattleSongFor(bt, s) {
  if (bt?.final) return 'sg_final';
  if (bt?.boss) return 'sg_boss';
  if (bt?.fixed) return 'sg_battle_elite';
  const id = s?.map || '', here = sgSongOf(id);
  if (s?.boat || id.startsWith('sea_') || here === 'sg_sea' || here === 'sg_isles') return 'sg_battle_sea';
  if (SG_DEEP_SONGS.has(here)) return 'sg_battle_deep';
  if (SG_COLD_SONGS.has(here)) return 'sg_battle_cold';
  if (SG_WILD_SONGS.has(here)) return 'sg_battle_wild';
  return 'sg_battle';
}
