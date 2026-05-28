'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Avatar from './Avatar';

const ZOEIRA = {
  0: ["Esse aí não erra nem o café da manhã ☕","Tá jogando de hack 🎮","Nostradamus do futebol 🔮","Bruxo! Até a FIFA desconfia 🧙","Palpiteiro profissional certificado 📜"],
  1: ["Quase lá, mas quase não conta 😅","Cheirando a liderança 👃","Vice é tradição brasileira 🇧🇷","Prata é bonito, mas ouro brilha mais ✨"],
  2: ["Pódio é pódio, não reclama 🥉","Pelo menos tem medalha, né? 😂","Bronze com orgulho 💪"],
  mid: ["Tá ali, de figurante 🎬","Nem sobe, nem desce... tá no limbo ☁️","Modo sobrevivência ativado 🏕️","Pelo menos não é último 🤷"],
  last: ["Alguém chama o VAR pra esse aí 📺","Derreteu mais que sorvete no Maracanã 🍦","Lanterna com orgulho (mentira) 😭","F no chat 💀"],
};

function getZoeira(pos, total) {
  const pool = pos === 0 ? ZOEIRA[0] : pos === 1 ? ZOEIRA[1] : pos === 2 ? ZOEIRA[2] : pos >= total - 1 ? ZOEIRA.last : ZOEIRA.mid;
  return pool[pos % pool.length];
}

export default function RankingPage() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRanking();
  }, []);

  async function loadRanking() {
    const { data } = await supabase.from('ranking').select('*');
    if (data) setRanking(data);
    setLoading(false);
  }

  // For demo/preview, use mock data if empty
  const displayRanking = ranking.length > 0 ? ranking : [
    { name: 'Thiago', total_points: 357, exact_count: 5, match_points: 114 },
    { name: 'Lucas', total_points: 340, exact_count: 4, match_points: 111 },
    { name: 'Diego', total_points: 339, exact_count: 4, match_points: 125 },
    { name: 'Marcelo', total_points: 330, exact_count: 6, match_points: 55 },
    { name: 'Rafael', total_points: 315, exact_count: 3, match_points: 114 },
    { name: 'Brunão', total_points: 298, exact_count: 3, match_points: 88 },
    { name: 'Paulinho', total_points: 275, exact_count: 2, match_points: 72 },
  ];

  const total = displayRanking.length;

  return (
    <div className="max-w-[900px] mx-auto p-5">
      <div className="card p-0 overflow-hidden">
        <div className="p-5 pb-2 border-b border-dark-200">
          <h3 className="section-title mb-1">🏆 Classificação Geral</h3>
          <span className="text-xs text-dark-500">Atualizado automaticamente</span>
        </div>

        {/* Podium */}
        {displayRanking.length >= 3 && (
          <div className="flex justify-center items-end gap-4 py-6 px-4 bg-gradient-to-b from-primary-50 to-white">
            {[1, 0, 2].map(idx => {
              const p = displayRanking[idx];
              if (!p) return null;
              const isFirst = idx === 0;
              const medal = ['🥇', '🥈', '🥉'][idx];
              const size = isFirst ? 76 : 58;
              return (
                <div key={idx} className="flex flex-col items-center" style={{ marginBottom: isFirst ? 20 : 0 }}>
                  <span className={`${isFirst ? 'text-3xl' : 'text-xl'} mb-1`}>{medal}</span>
                  <Avatar name={p.name} size={size} />
                  <span className={`font-sans font-bold ${isFirst ? 'text-sm' : 'text-xs'} text-dark-900 mt-1.5`}>
                    {p.name}
                  </span>
                  <span className={`font-display font-extrabold ${isFirst ? 'text-2xl' : 'text-lg'} text-dark-900`}>
                    {p.total_points}
                  </span>
                  <span className="text-[10px] text-dark-500">{p.exact_count} exatos</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Full list */}
        <div className="p-4 pt-0">
          {displayRanking.map((p, i) => {
            const zoeira = getZoeira(i, total);
            return (
              <div
                key={p.name}
                className={`flex items-center gap-3 p-3 mt-2 rounded-xl animate-slide-up ${
                  i === 0 ? 'bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-600' : 'bg-dark-50 border border-dark-200'
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Position */}
                <div className={`font-display font-extrabold min-w-[28px] text-center ${
                  i === 0 ? 'text-xl text-primary-600' : i === 1 ? 'text-lg text-dark-400' : i === 2 ? 'text-lg text-amber-700' : 'text-base text-dark-300'
                }`}>
                  {i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}º`}
                </div>

                {/* Avatar */}
                <Avatar name={p.name} size={42} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-sans font-bold text-sm text-dark-900">{p.name}</span>
                    {p.exact_count >= 5 && <span className="text-xs">🎯</span>}
                  </div>
                  <div className="text-[11px] text-dark-500 italic truncate">{zoeira}</div>
                  <div className="flex gap-2 mt-0.5">
                    <span className="text-[10px] text-dark-500">🎯 {p.exact_count} exatos</span>
                  </div>
                </div>

                {/* Points */}
                <div className={`font-display font-extrabold flex-shrink-0 ${
                  i === 0 ? 'text-2xl' : 'text-lg'
                } text-dark-900`}>
                  {p.total_points}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
