import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { aoExpirarSessao, definirSessao, login, logout, type Sessao } from './api';

const AuthContext = createContext<{
  sessao: Sessao | null; entrar: (usuario: string, senha: string) => Promise<void>; sair: () => Promise<void>;
}>({ sessao: null, entrar: async () => {}, sair: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  useEffect(() => {
    aoExpirarSessao(() => { definirSessao(null); setSessao(null); });
    return () => aoExpirarSessao(undefined);
  }, []);
  const entrar = async (usuario: string, senha: string) => {
    const session = await login(usuario, senha);
    definirSessao(session); setSessao(session);
  };
  const sair = async () => {
    try { await logout(); } catch { /* A sessão local é encerrada mesmo sem rede. */ }
    finally { setSessao(null); }
  };
  return <AuthContext.Provider value={{ sessao, entrar, sair }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);

