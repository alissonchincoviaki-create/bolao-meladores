import { supabase } from './supabase';

const DISCLAIMERS = {
  'group_r1': '⚠️ Texto gerado por inteligência artificial. Qualquer semelhança com a realidade é mera coincidência... ou não. O admin lava as mãos. 🍯',
  'group_r2': '🤖 Esse texto foi gerado por IA. O admin não escreveu, não revisou e não se responsabiliza. Reclamações? Fala com o robô. 🍯',
  'group_r3': '📢 Conteúdo gerado automaticamente por IA. O admin jura que não tem nada a ver com isso. A culpa é do algoritmo. 🍯',
  '32avos': '⚠️ Texto gerado por IA com base nos resultados. Se sentiu ofendido, reclame com o ChatBot. O admin é inocente. 🍯',
  'oitavas': '🤖 Nenhum melador foi consultado na produção deste texto. A IA escreve, o admin finge que não viu. 🍯',
  'quartas': '📢 Gerado por inteligência artificial. O admin não concorda, não discorda e principalmente não se responsabiliza. Segue o jogo. 🍯',
  'semi': '⚠️ Texto 100% artificial, 0% revisado. Se a zoeira passou do ponto, a culpa é da máquina. O admin nem viu o que saiu. 🍯',
  'final': '🏆 Este texto foi gerado por IA. Se você riu, a IA acertou. Se você chorou, a IA acertou também. O admin só apertou o botão. Até a próxima Copa, Meladores! 🍯',
};

const PHASE_LABELS = {
  'group_r1': '1ª Rodada', 'group_r2': '2ª Rodada', 'group_r3': '3ª Rodada',
  '32avos': '32-avos de Final', 'oitavas': 'Oitavas de Final', 'quartas': 'Quartas de Final',
  'semi': 'Semifinais', 'final': 'Final',
};

const PROFILES_TEXT = `PERFIS DOS PARTICIPANTES (use para trocadilhos, NÃO use cargo/profissão pra chamar a pessoa):
- Chinco (Alisson): admin do bolão, joga beach tênis e tênis, bebe cynar, casado com Samara, pai da Alice, torce pro Flamengo. Usar: cynar, beach tênis, controlador (trocadilho)
- Coruja (Lucas Vozinak): kicker de futebol americano, ama pagode e reggae, casado com Mônica, torce pro Atlético PR. Usar: kicker, field goal, pagode, reggae
- Luke (Lucas Ramos): pai da Nala (cachorra), ama correr, gosta de foto e abraçar todo mundo, bordão "sou da vila americana" (usar com moderação), torce pro Grêmio. Usar: abraço, Nala, corrida, foto. NÃO chamar de solteirão.
- Gaúcho (Felipe Schneider): casado com Mayla, pai do Caetano, pacanicultor, baixista da Quinta do Rock, ex-praticante de vários esportes, fã de Engenheiros do Hawaii, torce pro Internacional. Usar: pacani, baixo, Quinta do Rock, bagual, tchê
- Tiuk (Tiago Witiuk): casado com Lili, pai da Beatriz, pratica natação e corrida, presidente do grupo saunístico, ama sauna, torce pro Coritiba. Usar: sauna, presidente saunístico
- Thi (Thiago Freitas): casado com Ana, pai da Laura, maratonista, fotógrafo, viciado em café, sempre na Panificadora Sabrina, o mais tech do grupo, torce pro Coritiba. Usar: café, Sabrina, maratona, foto, engenheiro (trocadilho)
- Lampi (Thyago Silveira): casado com Jéssica, pai do Pedro, dono da Lampião Barbearia, presidente do Danone, zoeiro, leva 1 hora pra cortar cabelo, torce pro Corinthians. Usar: corte, Lampião, presidente, Danone, tesoura, 1 hora`;

const STYLE_GUIDE = `ESTILO DO TEXTO:
- Zoeiro com trocadilhos pessoais, mas que o participante se sinta abraçado e reconhecido
- Cada participante deve levar uma zoeira E um reconhecimento/carinho
- NÃO chamar participantes pelo cargo/profissão — usar essas infos apenas para trocadilhos
- Usar emojis nos nomes: Chinco 🥃, Coruja 🦉, Luke 💪, Gaúcho 🎸, Tiuk ⚖️, Thi ☕, Lampi ✂️
- Tom: narrador de reality show brasileiro, íntimo dos participantes
- O bolão vale uma camisa oficial da seleção para o vencedor, os demais pagam em vaquinha. Mencionar de forma natural.
- Incluir classificação completa no final com posição, nome, pontos e comentário curto
- Incluir destaques: quem mais pontuou, quem menos, acertos exatos, jogo do Brasil`;

const SYSTEM_PROMPT = `Você é o narrador oficial do Bolão dos Meladores, um bolão da Copa do Mundo 2026 entre 7 amigos. Gere textos de resumo de rodada no estilo storytelling zoeiro mas carinhoso. Responda APENAS com o texto do resumo, sem explicações.`;

export async function checkPhaseComplete(phase) {
  const { data: matches } = await supabase.from('matches').select('id, result_home').eq('phase', phase);
  if (!matches || matches.length === 0) return false;
  return matches.every(m => m.result_home !== null);
}

async function summaryAlreadySent(phase) {
  const marker = `RESUMO_${phase.toUpperCase()}`;
  const { data } = await supabase.from('chat_messages').select('id').eq('message_type', 'summary').ilike('content', `%${marker}%`).limit(1);
  return data && data.length > 0;
}

async function gatherPhaseData(phase) {
  const { data: users } = await supabase.from('users').select('id, name').eq('is_admin', false).order('name');
  if (!users) return null;
  const userMap = {};
  users.forEach(u => { userMap[u.id] = u.name; });

  const { data: matches } = await supabase.from('matches').select('*').eq('phase', phase).order('match_date').order('match_time');
  if (!matches) return null;

  const matchIds = matches.map(m => m.id);
  const { data: guesses } = await supabase.from('match_guesses').select('*').in('match_id', matchIds);

  const userStats = {};
  users.forEach(u => { userStats[u.name] = { phase_pts: 0, exacts: 0, zeros: 0 }; });
  (guesses || []).forEach(g => {
    const name = userMap[g.user_id];
    if (!name || !userStats[name]) return;
    userStats[name].phase_pts += (g.points || 0);
    if (g.is_exact) userStats[name].exacts++;
    if (g.points === 0) userStats[name].zeros++;
  });

  const ranking = [];
  for (const u of users) {
    const { data: mg } = await supabase.from('match_guesses').select('points, is_exact').eq('user_id', u.id).not('points', 'is', null);
    const { data: gc } = await supabase.from('group_class_guesses').select('points').eq('user_id', u.id).not('points', 'is', null);
    const matchPts = (mg || []).reduce((s, g) => s + (g.points || 0), 0);
    const groupPts = (gc || []).reduce((s, g) => s + (g.points || 0), 0);
    const exacts = (mg || []).filter(g => g.is_exact).length;
    ranking.push({ name: u.name, total: matchPts + groupPts, exacts, phase_pts: userStats[u.name]?.phase_pts || 0 });
  }
  ranking.sort((a, b) => b.total - a.total || b.exacts - a.exacts);

  const brasilMatches = matches.filter(m => m.is_brasil);
  const matchResults = matches.map(m => `${m.home_team} ${m.result_home}x${m.result_away} ${m.away_team}${m.is_brasil ? ' 🇧🇷' : ''}`);

  return { phase, phaseLabel: PHASE_LABELS[phase], matchResults, brasilResults: brasilMatches.map(m => `${m.home_team} ${m.result_home}x${m.result_away} ${m.away_team}`), ranking, userStats, totalMatches: matches.length };
}

export async function generatePhaseSummary(phase) {
  const alreadySent = await summaryAlreadySent(phase);
  if (alreadySent) return null;

  const complete = await checkPhaseComplete(phase);
  if (!complete) return null;

  const data = await gatherPhaseData(phase);
  if (!data) return null;

  const disclaimer = DISCLAIMERS[phase] || DISCLAIMERS['group_r1'];
  const isFinal = phase === 'final';

  const rankingText = data.ranking.map((r, i) =>
    `${i + 1}º ${r.name} — ${r.total} pts total (${r.phase_pts} pts nesta rodada, ${r.exacts} exatos)`
  ).join('\n');

  const sortedByPhase = [...data.ranking].sort((a, b) => b.phase_pts - a.phase_pts);
  const best = sortedByPhase[0];
  const worst = sortedByPhase[sortedByPhase.length - 1];

  let prompt;
  if (isFinal) {
    prompt = `Gere o TEXTO FINAL do Bolão dos Meladores — Copa do Mundo 2026.\n\nA Copa acabou! Storytelling completo.\n\n${PROFILES_TEXT}\n\n${STYLE_GUIDE}\n\nRanking final:\n${rankingText}\n\nResultados da final: ${data.matchResults.join(', ')}\n\nCAMPEÃO DO BOLÃO: ${data.ranking[0].name} com ${data.ranking[0].total} pontos — vai escolher a camisa!\nLANTERNA: ${data.ranking[data.ranking.length - 1].name}\n\nDestaque: ${best.name} com ${best.phase_pts} pts\nPior: ${worst.name} com ${worst.phase_pts} pts\n\nTexto épico de encerramento. Zoe cada um, reconheça cada um, coroe o campeão.\n\nNo final adicione: "${disclaimer}"\nE antes dela: <!-- RESUMO_FINAL -->`;
  } else {
    prompt = `Gere o resumo da ${data.phaseLabel} do Bolão dos Meladores.\n\n${PROFILES_TEXT}\n\n${STYLE_GUIDE}\n\nFase: ${data.phaseLabel} (${data.totalMatches} jogos)\n\nResultados:\n${data.matchResults.join('\n')}\n\n${data.brasilResults.length > 0 ? 'Jogos do Brasil (dobra): ' + data.brasilResults.join(', ') : 'Sem jogos do Brasil.'}\n\nClassificação após rodada:\n${rankingText}\n\nDestaque: ${best.name} com ${best.phase_pts} pts\nPior: ${worst.name} com ${worst.phase_pts} pts\n\nStoryTelling: como começou, o que aconteceu, quem subiu, quem caiu. Zoeira + carinho.\n\nNo final adicione: "${disclaimer}"\nE antes dela: <!-- RESUMO_${phase.toUpperCase()} -->`;
  }

  try {
    // Call local API route (avoids CORS)
    const response = await fetch('/api/generate-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, system: SYSTEM_PROMPT }),
    });

    const result = await response.json();

    if (result.text) {
      await supabase.from('chat_messages').insert({
        user_id: null,
        message_type: 'summary',
        content: result.text,
      });
      return result.text;
    }
  } catch (err) {
    console.error('Error generating summary:', err);
  }

  return null;
}
