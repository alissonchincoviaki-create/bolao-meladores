'use client';

export default function Header({ page, setPage, user, onLogout }) {
  const navItems = [
    { id: 'palpites', label: 'Palpites', icon: '⚽' },
    { id: 'ranking', label: 'Ranking', icon: '🏆' },
    { id: 'historico', label: 'Histórico', icon: '📊' },
    { id: 'resenha', label: 'Resenha', icon: '💬' },
    { id: 'regulamento', label: 'Regras', icon: '📋' },
  ];
  if (user?.is_admin) navItems.push({ id: 'admin', label: 'Admin', icon: '⚙️' });

  return (
    <header className="bg-white border-b-2 border-primary-600 sticky top-0 z-50 shadow-md shadow-primary-600/5">
      <div className="max-w-[900px] mx-auto px-5 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚽</span>
            <div>
              <h1 className="font-display text-xl font-extrabold text-dark-900 leading-tight">
                Bolão dos Meladores
              </h1>
              <span className="font-sans text-[10px] text-dark-500 tracking-[2px] uppercase font-medium">
                Copa do Mundo 2026
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-dark-500 font-medium hidden sm:block">
              {user?.name}
            </span>
            <button onClick={onLogout} className="btn-secondary text-xs py-1.5 px-3">
              Sair
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`nav-btn ${page === item.id ? 'nav-btn-active' : 'nav-btn-inactive'}`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
