'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getFlag, GROUPS } from '@/lib/scoring';
import Avatar from './Avatar';

const ADMIN_TABS = [
  { id: 'results', label: '⚽ Resultados' },
  { id: 'groups', label: '📊 Classif. Grupos' },
  { id: 'players', label: '👥 Participantes' },
];

const MATCH_PHASES = [
  { id: 'group_r1', label: '1ª Rodada' },
  { id: 'group_r2', label: '2ª Rodada' },
  { id: 'group_r3', label: '3ª Rodada' },
  { id: '32avos', label: '32-avos' },
  { id: 'oitavas', label: 'Oitavas' },
  { id: 'quartas', label: 'Quartas' },
  { id: 'semi', label: 'Semi' },
  { id: 'terceiro', label: '3º Lugar' },
  { id: 'final', label: 'Final' },
];

function ResultsTab() {
  const [phase, setPhase] = useState('group_r1');
  const [matches, setMatches] = useState([]);
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState(null);

  useEffect(() => { loadMatches(); }, [phase]);

  async function loadMatches() {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('phase', phase)
      .order('match_date')
      .order('match_time');
    if (data) {
      setMatches(data);
      const s = {};
      data.forEach(m => {
        s[m.id] = { home: m.result_home ?? '', away: m.result_away ?? '', ko_winner: m.ko_winner || '' };
      });
      setScores(s);
    }
  }

  async function saveResult(matchId) {
    const s = scores[matchId];
    if (s.home === '' || s.away === '') return;
    setSaving(matchId);

    const updateData = { result_home: parseInt(s.home), result_away: parseInt(s.away) };
    const isKo = !['group_r1', 'group_r2', 'group_r3'].includes(phase);
    if (isKo && s.ko_winner) updateData.ko_winner = s.ko_winner;

    await supabase.from('matches').update(updateData).eq('id', matchId);

    // Calculate points for all guesses
    const { data: guesses } = await supabase
      .from('match_guesses')
      .select('*')
      .eq('match_id', matchId);

    const match = matches.find(m => m.id === matchId);
    if (guesses && match) {
      for (const g of guesses) {
        const { calculateMatchPoints, getKnockoutClassPoints } = await import('@/lib/scoring');
        const { points, isExact } = calculateMatchPoints(
          g.guess_home, g.guess_away, parseInt(s.home), parseInt(s.away), match.is_brasil
        );
        let totalPts = points;
        if (isKo && g.ko_winner_guess === s.ko_winner) {
          totalPts += getKnockoutClassPoints(phase);
        }
        await supabase.from('match_guesses').update({ points: totalPts, is_exact: isExact }).eq('id', g.id);
      }
    }

    setSaving(null);
    loadMatches();
  }

  const isKo = !['group_r1', 'group_r2', 'group_r3'].includes(phase);

  return (
    <div>
      <div className="flex gap-1 flex-wrap mb-4">
        {MATCH_PHASES.map(p => (
          <button key={p.id} onClick={() => setPhase(p.id)}
            className={`phase-btn ${phase === p.id ? 'phase-btn-active' : 'phase-btn-inactive'}`}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {matches.map(m => {
          const s = scores[m.id] || {};
          const hasResult = m.result_home !== null;
          return (
            <div key={m.id} className={`bg-dark-50 border rounded-lg p-3 flex flex-col gap-2 ${
              hasResult ? 'border-green-300 bg-green-50/30' : 'border-dark-200'
            }`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[10px] text-dark-500">
                  {m.group_letter ? `Grupo ${m.group_letter} · ` : ''}{m.match_date} {m.match_time}
                  {hasResult && <span className="ml-1 text-green-600 font-bold">✓</span>}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{getFlag(m.home_team)}</span>
                  <span className="text-xs font-semibold">{m.home_team}</span>
                  <input
                    type="number" min="0" placeholder="-"
                    value={s.home ?? ''}
                    onChange={e => setScores({ ...scores, [m.id]: { ...s, home: e.target.value } })}
                    className="w-9 py-1 border-2 border-dark-300 rounded text-center text-sm font-display font-bold bg-white"
                  />
                  <span className="text-dark-400 font-bold text-xs">×</span>
                  <input
                    type="number" min="0" placeholder="-"
                    value={s.away ?? ''}
                    onChange={e => setScores({ ...scores, [m.id]: { ...s, away: e.target.value } })}
                    className="w-9 py-1 border-2 border-dark-300 rounded text-center text-sm font-display font-bold bg-white"
                  />
                  <span className="text-xs font-semibold">{m.away_team}</span>
                  <span className="text-sm">{getFlag(m.away_team)}</span>
                </div>
              </div>

              {isKo && (
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="text-[10px] font-semibold text-dark-700">Classificado:</label>
                  <select
                    value={s.ko_winner || ''}
                    onChange={e => setScores({ ...scores, [m.id]: { ...s, ko_winner: e.target.value } })}
                    className="input-field py-1 px-2 text-xs w-auto"
                  >
                    <option value="">Selecionar...</option>
                    <option value={m.home_team}>{getFlag(m.home_team)} {m.home_team}</option>
                    <option value={m.away_team}>{getFlag(m.away_team)} {m.away_team}</option>
                  </select>
                </div>
              )}

              <button
                onClick={() => saveResult(m.id)}
                disabled={saving === m.id}
                className="btn-success text-xs self-end"
              >
                {saving === m.id ? 'Salvando...' : hasResult ? '✏️ Atualizar' : '💾 Salvar'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GroupClassTab() {
  const [results, setResults] = useState({});

  return (
    <div>
      <h3 className="section-title">Inserir Classificação Final dos Grupos</h3>
      <p className="text-xs text-dark-500 mb-4">Preencha após o término da fase de grupos</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(GROUPS).map(([grp, teams]) => (
          <div key={grp} className="bg-dark-50 border border-dark-200 rounded-lg p-3">
            <div className="font-display font-bold text-sm mb-2">Grupo {grp}</div>
            {[1, 2, 3, 4].map(pos => (
              <div key={pos} className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold text-dark-500 w-5">{pos}º</span>
                <select
                  value={results[`${grp}_${pos}`] || ''}
                  onChange={e => setResults({ ...results, [`${grp}_${pos}`]: e.target.value })}
                  className="input-field py-1.5 px-2 text-xs flex-1"
                >
                  <option value="">Selecionar...</option>
                  {teams.map(t => <option key={t} value={t}>{getFlag(t)} {t}</option>)}
                </select>
              </div>
            ))}
            <button className="btn-success text-xs w-full mt-2">Salvar Grupo {grp}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayersTab() {
  const [players, setPlayers] = useState([]);
  const [newName, setNewName] = useState('');
  const [newLogin, setNewLogin] = useState('');

  useEffect(() => { loadPlayers(); }, []);

  async function loadPlayers() {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('is_admin', false)
      .order('name');
    if (data) setPlayers(data);
  }

  async function addPlayer() {
    if (!newName.trim() || !newLogin.trim()) return;
    await supabase.from('users').insert({
      name: newName.trim(),
      login: newLogin.toLowerCase().trim(),
      password_hash: 'meladores2026',
      is_admin: false,
      first_access: true,
    });
    setNewName('');
    setNewLogin('');
    loadPlayers();
  }

  async function resetPassword(id) {
    await supabase.from('users').update({ password_hash: 'meladores2026', first_access: true }).eq('id', id);
    loadPlayers();
  }

  async function removePlayer(id) {
    if (!confirm('Tem certeza que quer remover este participante?')) return;
    await supabase.from('users').delete().eq('id', id);
    loadPlayers();
  }

  return (
    <div>
      {/* Add new player */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-4">
        <div className="font-sans font-bold text-sm text-dark-900 mb-2">➕ Adicionar Participante</div>
        <div className="flex gap-2 flex-wrap">
          <input placeholder="Nome/Apelido" value={newName} onChange={e => setNewName(e.target.value)}
            className="input-field flex-1 min-w-[140px]" />
          <input placeholder="Login" value={newLogin} onChange={e => setNewLogin(e.target.value)}
            className="input-field flex-1 min-w-[100px]" />
          <button onClick={addPlayer} className="bg-primary-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm">
            Cadastrar
          </button>
        </div>
        <div className="mt-3">
          <label className="block text-xs font-semibold text-dark-700 mb-1">📸 Upload 3 fotos/zoeiras</label>
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-12 h-12 rounded-full border-2 border-dashed border-primary-400 flex items-center justify-center cursor-pointer bg-dark-50 text-primary-400 text-lg hover:bg-primary-50 transition-all">
                +
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Player list */}
      <div className="flex flex-col gap-1.5">
        {players.map(p => (
          <div key={p.id} className="flex items-center justify-between p-2.5 bg-dark-50 border border-dark-200 rounded-lg flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Avatar name={p.name} size={30} />
              <span className="font-sans font-bold text-xs text-dark-900">{p.name}</span>
              <span className="text-[10px] text-dark-500">@{p.login}</span>
              {p.first_access && (
                <span className="bg-primary-100 text-primary-800 text-[9px] font-semibold px-1.5 py-0.5 rounded">
                  Aguardando 1º acesso
                </span>
              )}
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => resetPassword(p.id)}
                className="bg-white border border-dark-300 rounded px-2 py-1 text-[10px] text-primary-800 hover:bg-dark-100 transition-all">
                🔑 Resetar
              </button>
              <button onClick={() => removePlayer(p.id)} className="btn-danger">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState('results');

  return (
    <div className="max-w-[900px] mx-auto p-5">
      <div className="flex gap-1 mb-4">
        {ADMIN_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`phase-btn text-sm ${tab === t.id ? 'phase-btn-active' : 'phase-btn-inactive'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        {tab === 'results' && <ResultsTab />}
        {tab === 'groups' && <GroupClassTab />}
        {tab === 'players' && <PlayersTab />}
      </div>
    </div>
  );
}
