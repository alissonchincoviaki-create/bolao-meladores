'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getFlag, calculateMatchPoints } from '@/lib/scoring';
import Avatar from './Avatar';

const PHASES = [
  { id: 'group_r1', label: '1ª Rodada' },
  { id: 'group_r2', label: '2ª Rodada' },
  { id: 'group_r3', label: '3ª Rodada' },
  { id: 'group_class', label: 'Classif. Grupos' },
  { id: '32avos', label: '32-avos' },
  { id: 'oitavas', label: 'Oitavas' },
  { id: 'quartas', label: 'Quartas' },
  { id: 'semi', label: 'Semi' },
  { id: 'terceiro', label: '3º Lugar' },
  { id: 'final', label: 'Final' },
];

function ptsColor(pts) {
  if (pts >= 10) return 'text-green-600';
  if (pts >= 7) return 'text-blue-600';
  if (pts >= 5) return 'text-yellow-600';
  if (pts >= 2) return 'text-orange-600';
  return 'text-red-600';
}

export default function HistoricoPage() {
  const [phase, setPhase] = useState('group_r1');
  const [matches, setMatches] = useState([]);
  const [guesses, setGuesses] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [phase]);

  async function loadData() {
    setLoading(true);

    // Load matches with results
    const { data: matchData } = await supabase
      .from('matches')
      .select('*')
      .eq('phase', phase)
      .not('result_home', 'is', null)
      .order('match_date')
      .order('match_time');

    if (matchData) {
      setMatches(matchData);

      // Load guesses for these matches
      const matchIds = matchData.map(m => m.id);
      if (matchIds.length > 0) {
        const { data: guessData } = await supabase
          .from('match_guesses')
          .select('*, users(name, avatar_choice, avatar_url_1, avatar_url_2, avatar_url_3)')
          .in('match_id', matchIds);

        // Group guesses by match
        const grouped = {};
        (guessData || []).forEach(g => {
          if (!grouped[g.match_id]) grouped[g.match_id] = [];
          grouped[g.match_id].push(g);
        });
        setGuesses(grouped);
      }
    }
    setLoading(false);
  }

  return (
    <div className="max-w-[900px] mx-auto p-5">
      {/* Phase tabs */}
      <div className="flex gap-1 flex-wrap mb-3">
        {PHASES.map(p => (
          <button
            key={p.id}
            onClick={() => setPhase(p.id)}
            className={`phase-btn ${phase === p.id ? 'phase-btn-active' : 'phase-btn-inactive'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="card text-center py-10">
          <div className="text-3xl mb-2">⚽</div>
          <div className="text-dark-500">Carregando...</div>
        </div>
      )}

      {!loading && matches.length === 0 && (
        <div className="card text-center py-10">
          <div className="text-3xl mb-2">📋</div>
          <div className="text-dark-500">Nenhum resultado desta fase ainda</div>
        </div>
      )}

      {matches.map(m => {
        const matchGuesses = guesses[m.id] || [];
        return (
          <div
            key={m.id}
            className={`card p-0 mb-2 overflow-hidden animate-fade-in ${
              m.is_brasil ? 'border-l-[3px] border-l-brasil' : ''
            }`}
          >
            {/* Match header + result */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-dark-50 gap-2 flex-wrap">
              <span className="text-[10px] text-dark-500">
                {m.group_letter ? `Grupo ${m.group_letter} · ` : ''}{m.match_time}
                {m.is_brasil && (
                  <span className="badge-brasil ml-1.5">🇧🇷 2x</span>
                )}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{getFlag(m.home_team)}</span>
                <span className="text-xs font-semibold">{m.home_team}</span>
                <span className="font-display text-base font-extrabold text-dark-900 px-2 py-0.5 bg-primary-50 rounded border border-primary-200">
                  {m.result_home}×{m.result_away}
                </span>
                <span className="text-xs font-semibold">{m.away_team}</span>
                <span className="text-sm">{getFlag(m.away_team)}</span>
              </div>
            </div>

            {/* Guesses grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 px-2 py-1">
              {matchGuesses.map(g => {
                const { points, isExact } = calculateMatchPoints(
                  g.guess_home, g.guess_away, m.result_home, m.result_away, m.is_brasil
                );
                return (
                  <div
                    key={g.id}
                    className={`flex items-center justify-between px-2 py-1 rounded ${
                      isExact ? 'bg-green-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Avatar name={g.users?.name || '?'} size={18} />
                      <span className="text-[11px] font-semibold text-dark-900">
                        {g.users?.name}
                      </span>
                      {isExact && <span className="text-[9px]">🎯</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-dark-600">
                        {g.guess_home}×{g.guess_away}
                      </span>
                      <span className={`font-display font-extrabold text-xs min-w-[28px] text-right ${ptsColor(points)}`}>
                        +{points}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
