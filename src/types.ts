export interface Question {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface QuizConfig {
  topic: string;
  subtopic: string;
  difficulty: Difficulty;
  questionCount: number;
}

export interface QuizResult {
  score: number;
  correct: number;
  wrong: number;
  total: number;
  accuracy: number;
  timeTaken: number;
  answers: {
    question: Question;
    userAnswer: string | null;
    isCorrect: boolean;
  }[];
  timestamp: number;
}
