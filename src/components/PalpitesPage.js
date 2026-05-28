'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getFlag, GROUPS, DEADLINES, getTimeRemaining, isDeadlinePassed } from '@/lib/scoring';
import ScoreStepper from './ScoreStepper';
import FlagSelect from './FlagSelect';

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
  const section = SECTIONS.find(s => s.phase === phase);

  return (
    <div className={`rounded-xl p-3 px-4 mb-4 flex justify-between items-center flex-wrap gap-2 ${
      passed ? 'bg-red-50 border border-red-200' : 'bg-primary-50 border border-primary-200'
    }`}>
      <div>
        <div className="text-sm font-semibold text-primary-800">{section?.label}</div>
        <div className="text-xs text-dark-500">
          Prazo: {new Date(DEADLINES[phase]).toLocaleDateString('pt-BR')} às{' '}
          {new Date(DEADLINES[phase]).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
        passed ? 'bg-red-100 text-red-700' : 
        remaining?.days < 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
      }`}>
        {passed ? '🔒 Encerrado' : `⏰ ${remaining?.days}d ${remaining?.hours}h`}
      </div>
    </div>
  );
}

function GroupClassCard({ group, teams }) {
  const [positions, setPositions] = useState({ 1: '', 2: '', 3: '', 4: '' });
  const used = Object.values(positions).filter(Boolean);

  return (
    <div className="bg-dark-50 rounded-lg p-3 border border-dark-200">
      <div className="font-display font-bold text-dark-900 mb-2 text-sm">Grupo {group}</div>
      {[1, 2, 3, 4].map(pos => (
        <FlagSelect
          key={pos}
          label={`${pos}º Lugar`}
          value={positions[pos]}
          onChange={v => setPositions({ ...positions, [pos]: v })}
          options={teams.filter(t => !used.includes(t) || t === positions[pos])}
        />
      ))}
      <div className="text-[10px] text-dark-500 mt-1">10 pts por posição acertada</div>
    </div>
  );
}

function MatchRow({ match }) {
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');

  return (
    <div className={`match-card ${match.is_brasil ? 'match-card-brasil' : 'match-card-normal'}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-dark-500">
          {match.group_letter ? `Grupo ${match.group_letter} · ` : ''}{match.match_date} {match.match_time}
        </span>
        {match.is_brasil && <span className="badge-brasil">🇧🇷 2x PONTOS</span>}
      </div>
      <div className="flex items-center gap-2 justify-center">
        <div className="flex items-center gap-1 flex-1 justify-end">
          <span className="text-xs font-semibold text-dark-900">{match.home_team}</span>
          <span className="text-lg">{getFlag(match.home_team)}</span>
        </div>
        <ScoreStepper value={home} onChange={setHome} />
        <span className="font-display font-bold text-primary-400 text-sm">×</span>
        <ScoreStepper value={away} onChange={setAway} />
        <div className="flex items-center gap-1 flex-1">
          <span className="text-lg">{getFlag(match.away_team)}</span>
          <span className="text-xs font-semibold text-dark-900">{match.away_team}</span>
        </div>
      </div>
    </div>
  );
}

function KnockoutRow({ match }) {
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const [winner, setWinner] = useState('');

  return (
    <div className={`match-card ${match.is_brasil ? 'match-card-brasil' : 'match-card-normal'}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-dark-500">{match.match_date} {match.match_time}</span>
        {match.is_brasil && <span className="badge-brasil">🇧🇷 2x</span>}
      </div>
      <div className="flex items-center gap-2 justify-center mb-2">
        <div className="flex items-center gap-1 flex-1 justify-end">
          <span className="text-xs font-semibold text-dark-900">{match.home_team}</span>
          <span className="text-lg">{getFlag(match.home_team)}</span>
        </div>
        <ScoreStepper value={home} onChange={setHome} />
        <span className="font-display font-bold text-primary-400 text-sm">×</span>
        <ScoreStepper value={away} onChange={setAway} />
        <div className="flex items-center gap-1 flex-1">
          <span className="text-lg">{getFlag(match.away_team)}</span>
          <span className="text-xs font-semibold text-dark-900">{match.away_team}</span>
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-semibold text-dark-700 mb-1">Quem classifica?</label>
        <div className="flex items-center gap-2">
          {winner && <span className="text-lg">{getFlag(winner)}</span>}
          <select value={winner} onChange={e => setWinner(e.target.value)} className="input-field py-1.5 text-xs flex-1">
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
  const [champ, setChamp] = useState('');
  const [vice, setVice] = useState('');
  const [third, setThird] = useState('');

  const current = SECTIONS.find(s => s.id === section);
  const phaseMap = { r1: 'group_r1', r2: 'group_r2', r3: 'group_r3' };

  useEffect(() => {
    loadMatches();
  }, [section]);

  async function loadMatches() {
    const phase = phaseMap[section] || section;
    if (['inicial', 'classif'].includes(section)) return;

    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('phase', phase)
      .order('match_date')
      .order('match_time');

    if (data) setMatches(data);
  }

  const isKnockout = ['32avos', 'oitavas', 'quartas', 'semi', 'terceiro', 'final'].includes(section);

  return (
    <div className="max-w-[900px] mx-auto p-5">
      {/* Section tabs */}
      <div className="flex gap-1 flex-wrap mb-4">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`phase-btn ${section === s.id ? 'phase-btn-active' : 'phase-btn-inactive'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <DeadlineBanner phase={current.phase} />

      {/* Initial Prediction */}
      {section === 'inicial' && (
        <div className="card animate-slide-up">
          <h3 className="section-title">🔮 Palpite Inicial</h3>
          <p className="text-xs text-dark-500 mb-3">Pontuação revelada somente após a final da Copa</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FlagSelect label="🏆 Campeão (60 pts)" value={champ} onChange={setChamp} />
            <FlagSelect label="🥈 Vice (40 pts)" value={vice} onChange={setVice} />
            <FlagSelect label="🥉 3º Lugar (20 pts)" value={third} onChange={setThird} />
          </div>
          <button className="btn-primary max-w-xs mt-3">✅ Salvar Palpite Inicial</button>
        </div>
      )}

      {/* Group Classification */}
      {section === 'classif' && (
        <div className="card animate-slide-up">
          <h3 className="section-title">📊 Classificação dos Grupos (1º ao 4º)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(GROUPS).map(([grp, teams]) => (
              <GroupClassCard key={grp} group={grp} teams={teams} />
            ))}
          </div>
          <button className="btn-primary max-w-xs mt-4">✅ Salvar Classificados</button>
        </div>
      )}

      {/* Group Matches */}
      {['r1', 'r2', 'r3'].includes(section) && (
        <div className="card animate-slide-up">
          <h3 className="section-title">⚽ Palpites — {current.label}</h3>
          <div className="grid gap-2">
            {matches.map(m => <MatchRow key={m.id} match={m} />)}
          </div>
          {matches.length > 0 && (
            <button className="btn-primary max-w-xs mt-4">✅ Enviar Palpites</button>
          )}
        </div>
      )}

      {/* Knockout */}
      {isKnockout && (
        <div className="card animate-slide-up">
          <h3 className="section-title">{current.label}</h3>
          <p className="text-xs text-dark-500 mb-3">Palpite do placar + quem classifica</p>
          <div className="grid gap-3">
            {matches.map(m => <KnockoutRow key={m.id} match={m} />)}
          </div>
          {matches.length > 0 && (
            <button className="btn-primary max-w-xs mt-4">✅ Enviar Palpites</button>
          )}
        </div>
      )}
    </div>
  );
}
