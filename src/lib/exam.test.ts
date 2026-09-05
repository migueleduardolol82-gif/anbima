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
  it("separa respostas erradas de questões não respondidas", () => {
    const questions = questionBank.slice(0, 3);
    const answers = { [questions[0].id]: questions[0].correctIndex, [questions[1].id]: (questions[1].correctIndex + 1) % 4 };
    const result = scoreAttempt(questions, answers, { id: "y", exam: "CPRO_I", mode: "exam", startedAt: "2026-01-01", finishedAt: "2026-01-01", durationSeconds: 10 });
    expect(result.correct).toBe(1);
    expect(result.wrong).toBe(1);
    expect(result.unanswered).toBe(1);
  });
  it("segue a distribuição oficial dos módulos", () => {
    const count = (exam: "CPRO_I" | "CPRO_R", module: string) => questionBank.filter((q) => q.exam === exam && q.module === module).length;
    expect([16, 6, 10, 8]).toEqual([
      count("CPRO_I", "1. Produtos de investimentos"),
      count("CPRO_I", "2. Alternativos, digitais e exterior"),
      count("CPRO_I", "3. Previdência complementar"),
      count("CPRO_I", "4. Risco, carteiras e performance"),
    ]);
    expect([9, 9, 18, 9]).toEqual([
      count("CPRO_R", "1. Prospecção e relacionamento"),
      count("CPRO_R", "2. Análise de informações do cliente"),
      count("CPRO_R", "3. Indicação de investimentos"),
      count("CPRO_R", "4. Análise e monitoramento"),
    ]);
  });
  it("mantém nível avançado, alternativas válidas e casos únicos", () => {
    expect(questionBank.filter((q) => q.difficulty === "Difícil").length).toBeGreaterThanOrEqual(65);
    expect(questionBank.every((q) => q.cognitiveLevel === "Aplicação" || q.cognitiveLevel === "Análise")).toBe(true);
    expect(new Set(questionBank.map((q) => q.context)).size).toBe(85);
    for (const q of questionBank) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(4);
    }
  });
  it("inclui árvores de diálogo em escala relevante na C-Pro R", () => {
    expect(questionBank.filter((q) => q.exam === "CPRO_R" && q.format === "dialogue").length).toBeGreaterThanOrEqual(12);
  });
});
