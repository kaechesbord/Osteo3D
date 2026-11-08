export type SkeletonRegion = 
  | 'all'
  | 'head'
  | 'spine'
  | 'thorax'
  | 'upper_limb'
  | 'pelvis'
  | 'lower_limb';

export type BoneClassification = 
  | 'long'
  | 'short'
  | 'flat'
  | 'irregular'
  | 'sesamoid';

export type SkeletalDivision = 'axial' | 'appendicular';

export interface BoneData {
  id: string;
  name: string;
  commonName: string;
  latinName: string;
  region: SkeletonRegion;
  division: SkeletalDivision;
  classification: BoneClassification;
  countInBody: number;
  description: string;
  articulations: string[];
  landmarks: string[];
  clinicalNote: string;
  mnemonic?: string;
  funFact: string;
  defaultPosition: [number, number, number];
  disarticulateVector: [number, number, number]; // Direction and distance when exploded
  cameraTarget: [number, number, number];
  cameraPosition: [number, number, number];
}

export interface QuizQuestion {
  id: string;
  type: 'click_3d' | 'identify_bone' | 'clinical_trivia';
  targetBoneId?: string;
  prompt: string;
  subtitle?: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  hint?: string;
}

export interface AcademyLesson {
  id: string;
  title: string;
  category: string;
  icon: string;
  targetBoneId?: string;
  cameraPosition?: [number, number, number];
  cameraTarget?: [number, number, number];
  summary: string;
  content: string[];
  mnemonic?: string;
  quickCheck: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}
