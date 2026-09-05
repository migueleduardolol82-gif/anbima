import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ExamApp } from "./exam-app";

describe("fluxo principal", () => {
  beforeEach(() => { localStorage.clear(); vi.spyOn(Math, "random").mockReturnValue(0.42); });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("abre o simulado C-Pro I com 40 questões", async () => {
    render(<ExamApp />);
    fireEvent.click(screen.getByRole("button", { name: /iniciar simulado/i }));
    fireEvent.click(screen.getByRole("button", { name: /começar agora/i }));
    expect(await screen.findByText(/questão 1 de 40/i)).toBeTruthy();
    expect(screen.getByText("02:30:00")).toBeTruthy();
  });

  it("configura C-Pro R, treino e correção instantânea", async () => {
    render(<ExamApp />);
    fireEvent.click(screen.getByRole("button", { name: /iniciar simulado/i }));
    fireEvent.click(screen.getByRole("button", { name: /C-Pro R/i }));
    fireEvent.click(screen.getByRole("button", { name: /Modo Treino/i }));
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /começar agora/i }));
    expect(await screen.findByText(/questão 1 de 45/i)).toBeTruthy();
    const options = document.querySelectorAll<HTMLButtonElement>(".option");
    fireEvent.click(options[0]);
    expect(await screen.findByText(/resposta (correta|incorreta)/i)).toBeTruthy();
  });

  it("finaliza, calcula resultado e grava histórico", async () => {
    render(<ExamApp />);
    fireEvent.click(screen.getByRole("button", { name: /iniciar simulado/i }));
    fireEvent.click(screen.getByRole("button", { name: /começar agora/i }));
    await screen.findByText(/questão 1 de 40/i);
    fireEvent.click(screen.getByRole("button", { name: /finalizar simulado agora/i }));
    expect(await screen.findByText(/simulado concluído/i)).toBeTruthy();
    await waitFor(() => expect(JSON.parse(localStorage.getItem("anbima-cpro-attempts") ?? "[]")).toHaveLength(1));
  });
});
