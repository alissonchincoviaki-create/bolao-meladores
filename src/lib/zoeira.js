// ============================================
// BOLÃO DOS MELADORES - ZOEIRA AI ENGINE
// Generates personalized trash-talk messages via Claude API
// ============================================

// System prompt with context about the bolão
const SYSTEM_PROMPT = `Você é o narrador zoeiro do "Bolão dos Meladores", um bolão da Copa do Mundo 2026 entre amigos. 
Seu papel é gerar mensagens curtas de zoeira (1-2 frases, máximo 280 caracteres) sobre eventos do bolão.
Use humor brasileiro, gírias, emojis e provocações leves entre amigos.
Nunca seja ofensivo ou pesado demais - é zoeira de amigo.
Responda APENAS com a mensagem, sem explicações.`;

// Fallback messages when API is unavailable
const FALLBACK = {
  exact: [
    "🎯 {name} CRAVOU {score}! Tá usando bola de cristal?",
    "🧙 {name} acertou na mosca! Bruxo confirmado!",
    "🎯 {name} cravou o placar! Alguém revista esse cidadão!",
  ],
  zero: [
    "😭 {name} fez ZERO pontos. Tá palpitando de olho fechado?",
    "💀 {name} zerou. F no chat.",
    "🤡 {name} errou TUDO. Vergonha alheia total.",
  ],
  leader: [
    "👑 NOVO LÍDER! {name} assumiu o topo! Até quando?",
    "👑 {name} é o novo líder do bolão! Segura esse monstro!",
  ],
  lanterna: [
    "🏮 Nova lanterna: {name}. Bem-vindo ao porão!",
    "📉 {name} afundou pro último lugar. Boa sorte!",
  ],
  deadline_24h: [
    "⏰ Faltam 24h pra fechar os palpites da {phase}!",
  ],
  deadline_2h: [
    "🚨 ÚLTIMAS 2 HORAS! {names}, corre que vai fechar!",
  ],
  deadline_missed: [
    "😱 {name} ESQUECEU de palpitar. Parabéns pelo zero automático 👏",
  ],
  result: [
    "⚽ Resultado: {home} {flag_h} {score_h}×{score_a} {flag_a} {away}",
  ],
  brasil_exact: [
    "🇧🇷🔥 {name} cravou o placar do Brasil! {pts} PONTOS! Os outros que chorem!",
  ],
  group_perfect: [
    "🧙 {name} acertou o Grupo {group} INTEIRO! 40 pontos! Bruxaria pura!",
  ],
  group_zero: [
    "💩 {name} errou TUDO no Grupo {group}. Nem chutando acertava!",
  ],
  close_race: [
    "🔥 {name1} e {name2} separados por apenas {diff} pts! Tá pegando fogo!",
  ],
  initial_champion: [
    "🏆 {name} CRAVOU o campeão lá no dia 1! Vidente confirmado! +60 pts!",
  ],
  initial_all: [
    "🔮 {name} acertou campeão, vice E terceiro! Bruxo de carteirinha! +120 pts!",
  ],
  initial_miss: [
    "💀 {name} errou campeão, vice e terceiro. O palpite envelheceu como leite fora da geladeira.",
  ],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillTemplate(template, vars) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  return result;
}

// Generate message via Claude API
async function generateWithAI(prompt, playerProfiles = {}) {
  try {
    const profileContext = Object.entries(playerProfiles)
      .map(([name, bio]) => `${name}: ${bio}`)
      .join('\n');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        system: SYSTEM_PROMPT + (profileContext ? `\n\nPerfis dos participantes:\n${profileContext}` : ''),
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text;
    if (text) return text.trim();
  } catch (error) {
    console.error('AI zoeira error:', error);
  }
  return null;
}

// ============ PUBLIC API ============

// After a match result is entered
export async function generateMatchMessages(match, guesses, playerProfiles) {
  const messages = [];
  const { home_team, away_team, result_home, result_away, is_brasil } = match;

  // Result announcement
  messages.push({
    type: 'system',
    content: `⚽ Resultado: ${home_team} ${result_home}×${result_away} ${away_team}${is_brasil ? ' 🇧🇷' : ''}`,
  });

  // Check each player's guess
  for (const guess of guesses) {
    const exact = guess.guess_home === result_home && guess.guess_away === result_away;
    const pts = guess.points || 0;

    if (exact) {
      const prompt = `${guess.user_name} acertou o placar exato ${home_team} ${result_home}x${result_away} ${away_team}${is_brasil ? ' (jogo do Brasil, pontuação dobrada!)' : ''}. Ganhou ${pts} pontos. Faça uma zoeira parabenizando.`;
      const aiMsg = await generateWithAI(prompt, playerProfiles);
      messages.push({
        type: 'zoeira',
        content: aiMsg || fillTemplate(pickRandom(is_brasil ? FALLBACK.brasil_exact : FALLBACK.exact), {
          name: guess.user_name,
          score: `${result_home}×${result_away}`,
          pts: pts,
        }),
      });
    } else if (pts === 0) {
      // Only roast ~30% of the time to avoid spam
      if (Math.random() < 0.3) {
        const prompt = `${guess.user_name} fez 0 pontos em ${home_team} x ${away_team}. Palpitou ${guess.guess_home}x${guess.guess_away}. Resultado foi ${result_home}x${result_away}. Zoeira curta.`;
        const aiMsg = await generateWithAI(prompt, playerProfiles);
        messages.push({
          type: 'zoeira',
          content: aiMsg || fillTemplate(pickRandom(FALLBACK.zero), { name: guess.user_name }),
        });
      }
    }
  }

  return messages;
}

// After ranking update
export async function generateRankingMessages(ranking, prevRanking, playerProfiles) {
  const messages = [];

  if (!prevRanking || prevRanking.length === 0) return messages;

  const prevLeader = prevRanking[0]?.name;
  const newLeader = ranking[0]?.name;
  const lastPlace = ranking[ranking.length - 1]?.name;
  const prevLast = prevRanking[prevRanking.length - 1]?.name;

  // New leader
  if (newLeader && newLeader !== prevLeader) {
    const prompt = `${newLeader} acabou de assumir a liderança do bolão, ultrapassando ${prevLeader}. Zoeira anunciando o novo líder.`;
    const aiMsg = await generateWithAI(prompt, playerProfiles);
    messages.push({
      type: 'zoeira',
      content: aiMsg || fillTemplate(pickRandom(FALLBACK.leader), { name: newLeader }),
    });
  }

  // New last place
  if (lastPlace && lastPlace !== prevLast) {
    const prompt = `${lastPlace} caiu pro último lugar do bolão. Zoeira sobre a nova lanterna.`;
    const aiMsg = await generateWithAI(prompt, playerProfiles);
    messages.push({
      type: 'zoeira',
      content: aiMsg || fillTemplate(pickRandom(FALLBACK.lanterna), { name: lastPlace }),
    });
  }

  // Close race (top 2 within 10 pts)
  if (ranking.length >= 2) {
    const diff = ranking[0].total_points - ranking[1].total_points;
    if (diff <= 10 && diff > 0) {
      messages.push({
        type: 'zoeira',
        content: fillTemplate(pickRandom(FALLBACK.close_race), {
          name1: ranking[0].name,
          name2: ranking[1].name,
          diff: diff,
        }),
      });
    }
  }

  return messages;
}

// Deadline reminders
export function generateDeadlineMessage(phase, hoursLeft, missingPlayers = []) {
  if (hoursLeft <= 2 && missingPlayers.length > 0) {
    return {
      type: 'system',
      content: fillTemplate(pickRandom(FALLBACK.deadline_2h), {
        phase,
        names: missingPlayers.join(', '),
      }),
    };
  }
  if (hoursLeft <= 24) {
    return {
      type: 'system',
      content: fillTemplate(pickRandom(FALLBACK.deadline_24h), { phase }),
    };
  }
  return null;
}

// After group classification results
export async function generateGroupClassMessages(group, guesses, actual, playerProfiles) {
  const messages = [];

  for (const guess of guesses) {
    const pts = guess.points || 0;

    if (pts === 40) {
      const prompt = `${guess.user_name} acertou a classificação COMPLETA do Grupo ${group} (1º ao 4º)! 40 pontos! Faça uma zoeira elogiando.`;
      const aiMsg = await generateWithAI(prompt, playerProfiles);
      messages.push({
        type: 'zoeira',
        content: aiMsg || fillTemplate(pickRandom(FALLBACK.group_perfect), { name: guess.user_name, group }),
      });
    } else if (pts === 0) {
      const prompt = `${guess.user_name} não acertou NENHUMA posição no Grupo ${group}. Zoeira.`;
      const aiMsg = await generateWithAI(prompt, playerProfiles);
      messages.push({
        type: 'zoeira',
        content: aiMsg || fillTemplate(pickRandom(FALLBACK.group_zero), { name: guess.user_name, group }),
      });
    }
  }

  return messages;
}

// After final - initial predictions revealed
export async function generateInitialPredictionMessages(predictions, actual, playerProfiles) {
  const messages = [];

  for (const pred of predictions) {
    const pts = pred.points || 0;

    if (pts === 120) {
      const prompt = `${pred.user_name} acertou campeão (${actual.champion}), vice (${actual.vice}) e terceiro (${actual.thirdPlace}) no palpite inicial! 120 pontos! Bruxo total. Zoeira.`;
      const aiMsg = await generateWithAI(prompt, playerProfiles);
      messages.push({
        type: 'zoeira',
        content: aiMsg || fillTemplate(pickRandom(FALLBACK.initial_all), { name: pred.user_name }),
      });
    } else if (pred.champion === actual.champion) {
      messages.push({
        type: 'zoeira',
        content: fillTemplate(pickRandom(FALLBACK.initial_champion), { name: pred.user_name }),
      });
    } else if (pts === 0) {
      const prompt = `${pred.user_name} errou campeão, vice e terceiro no palpite inicial. Palpitou ${pred.champion}/${pred.vice}/${pred.third_place} e o resultado foi ${actual.champion}/${actual.vice}/${actual.thirdPlace}. Zoeira.`;
      const aiMsg = await generateWithAI(prompt, playerProfiles);
      messages.push({
        type: 'zoeira',
        content: aiMsg || fillTemplate(pickRandom(FALLBACK.initial_miss), { name: pred.user_name }),
      });
    }
  }

  return messages;
}
