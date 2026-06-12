/**
 * Tone.Sampler pitch → URL mapping for the flute sample set.
 *
 * Samples are bundled in /public/samples/flute/ and served from the same
 * static host as the app (Vercel / Netlify / Cloudflare Pages — all CDNs).
 * No third-party storage dependency.
 *
 * Source: Woodwind sample pack, flute folder, 1.5 s mezzo-forte normal articulation.
 * Filename convention: flute_<Pitch>_<Dur>_<Dyn>_<Art>.mp3
 *   "Ds4" = D#4/Eb4, "Fs4" = F#4/Gb4
 * Total: ~180 KB across 9 chromatic pitches (C4–C6). Tone.js pitch-shifts
 * between them to cover the full flute range.
 */

const BASE = `${import.meta.env.BASE_URL}samples/flute`;

export const FLUTE_SAMPLES: Record<string, string> = {
  C4:    `${BASE}/flute_C4_15_mezzo-forte_normal.mp3`,
  'D#4': `${BASE}/flute_Ds4_15_mezzo-forte_normal.mp3`,
  'F#4': `${BASE}/flute_Fs4_15_mezzo-forte_normal.mp3`,
  A4:    `${BASE}/flute_A4_15_mezzo-forte_normal.mp3`,
  C5:    `${BASE}/flute_C5_15_mezzo-forte_normal.mp3`,
  'D#5': `${BASE}/flute_Ds5_15_mezzo-forte_normal.mp3`,
  'F#5': `${BASE}/flute_Fs5_15_mezzo-forte_normal.mp3`,
  A5:    `${BASE}/flute_A5_15_mezzo-forte_normal.mp3`,
  C6:    `${BASE}/flute_C6_15_mezzo-forte_normal.mp3`,
};
