export type UserRole = 'child' | 'parent' | 'doctor' | 'admin';

export type GameCategory =
  | 'Memory'
  | 'Attention'
  | 'Pattern Recognition'
  | 'Motor Coordination'
  | 'Language'
  | 'Problem Solving';

export interface GameDefinition {
  id: string;
  number: number;
  title: string;
  category: GameCategory;
  shortDescription: string;
  simpleInstructions: string;
  detailedInstructions: string;
  skillsTargeted: string[];
  estimatedMinutes: number;
  accentHex: string;
  surfaceHex: string;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  criteriaText: string;
  coinsBonus: number;
  xpBonus: number;
}

export interface AccessibilityPreferences {
  dyslexic_font: boolean;
  high_contrast: boolean;
  reduced_motion: boolean;
  text_size: 'normal' | 'large' | 'xlarge';
  text_to_speech: boolean;
  sound_enabled: boolean;
  simplified_instructions: boolean;
  interaction_timing: 'relaxed' | 'standard' | 'brisk';
  keyboard_navigation: boolean;
  alternative_tap: boolean;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url: string;
  created_at: string;
}

export interface ChildProfile {
  id: string;
  user_id: string | null;
  guardian_id: string;
  doctor_id: string | null;
  display_name: string;
  age_group: string;
  avatar_url: string;
  learning_preferences: string[];
  created_at: string;
}

export interface GameSessionRecord {
  id: string;
  child_id: string;
  game_id: string;
  score: number;
  accuracy: number;
  attempts: number;
  duration: number;
  difficulty: number;
  hints_used: number;
  repeated_errors: number;
  completed: boolean;
  completed_at: string;
}

export interface RewardRecord {
  id: string;
  child_id: string;
  reward_type: string;
  claim_key: string;
  description: string;
  coins: number;
  xp: number;
  created_at: string;
}

export interface UnlockedAchievement {
  id: string;
  child_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface CaregiverNote {
  id: string;
  child_id: string;
  author_id: string;
  author_name: string;
  author_role: UserRole;
  note: string;
  created_at: string;
}

export interface AdaptiveAdjustment {
  previousDifficulty: number;
  nextDifficulty: number;
  action: 'increased' | 'maintained' | 'reduced';
  reason: string;
  offerSimplerInstructions: boolean;
  offerAudioGuidance: boolean;
  suggestedNextCategory: GameCategory | null;
}

export interface GameRecommendation {
  game_id: string;
  title: string;
  category: GameCategory;
  recommended_difficulty: number;
  reason: string;
  source: 'adaptive-engine' | 'educator';
  author_name?: string;
}

export const GAMES_CATALOG: GameDefinition[] = [
  {
    id: 'memory-match',
    number: 1,
    title: 'Memory Match',
    category: 'Memory',
    shortDescription: 'Flip gentle botanical and animal cards to discover matching pairs.',
    simpleInstructions: 'Tap two cards to flip them. Find pairs that look the same.',
    detailedInstructions: 'Flip two cards at a time to remember where each illustrated token sits. Matching all pairs completes the board at your own pace without any countdown timer pressure.',
    skillsTargeted: ['Working Memory', 'Visual Recall', 'Turn Planning'],
    estimatedMinutes: 3,
    accentHex: '#6D4AFF',
    surfaceHex: '#EDE9FE',
  },
  {
    id: 'pattern-sequence',
    number: 2,
    title: 'Pattern Sequence',
    category: 'Pattern Recognition',
    shortDescription: 'Watch a sequence of colored geometric tokens and rebuild the order.',
    simpleInstructions: 'Watch the shapes light up. Tap them in the same order.',
    detailedInstructions: 'Observe the sequence of distinct shapes and colors shown on the garden board, then tap the matching tokens in order. Each shape includes a unique symbol alongside color.',
    skillsTargeted: ['Sequential Memory', 'Pattern Tracking', 'Rule Recognition'],
    estimatedMinutes: 3,
    accentHex: '#047857',
    surfaceHex: '#D1FAE5',
  },
  {
    id: 'color-sorting',
    number: 3,
    title: 'Color Sorting',
    category: 'Attention',
    shortDescription: 'Sort friendly tokens into matching color and symbol baskets.',
    simpleInstructions: 'Pick a token, then tap or drag it into the basket with the same symbol.',
    detailedInstructions: 'Sort each object into its matching labeled basket. You can drag items or use accessible two-tap selection (tap item, then tap basket).',
    skillsTargeted: ['Selective Attention', 'Categorization', 'Motor Control'],
    estimatedMinutes: 3,
    accentHex: '#B45309',
    surfaceHex: '#FEF3C7',
  },
  {
    id: 'shape-identification',
    number: 4,
    title: 'Shape Identification',
    category: 'Pattern Recognition',
    shortDescription: 'Spot the requested geometric shape from clear visual cards.',
    simpleInstructions: 'Read or listen to the shape name. Tap the matching shape.',
    detailedInstructions: 'Listen to or read the requested geometric shape name, then select the matching card among clear high-contrast figures.',
    skillsTargeted: ['Visual Discrimination', 'Geometric Literacy', 'Listening'],
    estimatedMinutes: 2,
    accentHex: '#4F46E5',
    surfaceHex: '#E0E7FF',
  },
  {
    id: 'number-sequence',
    number: 5,
    title: 'Number Sequence',
    category: 'Problem Solving',
    shortDescription: 'Discover the missing stepping-stone number in calm sequences.',
    simpleInstructions: 'Look at the numbers on the path. Pick the missing number.',
    detailedInstructions: 'Follow the stepping-stone number sequence and select which number belongs in the open stone. Higher levels explore skip counting.',
    skillsTargeted: ['Numerical Reasoning', 'Pattern Prediction', 'Logic'],
    estimatedMinutes: 3,
    accentHex: '#0F766E',
    surfaceHex: '#CCFBF1',
  },
  {
    id: 'visual-attention',
    number: 6,
    title: 'Visual Attention',
    category: 'Attention',
    shortDescription: 'Find the hidden target object calmly in a garden grid.',
    simpleInstructions: 'Look at the target at the top. Find all matching ones below.',
    detailedInstructions: 'Scan the structured grid and tap every item that matches the target emblem shown at the top of your screen.',
    skillsTargeted: ['Visual Scanning', 'Sustained Focus', 'Impulse Control'],
    estimatedMinutes: 3,
    accentHex: '#9D174D',
    surfaceHex: '#FCE7F3',
  },
  {
    id: 'word-image-matching',
    number: 7,
    title: 'Word & Image Match',
    category: 'Language',
    shortDescription: 'Connect everyday words with friendly illustrations or voice cues.',
    simpleInstructions: 'Read or hear the word. Tap the picture that matches it.',
    detailedInstructions: 'Practice linking vocabulary words to visual meaning. Use the Read Aloud button anytime to hear the target word spoken clearly.',
    skillsTargeted: ['Word Recognition', 'Auditory Comprehension', 'Vocabulary'],
    estimatedMinutes: 3,
    accentHex: '#6D4AFF',
    surfaceHex: '#EDE9FE',
  },
  {
    id: 'audio-memory',
    number: 8,
    title: 'Audio Memory',
    category: 'Memory',
    shortDescription: 'Listen to gentle chime patterns and replay the melody.',
    simpleInstructions: 'Listen to the musical chimes. Tap the bells in the same order.',
    detailedInstructions: 'Hear a soft sequence of musical chime tones paired with visual rings, then repeat the exact sequence on the chime pads.',
    skillsTargeted: ['Auditory Memory', 'Sound Sequencing', 'Listening Focus'],
    estimatedMinutes: 3,
    accentHex: '#047857',
    surfaceHex: '#D1FAE5',
  },
  {
    id: 'maze-explorer',
    number: 9,
    title: 'Maze Explorer',
    category: 'Problem Solving',
    shortDescription: 'Guide the garden explorer along a calm path to the flower goal.',
    simpleInstructions: 'Use arrow keys or tap the direction buttons to reach the flower.',
    detailedInstructions: 'Plan a path from start to the glowing flower using keyboard arrows, on-screen direction buttons, or by tapping adjacent open tiles.',
    skillsTargeted: ['Spatial Planning', 'Motor Guidance', 'Problem Solving'],
    estimatedMinutes: 4,
    accentHex: '#B45309',
    surfaceHex: '#FEF3C7',
  },
  {
    id: 'sky-glider',
    number: 10,
    title: 'Sky Glider Motor',
    category: 'Motor Coordination',
    shortDescription: 'Guide a gentle paper kite through open cloud arches at your sensitivity.',
    simpleInstructions: 'Tap, click, or press Space to lift the kite gently through cloud gates.',
    detailedInstructions: 'An original calm side-scrolling motor coordination exercise. Adjust flight sensitivity anytime and glide through wide cloud gates without harsh resets.',
    skillsTargeted: ['Timing & Rhythm', 'Motor Coordination', 'Visual Tracking'],
    estimatedMinutes: 3,
    accentHex: '#0369A1',
    surfaceHex: '#E0F2FE',
  },
  {
    id: 'emotion-matching',
    number: 11,
    title: 'Emotion & Expression',
    category: 'Language',
    shortDescription: 'Explore friendly facial expressions and match them to feeling words.',
    simpleInstructions: 'Look at the friendly face. Pick the word that describes how they feel.',
    detailedInstructions: 'Observe clear illustrated facial expressions and match each expression with supportive feeling words and real-life context cues.',
    skillsTargeted: ['Emotion Recognition', 'Social Language', 'Empathy'],
    estimatedMinutes: 3,
    accentHex: '#6D4AFF',
    surfaceHex: '#EDE9FE',
  },
];

export const ACHIEVEMENTS_CATALOG: AchievementDefinition[] = [
  {
    id: 'first-game',
    title: 'First Sprout',
    description: 'Completed your very first cognitive game session.',
    criteriaText: 'Complete 1 game',
    coinsBonus: 15,
    xpBonus: 30,
  },
  {
    id: 'memory-master',
    title: 'Memory Master',
    description: 'Completed 3 Memory games with steady focus.',
    criteriaText: 'Complete 3 Memory category sessions',
    coinsBonus: 25,
    xpBonus: 50,
  },
  {
    id: 'focus-champion',
    title: 'Focus Champion',
    description: 'Achieved 85% or higher accuracy in an Attention game.',
    criteriaText: 'Score ≥ 85% in Attention',
    coinsBonus: 25,
    xpBonus: 50,
  },
  {
    id: 'seven-day-streak',
    title: 'Seven-Day Streak',
    description: 'Practiced gently across 7 consecutive days.',
    criteriaText: '7-day practice streak',
    coinsBonus: 40,
    xpBonus: 80,
  },
  {
    id: 'pattern-explorer',
    title: 'Pattern Explorer',
    description: 'Completed 3 Pattern Recognition activities.',
    criteriaText: 'Complete 3 Pattern sessions',
    coinsBonus: 25,
    xpBonus: 50,
  },
  {
    id: 'steady-navigator',
    title: 'Steady Navigator',
    description: 'Completed both Maze Explorer and Sky Glider Motor.',
    criteriaText: 'Complete Maze & Sky Glider',
    coinsBonus: 30,
    xpBonus: 60,
  },
];

export const DEFAULT_ACCESSIBILITY: AccessibilityPreferences = {
  dyslexic_font: false,
  high_contrast: false,
  reduced_motion: false,
  text_size: 'normal',
  text_to_speech: false,
  sound_enabled: true,
  simplified_instructions: false,
  interaction_timing: 'standard',
  keyboard_navigation: true,
  alternative_tap: false,
};
