import type { Attempt, ExamCode, Question } from "./types";

export const EXAM_RULES: Record<ExamCode, { label: string; questions: number; seconds: number }> = {
  CPRO_I: { label: "C-Pro I", questions: 40, seconds: 2 * 60 * 60 + 30 * 60 },
  CPRO_R: { label: "C-Pro R", questions: 45, seconds: 2 * 60 * 60 + 30 * 60 },
};

export function shuffle<T>(items: T[], random = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function prepareQuestions(bank: Question[], exam: ExamCode, random = Math.random): Question[] {
  const limit = EXAM_RULES[exam].questions;
  return shuffle(bank.filter((q) => q.exam === exam), random)
    .slice(0, limit)
    .map((question) => {
      const indexed = question.options.map((option, originalIndex) => ({ option, originalIndex }));
      const shuffled = shuffle(indexed, random);
      return {
        ...question,
        options: shuffled.map((item) => item.option),
        correctIndex: shuffled.findIndex((item) => item.originalIndex === question.correctIndex),
      };
    });
}

export function formatTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return [hours, minutes, secs].map((value) => String(value).padStart(2, "0")).join(":");
}

export function scoreAttempt(
  questions: Question[],
  answers: Record<string, number>,
  meta: Pick<Attempt, "id" | "exam" | "mode" | "startedAt" | "finishedAt" | "durationSeconds">,
): Attempt {
  const moduleStats: Attempt["moduleStats"] = {};
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;
  for (const question of questions) {
    const response = answers[question.id];
    const wasAnswered = response !== undefined;
    const hit = wasAnswered && response === question.correctIndex;
    if (hit) correct += 1;
    else if (wasAnswered) wrong += 1;
    else unanswered += 1;
    moduleStats[question.module] ??= { correct: 0, wrong: 0, unanswered: 0, total: 0 };
    moduleStats[question.module].total += 1;
    if (hit) moduleStats[question.module].correct += 1;
    else if (wasAnswered) moduleStats[question.module].wrong += 1;
    else moduleStats[question.module].unanswered += 1;
  }
  return {
    ...meta,
    correct,
    wrong,
    unanswered,
    total: questions.length,
    percentage: questions.length ? Math.round((correct / questions.length) * 100) : 0,
    answers,
    correctAnswers: Object.fromEntries(questions.map((question) => [question.id, question.correctIndex])),
    questionIds: questions.map((question) => question.id),
    moduleStats,
  };
}
