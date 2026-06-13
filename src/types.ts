export type Swara = 'Sa' | 'Re' | 'Ga' | 'Ma' | 'Pa' | 'Dha' | 'Ni';

export type FluteKey = 'C' | 'C#' | 'D' | 'E' | 'F';

export interface Flute {
  key: FluteKey;
  name: string;
  root: string;
  imgRotate: number;
}

export interface RoadmapFeature {
  id: string;
  title: string;
  desc: string;
  /** Marks a feature as already shipped — rendered with a "completed" badge. */
  done?: boolean;
}

export type SectionId = 'hero' | 'carousel' | 'roadmap';
