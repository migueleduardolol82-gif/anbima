export type ExamCode = "CPRO_I" | "CPRO_R";
export type ExamMode = "exam" | "training";
export type QuestionFormat = "multiple" | "case" | "dialogue";

export interface Question {
  id: string;
  exam: ExamCode;
  module: string;
  format: QuestionFormat;
  difficulty: "Fácil" | "Médio" | "Difícil";
  context: string;
  dialogue?: { speaker: string; text: string }[];
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  reference: string;
}

export interface ExamConfig {
  exam: ExamCode;
  mode: ExamMode;
  instantFeedback: boolean;
}

export interface Attempt {
  id: string;
  exam: ExamCode;
  mode: ExamMode;
  startedAt: string;
  finishedAt: string;
  durationSeconds: number;
  correct: number;
  total: number;
  percentage: number;
  answers: Record<string, number>;
  correctAnswers: Record<string, number>;
  questionIds: string[];
  moduleStats: Record<string, { correct: number; total: number }>;
}
