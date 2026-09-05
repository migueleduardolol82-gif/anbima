"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, BookOpenCheck, BrainCircuit, Check, CheckCircle2, ChevronLeft, ChevronRight, CircleUserRound, Clock3, FileQuestion, Flag, History, LogIn, Menu, NotebookPen, RotateCcw, ShieldCheck, Target, TimerReset, X, XCircle } from "lucide-react";
import { AuthPanel } from "./auth-panel";
import { EXAM_RULES, formatTime, prepareQuestions, scoreAttempt } from "@/lib/exam";
import { questionBank } from "@/lib/questions";
import { loadAttempts, saveAttempt } from "@/lib/storage";
import type { Attempt, ExamCode, ExamConfig, Question } from "@/lib/types";

type Screen = "dashboard" | "setup" | "exam" | "result" | "history" | "errors" | "performance";

export function ExamApp() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [config, setConfig] = useState<ExamConfig>({ exam: "CPRO_I", mode: "exam", instantFeedback: false });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [flagged, setFlagged] = useState<string[]>([]);
  const [remaining, setRemaining] = useState(EXAM_RULES.CPRO_I.seconds);
  const [startedAt, setStartedAt] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [lastAttempt, setLastAttempt] = useState<Attempt | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { loadAttempts(user?.id).then(setAttempts); }, [user?.id]);

  useEffect(() => {
    if (screen !== "exam") return;
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [screen]);

  useEffect(() => { if (screen === "exam" && remaining === 0 && questions.length) void finishExam(); }, [remaining]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeQuestion = questions[index];
  const answered = Object.keys(answers).length;
  const hits = questions.filter((question) => answers[question.id] === question.correctIndex).length;
  const errorQuestions = useMemo(() => {
    const ids = new Set<string>();
    for (const attempt of attempts) attempt.questionIds.forEach((id) => {
      const question = questionBank.find((item) => item.id === id);
      if (question && attempt.answers[id] !== (attempt.correctAnswers?.[id] ?? question.correctIndex)) ids.add(id);
    });
    return questionBank.filter((question) => ids.has(question.id));
  }, [attempts]);

  function navigate(next: Screen) { setScreen(next); setMenuOpen(false); }
  function beginExam() {
    setQuestions(prepareQuestions(questionBank, config.exam)); setAnswers({}); setRevealed({}); setFlagged([]); setIndex(0);
    setRemaining(EXAM_RULES[config.exam].seconds); setStartedAt(new Date().toISOString()); setLastAttempt(null); setScreen("exam");
  }
  function choose(optionIndex: number) {
    if (!activeQuestion || revealed[activeQuestion.id]) return;
    setAnswers((current) => ({ ...current, [activeQuestion.id]: optionIndex }));
    if (config.mode === "training" && config.instantFeedback) setRevealed((current) => ({ ...current, [activeQuestion.id]: true }));
  }
  async function finishExam() {
    if (!questions.length || !startedAt) return;
    const attempt = scoreAttempt(questions, answers, { id: crypto.randomUUID(), exam: config.exam, mode: config.mode, startedAt, finishedAt: new Date().toISOString(), durationSeconds: EXAM_RULES[config.exam].seconds - remaining });
    setLastAttempt(attempt); setAttempts((current) => [attempt, ...current]); setScreen("result"); await saveAttempt(attempt, user?.id);
  }

  return <div className="app-shell">
    <aside className={menuOpen ? "sidebar sidebar-open" : "sidebar"}>
      <div className="brand"><div className="brand-symbol">CP</div><div><strong>C-Pro</strong><span>Simulados</span></div></div>
      <button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X /></button>
      <nav><NavButton active={screen === "dashboard"} icon={<BarChart3 />} label="Visão geral" onClick={() => navigate("dashboard")} /><NavButton active={screen === "setup" || screen === "exam"} icon={<FileQuestion />} label="Novo simulado" onClick={() => navigate("setup")} /><NavButton active={screen === "history"} icon={<History />} label="Histórico" onClick={() => navigate("history")} /><NavButton active={screen === "errors"} icon={<NotebookPen />} label="Caderno de erros" onClick={() => navigate("errors")} badge={errorQuestions.length} /><NavButton active={screen === "performance"} icon={<Target />} label="Desempenho" onClick={() => navigate("performance")} /></nav>
      <div className="sidebar-foot"><ShieldCheck /><div><strong>Base oficial 2026</strong><span>Programa v1.2 · vigência 01/01/2026</span></div></div>
    </aside>
    <main className="main-area"><header className="topbar"><button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Menu /></button><div><p className="eyebrow">PREPARAÇÃO ANBIMA</p><strong>{screenTitle(screen)}</strong></div><button className="account-button" onClick={() => setAuthOpen(true)}>{user ? <CircleUserRound /> : <LogIn />}<span>{user ? user.email : "Entrar"}</span></button></header>
      {screen === "dashboard" && <Dashboard attempts={attempts} onStart={() => setScreen("setup")} />}
      {screen === "setup" && <Setup config={config} setConfig={setConfig} onBegin={beginExam} />}
      {screen === "exam" && activeQuestion && <ExamScreen question={activeQuestion} index={index} total={questions.length} remaining={remaining} answered={answered} hits={hits} answer={answers[activeQuestion.id]} revealed={Boolean(revealed[activeQuestion.id])} flagged={flagged.includes(activeQuestion.id)} mode={config.mode} onChoose={choose} onReveal={() => setRevealed((current) => ({ ...current, [activeQuestion.id]: true }))} onFlag={() => setFlagged((current) => current.includes(activeQuestion.id) ? current.filter((id) => id !== activeQuestion.id) : [...current, activeQuestion.id])} onPrev={() => setIndex((value) => Math.max(0, value - 1))} onNext={() => setIndex((value) => Math.min(questions.length - 1, value + 1))} onFinish={finishExam} />}
      {screen === "result" && lastAttempt && <Result attempt={lastAttempt} onAgain={() => setScreen("setup")} onErrors={() => setScreen("errors")} />}
      {screen === "history" && <HistoryView attempts={attempts} />}{screen === "errors" && <ErrorsView questions={errorQuestions} />}{screen === "performance" && <Performance attempts={attempts} />}
    </main>{authOpen && <AuthPanel onClose={() => setAuthOpen(false)} onSignedIn={setUser} />}
  </div>;
}

function NavButton({ icon, label, active, onClick, badge }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; badge?: number }) { return <button className={active ? "nav-button active" : "nav-button"} onClick={onClick}>{icon}<span>{label}</span>{badge ? <b>{badge}</b> : null}</button>; }
function Dashboard({ attempts, onStart }: { attempts: Attempt[]; onStart: () => void }) {
  const total = attempts.length, average = total ? Math.round(attempts.reduce((sum, item) => sum + item.percentage, 0) / total) : 0, best = total ? Math.max(...attempts.map((item) => item.percentage)) : 0;
  return <div className="content dashboard-view"><section className="welcome-row"><div><p className="eyebrow">SEU PAINEL</p><h1>Treine como a prova cobra.</h1><p>Escolha a certificação, resolva cases e acompanhe onde precisa evoluir.</p></div><button className="primary-button large" onClick={onStart}><BrainCircuit /> Iniciar simulado</button></section><section className="metrics-grid"><Metric icon={<BookOpenCheck />} label="Simulados concluídos" value={String(total)} tone="blue" /><Metric icon={<Target />} label="Média de acertos" value={`${average}%`} tone="gold" /><Metric icon={<CheckCircle2 />} label="Melhor resultado" value={`${best}%`} tone="green" /><Metric icon={<Clock3 />} label="Tempo oficial" value="2h30" tone="violet" /></section><section className="exam-cards"><ExamCard code="C-Pro I" subtitle="Perfil técnico" questions="40 questões" topics="Produtos, alternativos, previdência e risco" onStart={onStart} /><ExamCard code="C-Pro R" subtitle="Perfil de relacionamento" questions="45 questões" topics="Cliente, suitability, indicação e monitoramento" onStart={onStart} /></section><section className="recent-panel"><div className="section-title"><div><p className="eyebrow">ÚLTIMAS TENTATIVAS</p><h2>Histórico recente</h2></div></div>{attempts.length ? attempts.slice(0, 4).map((attempt) => <AttemptRow key={attempt.id} attempt={attempt} />) : <Empty text="Seu primeiro resultado aparecerá aqui." />}</section></div>;
}
function Metric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) { return <article className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong></div></article>; }
function ExamCard({ code, subtitle, questions, topics, onStart }: { code: string; subtitle: string; questions: string; topics: string; onStart: () => void }) { return <article className="exam-card"><div className="exam-monogram">{code.slice(-1)}</div><p className="eyebrow">{subtitle}</p><h2>{code}</h2><div className="exam-meta"><span><FileQuestion /> {questions}</span><span><TimerReset /> 2h30</span></div><p>{topics}</p><button onClick={onStart}>Configurar prova <ChevronRight /></button></article>; }
function Setup({ config, setConfig, onBegin }: { config: ExamConfig; setConfig: (value: ExamConfig) => void; onBegin: () => void }) {
  const rule = EXAM_RULES[config.exam];
  return <div className="content setup-view"><div className="page-heading"><p className="eyebrow">NOVO SIMULADO</p><h1>Configure sua sessão</h1><p>Questões e alternativas serão embaralhadas a cada tentativa.</p></div><div className="setup-grid"><section className="setup-panel"><h2>1. Certificação</h2><div className="choice-grid">{(["CPRO_I", "CPRO_R"] as ExamCode[]).map((exam) => <button key={exam} className={config.exam === exam ? "choice active" : "choice"} onClick={() => setConfig({ ...config, exam })}><span>{exam === "CPRO_I" ? "I" : "R"}</span><div><strong>{EXAM_RULES[exam].label}</strong><small>{EXAM_RULES[exam].questions} questões · 2h30</small></div>{config.exam === exam && <Check />}</button>)}</div><h2>2. Modo</h2><div className="choice-grid"><button className={config.mode === "exam" ? "choice active" : "choice"} onClick={() => setConfig({ ...config, mode: "exam", instantFeedback: false })}><Clock3 /><div><strong>Modo Prova</strong><small>Correção somente ao finalizar</small></div></button><button className={config.mode === "training" ? "choice active" : "choice"} onClick={() => setConfig({ ...config, mode: "training" })}><BrainCircuit /><div><strong>Modo Treino</strong><small>Aprenda durante a resolução</small></div></button></div>{config.mode === "training" && <label className="switch-row"><div><strong>Correção instantânea</strong><span>Mostra resposta e explicação depois de marcar</span></div><input type="checkbox" checked={config.instantFeedback} onChange={(event) => setConfig({ ...config, instantFeedback: event.target.checked })} /></label>}</section><aside className="summary-card"><p className="eyebrow">RESUMO</p><div className="summary-code">{rule.label.slice(-1)}</div><h2>{rule.label}</h2><ul><li><FileQuestion /> <span>{rule.questions} questões</span></li><li><Clock3 /> <span>2 horas e 30 minutos</span></li><li><RotateCcw /> <span>Ordem aleatória</span></li><li><ShieldCheck /> <span>Conteúdo oficial vigente</span></li></ul><button className="primary-button large" onClick={onBegin}>Começar agora <ChevronRight /></button></aside></div></div>;
}
function ExamScreen(props: { question: Question; index: number; total: number; remaining: number; answered: number; hits: number; answer?: number; revealed: boolean; flagged: boolean; mode: string; onChoose: (index: number) => void; onReveal: () => void; onFlag: () => void; onPrev: () => void; onNext: () => void; onFinish: () => void }) {
  const q = props.question;
  return <div className="exam-workspace"><div className="exam-status"><div><span>Questão {props.index + 1} de {props.total}</span><div className="progress-track"><i style={{ width: `${((props.index + 1) / props.total) * 100}%` }} /></div></div><div className="live-score"><CheckCircle2 /> {props.answered} respondidas{props.mode === "training" && <><span /><b>{props.hits} acertos</b></>}</div><div className={props.remaining < 600 ? "timer danger" : "timer"}><Clock3 /><strong>{formatTime(props.remaining)}</strong></div></div><div className="question-layout"><article className="question-card"><div className="question-tags"><span>{q.format === "dialogue" ? "Árvore de diálogo" : q.format === "case" ? "Case" : "Contextualizada"}</span><span>{q.difficulty}</span><span>{q.module}</span></div><h1>{q.context}</h1>{q.dialogue && <div className="dialogue">{q.dialogue.map((line, i) => <div key={i} className={i % 2 ? "bubble professional" : "bubble"}><strong>{line.speaker}</strong>{line.text}</div>)}</div>}<h2>{q.prompt}</h2><div className="options">{q.options.map((option, i) => { const selected = props.answer === i, correct = props.revealed && i === q.correctIndex, wrong = props.revealed && selected && i !== q.correctIndex; return <button key={option} className={`option ${selected ? "selected" : ""} ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}`} onClick={() => props.onChoose(i)}><span>{String.fromCharCode(65 + i)}</span><p>{option}</p>{correct && <CheckCircle2 />}{wrong && <XCircle />}</button>; })}</div>{props.mode === "training" && props.answer !== undefined && !props.revealed && <button className="secondary-button reveal-button" onClick={props.onReveal}>Corrigir agora</button>}{props.revealed && <div className={props.answer === q.correctIndex ? "explanation success" : "explanation error"}><strong>{props.answer === q.correctIndex ? "Resposta correta" : "Resposta incorreta"}</strong><p>{q.explanation}</p><small>Referência programática: {q.reference}</small></div>}</article><aside className="question-nav"><div><p className="eyebrow">NAVEGAÇÃO</p><strong>{props.answered}/{props.total} respondidas</strong></div><button className={props.flagged ? "flag active" : "flag"} onClick={props.onFlag}><Flag /> {props.flagged ? "Marcada para revisar" : "Marcar para revisar"}</button><div className="nav-actions"><button onClick={props.onPrev} disabled={props.index === 0}><ChevronLeft /> Anterior</button>{props.index === props.total - 1 ? <button className="finish" onClick={props.onFinish}>Finalizar <Check /></button> : <button onClick={props.onNext}>Próxima <ChevronRight /></button>}</div><button className="finish-link" onClick={props.onFinish}>Finalizar simulado agora</button></aside></div></div>;
}
function Result({ attempt, onAgain, onErrors }: { attempt: Attempt; onAgain: () => void; onErrors: () => void }) { return <div className="content result-view"><section className="result-hero"><div className="result-ring" style={{ "--score": `${attempt.percentage * 3.6}deg` } as React.CSSProperties}><div><strong>{attempt.percentage}%</strong><span>de acertos</span></div></div><div><p className="eyebrow">SIMULADO CONCLUÍDO</p><h1>{attempt.percentage >= 70 ? "Bom desempenho." : "Seu diagnóstico está pronto."}</h1><p>{EXAM_RULES[attempt.exam].label} · {attempt.mode === "exam" ? "Modo Prova" : "Modo Treino"} · {formatTime(attempt.durationSeconds)}</p></div></section><section className="result-metrics"><Metric icon={<CheckCircle2 />} label="Acertos" value={`${attempt.correct}/${attempt.total}`} tone="green" /><Metric icon={<XCircle />} label="Erros" value={String(attempt.total - attempt.correct)} tone="red" /><Metric icon={<Clock3 />} label="Tempo usado" value={formatTime(attempt.durationSeconds)} tone="blue" /></section><section className="module-panel"><div className="section-title"><div><p className="eyebrow">POR MÓDULO</p><h2>Onde você foi melhor</h2></div></div>{Object.entries(attempt.moduleStats).map(([module, stat]) => { const value = Math.round((stat.correct / stat.total) * 100); return <div className="module-row" key={module}><div><strong>{module}</strong><span>{stat.correct} de {stat.total}</span></div><div className="module-bar"><i style={{ width: `${value}%` }} /></div><b>{value}%</b></div>; })}</section><div className="result-actions"><button className="secondary-button" onClick={onErrors}><NotebookPen /> Ver caderno de erros</button><button className="primary-button" onClick={onAgain}><RotateCcw /> Novo simulado</button></div></div>; }
function HistoryView({ attempts }: { attempts: Attempt[] }) { return <div className="content"><div className="page-heading"><p className="eyebrow">TENTATIVAS</p><h1>Histórico de simulados</h1><p>Compare resultados e acompanhe sua evolução.</p></div><section className="list-panel">{attempts.length ? attempts.map((attempt) => <AttemptRow key={attempt.id} attempt={attempt} />) : <Empty text="Nenhum simulado concluído ainda." />}</section></div>; }
function AttemptRow({ attempt }: { attempt: Attempt }) { return <div className="attempt-row"><div className="attempt-code">{attempt.exam === "CPRO_I" ? "I" : "R"}</div><div><strong>{EXAM_RULES[attempt.exam].label}</strong><span>{new Date(attempt.finishedAt).toLocaleDateString("pt-BR")} · {attempt.mode === "exam" ? "Modo Prova" : "Modo Treino"}</span></div><div><span>Acertos</span><strong>{attempt.correct}/{attempt.total}</strong></div><div><span>Resultado</span><strong className={attempt.percentage >= 70 ? "good" : "attention"}>{attempt.percentage}%</strong></div></div>; }
function ErrorsView({ questions }: { questions: Question[] }) { return <div className="content"><div className="page-heading"><p className="eyebrow">REVISÃO DIRECIONADA</p><h1>Caderno de erros</h1><p>As questões erradas ficam reunidas para você revisar o conceito.</p></div><section className="error-list">{questions.length ? questions.map((question) => <article className="error-card" key={question.id}><div><span>{question.module}</span><b>{question.difficulty}</b></div><h2>{question.prompt}</h2><p><strong>Resposta:</strong> {question.options[question.correctIndex]}</p><p>{question.explanation}</p><small>{question.reference}</small></article>) : <Empty text="Conclua um simulado para formar seu caderno de erros." />}</section></div>; }
function Performance({ attempts }: { attempts: Attempt[] }) { const modules = new Map<string, { correct: number; total: number }>(); attempts.forEach((attempt) => Object.entries(attempt.moduleStats).forEach(([name, stat]) => { const current = modules.get(name) ?? { correct: 0, total: 0 }; modules.set(name, { correct: current.correct + stat.correct, total: current.total + stat.total }); })); return <div className="content"><div className="page-heading"><p className="eyebrow">ESTATÍSTICAS</p><h1>Desempenho por módulo</h1><p>Dados consolidados de todas as suas tentativas.</p></div><section className="module-panel performance-panel">{modules.size ? [...modules].map(([module, stat]) => { const value = Math.round((stat.correct / stat.total) * 100); return <div className="performance-row" key={module}><div className="performance-score"><strong>{value}%</strong><span>{stat.correct}/{stat.total} acertos</span></div><div><h2>{module}</h2><div className="module-bar"><i style={{ width: `${value}%` }} /></div><p>{value >= 75 ? "Ponto forte" : value >= 55 ? "Em evolução" : "Prioridade de revisão"}</p></div></div>; }) : <Empty text="As estatísticas serão calculadas após seu primeiro simulado." />}</section></div>; }
function Empty({ text }: { text: string }) { return <div className="empty-state"><BookOpenCheck /><strong>{text}</strong><span>Você pode iniciar uma nova tentativa pelo menu.</span></div>; }
function screenTitle(screen: Screen) { return ({ dashboard: "Visão geral", setup: "Novo simulado", exam: "Simulado em andamento", result: "Resultado", history: "Histórico", errors: "Caderno de erros", performance: "Desempenho" })[screen]; }
