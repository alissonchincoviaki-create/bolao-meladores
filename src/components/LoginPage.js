'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoginPage({ onLogin }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFirstAccess, setShowFirstAccess] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [userData, setUserData] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: users, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('login', login.toLowerCase().trim())
        .single();

      if (dbError || !users) {
        setError('Usuário não encontrado');
        setLoading(false);
        return;
      }

      // Simple password check (in production use bcrypt)
      if (users.password_hash !== password) {
        setError('Senha incorreta');
        setLoading(false);
        return;
      }

      if (users.first_access) {
        setUserData(users);
        setShowFirstAccess(true);
        setLoading(false);
        return;
      }

      onLogin(users);
    } catch (err) {
      setError('Erro ao fazer login');
    }
    setLoading(false);
  };

  const handleFirstAccess = async () => {
    if (newPassword.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Senhas não conferem');
      return;
    }
    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: newPassword,
          first_access: false,
          avatar_choice: selectedAvatar + 1,
        })
        .eq('id', userData.id);

      if (updateError) throw updateError;

      onLogin({ ...userData, first_access: false, avatar_choice: selectedAvatar + 1 });
    } catch (err) {
      setError('Erro ao atualizar senha');
    }
    setLoading(false);
  };

  if (showFirstAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-dark-50 to-primary-50 p-5">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-xl border border-primary-200 flex flex-col items-center">
          <span className="text-5xl mb-2">⚽</span>
          <h1 className="font-display text-2xl font-extrabold text-dark-900 mb-1">Primeiro Acesso</h1>
          <p className="text-dark-500 text-sm mb-6 text-center">
            Crie sua nova senha para continuar
          </p>

          <div className="w-full mb-4">
            <label className="block text-sm font-semibold text-dark-700 mb-1">Nova senha</label>
            <input
              type="password" placeholder="Mínimo 6 caracteres"
              value={newPassword} onChange={e => setNewPassword(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="w-full mb-4">
            <label className="block text-sm font-semibold text-dark-700 mb-1">Confirmar senha</label>
            <input
              type="password" placeholder="Repita a senha"
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              className="input-field"
            />
          </div>

          {userData?.avatar_url_1 && (
            <div className="w-full mb-4">
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Escolha seu avatar 😂
              </label>
              <div className="flex gap-3 justify-center">
                {[userData.avatar_url_1, userData.avatar_url_2, userData.avatar_url_3].filter(Boolean).map((url, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedAvatar(i)}
                    className={`w-16 h-16 rounded-full overflow-hidden cursor-pointer transition-all ${
                      selectedAvatar === i
                        ? 'ring-3 ring-primary-600 scale-110'
                        : 'border-2 border-dark-300 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Opção ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-danger text-sm mb-3 text-center">{error}</p>}

          <button onClick={handleFirstAccess} disabled={loading} className="btn-primary">
            {loading ? 'Salvando...' : 'Confirmar e Entrar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-dark-50 to-primary-50 p-5">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-xl border border-primary-200 flex flex-col items-center">
        <span className="text-6xl mb-2">⚽</span>
        <h1 className="font-display text-2xl font-extrabold text-dark-900 mb-1">
          Bolão dos Meladores
        </h1>
        <p className="text-[11px] text-dark-500 tracking-[2px] uppercase font-medium mb-7">
          Copa do Mundo 2026
        </p>

        <form onSubmit={handleLogin} className="w-full">
          <div className="w-full mb-4">
            <label className="block text-sm font-semibold text-dark-700 mb-1">Apelido</label>
            <input
              type="text" placeholder="Seu apelido"
              value={login} onChange={e => setLogin(e.target.value)}
              className="input-field" required
            />
          </div>

          <div className="w-full mb-4">
            <label className="block text-sm font-semibold text-dark-700 mb-1">Senha</label>
            <input
              type="password" placeholder="Sua senha"
              value={password} onChange={e => setPassword(e.target.value)}
              className="input-field" required
            />
          </div>

          {error && <p className="text-danger text-sm mb-3 text-center">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
