'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Avatar from './Avatar';

const ZOEIRA = {
  0: ["Esse aí não erra nem o café da manhã ☕","Tá jogando de hack 🎮","Nostradamus do futebol 🔮","Bruxo! Até a FIFA desconfia 🧙"],
  1: ["Quase lá, mas quase não conta 😅","Cheirando a liderança 👃","Vice é tradição 🇧🇷"],
  2: ["Pódio é pódio, não reclama 🥉","Bronze com orgulho 💪"],
  mid: ["Tá ali, de figurante 🎬","Modo sobrevivência ativado 🏕️","Pelo menos não é último 🤷"],
  last: ["Alguém chama o VAR 📺","Derreteu mais que sorvete 🍦","F no chat 💀"],
};
function getZoeira(pos, total) {
  const pool = pos === 0 ? ZOEIRA[0] : pos === 1 ? ZOEIRA[1] : pos === 2 ? ZOEIRA[2] : pos >= total - 1 ? ZOEIRA.last : ZOEIRA.mid;
  return pool[pos % pool.length];
}

export default function RankingPage() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadRanking(); }, []);

  async function loadRanking() {
    const { data, error } = await supabase.from('ranking').select('*');
    if (data && data.length > 0) {
      setRanking(data);
    } else {
      // Fallback: build ranking from users + guesses
      const { data: users } = await supabase.from('users').select('id, name').eq('is_admin', false);
      if (users) {
        const ranked = [];
        for (const u of users) {
          const { data: mg } = await supabase.from('match_guesses').select('points, is_exact').eq('user_id', u.id).not('points', 'is', null);
          const { data: gc } = await supabase.from('group_class_guesses').select('points').eq('user_id', u.id).not('points', 'is', null);
          const matchPts = (mg || []).reduce((s, g) => s + (g.points || 0), 0);
          const groupPts = (gc || []).reduce((s, g) => s + (g.points || 0), 0);
          const exacts = (mg || []).filter(g => g.is_exact).length;
          ranked.push({ name: u.name, total_points: matchPts + groupPts, exact_count: exacts, match_points: matchPts, group_points: groupPts });
        }
        ranked.sort((a, b) => b.total_points - a.total_points || b.exact_count - a.exact_count);
        setRanking(ranked);
      }
    }
    setLoading(false);
  }

  const total = ranking.length;

  if (loading) return <div className="max-w-[900px] mx-auto p-5"><div className="card text-center py-10"><div className="text-3xl mb-2">🍯</div><div className="text-dark-500">Carregando ranking...</div></div></div>;

  if (ranking.length === 0) return <div className="max-w-[900px] mx-auto p-5"><div className="card text-center py-10"><div className="text-3xl mb-2">🏆</div><div className="text-dark-500">Nenhum palpite registrado ainda</div></div></div>;

  return (
    <div className="max-w-[900px] mx-auto p-5">
      <div className="card p-0 overflow-hidden">
        <div className="p-5 pb-2 border-b border-dark-200">
          <h3 className="section-title mb-1">🏆 Classificação Geral</h3>
          <span className="text-xs text-dark-500">Atualizado automaticamente</span>
        </div>
        {ranking.length >= 3 && (
          <div className="flex justify-center items-end gap-4 py-6 px-4 bg-gradient-to-b from-primary-50 to-white">
            {[1, 0, 2].map(idx => {
              const p = ranking[idx];
              if (!p) return null;
              const isFirst = idx === 0;
              const medal = ['🥇','🥈','🥉'][idx];
              return (
                <div key={idx} className="flex flex-col items-center" style={{ marginBottom: isFirst ? 20 : 0 }}>
                  <span className={`${isFirst ? 'text-3xl' : 'text-xl'} mb-1`}>{medal}</span>
                  <Avatar name={p.name} size={isFirst ? 76 : 58} />
                  <span className={`font-sans font-bold ${isFirst ? 'text-sm' : 'text-xs'} text-dark-900 mt-1.5`}>{p.name}</span>
                  <span className={`font-display font-extrabold ${isFirst ? 'text-2xl' : 'text-lg'} text-dark-900`}>{p.total_points}</span>
                  <span className="text-[10px] text-dark-500">{p.exact_count} exatos</span>
                </div>
              );
            })}
          </div>
        )}
        <div className="p-4 pt-0">
          {ranking.map((p, i) => (
            <div key={p.name} className={`flex items-center gap-3 p-3 mt-2 rounded-xl ${
              i === 0 ? 'bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-600' : 'bg-dark-50 border border-dark-200'
            }`}>
              <div className={`font-display font-extrabold min-w-[28px] text-center ${
                i === 0 ? 'text-xl text-primary-600' : i === 1 ? 'text-lg text-dark-400' : i === 2 ? 'text-lg text-amber-700' : 'text-base text-dark-300'
              }`}>{i < 3 ? ['🥇','🥈','🥉'][i] : `${i+1}º`}</div>
              <Avatar name={p.name} size={42} />
              <div className="flex-1 min-w-0">
                <span className="font-sans font-bold text-sm text-dark-900">{p.name}</span>
                {p.exact_count >= 3 && <span className="text-xs ml-1">🎯</span>}
                <div className="text-[11px] text-dark-500 italic truncate">{getZoeira(i, total)}</div>
                <div className="text-[10px] text-dark-500">🎯 {p.exact_count} exatos · Jogos: {p.match_points || 0} · Grupos: {p.group_points || 0}</div>
              </div>
              <div className={`font-display font-extrabold flex-shrink-0 ${i === 0 ? 'text-2xl' : 'text-lg'} text-dark-900`}>{p.total_points}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
