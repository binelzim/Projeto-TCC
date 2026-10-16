import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { buscarPerfil, mensagemDeErro, type Perfil } from './api';
import { useAuth } from './auth';
import { useSettings } from './settings';

const Context = createContext<{ perfil: Perfil | null; erro: string; atualizar: () => Promise<void> }>({ perfil: null, erro: '', atualizar: async () => {} });
export function PerfilProvider({ children }: { children: ReactNode }) {
  const { sessao } = useAuth();
  const [state, setState] = useState<{ token?: string; perfil: Perfil | null; erro: string }>({ perfil: null, erro: '' });
  const { announce } = useSettings();
  const atual = useRef(sessao?.token);
  const avisoVisto = useRef('');
  const consultas = useRef(new Set<string>());
  useEffect(() => { atual.current = sessao?.token; }, [sessao?.token]);
  const atualizar = useCallback(async () => {
    if (!sessao) return;
    const token = sessao.token;
    if (consultas.current.has(token)) return;
    consultas.current.add(token);
    try {
      const perfil = await buscarPerfil();
      if (atual.current === token) setState({ token, perfil, erro: '' });
    } catch (e) { if (atual.current === token) setState(s => ({ ...s, token, erro: mensagemDeErro(e, 'Falha ao atualizar sua linha.') })); }
    finally { consultas.current.delete(token); }
  }, [sessao]);
  useEffect(() => {
    if (!sessao) return;
    const first = setTimeout(() => { void atualizar(); }, 0);
    const timer = setInterval(atualizar, 5000);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, [sessao, atualizar]);
  const perfil = state.token === sessao?.token ? state.perfil : null;
  const aviso = perfil?.linha.aviso;
  useEffect(() => {
    const key = sessao?.token + ':' + aviso?.criadoEm;
    if (aviso && key !== avisoVisto.current) { avisoVisto.current = key; announce('Novo aviso do motorista. ' + aviso.mensagem); }
  }, [sessao?.token, aviso, announce]);
  return <Context.Provider value={{ perfil, erro: state.token === sessao?.token ? state.erro : '', atualizar }}>{children}</Context.Provider>;
}
export const usePerfil = () => useContext(Context);
