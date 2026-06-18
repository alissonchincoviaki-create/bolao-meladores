// ============================================
// BOLÃO DOS MELADORES - SCORING ENGINE
// All point calculation logic
// ============================================

// ---- MATCH POINTS ----
// Returns { points, isExact }
export function calculateMatchPoints(guessHome, guessAway, resultHome, resultAway, isBrasil = false) {
  const gWinner = guessHome > guessAway ? 'H' : guessHome < guessAway ? 'A' : 'D';
  const rWinner = resultHome > resultAway ? 'H' : resultHome < resultAway ? 'A' : 'D';
  const matchedHome = guessHome === resultHome;
  const matchedAway = guessAway === resultAway;

  let points = 0;
  let isExact = false;

  if (rWinner === 'D') {
    // Draw
    if (matchedHome && matchedAway) { points = 10; isExact = true; }
    else if (gWinner === 'D') { points = 7; }
    else if (matchedHome || matchedAway) { points = 2; }
  } else {
    // There's a winner
    if (matchedHome && matchedAway) { points = 10; isExact = true; }
    else if (gWinner === rWinner && (matchedHome || matchedAway)) { points = 7; }
    else if (gWinner === rWinner) { points = 5; }
    else if (matchedHome || matchedAway) { points = 2; }
  }

  if (isBrasil) points *= 2;

  return { points, isExact };
}

// ---- GROUP CLASSIFICATION POINTS ----
// 10 pts per correct position (max 40 per group)
export function calculateGroupClassPoints(guess, actual) {
  // guess = { pos1, pos2, pos3, pos4 }
  // actual = { pos1, pos2, pos3, pos4 }
  let points = 0;
  if (guess.pos1 === actual.pos1) points += 10;
  if (guess.pos2 === actual.pos2) points += 10;
  if (guess.pos3 === actual.pos3) points += 10;
  if (guess.pos4 === actual.pos4) points += 10;
  return points;
}

// ---- KNOCKOUT CLASSIFICATION POINTS ----
export function getKnockoutClassPoints(phase) {
  const points = {
    '32avos': 7,
    'oitavas': 10,
    'quartas': 15,
    'semi': 20,
    'terceiro': 40,
    'final': 40,
  };
  return points[phase] || 0;
}

// ---- INITIAL PREDICTION POINTS ----
// Only calculated after the final
export function calculateInitialPoints(prediction, actual) {
  let points = 0;
  if (prediction.champion === actual.champion) points += 60;
  if (prediction.vice === actual.vice) points += 40;
  if (prediction.thirdPlace === actual.thirdPlace) points += 20;
  return points;
}

// ---- PHASE DEADLINES ----
export const DEADLINES = {
  initial: new Date('2026-06-11T19:00:00Z'),
  group_r1: new Date('2026-06-11T19:00:00Z'),
  group_class: new Date('2026-06-11T19:00:00Z'),
  group_r2: new Date('2026-06-18T16:00:00Z'),
  group_r3: new Date('2026-06-24T19:00:00Z'),
  '32avos': new Date('2026-06-28T19:00:00Z'),
  oitavas: new Date('2026-07-04T17:00:00Z'),
  quartas: new Date('2026-07-09T20:00:00Z'),
  semi: new Date('2026-07-14T19:00:00Z'),
  terceiro: new Date('2026-07-18T21:00:00Z'),
  final: new Date('2026-07-19T19:00:00Z'),
};

export function isDeadlinePassed(phase) {
  const deadline = DEADLINES[phase];
  if (!deadline) return false;
  return new Date() >= deadline;
}

export function getTimeRemaining(phase) {
  const deadline = DEADLINES[phase];
  if (!deadline) return null;
  const diff = deadline - new Date();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, passed: true };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    passed: false,
  };
}

// ---- COUNTRY FLAGS ----
export const FLAGS = {
  'Brasil': '🇧🇷', 'Argentina': '🇦🇷', 'França': '🇫🇷', 'Alemanha': '🇩🇪',
  'Espanha': '🇪🇸', 'Portugal': '🇵🇹', 'Inglaterra': '🇬🇧', 'P. Baixos': '🇳🇱',
  'Bélgica': '🇧🇪', 'Uruguai': '🇺🇾', 'Colômbia': '🇨🇴', 'Croácia': '🇭🇷',
  'Japão': '🇯🇵', 'Marrocos': '🇲🇦', 'México': '🇲🇽', 'EUA': '🇺🇸',
  'Suíça': '🇨🇭', 'Equador': '🇪🇨', 'Senegal': '🇸🇳', 'Noruega': '🇳🇴',
  'Turquia': '🇹🇷', 'Coreia do Sul': '🇰🇷', 'A. Saudita': '🇸🇦', 'Egito': '🇪🇬',
  'Áustria': '🇦🇹', 'Canadá': '🇨🇦', 'Austrália': '🇦🇺', 'Escócia': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Irã': '🇮🇷', 'Gana': '🇬🇭', 'Tunísia': '🇹🇳', 'Panamá': '🇵🇦',
  'África do Sul': '🇿🇦', 'Tchéquia': '🇨🇿', 'Bósnia': '🇧🇦', 'Catar': '🇶🇦',
  'Haiti': '🇭🇹', 'Paraguai': '🇵🇾', 'Curaçao': '🇨🇼', 'C. Marfim': '🇨🇮',
  'Suécia': '🇸🇪', 'N. Zelândia': '🇳🇿', 'Cabo Verde': '🇨🇻',
  'Iraque': '🇮🇶', 'Argélia': '🇩🇿', 'Jordânia': '🇯🇴',
  'RD Congo': '🇨🇩', 'Uzbequistão': '🇺🇿',
};

export function getFlag(team) {
  return FLAGS[team] || '🏳️';
}

// ---- GROUPS ----
export const GROUPS = {
  A: ['México', 'África do Sul', 'Coreia do Sul', 'Tchéquia'],
  B: ['Canadá', 'Bósnia', 'Catar', 'Suíça'],
  C: ['Brasil', 'Marrocos', 'Escócia', 'Haiti'],
  D: ['EUA', 'Paraguai', 'Austrália', 'Turquia'],
  E: ['Alemanha', 'Curaçao', 'C. Marfim', 'Equador'],
  F: ['P. Baixos', 'Japão', 'Suécia', 'Tunísia'],
  G: ['Bélgica', 'Egito', 'Irã', 'N. Zelândia'],
  H: ['Espanha', 'Cabo Verde', 'A. Saudita', 'Uruguai'],
  I: ['França', 'Senegal', 'Iraque', 'Noruega'],
  J: ['Argentina', 'Argélia', 'Áustria', 'Jordânia'],
  K: ['Portugal', 'RD Congo', 'Uzbequistão', 'Colômbia'],
  L: ['Inglaterra', 'Croácia', 'Gana', 'Panamá'],
};

// ---- MATCH START TIME CHECK ----
export function matchHasStarted(matchDate, matchTime) {
  const timeClean = matchTime.replace('h', ':').replace(/:\s*$/, ':00');
  const [hours, minutes] = timeClean.split(':').map(Number);
  const matchDateTime = new Date(`${matchDate}T${String(hours).padStart(2,'0')}:${String(minutes || 0).padStart(2,'0')}:00-03:00`);
  return new Date() >= matchDateTime;
}

export function getMatchDateTime(matchDate, matchTime) {
  const timeClean = matchTime.replace('h', ':').replace(/:\s*$/, ':00');
  const [hours, minutes] = timeClean.split(':').map(Number);
  return new Date(`${matchDate}T${String(hours).padStart(2,'0')}:${String(minutes || 0).padStart(2,'0')}:00-03:00`);
}
