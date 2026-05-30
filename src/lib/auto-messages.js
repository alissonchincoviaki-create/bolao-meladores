import { supabase } from './supabase';
import { PROFILES, findProfile } from './zoeira';

// ============ WELCOME MESSAGES (first access) ============
const WELCOME = {
  'Chinco': [
    "🍯 Chinco entrou no bolão! O admin chegou pra controlar tudo... menos os próprios palpites! 🥃",
    "🍯 Alerta: Chinco ativou o modo controlador! Será que controla os resultados tb? 🤔",
  ],
  'Coruja': [
    "🍯 Coruja pousou no bolão! Largou o treino pra treinar os palpites! 🦉",
    "🍯 O personal chegou! Coruja, bora ver se tu treina palpite tão bem quanto treina os outros! 💪",
  ],
  'Luke': [
    "🍯 Luke entrou! Sou da vila americana e agora sou do bolão também! 💪",
    "🍯 O solteirão chegou! Luke, aqui não adianta abraçar o resultado, tem que acertar! 🤗",
  ],
  'Gaúcho': [
    "🍯 Gaúcho entrou no bolão! O bagual largou o pacani e veio palpitar! 🧉",
    "🍯 O dentista chegou! Gaúcho, bora arrancar uns pontos! 🦷",
  ],
  'Tiuk': [
    "🍯 Tiuk entrou! O advogado vai defender os palpites dele até o fim! ⚖️",
    "🍯 O presidente saunístico chegou! Tiuk, sauna não vale ponto! 🧖",
  ],
  'Testi': [
    "🍯 Testi entrou! O triatleta chegou pra nadar, pedalar e... errar palpite! 🏊",
    "🍯 Alerta de dieta! Testi entrou no bolão! Dieta de pontos tb? 🥗",
  ],
  'Thi': [
    "🍯 Thi entrou! O engenheiro da madeira veio calcular uns placares! ☕",
    "🍯 Thi chegou direto da Panificadora Sabrina! Café na mão e palpite na outra! ☕",
  ],
  'Lampi': [
    "🍯 Lampi entrou! O barbeiro veio cortar as chances dos outros! ✂️",
    "🍯 O presidente chegou! Lampi, demora 1h pro corte mas o palpite é na hora! ✂️",
  ],
};

const WELCOME_GENERIC = [
  "🍯 {name} entrou no Bolão dos Meladores! Mais um pra passar vergonha! 😂",
  "🍯 {name} chegou! O bolão tá ficando perigoso! 🔥",
];

// ============ LOGIN MESSAGES ============
const LOGIN_MSGS = {
  'Chinco': [
    "👀 Chinco tá online! Será que veio mudar o palpite de novo? 🥃",
    "🔔 O admin tá de olho! Chinco logou!",
    "⚡ Chinco entrou. Beach tênis não salva palpite ruim, hein!",
  ],
  'Coruja': [
    "👀 Coruja logou! Veio do treino direto pro bolão!",
    "🔔 Coruja online! Largou o pagode e veio conferir o ranking!",
    "⚡ O personal tá aqui! Coruja entrou pra treinar os palpites!",
  ],
  'Luke': [
    "👀 Luke logou! Sou da vila americana e vim conferir meus pontos! 💪",
    "🔔 Luke online! Trouxe abraço e palpite duvidoso!",
    "⚡ O segurador chegou! Luke entrou pra segurar a posição!",
  ],
  'Gaúcho': [
    "👀 Gaúcho logou! O bagual veio conferir a classificação!",
    "🔔 Gaúcho online! Engenheiros do Hawaii tocando ao fundo! 🎸",
    "⚡ O dentista entrou! Gaúcho veio arrancar dente ou pontos?",
  ],
  'Tiuk': [
    "👀 Tiuk logou! O advogado veio analisar os resultados! ⚖️",
    "🔔 Tiuk online! Saiu da sauna direto pro bolão! 🧖",
    "⚡ O presidente saunístico entrou! Tiuk tá de olho!",
  ],
  'Testi': [
    "👀 Testi logou! Parou o treino pra ver o ranking!",
    "🔔 Testi online! Veio da natação direto pro bolão! 🏊",
    "⚡ O triatleta chegou! Testi vai conferir a dieta de pontos!",
  ],
  'Thi': [
    "👀 Thi logou! Café na mão e ranking na tela! ☕",
    "🔔 Thi online! Saiu da Sabrina e veio pro bolão!",
    "⚡ O maratonista chegou! Thi corre dos palpites ruins? 🏃",
  ],
  'Lampi': [
    "👀 Lampi logou! Pausou o corte pra ver o bolão! ✂️",
    "🔔 Lampi online! O zoeiro veio zoar ou ser zoado?",
    "⚡ O barbeiro chegou! Lampi veio aparar as arestas do ranking!",
  ],
};

const LOGIN_GENERIC = [
  "👀 {name} tá online!",
  "🔔 {name} logou no bolão!",
];

// ============ PRE-CUP MESSAGES ============
const PRE_CUP = [
  "🏆 A Copa do Mundo 2026 tá chegando! Quem vai ser o bruxo dos palpites? 🧙",
  "⚽ Faltam poucos dias! Já garantiram os palpites ou vão deixar pra última hora como sempre? 😅",
  "🔥 Bolão dos Meladores ativado! Preparem os palpites e os argumentos pra quando errarem tudo! 😂",
  "🍯 A era dos Meladores começou! Que vença o menos azarado! 🎲",
  "⚽ Copa 2026 vem aí! Lembrem: aqui não tem especialista, tem palpiteiro com sorte! 🍀",
  "🏆 Quem será o campeão do bolão? Spoiler: provavelmente não é quem tá mais confiante! 😂",
  "🔮 Hora de registrar os palpites iniciais! Campeão, vice e 3º lugar. Quem tem coragem de cravar o Brasil? 🇧🇷",
  "⚡ Lembrete: jogos do Brasil valem DOBRO! Então se errar, a vergonha também é dobrada! 🇧🇷😂",
  "📊 12 grupos, 48 seleções, 104 jogos. E vocês vão errar a maioria! Bora! 🎯",
  "🧙 Dica: palpite bom é que nem café do Thi - todo dia um diferente! ☕",
  "🏮 Alguém vai ser lanterna. A pergunta é: quem? As apostas estão abertas! 💀",
  "⚽ Já imaginou o Lampi liderando o bolão? Nem ele imagina! ✂️😂",
  "🥃 Chinco já preparou o cynar pra comemorar ou pra afogar as mágoas? 🤔",
  "🏃 Thi vai correr uma maratona a cada resultado ruim. Prepara o tênis! 👟",
  "🦉 Coruja, personal trainer de palpite existe? Perguntando pra um amigo! 💪",
  "⚖️ Tiuk, se o palpite der ruim, entra com recurso! O advogado do grupo precisa se virar! 😂",
  "🏊 Testi, triathlon é nadar, pedalar e correr. Bolão é chutar, errar e chorar! 😭",
  "🧉 Gaúcho, o bagual vai tocar baixo quando perder ou quando ganhar? 🎸",
  "🤗 Luke, abraço não dá ponto! Mas boa sorte, solteirão da vila americana! 💪",
];

// ============ FUNCTIONS ============

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function getProfileKey(name) {
  const p = findProfile(name);
  return p ? p.key : null;
}

// Send a message to the chat
async function sendSystemMessage(content, type = 'system') {
  try {
    await supabase.from('chat_messages').insert({
      user_id: null,
      message_type: type,
      content: content,
    });
  } catch (err) {
    console.error('Error sending system message:', err);
  }
}

// Called when user does first access
export async function sendWelcomeMessage(userName) {
  const key = getProfileKey(userName);
  let msg;
  if (key && WELCOME[key]) {
    msg = pickRandom(WELCOME[key]);
  } else {
    msg = pickRandom(WELCOME_GENERIC).replace('{name}', userName);
  }
  await sendSystemMessage(msg, 'zoeira');
}

// Called on login (not every time - check last login)
export async function sendLoginMessage(userName) {
  // Check if we already sent a login message in the last 2 hours
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data: recent } = await supabase
    .from('chat_messages')
    .select('id')
    .eq('message_type', 'zoeira')
    .ilike('content', `%${userName}%`)
    .gte('created_at', twoHoursAgo)
    .limit(1);

  if (recent && recent.length > 0) return; // Already sent recently

  const key = getProfileKey(userName);
  let msg;
  if (key && LOGIN_MSGS[key]) {
    msg = pickRandom(LOGIN_MSGS[key]);
  } else {
    msg = pickRandom(LOGIN_GENERIC).replace('{name}', userName);
  }
  await sendSystemMessage(msg, 'zoeira');
}

// Send random pre-cup messages
export async function sendPreCupMessage() {
  // Check if we already sent a pre-cup message today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data: recent } = await supabase
    .from('chat_messages')
    .select('id')
    .eq('message_type', 'system')
    .gte('created_at', today.toISOString())
    .limit(3);

  if (recent && recent.length >= 2) return; // Max 2 pre-cup messages per day

  const msg = pickRandom(PRE_CUP);
  await sendSystemMessage(msg, 'zoeira');
}

export { PRE_CUP };
