'use client';
import { useState, useEffect } from 'react';
import LoginPage from '@/components/LoginPage';
import Header from '@/components/Header';
import PalpitesPage from '@/components/PalpitesPage';
import RankingPage from '@/components/RankingPage';
import HistoricoPage from '@/components/HistoricoPage';
import ResenhaPage from '@/components/ResenhaPage';
import RegulamentoPage from '@/components/RegulamentoPage';
import AdminPage from '@/components/AdminPage';

export default function Home() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('palpites');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('bolao_user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('bolao_user', JSON.stringify(userData));
    setPage('palpites');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('bolao_user');
    setPage('palpites');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dark-50 to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🍯</div>
          <div className="font-display text-xl font-bold text-dark-900">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-50 to-primary-50">
      <Header page={page} setPage={setPage} user={user} onLogout={handleLogout} />
      <main className="animate-fade-in">
        {page === 'palpites' && <PalpitesPage user={user} />}
        {page === 'ranking' && <RankingPage user={user} />}
        {page === 'historico' && <HistoricoPage user={user} />}
        {page === 'resenha' && <ResenhaPage user={user} />}
        {page === 'regulamento' && <RegulamentoPage />}
        {page === 'admin' && user.is_admin && <AdminPage user={user} />}
      </main>
    </div>
  );
}
