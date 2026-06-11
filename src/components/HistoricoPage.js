'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getFlag, GROUPS, calculateMatchPoints, isDeadlinePassed } from '@/lib/scoring';
import Avatar from './Avatar';

const PHASES = [
  { id: 'initial', label: 'Palpite Inicial', phase: 'initial' },
  { id: 'group_class', label: 'Classif. Grupos', phase: 'group_class' },
  { id: 'group_r1', label: '1ª Rodada', phase: 'group_r1' },
  { id: 'group_r2', label: '2ª Rodada', phase: 'group_r2' },
  { id: 'group_r3', label: '3ª Rodada', phase: 'group_r3' },
  { id: '32avos', label: '32-avos', phase: '32avos' },
  { id: 'oitavas', label: 'Oitavas', phase: 'oitavas' },
  { id: 'quartas', label: 'Quartas', phase: 'quartas' },
  { id: 'semi', label: 'Semi', phase: 'semi' },
  { id: 'terceiro', label: '3º Lugar', phase: 'terceiro' },
  { id: 'final', label: 'Final', phase: 'final' },
];

function ptsColor(pts) {
  if (pts >= 10) return 'text-green-600';
  if (pts >= 7) return 'text-blue-600';
  if (pts >= 5) return 'text-yellow-600';
  if (pts >= 2) return 'text-orange-600';
  return 'text-red-600';
}

// Load all users once and cache
let usersCache = null;
async function getUsers() {
  if (usersCache) return usersCache;
  const { data } = await supabase.from('users').select('id, name, avatar_url_1').eq('is_admin', false);
  if (data) {
    usersCache = {};
    data.forEach(u => { usersCache[u.id] = u; });
  }
  return usersCache || {};
}

function InitialView({ cache, setCache }) {
  const [loading, setLoading] = useState(!cache.initial);
  const data = cache.initial;

  useEffect(() => { if (!data) loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const locked = isDeadlinePassed('initial');
    if (!locked) { setCache(p => ({...p, initial: { locked: false }})); setLoading(false); return; }
    
    const users = await getUsers();
    const [predsRes, resRes] = await Promise.all([
      supabase.from('initial_predictions').select('*'),
      supabase.from('initial_results').select('*').limit(1),
    ]);
    
    const predictions = (predsRes.data || []).map(p => ({ ...p, user: users[p.user_id] || { name: '?', avatar_url_1: null } }));
    setCache(p => ({...p, initial: { locked: true, predictions, result: resRes.data?.[0] || null }}));
    setLoading(false);
  }

  if (loading) return <div className="card text-center py-10"><div className="text-3xl mb-2">🍯</div><div className="text-dark-500">Carregando...</div></div>;
  if (!data?.locked) return <div className="card text-center py-10"><div className="text-3xl mb-2">🔒</div><div className="text-dark-500">Palpites visíveis após o prazo de envio</div></div>;
  if (data.predictions.length === 0) return <div className="card text-center py-10"><div className="text-3xl mb-2">📋</div><div className="text-dark-500">Nenhum palpite inicial registrado</div></div>;

  return (
    <div className="card animate-fade-in">
      <h3 className="section-title">🔮 Palpites Iniciais</h3>
      {data.result && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-300">
          <div className="text-sm font-bold text-green-800 mb-1">✅ Resultado Final:</div>
          <div className="flex gap-4 text-sm flex-wrap">
            <span>🏆 {getFlag(data.result.champion)} {data.result.champion}</span>
            <span>🥈 {getFlag(data.result.vice)} {data.result.vice}</span>
            <span>🥉 {getFlag(data.result.third_place)} {data.result.third_place}</span>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2">
        {data.predictions.map(p => (
          <div key={p.id} className={`flex items-center justify-between p-3 rounded-lg border ${p.points !== null && p.points > 0 ? 'bg-green-50 border-green-200' : 'bg-dark-50 border-dark-200'}`}>
            <div className="flex items-center gap-2">
              <Avatar name={p.user.name} size={28} url={p.user.avatar_url_1} />
              <div>
                <span className="font-sans font-bold text-sm text-dark-900">{p.user.name}</span>
                <div className="text-xs text-dark-500">
                  🏆 {getFlag(p.champion)} {p.champion} · 🥈 {getFlag(p.vice)} {p.vice} · 🥉 {getFlag(p.third_place)} {p.third_place}
                </div>
              </div>
            </div>
            {p.points !== null ? (
              <span className={`font-display font-extrabold text-sm ${p.points > 0 ? 'text-green-600' : 'text-red-500'}`}>+{p.points}</span>
            ) : (
              <span className="text-[10px] text-dark-400">Aguardando final</span>
            )}
          </div>
        ))}
      </div>
      {!data.result && <p className="text-xs text-dark-500 mt-3 italic">Pontuação será calculada após a final da Copa</p>}
    </div>
  );
}

function GroupClassView({ cache, setCache }) {
  const [loading, setLoading] = useState(!cache.group_class);
  const data = cache.group_class;

  useEffect(() => { if (!data) loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const locked = isDeadlinePassed('group_class');
    if (!locked) { setCache(p => ({...p, group_class: { locked: false }})); setLoading(false); return; }
    
    const users = await getUsers();
    const [gRes, rRes] = await Promise.all([
      supabase.from('group_class_guesses').select('*').order('group_letter'),
      supabase.from('group_class_results').select('*'),
    ]);
    
    const results = {};
    (rRes.data || []).forEach(d => { results[d.group_letter] = d; });
    const byGroup = {};
    (gRes.data || []).forEach(g => {
      g.user = users[g.user_id] || { name: '?', avatar_url_1: null };
      if (!byGroup[g.group_letter]) byGroup[g.group_letter] = [];
      byGroup[g.group_letter].push(g);
    });
    setCache(p => ({...p, group_class: { locked: true, byGroup, results }}));
    setLoading(false);
  }

  if (loading) return <div className="card text-center py-10"><div className="text-3xl mb-2">🍯</div><div className="text-dark-500">Carregando...</div></div>;
  if (!data?.locked) return <div className="card text-center py-10"><div className="text-3xl mb-2">🔒</div><div className="text-dark-500">Palpites visíveis após o prazo de envio</div></div>;
  if (Object.keys(data.byGroup).length === 0) return <div className="card text-center py-10"><div className="text-3xl mb-2">📋</div><div className="text-dark-500">Nenhum palpite registrado</div></div>;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(GROUPS).map(([grp]) => {
          const groupGuesses = data.byGroup[grp] || [];
          const result = data.results[grp];
          if (groupGuesses.length === 0) return null;
          return (
            <div key={grp} className="card p-0 overflow-hidden animate-fade-in">
              <div className="px-3 py-2 bg-dark-50 border-b border-dark-200">
                <div className="flex justify-between items-center">
                  <span className="font-display font-bold text-sm">Grupo {grp}</span>
                  {result && <span className="text-green-600 text-[10px] font-bold">✅ Resultado</span>}
                </div>
                {result ? (
                  <div className="text-[10px] text-dark-500 mt-1">
                    1º {getFlag(result.pos_1)} {result.pos_1} · 2º {getFlag(result.pos_2)} {result.pos_2} · 3º {getFlag(result.pos_3)} {result.pos_3} · 4º {getFlag(result.pos_4)} {result.pos_4}
                  </div>
                ) : <div className="text-[10px] text-dark-400 mt-1">Aguardando classificação final</div>}
              </div>
              <div className="p-2">
                {groupGuesses.map(g => {
                  const correct = [];
                  if (result) { [1,2,3,4].forEach(pos => { if (g[`pos_${pos}`] === result[`pos_${pos}`]) correct.push(pos); }); }
                  return (
                    <div key={g.id} className={`flex items-center justify-between px-2 py-1.5 rounded mb-0.5 ${correct.length === 4 ? 'bg-green-50' : ''}`}>
                      <div className="flex items-center gap-1.5">
                        <Avatar name={g.user.name} size={18} url={g.user.avatar_url_1} />
                        <span className="text-[11px] font-semibold text-dark-900">{g.user.name}</span>
                        {correct.length === 4 && <span className="text-[9px]">🎯</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4].map(pos => {
                          const team = g[`pos_${pos}`];
                          const isCorrect = result && g[`pos_${pos}`] === result[`pos_${pos}`];
                          return <span key={pos} className={`text-[10px] px-1 rounded ${isCorrect ? 'bg-green-100 text-green-700' : result ? 'text-dark-400' : 'text-dark-600'}`}>{pos}º{getFlag(team)}</span>;
                        })}
                        {g.points !== null ? (
                          <span className={`font-display font-extrabold text-xs ml-1 ${g.points > 0 ? 'text-green-600' : 'text-red-500'}`}>+{g.points}</span>
                        ) : result ? <span className="text-[10px] text-dark-400 ml-1">—</span> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {Object.keys(data.results).length === 0 && <p className="text-xs text-dark-500 mt-3 italic text-center">Pontuação calculada quando o admin inserir a classificação final</p>}
    </div>
  );
}

function MatchHistoryView({ phase, cache, setCache }) {
  const cacheKey = `match_${phase}`;
  const [loading, setLoading] = useState(!cache[cacheKey]);
  const data = cache[cacheKey];

  useEffect(() => { if (!data) loadData(); }, [phase]);

  async function loadData() {
    setLoading(true);
    const locked = isDeadlinePassed(phase);
    if (!locked) { setCache(p => ({...p, [cacheKey]: { locked: false }})); setLoading(false); return; }

    const users = await getUsers();
    const { data: matchData } = await supabase.from('matches').select('*').eq('phase', phase).order('match_date').order('match_time');
    
    if (matchData && matchData.length > 0) {
      const matchIds = matchData.map(m => m.id);
      const { data: guessData } = await supabase.from('match_guesses').select('*').in('match_id', matchIds);
      const grouped = {};
      (guessData || []).forEach(g => {
        g.user = users[g.user_id] || { name: '?', avatar_url_1: null };
        if (!grouped[g.match_id]) grouped[g.match_id] = [];
        grouped[g.match_id].push(g);
      });
      setCache(p => ({...p, [cacheKey]: { locked: true, matches: matchData, guesses: grouped }}));
    } else {
      setCache(p => ({...p, [cacheKey]: { locked: true, matches: [], guesses: {} }}));
    }
    setLoading(false);
  }

  if (loading) return <div className="card text-center py-10"><div className="text-3xl mb-2">🍯</div><div className="text-dark-500">Carregando...</div></div>;
  if (!data?.locked) return <div className="card text-center py-10"><div className="text-3xl mb-2">🔒</div><div className="text-dark-500">Palpites visíveis após o prazo de envio</div></div>;
  if (data.matches.length === 0) return <div className="card text-center py-10"><div className="text-3xl mb-2">📋</div><div className="text-dark-500">Nenhum jogo nesta fase</div></div>;

  const isKo = ['32avos','oitavas','quartas','semi','terceiro','final'].includes(phase);

  return (
    <div>
      {data.matches.map(m => {
        const matchGuesses = data.guesses[m.id] || [];
        const hasResult = m.result_home !== null;
        return (
          <div key={m.id} className={`card p-0 mb-2 overflow-hidden animate-fade-in ${m.is_brasil ? 'border-l-[3px] border-l-brasil' : ''}`}>
            <div className="flex items-center justify-between px-3 py-1.5 bg-dark-50 gap-2 flex-wrap">
              <span className="text-[10px] text-dark-500">
                {m.group_letter ? `Grupo ${m.group_letter} · ` : ''}{m.match_time}
                {m.is_brasil && <span className="badge-brasil ml-1.5">🇧🇷 2x</span>}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{getFlag(m.home_team)}</span>
                <span className="text-xs font-semibold">{m.home_team}</span>
                {hasResult ? (
                  <span className="font-display text-base font-extrabold text-dark-900 px-2 py-0.5 bg-primary-50 rounded border border-primary-200">{m.result_home}×{m.result_away}</span>
                ) : (
                  <span className="font-display text-base font-extrabold text-dark-400 px-2 py-0.5 bg-dark-100 rounded border border-dark-200">? × ?</span>
                )}
                <span className="text-xs font-semibold">{m.away_team}</span>
                <span className="text-sm">{getFlag(m.away_team)}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 px-2 py-1">
              {matchGuesses.map(g => {
                let displayPts = null;
                let isExact = false;
                if (hasResult) {
                  const calc = calculateMatchPoints(g.guess_home, g.guess_away, m.result_home, m.result_away, m.is_brasil);
                  displayPts = g.points !== null ? g.points : calc.points;
                  isExact = calc.isExact;
                }
                return (
                  <div key={g.id} className={`flex items-center justify-between px-2 py-1 rounded ${isExact ? 'bg-green-50' : ''}`}>
                    <div className="flex items-center gap-1.5">
                      <Avatar name={g.user.name} size={18} url={g.user.avatar_url_1} />
                      <span className="text-[11px] font-semibold text-dark-900">{g.user.name}</span>
                      {isExact && <span className="text-[9px]">🎯</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-dark-600">
                        {g.guess_home}×{g.guess_away}
                        {isKo && g.ko_winner_guess && <span className="ml-1 text-[9px] text-dark-400">({getFlag(g.ko_winner_guess)})</span>}
                      </span>
                      {displayPts !== null ? (
                        <span className={`font-display font-extrabold text-xs min-w-[28px] text-right ${ptsColor(displayPts)}`}>+{displayPts}</span>
                      ) : (
                        <span className="text-[10px] text-dark-400 min-w-[28px] text-right">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {matchGuesses.length === 0 && <div className="text-xs text-dark-400 p-2">Nenhum palpite registrado</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function HistoricoPage({ user }) {
  const [phase, setPhase] = useState('group_r1');
  const [cache, setCache] = useState({});

  return (
    <div className="max-w-[900px] mx-auto p-5">
      <div className="flex gap-1 flex-wrap mb-3">
        {PHASES.map(p => (
          <button key={p.id} onClick={() => setPhase(p.id)}
            className={`phase-btn ${phase === p.id ? 'phase-btn-active' : 'phase-btn-inactive'}`}>{p.label}</button>
        ))}
      </div>
      {phase === 'initial' && <InitialView cache={cache} setCache={setCache} />}
      {phase === 'group_class' && <GroupClassView cache={cache} setCache={setCache} />}
      {!['initial', 'group_class'].includes(phase) && <MatchHistoryView phase={phase} cache={cache} setCache={setCache} />}
    </div>
  );
}
