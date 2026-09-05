import { describe, expect, it } from "vitest";
import { EXAM_RULES, formatTime, prepareQuestions, scoreAttempt, shuffle } from "./exam";
import { questionBank } from "./questions";

describe("regras do simulado", () => {
  it("prepara exatamente 40 questões para C-Pro I", () => expect(prepareQuestions(questionBank, "CPRO_I", () => 0.42)).toHaveLength(40));
  it("prepara exatamente 45 questões para C-Pro R", () => expect(prepareQuestions(questionBank, "CPRO_R", () => 0.42)).toHaveLength(45));
  it("define 2h30 para as duas provas", () => { expect(EXAM_RULES.CPRO_I.seconds).toBe(9000); expect(EXAM_RULES.CPRO_R.seconds).toBe(9000); });
  it("embaralha sem perder elementos", () => expect(shuffle([1, 2, 3, 4], () => 0).sort()).toEqual([1, 2, 3, 4]));
  it("formata o cronômetro", () => expect(formatTime(9000)).toBe("02:30:00"));
  it("preserva a resposta correta ao embaralhar alternativas", () => {
    const prepared = prepareQuestions(questionBank.slice(0, 40), "CPRO_I", () => 0);
    for (const item of prepared) {
      const original = questionBank.find((question) => question.id === item.id)!;
      expect(item.options[item.correctIndex]).toBe(original.options[original.correctIndex]);
    }
  });
  it("calcula nota e desempenho por módulo", () => {
    const questions = questionBank.slice(0, 2);
    const answers = Object.fromEntries(questions.map((question) => [question.id, question.correctIndex]));
    const result = scoreAttempt(questions, answers, { id: "x", exam: "CPRO_I", mode: "exam", startedAt: "2026-01-01", finishedAt: "2026-01-01", durationSeconds: 10 });
    expect(result.correct).toBe(2); expect(result.percentage).toBe(100); expect(Object.values(result.moduleStats)[0].total).toBe(2);
  });
});
