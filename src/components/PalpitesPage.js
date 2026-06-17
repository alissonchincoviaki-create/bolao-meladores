'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getFlag, GROUPS, DEADLINES, getTimeRemaining, isDeadlinePassed } from '@/lib/scoring';
import ScoreStepper from './ScoreStepper';
import FlagSelect from './FlagSelect';
import Avatar from './Avatar';

const SCARY_PHRASES = [
  "Tô de olho nos seus palpites... 👁️",
  "Tenta me alcançar... se conseguir 😈",
  "Eu assombro esse ranking 👻",
  "Palpita com medo, palpita... 🫣",
  "O líder nunca dorme 💀",
  "Sente a pressão? Sou eu 😏",
  "Seu palpite tá tremendo? 🫠",
  "Cuidado... tô logo ali em cima 👑",
  "Cada ponto meu é um pesadelo seu 😱",
  "Buuu! Acertei mais que você 👻",
];

function GhostLeader({ leader }) {
  const [bounce, setBounce] = useState(false);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [fadePhrase, setFadePhrase] = useState(true);

  useEffect(() => {
    const b = setInterval(() => setBounce(x => !x), 2500);
    const p = setInterval(() => {
      setFadePhrase(false);
      setTimeout(() => { setPhraseIdx(i => (i + 1) % SCARY_PHRASES.length); setFadePhrase(true); }, 400);
    }, 5000);
    return () => { clearInterval(b); clearInterval(p); };
  }, []);

  if (!leader) return null;
  const initials = leader.name ? leader.name.substring(0, 2).toUpperCase() : '??';
  const COLORS = ['#2563EB','#16A34A','#DC2626','#9333EA','#EA580C','#0891B2','#DB2777'];
  const color = COLORS[leader.name ? leader.name.charCodeAt(0) % COLORS.length : 0];

  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 12, zIndex: 999,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      opacity: 0.5, transition: 'transform 0.8s ease-in-out',
      transform: bounce ? 'translateY(-8px)' : 'translateY(4px)',
      pointerEvents: 'none',
    }}>
      <div style={{ position: 'relative', width: 90, height: 110 }}>
        <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', fontSize: 18, zIndex: 2 }}>👑</div>
        <svg viewBox="0 0 100 120" style={{ width: 90, height: 110, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}>
          <defs>
            <radialGradient id="ghostGlow" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#e0e7ff" /><stop offset="50%" stopColor="#c7d2fe" /><stop offset="100%" stopColor="#a5b4fc" />
            </radialGradient>
            {leader.avatar_url_1 && (
              <pattern id="leaderPhoto" patternUnits="objectBoundingBox" width="1" height="1">
                <image href={leader.avatar_url_1} x="0" y="0" width="44" height="44" preserveAspectRatio="xMidYMid slice" />
              </pattern>
            )}
          </defs>
          <path d="M50 5 C20 5 5 25 5 50 L5 95 L15 85 L25 95 L35 85 L50 95 L65 85 L75 95 L85 85 L95 95 L95 50 C95 25 80 5 50 5Z"
            fill="url(#ghostGlow)" stroke="#818cf8" strokeWidth="1.5" opacity="0.9" />
          {leader.avatar_url_1 ? (
            <circle cx="50" cy="42" r="22" fill="url(#leaderPhoto)" opacity="0.9" />
          ) : (
            <>
              <circle cx="50" cy="42" r="22" fill={color} opacity="0.9" />
              <text x="50" y="48" textAnchor="middle" fill="white" fontSize="18" fontWeight="800" fontFamily="sans-serif">{initials}</text>
            </>
          )}
          <circle cx="25" cy="70" r="3" fill="#4f46e5" opacity="0.4" />
          <circle cx="75" cy="70" r="3" fill="#4f46e5" opacity="0.4" />
          <path d="M35 78 Q50 85 65 78" fill="none" stroke="#4f46e5" strokeWidth="1.5" opacity="0.3" />
        </svg>
      </div>
      <div style={{ textAlign: 'center', marginTop: -2, fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>{leader.name} · {leader.total}pts</div>
      </div>
      <div style={{
        marginTop: 4, background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.2)',
        borderRadius: 8, padding: '3px 10px', maxWidth: 160, textAlign: 'center',
        opacity: fadePhrase ? 1 : 0, transition: 'opacity 0.4s',
      }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontStyle: 'italic', color: '#4338ca', fontWeight: 600 }}>
          {SCARY_PHRASES[phraseIdx]}
        </span>
      </div>
    </div>
  );
}

const SECTIONS = [
  { id: 'inicial', label: '🔮 Inicial', phase: 'initial' },
  { id: 'classif', label: '📊 Grupos', phase: 'group_class' },
  { id: 'r1', label: '⚽ 1ª Rod.', phase: 'group_r1' },
  { id: 'r2', label: '⚽ 2ª Rod.', phase: 'group_r2' },
  { id: 'r3', label: '⚽ 3ª Rod.', phase: 'group_r3' },
  { id: '32avos', label: '⚔️ 32-avos', phase: '32avos' },
  { id: 'oitavas', label: '⚔️ Oitavas', phase: 'oitavas' },
  { id: 'quartas', label: '⚔️ Quartas', phase: 'quartas' },
  { id: 'semi', label: '⚔️ Semi', phase: 'semi' },
  { id: 'terceiro', label: '🥉 3º Lugar', phase: 'terceiro' },
  { id: 'final', label: '🏆 Final', phase: 'final' },
];

function DeadlineBanner({ phase }) {
  const remaining = getTimeRemaining(phase);
  const passed = isDeadlinePassed(phase);
  const dl = DEADLINES[phase];
  return (
    <div className={`rounded-xl p-3 px-4 mb-4 flex justify-between items-center flex-wrap gap-2 ${
      passed ? 'bg-red-50 border border-red-200' : 'bg-primary-50 border border-primary-200'
    }`}>
      <div>
        <div className="text-xs text-dark-500">
          Prazo: {dl ? new Date(dl).toLocaleDateString('pt-BR') + ' às ' + new Date(dl).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
        </div>
      </div>
      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
        passed ? 'bg-red-100 text-red-700' : remaining?.days < 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
      }`}>
        {passed ? '🔒 Encerrado' : `⏰ ${remaining?.days || 0}d ${remaining?.hours || 0}h`}
      </div>
    </div>
  );
}

function GroupClassCard({ group, teams, saved, onSave }) {
  const [positions, setPositions] = useState(saved || { 1: '', 2: '', 3: '', 4: '' });
  const used = Object.values(positions).filter(Boolean);

  useEffect(() => { if (saved) setPositions(saved); }, [saved]);

  return (
    <div className="bg-dark-50 rounded-lg p-3 border border-dark-200">
      <div className="flex justify-between items-center mb-2">
        <div className="font-display font-bold text-dark-900 text-sm">Grupo {group}</div>
        {used.length > 0 && (
          <button onClick={() => { const empty = { 1: '', 2: '', 3: '', 4: '' }; setPositions(empty); onSave(group, empty); }} className="text-[10px] text-red-500 hover:text-red-700">🔄 Limpar</button>
        )}
      </div>
      {[1, 2, 3, 4].map(pos => (
        <FlagSelect key={pos} label={`${pos}º Lugar`} value={positions[pos]}
          onChange={v => { const np = { ...positions, [pos]: v }; setPositions(np); onSave(group, np); }}
          options={teams.filter(t => !used.includes(t) || t === positions[pos])} />
      ))}
    </div>
  );
}

function MatchRow({ match, guess, onGuessChange, locked }) {
  return (
    <div className={`match-card ${match.is_brasil ? 'match-card-brasil' : 'match-card-normal'} ${locked ? 'opacity-60' : ''}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-dark-500">
          {match.group_letter ? `Grupo ${match.group_letter} · ` : ''}{match.match_time}
        </span>
        {match.is_brasil && <span className="badge-brasil">🇧🇷 2x PONTOS</span>}
      </div>
      <div className="flex items-center gap-2 justify-center">
        <div className="flex items-center gap-1 flex-1 justify-end">
          <span className="text-xs font-semibold text-dark-900">{match.home_team}</span>
          <span className="text-lg">{getFlag(match.home_team)}</span>
        </div>
        <ScoreStepper value={guess?.home ?? ''} onChange={v => !locked && onGuessChange(match.id, 'home', v)} />
        <span className="font-display font-bold text-primary-400 text-sm">×</span>
        <ScoreStepper value={guess?.away ?? ''} onChange={v => !locked && onGuessChange(match.id, 'away', v)} />
        <div className="flex items-center gap-1 flex-1">
          <span className="text-lg">{getFlag(match.away_team)}</span>
          <span className="text-xs font-semibold text-dark-900">{match.away_team}</span>
        </div>
      </div>
    </div>
  );
}

function KnockoutRow({ match, guess, onGuessChange, locked }) {
  return (
    <div className={`match-card ${match.is_brasil ? 'match-card-brasil' : 'match-card-normal'} ${locked ? 'opacity-60' : ''}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-dark-500">{match.match_time}</span>
        {match.is_brasil && <span className="badge-brasil">🇧🇷 2x</span>}
      </div>
      <div className="flex items-center gap-2 justify-center mb-2">
        <div className="flex items-center gap-1 flex-1 justify-end">
          <span className="text-xs font-semibold">{match.home_team}</span><span className="text-lg">{getFlag(match.home_team)}</span>
        </div>
        <ScoreStepper value={guess?.home ?? ''} onChange={v => !locked && onGuessChange(match.id, 'home', v)} />
        <span className="font-display font-bold text-primary-400 text-sm">×</span>
        <ScoreStepper value={guess?.away ?? ''} onChange={v => !locked && onGuessChange(match.id, 'away', v)} />
        <div className="flex items-center gap-1 flex-1">
          <span className="text-lg">{getFlag(match.away_team)}</span><span className="text-xs font-semibold">{match.away_team}</span>
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-semibold text-dark-700 mb-1">Quem classifica?</label>
        <div className="flex items-center gap-2">
          {guess?.ko_winner && <span className="text-lg">{getFlag(guess.ko_winner)}</span>}
          <select value={guess?.ko_winner || ''} onChange={e => !locked && onGuessChange(match.id, 'ko_winner', e.target.value)}
            className="input-field py-1.5 text-xs flex-1" disabled={locked}>
            <option value="">Selecionar...</option>
            <option value={match.home_team}>{getFlag(match.home_team)} {match.home_team}</option>
            <option value={match.away_team}>{getFlag(match.away_team)} {match.away_team}</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default function PalpitesPage({ user }) {
  const [section, setSection] = useState('r1');
  const [matches, setMatches] = useState([]);
  const [guesses, setGuesses] = useState({});
  const [groupClass, setGroupClass] = useState({});
  const [champ, setChamp] = useState('');
  const [vice, setVice] = useState('');
  const [third, setThird] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [leader, setLeader] = useState(null);

  const current = SECTIONS.find(s => s.id === section);
  const phaseMap = { r1: 'group_r1', r2: 'group_r2', r3: 'group_r3' };
  const locked = isDeadlinePassed(current?.phase);

  useEffect(() => { loadData(); }, [section]);
  useEffect(() => { loadLeader(); }, []);

  async function loadLeader() {
    const { data: users } = await supabase.from('users').select('id, name, avatar_url_1').eq('is_admin', false);
    if (!users) return;
    let best = null;
    for (const u of users) {
      const { data: mg } = await supabase.from('match_guesses').select('points').eq('user_id', u.id).not('points', 'is', null);
      const { data: gc } = await supabase.from('group_class_guesses').select('points').eq('user_id', u.id).not('points', 'is', null);
      const total = (mg || []).reduce((s, g) => s + (g.points || 0), 0) + (gc || []).reduce((s, g) => s + (g.points || 0), 0);
      if (!best || total > best.total) best = { name: u.name, avatar_url_1: u.avatar_url_1, total };
    }
    if (best && best.total > 0) setLeader(best);
  }

  async function loadData() {
    setMessage('');
    const phase = phaseMap[section] || section;

    if (section === 'inicial') {
      const { data } = await supabase.from('initial_predictions').select('*').eq('user_id', user.id).single();
      if (data) { setChamp(data.champion || ''); setVice(data.vice || ''); setThird(data.third_place || ''); }
      else { setChamp(''); setVice(''); setThird(''); }
      return;
    }

    if (section === 'classif') {
      const { data } = await supabase.from('group_class_guesses').select('*').eq('user_id', user.id);
      const gc = {};
      (data || []).forEach(g => { gc[g.group_letter] = { 1: g.pos_1, 2: g.pos_2, 3: g.pos_3, 4: g.pos_4 }; });
      setGroupClass(gc);
      return;
    }

    // Load matches
    const { data: matchData } = await supabase.from('matches').select('*').eq('phase', phase).order('match_date').order('match_time');
    if (matchData) setMatches(matchData);

    // Load existing guesses
    const { data: guessData } = await supabase.from('match_guesses').select('*').eq('user_id', user.id);
    const g = {};
    (guessData || []).forEach(gu => { g[gu.match_id] = { home: gu.guess_home, away: gu.guess_away, ko_winner: gu.ko_winner_guess }; });
    setGuesses(g);
  }

  function handleGuessChange(matchId, field, value) {
    setGuesses(prev => ({ ...prev, [matchId]: { ...prev[matchId], [field]: value } }));
  }

  async function saveInitial() {
    if (!champ || !vice || !third) { setMessage('Preencha campeão, vice e 3º lugar'); return; }
    if (locked) { setMessage('Prazo encerrado!'); return; }
    setSaving(true);
    const { error } = await supabase.from('initial_predictions').upsert({
      user_id: user.id, champion: champ, vice: vice, third_place: third,
    }, { onConflict: 'user_id' });
    setSaving(false);
    setMessage(error ? 'Erro: ' + error.message : '✅ Palpite inicial salvo!');
  }

  async function saveGroupClass() {
    if (locked) { setMessage('Prazo encerrado!'); return; }
    setSaving(true);
    let saved = 0;
    for (const [grp, pos] of Object.entries(groupClass)) {
      if (pos[1] && pos[2] && pos[3] && pos[4]) {
        await supabase.from('group_class_guesses').upsert({
          user_id: user.id, group_letter: grp, pos_1: pos[1], pos_2: pos[2], pos_3: pos[3], pos_4: pos[4],
        }, { onConflict: 'user_id,group_letter' });
        saved++;
      }
    }
    setSaving(false);
    setMessage(saved > 0 ? `✅ ${saved} grupo(s) salvo(s)!` : 'Preencha pelo menos 1 grupo completo');
  }

  async function saveMatchGuesses() {
    if (locked) { setMessage('Prazo encerrado!'); return; }
    setSaving(true);
    const phase = phaseMap[section] || section;
    const isKo = ['32avos', 'oitavas', 'quartas', 'semi', 'terceiro', 'final'].includes(section);
    let saved = 0;
    let errors = 0;

    for (const match of matches) {
      const g = guesses[match.id];
      if (g && g.home !== undefined && g.home !== '' && g.away !== undefined && g.away !== '') {
        const row = {
          user_id: user.id, match_id: match.id,
          guess_home: parseInt(g.home), guess_away: parseInt(g.away),
          ko_winner_guess: isKo ? (g.ko_winner || null) : null,
        };
        const { error } = await supabase.from('match_guesses').upsert(row, { onConflict: 'user_id,match_id' });
        if (error) errors++; else saved++;
      }
    }

    setSaving(false);
    if (errors > 0) setMessage(`⚠️ ${saved} salvos, ${errors} erros`);
    else if (saved > 0) setMessage(`✅ ${saved} palpite(s) salvo(s)!`);
    else setMessage('Preencha pelo menos 1 palpite');
  }

  function handleGroupSave(group, positions) {
    setGroupClass(prev => ({ ...prev, [group]: positions }));
  }

  async function clearAll() {
    if (!confirm('Limpar todos os palpites desta seção?')) return;
    if (section === 'inicial') { setChamp(''); setVice(''); setThird(''); await supabase.from('initial_predictions').delete().eq('user_id', user.id); setMessage('Palpite inicial limpo!'); }
    else if (section === 'classif') { setGroupClass({}); await supabase.from('group_class_guesses').delete().eq('user_id', user.id); setMessage('Classificados limpos!'); }
    else {
      const phase = phaseMap[section] || section;
      const matchIds = matches.map(m => m.id);
      if (matchIds.length > 0) { await supabase.from('match_guesses').delete().eq('user_id', user.id).in('match_id', matchIds); }
      setGuesses({});
      setMessage('Palpites limpos!');
    }
  }

  const isKnockout = ['32avos', 'oitavas', 'quartas', 'semi', 'terceiro', 'final'].includes(section);

  return (
    <div className="max-w-[900px] mx-auto p-5">
      <div className="flex gap-1 flex-wrap mb-4">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className={`phase-btn ${section === s.id ? 'phase-btn-active' : 'phase-btn-inactive'}`}>{s.label}</button>
        ))}
      </div>

      <DeadlineBanner phase={current.phase} />

      {message && (
        <div className="mb-3 p-2 rounded-lg bg-primary-50 border border-primary-200 text-sm text-primary-800 animate-fade-in">{message}</div>
      )}

      {section === 'inicial' && (
        <div className="card animate-slide-up">
          <h3 className="section-title">🔮 Palpite Inicial</h3>
          <p className="text-xs text-dark-500 mb-3">Pontuação revelada somente após a final da Copa</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FlagSelect label="🏆 Campeão (60 pts)" value={champ} onChange={v => !locked && setChamp(v)} />
            <FlagSelect label="🥈 Vice (40 pts)" value={vice} onChange={v => !locked && setVice(v)} />
            <FlagSelect label="🥉 3º Lugar (20 pts)" value={third} onChange={v => !locked && setThird(v)} />
          </div>
          {!locked && (
            <div className="flex gap-2 mt-3">
              <button onClick={saveInitial} disabled={saving} className="btn-primary max-w-xs">{saving ? 'Salvando...' : '✅ Salvar'}</button>
              {(champ || vice || third) && <button onClick={clearAll} className="btn-danger text-xs px-4">🔄 Limpar</button>}
            </div>
          )}
        </div>
      )}

      {section === 'classif' && (
        <div className="card animate-slide-up">
          <h3 className="section-title">📊 Classificação dos Grupos (1º ao 4º)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(GROUPS).map(([grp, teams]) => (
              <GroupClassCard key={grp} group={grp} teams={teams} saved={groupClass[grp]} onSave={handleGroupSave} />
            ))}
          </div>
          {!locked && (
            <div className="flex gap-2 mt-4">
              <button onClick={saveGroupClass} disabled={saving} className="btn-primary max-w-xs">{saving ? 'Salvando...' : '✅ Salvar Classificados'}</button>
              {Object.keys(groupClass).length > 0 && <button onClick={clearAll} className="btn-danger text-xs px-4">🔄 Limpar Tudo</button>}
            </div>
          )}
        </div>
      )}

      {['r1', 'r2', 'r3'].includes(section) && (
        <div className="card animate-slide-up">
          <h3 className="section-title">⚽ Palpites — {current.label}</h3>
          <div className="grid gap-2">
            {matches.map(m => <MatchRow key={m.id} match={m} guess={guesses[m.id]} onGuessChange={handleGuessChange} locked={locked} />)}
          </div>
          {!locked && matches.length > 0 && (
            <div className="flex gap-2 mt-4">
              <button onClick={saveMatchGuesses} disabled={saving} className="btn-primary max-w-xs">{saving ? 'Salvando...' : '✅ Enviar Palpites'}</button>
              {Object.keys(guesses).length > 0 && <button onClick={clearAll} className="btn-danger text-xs px-4">🔄 Limpar</button>}
            </div>
          )}
        </div>
      )}

      {isKnockout && (
        <div className="card animate-slide-up">
          <h3 className="section-title">{current.label}</h3>
          <p className="text-xs text-dark-500 mb-3">Palpite do placar + quem classifica</p>
          <div className="grid gap-3">
            {matches.map(m => <KnockoutRow key={m.id} match={m} guess={guesses[m.id]} onGuessChange={handleGuessChange} locked={locked} />)}
          </div>
          {!locked && matches.length > 0 && (
            <div className="flex gap-2 mt-4">
              <button onClick={saveMatchGuesses} disabled={saving} className="btn-primary max-w-xs">{saving ? 'Salvando...' : '✅ Enviar Palpites'}</button>
              {Object.keys(guesses).length > 0 && <button onClick={clearAll} className="btn-danger text-xs px-4">🔄 Limpar</button>}
            </div>
          )}
        </div>
      )}

      {/* 👻 Ghost Leader */}
      {leader && leader.name !== user.name && <GhostLeader leader={leader} />}
    </div>
  );
}
