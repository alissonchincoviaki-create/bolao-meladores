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
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [userData, setUserData] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data: users, error: dbError } = await supabase
        .from('users').select('*').eq('login', login.toLowerCase().trim()).single();
      if (dbError || !users) { setError('Usuário não encontrado'); setLoading(false); return; }
      if (users.password_hash !== password) { setError('Senha incorreta'); setLoading(false); return; }
      if (users.first_access) { setUserData(users); setShowFirstAccess(true); setLoading(false); return; }
      onLogin(users);
    } catch (err) { setError('Erro ao fazer login'); }
    setLoading(false);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError('Foto deve ter no máximo 2MB'); return; }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleFirstAccess = async () => {
    if (newPassword.length < 6) { setError('Senha deve ter pelo menos 6 caracteres'); return; }
    if (newPassword !== confirmPassword) { setError('Senhas não conferem'); return; }
    if (!photoFile) { setError('Escolha uma foto para continuar'); return; }
    setLoading(true);
    setError('');

    try {
      // Upload photo to Supabase Storage
      let avatarUrl = null;
      const fileName = `avatars/${userData.id}_${Date.now()}.${photoFile.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, photoFile, { upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        avatarUrl = urlData?.publicUrl;
      }

      await supabase.from('users').update({
        password_hash: newPassword,
        first_access: false,
        avatar_url_1: avatarUrl || photoPreview,
        avatar_choice: 1,
      }).eq('id', userData.id);

      onLogin({ ...userData, first_access: false, avatar_url_1: avatarUrl || photoPreview, avatar_choice: 1 });
    } catch (err) {
      // If storage fails, save as base64 fallback
      await supabase.from('users').update({
        password_hash: newPassword,
        first_access: false,
        avatar_url_1: photoPreview,
        avatar_choice: 1,
      }).eq('id', userData.id);
      onLogin({ ...userData, first_access: false, avatar_url_1: photoPreview, avatar_choice: 1 });
    }
    setLoading(false);
  };

  if (showFirstAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-dark-50 to-primary-50 p-5">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-xl border border-primary-200 flex flex-col items-center">
          <span className="text-5xl mb-2">🍯</span>
          <h1 className="font-display text-2xl font-extrabold text-dark-900 mb-1">Primeiro Acesso</h1>
          <p className="text-dark-500 text-sm mb-4 text-center">Crie sua senha e escolha sua foto</p>

          <div className="w-full mb-4">
            <label className="block text-sm font-semibold text-dark-700 mb-1">Nova senha</label>
            <input type="password" placeholder="Mínimo 6 caracteres" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field" />
          </div>
          <div className="w-full mb-4">
            <label className="block text-sm font-semibold text-dark-700 mb-1">Confirmar senha</label>
            <input type="password" placeholder="Repita a senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-field" />
          </div>

          <div className="w-full mb-4">
            <label className="block text-sm font-semibold text-dark-700 mb-2">📸 Sua foto (obrigatório)</label>
            <div className="flex items-center gap-4">
              {photoPreview ? (
                <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-primary-600 flex-shrink-0">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-primary-400 flex items-center justify-center bg-dark-50 text-primary-400 text-2xl flex-shrink-0">📷</div>
              )}
              <div className="flex-1">
                <label className="block cursor-pointer bg-primary-50 border border-primary-200 rounded-lg px-4 py-2 text-center text-sm font-semibold text-primary-700 hover:bg-primary-100 transition-all">
                  {photoPreview ? 'Trocar foto' : 'Escolher foto'}
                  <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                </label>
                <p className="text-[10px] text-dark-500 mt-1 text-center">JPG ou PNG, máx 2MB</p>
              </div>
            </div>
          </div>

          {error && <p className="text-danger text-sm mb-3 text-center">{error}</p>}
          <button onClick={handleFirstAccess} disabled={loading} className="btn-primary">{loading ? 'Salvando...' : 'Confirmar e Entrar'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-dark-50 to-primary-50 p-5">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-xl border border-primary-200 flex flex-col items-center">
        <span className="text-6xl mb-2">🍯</span>
        <h1 className="font-display text-2xl font-extrabold text-dark-900 mb-1">Bolão dos Meladores</h1>
        <p className="text-[11px] text-dark-500 tracking-[2px] uppercase font-medium mb-7">Copa do Mundo 2026</p>
        <form onSubmit={handleLogin} className="w-full">
          <div className="w-full mb-4">
            <label className="block text-sm font-semibold text-dark-700 mb-1">Apelido</label>
            <input type="text" placeholder="Seu apelido" value={login} onChange={e => setLogin(e.target.value)} className="input-field" required />
          </div>
          <div className="w-full mb-4">
            <label className="block text-sm font-semibold text-dark-700 mb-1">Senha</label>
            <input type="password" placeholder="Sua senha" value={password} onChange={e => setPassword(e.target.value)} className="input-field" required />
          </div>
          {error && <p className="text-danger text-sm mb-3 text-center">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Entrando...' : 'Entrar'}</button>
        </form>
      </div>
    </div>
  );
}
