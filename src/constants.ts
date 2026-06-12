import type { Flute, FluteKey, RoadmapFeature, Swara } from './types';

export const SWARAS: Swara[] = ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni'];

// Major scale intervals from root, in semitones
export const SWARA_INTERVALS: Record<Swara, number> = {
  Sa: 0,
  Re: 2,
  Ga: 4,
  Ma: 5,
  Pa: 7,
  Dha: 9,
  Ni: 11,
};

// Root MIDI note for each flute (octave 4)
export const FLUTE_ROOT_MIDI: Record<FluteKey, number> = {
  C: 60,
  'C#': 61,
  D: 62,
  E: 64,
  F: 65,
};

// Carousel order: C# (active) sits in the middle
export const FLUTES: Flute[] = [
  { key: 'C',  name: 'C FLUTE',  root: 'Root: C',       imgRotate: -8 },
  { key: 'D',  name: 'D FLUTE',  root: 'Root: D',       imgRotate: -4 },
  { key: 'C#', name: 'C# FLUTE', root: 'Root: C# / Db', imgRotate: 0  },
  { key: 'E',  name: 'E FLUTE',  root: 'Root: E',       imgRotate: 4  },
  { key: 'F',  name: 'F FLUTE',  root: 'Root: F',       imgRotate: 8  },
];

export const FLUTE_IMAGE: Record<FluteKey, string> = {
  'C#': 'https://zccmrecwlvfqsftmsoxa.supabase.co/storage/v1/object/public/Test/C_Sharp.png',
  'C':  'https://zccmrecwlvfqsftmsoxa.supabase.co/storage/v1/object/public/Test/C.png',
  'D':  'https://zccmrecwlvfqsftmsoxa.supabase.co/storage/v1/object/public/Test/D.png',
  'E':  'https://zccmrecwlvfqsftmsoxa.supabase.co/storage/v1/object/public/Test/E.png',
  'F':  'https://zccmrecwlvfqsftmsoxa.supabase.co/storage/v1/object/public/Test/F.png',
};

// MediaPipe gesture recognizer model
export const GESTURE_MODEL_URL =
  'https://zccmrecwlvfqsftmsoxa.supabase.co/storage/v1/object/public/Test/gesture_recognizer_final.task';

// Gesture detection
export const CONFIDENCE_THRESHOLD = 0.50;
export const NO_HAND_FRAMES = 6;

export const ROADMAP_FEATURES: RoadmapFeature[] = [
  { id: 'f1', title: 'DUAL HAND CONTROL',               desc: 'Play two-handed gestures for complex compositions and chord-style combinations.' },
  { id: 'f2', title: 'BREATH INTENSITY',                desc: 'A second MediaPipe model tracks lip openness in real time. Open wider to blow harder and control volume naturally.' },
  { id: 'f3', title: 'MULTI-ANGLE GESTURE RECOGNITION', desc: 'Improved model accuracy across different hand angles, distances and orientations.' },
  { id: 'f4', title: '2ND, 3RD & 4TH OCTAVE SUPPORT',   desc: 'Extend beyond one octave and unlock the full bansuri range.' },
  { id: 'f5', title: 'HALF NOTES & MICROTONES',         desc: 'Additional gesture shapes for komal and tivra swaras.' },
  { id: 'f6', title: 'ALL FLUTE SCALES',                desc: 'C, D, E, F and additional scales available to play.' },
  { id: 'f7', title: 'LEARN EASY SONGS',                desc: 'Step-by-step guided melodies and ragas.' },
  { id: 'f8', title: 'RECORDING & PLAYBACK',            desc: 'Save performances and replay them later.' },
  { id: 'f9', title: 'QUALITY OF LIFE IMPROVEMENTS',    desc: 'Faster loading, smoother animations and improved mobile support.' },
];
