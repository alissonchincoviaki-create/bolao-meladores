// ============================================
// BOLÃO DOS MELADORES - ZOEIRA AI ENGINE
// Personalized trash-talk via Claude API + fallback
// ============================================

const PROFILES = {
  'Chinco': { real: 'Alisson Chincoviaki', time: 'Flamengo', traits: 'controlador da PX, jogador de beach tênis e tênis, marido da Samara, pai da Alice, bebe cynar', zoeiras: ['controlador que não controla nem os palpites', 'beach tênis não salva palpite ruim', 'até o cynar prevê melhor que ele', 'admin do bolão mas lanterna do ranking'] },
  'Coruja': { real: 'Lucas Vozinak', time: 'Atlético PR', traits: 'professor de corrida e personal trainer, casado com Mônica, joga futebol americano, ama pagode e reggae', zoeiras: ['corre muito mas dos palpites certos foge', 'personal trainer que não treina o palpite', 'mais perdido que bola de futebol americano', 'vai pôr um pagode pra chorar a derrota'] },
  'Luke': { real: 'Lucas Ramos', time: 'Grêmio', traits: 'solteirão, pai da Nala, dono de seguradora, corredor, gosta de foto e abraçar, da vila americana', zoeiras: ['sou da vila americana mas o palpite é de vila qualquer', 'segura esse resultado que nem seguro cobre', 'vai abraçar quem? tá em último', 'corre igual corre dos palpites certos - pra longe'] },
  'Gaúcho': { real: 'Felipe Schneider', time: 'Internacional', traits: 'dentista, pacanicultor, baixista da quinta do rock, casado com Mayla, pai do Caetano, ex-praticante de tudo, fã de Engenheiros do Hawaii', zoeiras: ['arranca dente mas não arranca um acerto', 'ex-praticante de esporte, ex-praticante de palpite bom', 'até pacani dá mais sorte que esse palpite', 'vai tocar baixo que de bolão não entende'] },
  'Tiuk': { real: 'Tiago Witiuk', time: 'Coritiba', traits: 'advogado, pratica natação e corrida, presidente do grupo saunístico, casado com Lili, pai da Beatriz', zoeiras: ['advogado que não defende nem o próprio palpite', 'vai pra sauna suar esse resultado vergonhoso', 'presidente do grupo saunístico e lanterna do bolão', 'entra com recurso contra esse placar'] },
  'Testi': { real: 'Tiago Testi', time: 'Corinthians', traits: 'personal trainer, professor de natação, triatleta, sempre na dieta, fã de NFL, uma vez adotou um gato bêbado, casado com Maísa', zoeiras: ['triatleta mas não consegue acertar nem 1 placar', 'na dieta de pontos também aparentemente', 'vai adotar outro gato pra esquecer essa rodada', 'treina todo dia mas o palpite tá sedentário'] },
  'Thi': { real: 'Thiago Freitas', time: 'Coritiba', traits: 'engenheiro da madeira, maratonista, fotógrafo, viciado em café, sempre na Panificadora Sabrina, casado com Ana, pai da Laura, o mais tech do grupo', zoeiras: ['engenheiro que não calcula nem placar', 'corre maratona mas foge dos acertos', 'tira foto desse zero no palpite', 'mais um café na Sabrina pra engolir esse resultado'] },
  'Lampi': { real: 'Thyago Silveira', time: 'Corinthians', traits: 'barbeiro, pai do Pedro, casado com Jéssica, presidente de times, zoeiro, leva 1 hora pra cortar cabelo', zoeiras: ['leva 1 hora pra cortar cabelo e 1 segundo pra errar palpite', 'presidente de time mas rebaixado no bolão', 'barbeiro que não acerta nem o corte do placar', 'zoeiro mas a piada é o palpite dele'] },
};

// Find profile by name (partial match)
function findProfile(name) {
  if (!name) return null;
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(PROFILES)) {
    if (lower.includes(key.toLowerCase()) || lower.includes(val.real.toLowerCase().split(' ')[0].toLowerCase())) return { key, ...val };
  }
  return null;
}

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function fillTemplate(t, v) { let r = t; for (const [k, val] of Object.entries(v)) r = r.replace(new RegExp(`{${k}}`, 'g'), val); return r; }

// System prompt for Claude API
const SYSTEM_PROMPT = `Você é o narrador zoeiro do "Bolão dos Meladores", um bolão da Copa do Mundo 2026 entre 8 amigos.
Gere mensagens curtas (1-2 frases, máx 280 chars) com zoeira brasileira, gírias, emojis e provocações leves.
Nunca seja ofensivo - é zoeira de amigo.

PERFIS DOS PARTICIPANTES:
- Chinco (Alisson): admin do bolão, controlador, joga beach tênis, bebe cynar, Flamengo
- Coruja (Lucas V): personal trainer, futebol americano, pagode/reggae, Atlético PR
- Luke (Lucas R): solteirão, seguradora, corredor, "sou da vila americana", abraçador, Grêmio
- Gaúcho (Felipe): dentista, pacanicultor, baixista, ex-tudo, Engenheiros do Hawaii, Internacional
- Tiuk (Tiago W): advogado, saunista presidente, natação, Coritiba
- Testi (Tiago T): triatleta, dieta eterna, NFL, adotou gato bêbado, Corinthians
- Thi (Thiago F): engenheiro madeira, maratonista, café na Sabrina, tech, Coritiba
- Lampi (Thyago S): barbeiro, 1h por corte, presidente de times, zoeiro, Corinthians

Use os perfis pra personalizar a zoeira. Responda APENAS com a mensagem.`;

async function generateWithAI(prompt) {
  try {
    const apiKey = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
    if (!apiKey && typeof window !== 'undefined') {
      // Client-side: call via API route or skip
      return null;
    }
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '', 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 150, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: prompt }] }),
    });
    const data = await response.json();
    return data.content?.[0]?.text?.trim() || null;
  } catch { return null; }
}

// ============ FALLBACK MESSAGES ============
const FALLBACK = {
  exact: [
    "🎯 {name} CRAVOU {score}! Tá usando bola de cristal?",
    "🎯 {name} acertou na mosca! Bruxo confirmado! 🧙",
    "🎯 {name} cravou {score}! Alguém revista esse cidadão!",
  ],
  exact_personal(name) {
    const p = findProfile(name);
    if (!p) return null;
    const msgs = {
      'Chinco': ["🎯 Chinco cravou! Até o cynar tá aplaudindo! 🥃", "🎯 O controlador acertou o placar! Tá controlando até a bola!"],
      'Coruja': ["🎯 Coruja cravou! Largou o pagode e virou vidente! 🔮", "🎯 Personal trainer dos palpites! Coruja acertou!"],
      'Luke': ["🎯 Luke cravou! Sou da vila americana e do palpite certo! 💪", "🎯 Segura esse acerto que nem seguro cobre! Luke mandou bem!"],
      'Gaúcho': ["🎯 Gaúcho arrancou o dente e cravou o placar! 🦷", "🎯 Bagual acertou! Até os Engenheiros do Hawaii aplaudiram!"],
      'Tiuk': ["🎯 Tiuk cravou! Sentença: palpite perfeito! ⚖️", "🎯 O advogado ganhou a causa! Tiuk acertou em cheio!"],
      'Testi': ["🎯 Testi cravou! A dieta de pontos tá funcionando! 🏊", "🎯 Triatleta dos palpites! Testi nadou, pedalou e acertou!"],
      'Thi': ["🎯 Thi cravou! Mais um café na Sabrina pra comemorar! ☕", "🎯 O engenheiro calculou certinho! Thi acertou!"],
      'Lampi': ["🎯 Lampi cravou! Cortou o placar com precisão de barbeiro! ✂️", "🎯 O presidente acertou! Lampi tá demais!"],
    };
    return pickRandom(msgs[p.key] || []);
  },
  zero_personal(name) {
    const p = findProfile(name);
    if (!p) return null;
    const msgs = {
      'Chinco': ["😭 Chinco zerou! Controlador que não controla nem palpite!", "💀 Chinco fez ZERO! Vai beber um cynar pra esquecer 🥃"],
      'Coruja': ["😭 Coruja zerou! Corre que o palpite tá te perseguindo!", "💀 Coruja fez ZERO! Põe um pagode aí pra chorar"],
      'Luke': ["😭 Luke zerou! Sou da vila americana mas o palpite é de outra vila!", "💀 Luke fez ZERO! Abraça esse resultado aí 🤗"],
      'Gaúcho': ["😭 Gaúcho zerou! Vai tocar baixo que de bolão não entende! 🎸", "💀 Gaúcho fez ZERO! Até pacani acerta mais!"],
      'Tiuk': ["😭 Tiuk zerou! Vai pra sauna suar essa vergonha! 🧖", "💀 Tiuk fez ZERO! Entra com recurso contra esse placar! ⚖️"],
      'Testi': ["😭 Testi zerou! Na dieta de pontos tb aparentemente! 🥗", "💀 Testi fez ZERO! Vai adotar outro gato pra esquecer 🐱"],
      'Thi': ["😭 Thi zerou! Engenheiro que não calcula nem placar!", "💀 Thi fez ZERO! Mais um café na Sabrina pra engolir isso ☕"],
      'Lampi': ["😭 Lampi zerou! Leva 1h pra cortar cabelo e 1s pra errar! ✂️", "💀 Lampi fez ZERO! Presidente rebaixado!"],
    };
    return pickRandom(msgs[p.key] || []);
  },
  leader: [
    "👑 NOVO LÍDER! {name} assumiu o topo! Até quando?",
    "👑 {name} é o novo líder! Segura esse monstro!",
  ],
  leader_personal(name) {
    const p = findProfile(name);
    if (!p) return null;
    const msgs = {
      'Chinco': ["👑 Chinco no topo! O admin também lidera o ranking! Suspeito... 🤔"],
      'Coruja': ["👑 Coruja assumiu a liderança! Esse personal tá treinando pesado!"],
      'Luke': ["👑 Luke líder! O cara da vila americana assumiu o comando! 💪"],
      'Gaúcho': ["👑 Gaúcho no topo! O bagual tá impossível! Tchê! 🧉"],
      'Tiuk': ["👑 Tiuk líder! O advogado ganhou a causa mais importante! ⚖️"],
      'Testi': ["👑 Testi líder! A dieta tá dando resultado nos palpites! 🏆"],
      'Thi': ["👑 Thi líder! O engenheiro calculou tudo certinho! ☕"],
      'Lampi': ["👑 Lampi líder! O presidente virou presidente do bolão também! ✂️"],
    };
    return pickRandom(msgs[p.key] || []);
  },
  lanterna: [
    "🏮 Nova lanterna: {name}. Bem-vindo ao porão!",
    "📉 {name} afundou pro último lugar. F no chat 💀",
  ],
  lanterna_personal(name) {
    const p = findProfile(name);
    if (!p) return null;
    const msgs = {
      'Chinco': ["🏮 Chinco é lanterna! O admin tá no porão do próprio bolão! 😂"],
      'Coruja': ["🏮 Coruja é lanterna! Corre que o último lugar tá te perseguindo!"],
      'Luke': ["🏮 Luke é lanterna! Nem abraço salva esse ranking! 🤗"],
      'Gaúcho': ["🏮 Gaúcho é lanterna! Ex-praticante de palpite bom também! 🎸"],
      'Tiuk': ["🏮 Tiuk é lanterna! Presidente do grupo saunístico e do porão do bolão! 🧖"],
      'Testi': ["🏮 Testi é lanterna! Treina triathlon mas o palpite tá sedentário! 🏊"],
      'Thi': ["🏮 Thi é lanterna! Vai correr uma maratona pra esquecer! 🏃"],
      'Lampi': ["🏮 Lampi é lanterna! O zoeiro virou a piada! ✂️"],
    };
    return pickRandom(msgs[p.key] || []);
  },
  deadline_24h: ["⏰ Faltam 24h pra fechar os palpites da {phase}! Quem não enviou vai chorar depois!"],
  deadline_2h: ["🚨 ÚLTIMAS 2 HORAS! {names}, corre que vai fechar!"],
  deadline_missed: ["😱 {name} ESQUECEU de palpitar! Parabéns pelo zero automático 👏"],
  result: ["⚽ Resultado: {home} {score_h}×{score_a} {away}"],
  brasil_exact: ["🇧🇷🔥 {name} cravou o placar do Brasil! {pts} PONTOS! Os outros que chorem!"],
  close_race: ["🔥 {name1} e {name2} separados por apenas {diff} pts! Tá pegando fogo!"],
  group_perfect: ["🧙 {name} acertou o Grupo {group} INTEIRO! 40 pontos! Bruxaria pura!"],
  initial_all: ["🔮 {name} acertou campeão, vice E terceiro! Bruxo de carteirinha! +120 pts!"],
  initial_miss: ["💀 {name} errou campeão, vice e terceiro. Envelheceu como leite fora da geladeira!"],
};

// ============ PUBLIC API ============

export async function generateMatchMessages(match, guessesWithUsers) {
  const messages = [];
  const { home_team, away_team, result_home, result_away, is_brasil } = match;

  messages.push({ type: 'system', content: `⚽ Resultado: ${home_team} ${result_home}×${result_away} ${away_team}${is_brasil ? ' 🇧🇷' : ''}` });

  for (const g of guessesWithUsers) {
    const name = g.user_name || g.users?.name || '';
    const exact = g.guess_home === result_home && g.guess_away === result_away;
    const pts = g.points || 0;

    if (exact) {
      // Try personalized first, then AI, then generic
      let msg = FALLBACK.exact_personal(name);
      if (!msg) {
        const aiMsg = await generateWithAI(`${name} acertou o placar exato ${home_team} ${result_home}x${result_away} ${away_team}. ${pts} pontos. Zoeira personalizada.`);
        msg = aiMsg || fillTemplate(pickRandom(FALLBACK.exact), { name, score: `${result_home}×${result_away}` });
      }
      messages.push({ type: 'zoeira', content: msg });
    } else if (pts === 0 && Math.random() < 0.35) {
      let msg = FALLBACK.zero_personal(name);
      if (!msg) msg = `😭 ${name} fez ZERO pontos. Tá palpitando de olho fechado?`;
      messages.push({ type: 'zoeira', content: msg });
    }
  }
  return messages;
}

export async function generateRankingMessages(ranking, prevRanking) {
  const messages = [];
  if (!prevRanking || prevRanking.length === 0) return messages;

  const prevLeader = prevRanking[0]?.name;
  const newLeader = ranking[0]?.name;
  const lastPlace = ranking[ranking.length - 1]?.name;
  const prevLast = prevRanking[prevRanking.length - 1]?.name;

  if (newLeader && newLeader !== prevLeader) {
    let msg = FALLBACK.leader_personal(newLeader);
    if (!msg) msg = fillTemplate(pickRandom(FALLBACK.leader), { name: newLeader });
    messages.push({ type: 'zoeira', content: msg });
  }

  if (lastPlace && lastPlace !== prevLast) {
    let msg = FALLBACK.lanterna_personal(lastPlace);
    if (!msg) msg = fillTemplate(pickRandom(FALLBACK.lanterna), { name: lastPlace });
    messages.push({ type: 'zoeira', content: msg });
  }

  if (ranking.length >= 2) {
    const diff = ranking[0].total_points - ranking[1].total_points;
    if (diff <= 10 && diff > 0) {
      messages.push({ type: 'zoeira', content: fillTemplate(pickRandom(FALLBACK.close_race), { name1: ranking[0].name, name2: ranking[1].name, diff }) });
    }
  }
  return messages;
}

export function generateDeadlineMessage(phase, hoursLeft, missingPlayers = []) {
  if (hoursLeft <= 2 && missingPlayers.length > 0) {
    return { type: 'system', content: fillTemplate(pickRandom(FALLBACK.deadline_2h), { phase, names: missingPlayers.join(', ') }) };
  }
  if (hoursLeft <= 24) {
    return { type: 'system', content: fillTemplate(pickRandom(FALLBACK.deadline_24h), { phase }) };
  }
  return null;
}

export { PROFILES, findProfile };
