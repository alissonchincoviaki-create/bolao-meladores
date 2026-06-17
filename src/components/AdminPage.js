'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getFlag, GROUPS, calculateMatchPoints, getKnockoutClassPoints, calculateGroupClassPoints, calculateInitialPoints } from '@/lib/scoring';
import { checkPhaseComplete, generatePhaseSummary } from '@/lib/auto-messages';
import Avatar from './Avatar';
import FlagSelect from './FlagSelect';

const ADMIN_TABS = [
  { id: 'results', label: '⚽ Resultados' },
  { id: 'groups', label: '📊 Classif. Grupos' },
  { id: 'initial', label: '🏆 Campeão/Vice/3º' },
  { id: 'status', label: '📋 Status Palpites' },
  { id: 'players', label: '👥 Participantes' },
];

const MATCH_PHASES = [
  { id: 'group_r1', label: '1ª Rodada' }, { id: 'group_r2', label: '2ª Rodada' }, { id: 'group_r3', label: '3ª Rodada' },
  { id: '32avos', label: '32-avos' }, { id: 'oitavas', label: 'Oitavas' }, { id: 'quartas', label: 'Quartas' },
  { id: 'semi', label: 'Semi' }, { id: 'terceiro', label: '3º Lugar' }, { id: 'final', label: 'Final' },
];

function ResultsTab() {
  const [phase, setPhase] = useState('group_r1');
  const [matches, setMatches] = useState([]);
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState(null);
  const [message, setMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  useEffect(() => { loadMatches(); }, [phase]);

  async function loadMatches() {
    const { data } = await supabase.from('matches').select('*').eq('phase', phase).order('match_date').order('match_time');
    if (data) { setMatches(data); const s = {}; data.forEach(m => { s[m.id] = { home: m.result_home ?? '', away: m.result_away ?? '', ko_winner: m.ko_winner || '' }; }); setScores(s); }
  }

  async function saveResult(matchId) {
    const s = scores[matchId]; if (s.home === '' || s.away === '') return;
    setSaving(matchId); setMessage('');
    const rh = parseInt(s.home), ra = parseInt(s.away);
    const updateData = { result_home: rh, result_away: ra };
    const isKo = !['group_r1','group_r2','group_r3'].includes(phase);
    if (isKo && s.ko_winner) updateData.ko_winner = s.ko_winner;
    await supabase.from('matches').update(updateData).eq('id', matchId);

    const match = matches.find(m => m.id === matchId);
    const { data: guessData } = await supabase.from('match_guesses').select('*').eq('match_id', matchId);
    if (guessData) {
      for (const g of guessData) {
        const { points, isExact } = calculateMatchPoints(g.guess_home, g.guess_away, rh, ra, match?.is_brasil);
        let totalPts = points;
        if (isKo && g.ko_winner_guess && g.ko_winner_guess === s.ko_winner) totalPts += getKnockoutClassPoints(phase);
        await supabase.from('match_guesses').update({ points: totalPts, is_exact: isExact }).eq('id', g.id);
      }
    }
    setSaving(null);
    setMessage('✅ Resultado salvo e pontos calculados!');
    await loadMatches();

    // Check if phase is now complete -> generate summary
    const phaseToCheck = phase === 'terceiro' ? 'final' : phase;
    const isComplete = await checkPhaseComplete(phase);
    if (isComplete) {
      setGenerating(true);
      setMessage('✅ Resultado salvo! Gerando resumo da rodada...');
      const summary = await generatePhaseSummary(phase);
      setGenerating(false);
      if (summary) {
        setMessage('✅ Resultado salvo, pontos calculados e resumo da rodada publicado na Resenha! 🍯');
      } else {
        setMessage('✅ Resultado salvo e pontos calculados!');
      }
    }
  }

  async function clearResult(matchId) {
    if (!confirm('Limpar resultado deste jogo?')) return;
    setSaving(matchId);
    await supabase.from('matches').update({ result_home: null, result_away: null, ko_winner: null }).eq('id', matchId);
    await supabase.from('match_guesses').update({ points: null, is_exact: false }).eq('match_id', matchId);
    setSaving(null); setMessage('Resultado limpo!'); loadMatches();
  }

  const isKo = !['group_r1','group_r2','group_r3'].includes(phase);
  return (
    <div>
      <div className="flex gap-1 flex-wrap mb-4">{MATCH_PHASES.map(p => (<button key={p.id} onClick={() => setPhase(p.id)} className={`phase-btn ${phase === p.id ? 'phase-btn-active' : 'phase-btn-inactive'}`}>{p.label}</button>))}</div>
      {message && <div className="mb-3 p-2 rounded-lg bg-primary-50 border border-primary-200 text-sm text-primary-800">{message}</div>}
      {generating && <div className="mb-3 p-2 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">🤖 Gerando resumo da rodada com IA... aguarde...</div>}
      <div className="flex flex-col gap-2">{matches.map(m => { const s = scores[m.id] || {}; const hasResult = m.result_home !== null; return (
        <div key={m.id} className={`bg-dark-50 border rounded-lg p-3 flex flex-col gap-2 ${hasResult ? 'border-green-300 bg-green-50/30' : 'border-dark-200'}`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[10px] text-dark-500">{m.group_letter ? `Grupo ${m.group_letter} · ` : ''}{m.match_date} {m.match_time}{hasResult && <span className="ml-1 text-green-600 font-bold">✓</span>}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{getFlag(m.home_team)}</span><span className="text-xs font-semibold">{m.home_team}</span>
              <input type="number" min="0" placeholder="-" value={s.home ?? ''} onChange={e => setScores({...scores,[m.id]:{...s,home:e.target.value}})} className="w-9 py-1 border-2 border-dark-300 rounded text-center text-sm font-display font-bold bg-white"/>
              <span className="text-dark-400 font-bold text-xs">×</span>
              <input type="number" min="0" placeholder="-" value={s.away ?? ''} onChange={e => setScores({...scores,[m.id]:{...s,away:e.target.value}})} className="w-9 py-1 border-2 border-dark-300 rounded text-center text-sm font-display font-bold bg-white"/>
              <span className="text-xs font-semibold">{m.away_team}</span><span className="text-sm">{getFlag(m.away_team)}</span>
            </div>
          </div>
          {isKo && (<div className="flex items-center gap-2 flex-wrap"><label className="text-[10px] font-semibold text-dark-700">Classificado:</label>
            <select value={s.ko_winner||''} onChange={e=>setScores({...scores,[m.id]:{...s,ko_winner:e.target.value}})} className="input-field py-1 px-2 text-xs w-auto">
              <option value="">Selecionar...</option><option value={m.home_team}>{getFlag(m.home_team)} {m.home_team}</option><option value={m.away_team}>{getFlag(m.away_team)} {m.away_team}</option>
            </select></div>)}
          <div className="flex gap-2 self-end">
            {hasResult && <button onClick={()=>clearResult(m.id)} disabled={saving===m.id} className="btn-danger text-xs">🔄 Limpar</button>}
            <button onClick={()=>saveResult(m.id)} disabled={saving===m.id||generating} className="btn-success text-xs">{saving===m.id?'Salvando...':hasResult?'✏️ Atualizar':'💾 Salvar'}</button>
          </div>
        </div>);})}</div>
    </div>
  );
}

function GroupClassTab() {
  const [results, setResults] = useState({});
  const [savedGroups, setSavedGroups] = useState({});
  const [message, setMessage] = useState('');
  useEffect(() => { loadSaved(); }, []);

  async function loadSaved() {
    const { data } = await supabase.from('group_class_results').select('*');
    if (data) { const r = {}; const sg = {}; data.forEach(d => { r[`${d.group_letter}_1`]=d.pos_1; r[`${d.group_letter}_2`]=d.pos_2; r[`${d.group_letter}_3`]=d.pos_3; r[`${d.group_letter}_4`]=d.pos_4; sg[d.group_letter]=true; }); setResults(r); setSavedGroups(sg); }
  }

  function getUsed(grp) { const u=[]; for(let p=1;p<=4;p++){const v=results[`${grp}_${p}`];if(v)u.push(v);} return u; }

  async function saveGroup(grp) {
    const p1=results[`${grp}_1`],p2=results[`${grp}_2`],p3=results[`${grp}_3`],p4=results[`${grp}_4`];
    if(!p1||!p2||!p3||!p4){setMessage(`Preencha as 4 posições do Grupo ${grp}`);return;}
    await supabase.from('group_class_results').upsert({group_letter:grp,pos_1:p1,pos_2:p2,pos_3:p3,pos_4:p4},{onConflict:'group_letter'});
    const{data:guessData}=await supabase.from('group_class_guesses').select('*').eq('group_letter',grp);
    if(guessData){for(const g of guessData){
      const pts=calculateGroupClassPoints({pos1:g.pos_1,pos2:g.pos_2,pos3:g.pos_3,pos4:g.pos_4},{pos1:p1,pos2:p2,pos3:p3,pos4:p4});
      await supabase.from('group_class_guesses').update({points:pts}).eq('id',g.id);
    }}
    setSavedGroups(prev=>({...prev,[grp]:true}));
    setMessage(`✅ Grupo ${grp} salvo e pontos calculados!`);
  }

  async function clearGroup(grp) {
    if(!confirm(`Limpar Grupo ${grp}?`))return;
    await supabase.from('group_class_results').delete().eq('group_letter',grp);
    await supabase.from('group_class_guesses').update({points:null}).eq('group_letter',grp);
    setResults(prev=>{const n={...prev};delete n[`${grp}_1`];delete n[`${grp}_2`];delete n[`${grp}_3`];delete n[`${grp}_4`];return n;});
    setSavedGroups(prev=>{const n={...prev};delete n[grp];return n;});
    setMessage(`Grupo ${grp} limpo!`);
  }

  async function clearAllGroups() {
    if(!confirm('Limpar TODOS os grupos?'))return;
    await supabase.from('group_class_results').delete().gt('id',0);
    await supabase.from('group_class_guesses').update({points:null}).gt('id',0);
    setResults({});setSavedGroups({});setMessage('Todos os grupos limpos!');
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="section-title mb-0">Classificação Final dos Grupos</h3>
        {Object.keys(savedGroups).length>0&&<button onClick={clearAllGroups} className="btn-danger text-xs">🔄 Limpar Todos</button>}
      </div>
      {message&&<div className="mb-3 p-2 rounded-lg bg-primary-50 border border-primary-200 text-sm text-primary-800">{message}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(GROUPS).map(([grp,teams])=>{const used=getUsed(grp);const isSaved=savedGroups[grp];return(
          <div key={grp} className={`bg-dark-50 border rounded-lg p-3 ${isSaved?'border-green-300 bg-green-50/30':'border-dark-200'}`}>
            <div className="font-display font-bold text-sm mb-2">Grupo {grp} {isSaved&&<span className="text-green-600 text-xs">✓</span>}</div>
            {[1,2,3,4].map(pos=>{const cv=results[`${grp}_${pos}`]||'';const avail=teams.filter(t=>!used.includes(t)||t===cv);return(
              <div key={pos} className="flex items-center gap-2 mb-1.5"><span className="text-xs font-bold text-dark-500 w-5">{pos}º</span>
                {cv&&<span className="text-sm">{getFlag(cv)}</span>}
                <select value={cv} onChange={e=>setResults({...results,[`${grp}_${pos}`]:e.target.value})} className="input-field py-1.5 px-2 text-xs flex-1">
                  <option value="">Selecionar...</option>{avail.map(t=><option key={t} value={t}>{getFlag(t)} {t}</option>)}
                </select></div>);})}
            <div className="flex gap-2 mt-2">
              <button onClick={()=>saveGroup(grp)} className="btn-success text-xs flex-1">💾 Salvar</button>
              {isSaved&&<button onClick={()=>clearGroup(grp)} className="btn-danger text-xs">🔄</button>}
            </div>
          </div>);})}
      </div>
    </div>
  );
}

function InitialResultsTab() {
  const [champ, setChamp] = useState('');
  const [vice, setVice] = useState('');
  const [third, setThird] = useState('');
  const [message, setMessage] = useState('');
  const [hasSaved, setHasSaved] = useState(false);
  const [resultId, setResultId] = useState(null);

  useEffect(() => { loadResults(); }, []);
  async function loadResults() {
    const { data } = await supabase.from('initial_results').select('*').limit(1);
    if (data && data.length > 0) {
      setChamp(data[0].champion||''); setVice(data[0].vice||''); setThird(data[0].third_place||'');
      setHasSaved(true); setResultId(data[0].id);
    } else {
      setHasSaved(false); setResultId(null);
    }
  }

  async function save() {
    if (!champ||!vice||!third) { setMessage('Preencha os 3 campos'); return; }
    if (resultId) {
      await supabase.from('initial_results').update({ champion: champ, vice: vice, third_place: third }).eq('id', resultId);
    } else {
      const { data } = await supabase.from('initial_results').insert({ champion: champ, vice: vice, third_place: third }).select();
      if (data && data.length > 0) setResultId(data[0].id);
    }
    const { data: preds } = await supabase.from('initial_predictions').select('*');
    if (preds) {
      for (const p of preds) {
        const pts = calculateInitialPoints({ champion: p.champion, vice: p.vice, thirdPlace: p.third_place }, { champion: champ, vice: vice, thirdPlace: third });
        await supabase.from('initial_predictions').update({ points: pts }).eq('id', p.id);
      }
    }
    setHasSaved(true);
    setMessage('✅ Resultado final salvo e pontos calculados!');
  }

  async function clearResults() {
    if (!confirm('Limpar resultado do campeão/vice/3º?')) return;
    if (resultId) {
      await supabase.from('initial_results').delete().eq('id', resultId);
    }
    await supabase.from('initial_predictions').update({ points: null }).gt('id', 0);
    setChamp(''); setVice(''); setThird(''); setHasSaved(false); setResultId(null);
    setMessage('Resultado limpo e pontos zerados!');
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="section-title mb-0">🏆 Resultado Final da Copa</h3>
        {hasSaved && <button onClick={clearResults} className="btn-danger text-xs">🔄 Limpar Tudo</button>}
      </div>
      <p className="text-xs text-dark-500 mb-4">Preencha após a final para calcular pontos do palpite inicial</p>
      {message && <div className="mb-3 p-2 rounded-lg bg-primary-50 border border-primary-200 text-sm text-primary-800">{message}</div>}
      {hasSaved && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-300">
          <div className="text-sm font-bold text-green-800 mb-1">✅ Resultado registrado:</div>
          <div className="flex gap-4 text-sm flex-wrap">
            <span>🏆 {getFlag(champ)} {champ}</span>
            <span>🥈 {getFlag(vice)} {vice}</span>
            <span>🥉 {getFlag(third)} {third}</span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <FlagSelect label="🏆 Campeão" value={champ} onChange={setChamp} />
        <FlagSelect label="🥈 Vice" value={vice} onChange={setVice} />
        <FlagSelect label="🥉 3º Lugar" value={third} onChange={setThird} />
      </div>
      <button onClick={save} className="btn-primary max-w-xs">💾 Salvar e Calcular Pontos</button>
    </div>
  );
}

function StatusTab() {
  const [players, setPlayers] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [selectedPhase, setSelectedPhase] = useState('initial');
  const allPhases = [{ id: 'initial', label: 'Palpite Inicial' },{ id: 'group_class', label: 'Classif. Grupos' },...MATCH_PHASES];
  useEffect(() => { loadStatus(); }, [selectedPhase]);

  async function loadStatus() {
    const { data: users } = await supabase.from('users').select('id, name').eq('is_admin', false).order('name');
    if (!users) return;
    setPlayers(users); const subs = {};
    if (selectedPhase === 'initial') {
      const { data } = await supabase.from('initial_predictions').select('user_id');
      (data||[]).forEach(d => { subs[d.user_id] = true; });
    } else if (selectedPhase === 'group_class') {
      const { data } = await supabase.from('group_class_guesses').select('user_id');
      const counts = {}; (data||[]).forEach(d => { counts[d.user_id]=(counts[d.user_id]||0)+1; });
      Object.entries(counts).forEach(([uid,cnt]) => { subs[uid] = cnt>=12 ? true : `${cnt}/12`; });
    } else {
      const { data: matchIds } = await supabase.from('matches').select('id').eq('phase', selectedPhase);
      if (matchIds && matchIds.length > 0) {
        const ids = matchIds.map(m => m.id);
        const { data } = await supabase.from('match_guesses').select('user_id').in('match_id', ids);
        const counts = {}; (data||[]).forEach(d => { counts[d.user_id]=(counts[d.user_id]||0)+1; });
        const total = ids.length;
        Object.entries(counts).forEach(([uid,cnt]) => { subs[uid] = cnt>=total ? true : `${cnt}/${total}`; });
      }
    }
    setSubmissions(subs);
  }

  return (
    <div>
      <h3 className="section-title">📋 Quem já enviou palpites</h3>
      <div className="flex gap-1 flex-wrap mb-4">{allPhases.map(p=>(<button key={p.id} onClick={()=>setSelectedPhase(p.id)} className={`phase-btn ${selectedPhase===p.id?'phase-btn-active':'phase-btn-inactive'}`}>{p.label}</button>))}</div>
      <div className="flex flex-col gap-1.5">{players.map(p=>{const status=submissions[p.id];return(
        <div key={p.id} className={`flex items-center justify-between p-2.5 rounded-lg border ${status===true?'bg-green-50 border-green-300':status?'bg-yellow-50 border-yellow-300':'bg-dark-50 border-dark-200'}`}>
          <div className="flex items-center gap-2"><Avatar name={p.name} size={28}/><span className="font-sans font-bold text-sm text-dark-900">{p.name}</span></div>
          <span className={`text-xs font-bold ${status===true?'text-green-600':status?'text-yellow-600':'text-red-500'}`}>{status===true?'✅ Enviou':status?`⚠️ Parcial (${status})`:'❌ Não enviou'}</span>
        </div>);})}</div>
    </div>
  );
}

function PlayersTab() {
  const [players, setPlayers] = useState([]);
  const [newName, setNewName] = useState('');
  const [newLogin, setNewLogin] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => { loadPlayers(); }, []);
  async function loadPlayers() { const { data } = await supabase.from('users').select('*').eq('is_admin', false).order('name'); if (data) setPlayers(data); }
  async function addPlayer() {
    if (!newName.trim()||!newLogin.trim()) { setMessage('Preencha nome e login'); return; }
    const { error } = await supabase.from('users').insert({ name: newName.trim(), login: newLogin.toLowerCase().trim(), password_hash: 'meladores2026', is_admin: false, first_access: true });
    if (error) { setMessage(error.message.includes('duplicate') ? 'Login já existe!' : 'Erro: ' + error.message); return; }
    setNewName(''); setNewLogin(''); setMessage('✅ Cadastrado!'); loadPlayers();
  }
  async function resetPassword(id) { await supabase.from('users').update({ password_hash: 'meladores2026', first_access: true }).eq('id', id); setMessage('Senha resetada!'); loadPlayers(); }
  async function removePlayer(id) { if (!confirm('Remover participante?')) return; await supabase.from('users').delete().eq('id', id); setMessage('Removido!'); loadPlayers(); }

  return (
    <div>
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-4">
        <div className="font-sans font-bold text-sm text-dark-900 mb-2">➕ Adicionar Participante</div>
        <div className="flex gap-2 flex-wrap">
          <input placeholder="Nome/Apelido" value={newName} onChange={e=>setNewName(e.target.value)} className="input-field flex-1 min-w-[140px]"/>
          <input placeholder="Login" value={newLogin} onChange={e=>setNewLogin(e.target.value)} className="input-field flex-1 min-w-[100px]"/>
          <button onClick={addPlayer} className="bg-primary-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-primary-700">Cadastrar</button>
        </div>
        <p className="text-[10px] text-dark-500 mt-2">Senha padrão: meladores2026</p>
      </div>
      {message&&<div className="mb-3 p-2 rounded-lg bg-primary-50 border border-primary-200 text-sm text-primary-800">{message}</div>}
      <div className="flex flex-col gap-1.5">
        {players.length===0&&<div className="text-center py-6 text-dark-500 text-sm">Nenhum participante</div>}
        {players.map(p=>(
          <div key={p.id} className="flex items-center justify-between p-2.5 bg-dark-50 border border-dark-200 rounded-lg flex-wrap gap-2">
            <div className="flex items-center gap-2"><Avatar name={p.name} size={30}/><span className="font-bold text-xs text-dark-900">{p.name}</span><span className="text-[10px] text-dark-500">@{p.login}</span>
              {p.first_access&&<span className="bg-primary-100 text-primary-800 text-[9px] font-semibold px-1.5 py-0.5 rounded">Aguardando</span>}</div>
            <div className="flex gap-1.5">
              <button onClick={()=>resetPassword(p.id)} className="bg-white border border-dark-300 rounded px-2 py-1 text-[10px] text-primary-800 hover:bg-dark-100">🔑 Resetar</button>
              <button onClick={()=>removePlayer(p.id)} className="btn-danger">🗑️</button>
            </div>
          </div>))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState('results');
  return (
    <div className="max-w-[900px] mx-auto p-5">
      <div className="flex gap-1 mb-4 flex-wrap">{ADMIN_TABS.map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} className={`phase-btn text-sm ${tab===t.id?'phase-btn-active':'phase-btn-inactive'}`}>{t.label}</button>))}</div>
      <div className="card">
        {tab==='results'&&<ResultsTab/>}
        {tab==='groups'&&<GroupClassTab/>}
        {tab==='initial'&&<InitialResultsTab/>}
        {tab==='status'&&<StatusTab/>}
        {tab==='players'&&<PlayersTab/>}
      </div>
    </div>
  );
}
