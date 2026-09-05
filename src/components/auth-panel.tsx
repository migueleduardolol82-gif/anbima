"use client";

import { useState } from "react";
import { LockKeyhole, X } from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

interface AuthPanelProps { onClose: () => void; onSignedIn: (user: { id: string; email: string }) => void; }

export function AuthPanel({ onClose, onSignedIn }: AuthPanelProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const configured = isSupabaseConfigured();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!configured) { onSignedIn({ id: "demo-user", email: email || "modo.demo@local" }); onClose(); return; }
    const supabase = getSupabase();
    if (!supabase) return;
    setMessage("Processando...");
    const result = creating ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) { setMessage(result.error.message); return; }
    if (result.data.user) { onSignedIn({ id: result.data.user.id, email: result.data.user.email ?? email }); onClose(); }
    else setMessage("Confira seu e-mail para confirmar o cadastro.");
  }

  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Acesso à conta"><form className="auth-card" onSubmit={submit}>
    <button type="button" className="icon-button auth-close" onClick={onClose} aria-label="Fechar"><X size={20} /></button>
    <div className="auth-mark"><LockKeyhole size={22} /></div><p className="eyebrow">CONTA INDEPENDENTE</p><h2>{creating ? "Criar sua conta" : "Entrar no simulador"}</h2>
    <p className="muted">Seus simulados, estatísticas e erros ficam separados de qualquer outra plataforma.</p>
    <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
    <label>Senha<input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
    {message && <p className="form-message">{message}</p>}<button className="primary-button" type="submit">{creating ? "Criar conta" : "Entrar"}</button>
    <button className="text-button" type="button" onClick={() => { setCreating(!creating); setMessage(""); }}>{creating ? "Já tenho uma conta" : "Ainda não tenho uma conta"}</button>
    {!configured && <p className="demo-note">Demonstração: o acesso usa armazenamento local até as chaves do banco serem configuradas.</p>}
  </form></div>;
}
