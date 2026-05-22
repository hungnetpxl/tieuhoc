// TypeScript Definitions for Duolingo Kids Math Website

export type MathType = 'addition' | 'subtraction' | 'multiplication' | 'division';

export type QuestionMode = 'basic' | 'visual' | 'story' | 'kumon';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type PetItemType = 'color' | 'hat' | 'food';

export interface ParentProfile {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
}

export interface ChildProfile {
  id: string;
  parent_id: string;
  name: string;
  avatar: string; // Tên avatar, vd: 'dino', 'unicorn', 'fox', 'bear', 'rabbit'
  level: number;
  experience_points: number;
  stars: number;
  lives: number;
  streak_days: number;
  last_active_at?: string;
  pet_name: string;
  pet_color: string; // 'green', 'blue', 'pink', 'yellow'
  pet_hat: string; // 'none', 'cap', 'crown', 'wizard', 'cowboy'
  created_at: string;
}

export interface MathQuestion {
  id: string;
  math_type: MathType;
  number_a: number;
  number_b: number;
  operator: string; // '+', '-', 'x', '/'
  question_text: string;
  question_visual?: string; // Chuỗi các emoji trực quan (🍎🍎 + 🍎)
  correct_answer: number;
  options: number[]; // 3-4 đáp án lựa chọn
  mode: QuestionMode;
  difficulty: DifficultyLevel;
  kumon_style?: 'vertical' | 'fill_blank' | 'chain';
  kumon_blank_position?: 'a' | 'b' | 'c';
}

export interface LearningSession {
  id: string;
  child_id: string;
  status: 'active' | 'completed' | 'failed';
  math_types: MathType[];
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  stars_earned: number;
  started_at: string;
  ended_at?: string;
}

export interface QuestionHistoryEntry {
  id: string;
  session_id: string;
  child_id: string;
  math_type: MathType;
  question_text: string;
  question_visual?: string;
  correct_answer: number;
  selected_answer: number;
  is_correct: boolean;
  time_taken_seconds: number;
  difficulty_level: DifficultyLevel;
  created_at: string;
}

export interface ChildMistake {
  id: string;
  child_id: string;
  math_type: MathType;
  number_a: number;
  number_b: number;
  operator: string;
  wrong_count: number;
  last_attempt_correct: boolean;
  updated_at: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon_emoji: string;
  reward_stars: number;
}

export interface ChildBadge {
  id: string;
  child_id: string;
  badge_id: string;
  unlocked_at: string;
  badge?: Badge;
}

export interface ChildStatistics {
  child_id: string;
  total_sessions: number;
  total_questions: number;
  correct_count: number;
  accuracy_rate: number;
  avg_time_per_question: number;
  strongest_topic: string;
  weakest_topic: string;
  updated_at: string;
}

export interface PetShopItem {
  id: string;
  name: string;
  type: PetItemType;
  cost: number;
  value: string; // Tên màu hoặc tên mũ hoặc chỉ số hồi tim
  emoji: string;
  bought?: boolean;
}

export interface GameSettings {
  minNumber: number;
  maxNumber: number;
  questionCount: number;
  timeLimit?: number; // giây (0 là không giới hạn)
  mathTypes: MathType[];
  mode: 'mixed' | 'visual' | 'story' | 'basic' | 'kumon';
}
