import { supabase } from './supabase';

// ============ DISCLAIMERS BY PHASE ============
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
  'group_r1': '1ª Rodada',
  'group_r2': '2ª Rodada',
  'group_r3': '3ª Rodada',
  '32avos': '32-avos de Final',
  'oitavas': 'Oitavas de Final',
  'quartas': 'Quartas de Final',
  'semi': 'Semifinais',
  'final': 'Final',
};

// ============ PROFILES ============
const PROFILES_TEXT = `PERFIS DOS PARTICIPANTES (use para trocadilhos, NÃO use cargo/profissão pra chamar a pessoa):
- Chinco (Alisson): admin do bolão, joga beach tênis e tênis, bebe cynar, casado com Samara, pai da Alice, torce pro Flamengo. Usar: cynar, beach tênis, controlador (trocadilho)
- Coruja (Lucas Vozinak): kicker de futebol americano, ama pagode e reggae, casado com Mônica, torce pro Atlético PR. Usar: kicker, field goal, pagode, reggae
- Luke (Lucas Ramos): pai da Nala (cachorra), ama correr, gosta de foto e abraçar todo mundo, bordão "sou da vila americana" (usar com moderação), torce pro Grêmio. Usar: abraço, Nala, corrida, foto. NÃO chamar de solteirão.
- Gaúcho (Felipe Schneider): casado com Mayla, pai do Caetano, pacanicultor, baixista da Quinta do Rock, ex-praticante de vários esportes, fã de Engenheiros do Hawaii, torce pro Internacional. Usar: pacani, baixo, Quinta do Rock, bagual, tchê
- Tiuk (Tiago Witiuk): casado com Lili, pai da Beatriz, pratica natação e corrida, presidente do grupo saunístico, ama sauna, torce pro Coritiba. Usar: sauna, presidente saunístico
- Thi (Thiago Freitas): casado com Ana, pai da Laura, maratonista, fotógrafo, viciado em café, sempre na Panificadora Sabrina, o mais tech do grupo, torce pro Coritiba. Usar: café, Sabrina, maratona, foto, engenheiro (trocadilho)
- Lampi (Thyago Silveira): casado com Jéssica, pai do Pedro, dono da Lampião Barbearia, presidente do Danone, zoeiro, leva 1 hora pra cortar cabelo, torce pro Corinthians. Usar: corte, Lampião, presidente, Danone, tesoura, 1 hora`;

const STYLE_GUIDE = `ESTILO DO TEXTO:
- Zoeiro com trocadilhos pessoais, mas que o participante se sinta abraçado
- Cada participante deve levar uma zoeira E um reconhecimento/carinho
- NÃO chamar participantes pelo cargo/profissão (advogado, personal, dentista, etc) — usar essas infos apenas para trocadilhos
- Usar emojis nos nomes: Chinco 🥃, Coruja 🦉, Luke 💪, Gaúcho 🎸, Tiuk ⚖️, Thi ☕, Lampi ✂️
- Tom: como um narrador de reality show brasileiro, íntimo dos participantes
- IMPORTANTE: O bolão vale uma camisa oficial da seleção para o vencedor, os demais pagam em vaquinha. Mencionar isso de forma natural conforme a fase avança (leve no início, mais presente no final)
- Incluir classificação completa no final com posição, nome, pontos e comentário curto
- Incluir destaques: quem mais pontuou, quem menos, acertos exatos, jogo do Brasil`;

// ============ CHECK IF PHASE IS COMPLETE ============
export async function checkPhaseComplete(phase) {
  const { data: matches } = await supabase
    .from('matches')
    .select('id, result_home')
    .eq('phase', phase);

  if (!matches || matches.length === 0) return false;

  const allHaveResults = matches.every(m => m.result_home !== null);
  return allHaveResults;
}

// ============ CHECK IF SUMMARY ALREADY SENT ============
async function summaryAlreadySent(phase) {
  const marker = `RESUMO_${phase.toUpperCase()}`;
  const { data } = await supabase
    .from('chat_messages')
    .select('id')
    .eq('message_type', 'summary')
    .ilike('content', `%${marker}%`)
    .limit(1);

  return data && data.length > 0;
}

// ============ GATHER PHASE DATA ============
async function gatherPhaseData(phase) {
  // Get all users
  const { data: users } = await supabase
    .from('users')
    .select('id, name')
    .eq('is_admin', false)
    .order('name');

  if (!users) return null;

  const userMap = {};
  users.forEach(u => { userMap[u.id] = u.name; });

  // Get matches of this phase
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .eq('phase', phase)
    .order('match_date')
    .order('match_time');

  if (!matches) return null;

  const matchIds = matches.map(m => m.id);

  // Get all guesses for these matches
  const { data: guesses } = await supabase
    .from('match_guesses')
    .select('*')
    .in('match_id', matchIds);

  // Calculate per-user stats for this phase
  const userStats = {};
  users.forEach(u => {
    userStats[u.name] = { phase_pts: 0, exacts: 0, zeros: 0, total_guesses: 0 };
  });

  (guesses || []).forEach(g => {
    const name = userMap[g.user_id];
    if (!name || !userStats[name]) return;
    userStats[name].phase_pts += (g.points || 0);
    userStats[name].total_guesses++;
    if (g.is_exact) userStats[name].exacts++;
    if (g.points === 0) userStats[name].zeros++;
  });

  // Get overall ranking
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

  // Brasil matches
  const brasilMatches = matches.filter(m => m.is_brasil);
  const brasilResults = brasilMatches.map(m => ({
    match: `${m.home_team} ${m.result_home}x${m.result_away} ${m.away_team}`,
  }));

  // Format match results
  const matchResults = matches.map(m => `${m.home_team} ${m.result_home}x${m.result_away} ${m.away_team}${m.is_brasil ? ' 🇧🇷' : ''}`);

  return {
    phase,
    phaseLabel: PHASE_LABELS[phase],
    matchResults,
    brasilResults,
    ranking,
    userStats,
    totalMatches: matches.length,
  };
}

// ============ GENERATE SUMMARY VIA CLAUDE API ============
export async function generatePhaseSummary(phase) {
  // Check if already sent
  const alreadySent = await summaryAlreadySent(phase);
  if (alreadySent) return null;

  // Check if phase is complete
  const complete = await checkPhaseComplete(phase);
  if (!complete) return null;

  // Gather data
  const data = await gatherPhaseData(phase);
  if (!data) return null;

  const disclaimer = DISCLAIMERS[phase] || DISCLAIMERS['group_r1'];
  const isFinal = phase === 'final';

  // Build ranking text
  const rankingText = data.ranking.map((r, i) =>
    `${i + 1}º ${r.name} — ${r.total} pts total (${r.phase_pts} pts nesta rodada, ${r.exacts} exatos)`
  ).join('\n');

  // Build stats
  const sortedByPhase = [...data.ranking].sort((a, b) => b.phase_pts - a.phase_pts);
  const best = sortedByPhase[0];
  const worst = sortedByPhase[sortedByPhase.length - 1];

  let prompt;
  if (isFinal) {
    prompt = `Gere o TEXTO FINAL do Bolão dos Meladores — Copa do Mundo 2026.

A Copa acabou! Gere um storytelling completo da trajetória de todos os participantes ao longo de toda a Copa.

${PROFILES_TEXT}

${STYLE_GUIDE}

DADOS FINAIS:
Ranking final:
${rankingText}

Resultados da final: ${data.matchResults.join(', ')}

O CAMPEÃO DO BOLÃO é ${data.ranking[0].name} com ${data.ranking[0].total} pontos e vai escolher sua camisa oficial! Os outros 6 vão pagar na vaquinha.
O LANTERNA é ${data.ranking[data.ranking.length - 1].name} com ${data.ranking[data.ranking.length - 1].total} pontos.

Destaque da rodada: ${best.name} com ${best.phase_pts} pts
Pior da rodada: ${worst.name} com ${worst.phase_pts} pts

Faça um texto épico de encerramento, contando a história da Copa dos Meladores do início ao fim, zoando cada um, reconhecendo cada um, coroando o campeão e consolando (com zoeira) o lanterna. Mencione a camisa e a vaquinha.

No final do texto, adicione esta frase exata: "${disclaimer}"
E antes dela, adicione uma tag oculta: <!-- RESUMO_FINAL -->`;
  } else {
    prompt = `Gere o resumo da ${data.phaseLabel} do Bolão dos Meladores — Copa do Mundo 2026.

${PROFILES_TEXT}

${STYLE_GUIDE}

DADOS DA RODADA:
Fase: ${data.phaseLabel} (${data.totalMatches} jogos)

Resultados dos jogos:
${data.matchResults.join('\n')}

${data.brasilResults.length > 0 ? 'Jogos do Brasil (pontuação dobrada): ' + data.brasilResults.map(b => b.match).join(', ') : 'Sem jogos do Brasil nesta rodada.'}

Classificação após esta rodada:
${rankingText}

Destaque da rodada: ${best.name} com ${best.phase_pts} pts
Pior da rodada: ${worst.name} com ${worst.phase_pts} pts

Gere o texto como storytelling: como começou a rodada, o que aconteceu, quem subiu, quem caiu, zoeira personalizada pra cada participante com carinho. Inclua a classificação formatada no final.

No final do texto, adicione esta frase exata: "${disclaimer}"
E antes dela, adicione uma tag oculta: <!-- RESUMO_${phase.toUpperCase()} -->`;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: `Você é o narrador oficial do Bolão dos Meladores, um bolão da Copa do Mundo 2026 entre 7 amigos. Gere textos de resumo de rodada no estilo storytelling zoeiro mas carinhoso. Responda APENAS com o texto do resumo, sem explicações.`,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const result = await response.json();
    const text = result.content?.[0]?.text?.trim();

    if (text) {
      // Save to chat
      await supabase.from('chat_messages').insert({
        user_id: null,
        message_type: 'summary',
        content: text,
      });
      return text;
    }
  } catch (err) {
    console.error('Error generating summary:', err);
  }

  return null;
}
