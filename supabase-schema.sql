-- ============================================
-- BOLÃO DOS MELADORES - DATABASE SCHEMA
-- Supabase (PostgreSQL)
-- ============================================

-- 1. USERS TABLE
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  login TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  first_access BOOLEAN DEFAULT TRUE,
  avatar_choice INTEGER DEFAULT NULL, -- 1, 2, or 3
  avatar_url_1 TEXT DEFAULT NULL,
  avatar_url_2 TEXT DEFAULT NULL,
  avatar_url_3 TEXT DEFAULT NULL,
  profile_bio TEXT DEFAULT NULL, -- zoeira profile for AI messages
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MATCHES TABLE
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  phase TEXT NOT NULL, -- 'group_r1', 'group_r2', 'group_r3', '32avos', 'oitavas', 'quartas', 'semi', 'terceiro', 'final'
  group_letter TEXT, -- A-L for group phase, NULL for knockout
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  match_date DATE NOT NULL,
  match_time TEXT NOT NULL, -- '16h', '19h', etc
  is_brasil BOOLEAN DEFAULT FALSE,
  result_home INTEGER DEFAULT NULL,
  result_away INTEGER DEFAULT NULL,
  ko_winner TEXT DEFAULT NULL, -- knockout: who advances
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MATCH GUESSES
CREATE TABLE match_guesses (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  guess_home INTEGER NOT NULL,
  guess_away INTEGER NOT NULL,
  ko_winner_guess TEXT DEFAULT NULL, -- knockout: who user thinks advances
  points INTEGER DEFAULT NULL, -- calculated after result
  is_exact BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- 4. GROUP CLASSIFICATION GUESSES
CREATE TABLE group_class_guesses (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  group_letter TEXT NOT NULL, -- A-L
  pos_1 TEXT NOT NULL,
  pos_2 TEXT NOT NULL,
  pos_3 TEXT NOT NULL,
  pos_4 TEXT NOT NULL,
  points INTEGER DEFAULT NULL, -- calculated after group phase
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, group_letter)
);

-- 5. GROUP CLASSIFICATION RESULTS (actual)
CREATE TABLE group_class_results (
  id SERIAL PRIMARY KEY,
  group_letter TEXT NOT NULL UNIQUE,
  pos_1 TEXT NOT NULL,
  pos_2 TEXT NOT NULL,
  pos_3 TEXT NOT NULL,
  pos_4 TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. INITIAL PREDICTIONS
CREATE TABLE initial_predictions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  champion TEXT NOT NULL,
  vice TEXT NOT NULL,
  third_place TEXT NOT NULL,
  points INTEGER DEFAULT NULL, -- calculated after final
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 7. INITIAL PREDICTION RESULTS (actual)
CREATE TABLE initial_results (
  id SERIAL PRIMARY KEY,
  champion TEXT NOT NULL,
  vice TEXT NOT NULL,
  third_place TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CHAT MESSAGES (Resenha)
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for system messages
  message_type TEXT NOT NULL DEFAULT 'user', -- 'user', 'system', 'zoeira'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. DEADLINES
CREATE TABLE deadlines (
  id SERIAL PRIMARY KEY,
  phase TEXT NOT NULL UNIQUE,
  deadline_at TIMESTAMPTZ NOT NULL,
  label TEXT NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_matches_phase ON matches(phase);
CREATE INDEX idx_match_guesses_user ON match_guesses(user_id);
CREATE INDEX idx_match_guesses_match ON match_guesses(match_id);
CREATE INDEX idx_group_class_user ON group_class_guesses(user_id);
CREATE INDEX idx_chat_created ON chat_messages(created_at);

-- ============================================
-- DEADLINES SEED DATA
-- ============================================
INSERT INTO deadlines (phase, deadline_at, label) VALUES
('initial', '2026-06-11T19:00:00Z', 'Palpite Inicial + Classificados + 1ª Rodada'),
('group_r1', '2026-06-11T19:00:00Z', '1ª Rodada'),
('group_class', '2026-06-11T19:00:00Z', 'Classificados dos Grupos'),
('group_r2', '2026-06-18T16:00:00Z', '2ª Rodada'),
('group_r3', '2026-06-24T19:00:00Z', '3ª Rodada'),
('32avos', '2026-06-28T19:00:00Z', '32-avos de Final'),
('oitavas', '2026-07-04T17:00:00Z', 'Oitavas de Final'),
('quartas', '2026-07-09T20:00:00Z', 'Quartas de Final'),
('semi', '2026-07-14T19:00:00Z', 'Semifinais'),
('terceiro', '2026-07-18T21:00:00Z', 'Disputa do 3º Lugar'),
('final', '2026-07-19T19:00:00Z', 'Final');

-- ============================================
-- MATCHES SEED DATA - ALL 104 WORLD CUP 2026 MATCHES
-- Times in UTC (Brasilia -3)
-- ============================================

-- ======= GROUP STAGE - ROUND 1 =======
INSERT INTO matches (phase, group_letter, home_team, away_team, match_date, match_time, is_brasil) VALUES
-- 11/06
('group_r1', 'A', 'México', 'África do Sul', '2026-06-11', '16h', FALSE),
('group_r1', 'A', 'Coreia do Sul', 'Tchéquia', '2026-06-11', '23h', FALSE),
-- 12/06
('group_r1', 'B', 'Canadá', 'Bósnia', '2026-06-12', '16h', FALSE),
('group_r1', 'D', 'EUA', 'Paraguai', '2026-06-12', '22h', FALSE),
-- 13/06
('group_r1', 'D', 'Austrália', 'Turquia', '2026-06-13', '1h', FALSE),
('group_r1', 'B', 'Catar', 'Suíça', '2026-06-13', '16h', FALSE),
('group_r1', 'C', 'Brasil', 'Marrocos', '2026-06-13', '19h', TRUE),
('group_r1', 'C', 'Haiti', 'Escócia', '2026-06-13', '22h', FALSE),
-- 14/06
('group_r1', 'E', 'Alemanha', 'Curaçao', '2026-06-14', '14h', FALSE),
('group_r1', 'F', 'P. Baixos', 'Japão', '2026-06-14', '17h', FALSE),
('group_r1', 'E', 'C. Marfim', 'Equador', '2026-06-14', '20h', FALSE),
('group_r1', 'F', 'Suécia', 'Tunísia', '2026-06-14', '23h', FALSE),
-- 15/06
('group_r1', 'H', 'Espanha', 'Cabo Verde', '2026-06-15', '13h', FALSE),
('group_r1', 'G', 'Bélgica', 'Egito', '2026-06-15', '16h', FALSE),
('group_r1', 'H', 'A. Saudita', 'Uruguai', '2026-06-15', '19h', FALSE),
('group_r1', 'G', 'Irã', 'N. Zelândia', '2026-06-15', '22h', FALSE),
-- 16/06
('group_r1', 'J', 'Áustria', 'Jordânia', '2026-06-16', '1h', FALSE),
('group_r1', 'I', 'França', 'Senegal', '2026-06-16', '16h', FALSE),
('group_r1', 'I', 'Iraque', 'Noruega', '2026-06-16', '19h', FALSE),
('group_r1', 'J', 'Argentina', 'Argélia', '2026-06-16', '22h', FALSE),
-- 17/06
('group_r1', 'K', 'Portugal', 'RD Congo', '2026-06-17', '14h', FALSE),
('group_r1', 'L', 'Inglaterra', 'Croácia', '2026-06-17', '17h', FALSE),
('group_r1', 'L', 'Gana', 'Panamá', '2026-06-17', '20h', FALSE),
('group_r1', 'K', 'Uzbequistão', 'Colômbia', '2026-06-17', '23h', FALSE);

-- ======= GROUP STAGE - ROUND 2 =======
INSERT INTO matches (phase, group_letter, home_team, away_team, match_date, match_time, is_brasil) VALUES
-- 18/06
('group_r2', 'A', 'Tchéquia', 'África do Sul', '2026-06-18', '13h', FALSE),
('group_r2', 'B', 'Suíça', 'Bósnia', '2026-06-18', '16h', FALSE),
('group_r2', 'B', 'Canadá', 'Catar', '2026-06-18', '19h', FALSE),
('group_r2', 'A', 'México', 'Coreia do Sul', '2026-06-18', '22h', FALSE),
-- 19/06
('group_r2', 'D', 'Turquia', 'Paraguai', '2026-06-19', '1h', FALSE),
('group_r2', 'D', 'EUA', 'Austrália', '2026-06-19', '16h', FALSE),
('group_r2', 'C', 'Escócia', 'Marrocos', '2026-06-19', '19h', FALSE),
('group_r2', 'C', 'Brasil', 'Haiti', '2026-06-19', '22h', TRUE),
-- 20/06
('group_r2', 'F', 'Tunísia', 'Japão', '2026-06-20', '1h', FALSE),
('group_r2', 'F', 'P. Baixos', 'Suécia', '2026-06-20', '14h', FALSE),
('group_r2', 'E', 'Alemanha', 'C. Marfim', '2026-06-20', '17h', FALSE),
('group_r2', 'E', 'Equador', 'Curaçao', '2026-06-20', '21h', FALSE),
-- 21/06
('group_r2', 'H', 'Espanha', 'A. Saudita', '2026-06-21', '13h', FALSE),
('group_r2', 'G', 'Bélgica', 'Irã', '2026-06-21', '16h', FALSE),
('group_r2', 'H', 'Uruguai', 'Cabo Verde', '2026-06-21', '19h', FALSE),
('group_r2', 'G', 'N. Zelândia', 'Egito', '2026-06-21', '22h', FALSE),
-- 22/06
('group_r2', 'J', 'Jordânia', 'Argélia', '2026-06-22', '0h', FALSE),
('group_r2', 'J', 'Argentina', 'Áustria', '2026-06-22', '14h', FALSE),
('group_r2', 'I', 'França', 'Iraque', '2026-06-22', '18h', FALSE),
('group_r2', 'I', 'Noruega', 'Senegal', '2026-06-22', '21h', FALSE),
-- 23/06
('group_r2', 'K', 'Portugal', 'Uzbequistão', '2026-06-23', '14h', FALSE),
('group_r2', 'L', 'Inglaterra', 'Gana', '2026-06-23', '17h', FALSE),
('group_r2', 'L', 'Panamá', 'Croácia', '2026-06-23', '20h', FALSE),
('group_r2', 'K', 'Colômbia', 'RD Congo', '2026-06-23', '23h', FALSE);

-- ======= GROUP STAGE - ROUND 3 =======
INSERT INTO matches (phase, group_letter, home_team, away_team, match_date, match_time, is_brasil) VALUES
-- 24/06
('group_r3', 'B', 'Suíça', 'Canadá', '2026-06-24', '16h', FALSE),
('group_r3', 'B', 'Bósnia', 'Catar', '2026-06-24', '16h', FALSE),
('group_r3', 'C', 'Escócia', 'Brasil', '2026-06-24', '19h', TRUE),
('group_r3', 'C', 'Marrocos', 'Haiti', '2026-06-24', '19h', FALSE),
('group_r3', 'A', 'Tchéquia', 'México', '2026-06-24', '22h', FALSE),
('group_r3', 'A', 'África do Sul', 'Coreia do Sul', '2026-06-24', '22h', FALSE),
-- 25/06
('group_r3', 'E', 'Curaçao', 'C. Marfim', '2026-06-25', '17h', FALSE),
('group_r3', 'E', 'Equador', 'Alemanha', '2026-06-25', '17h', FALSE),
('group_r3', 'F', 'Japão', 'Suécia', '2026-06-25', '20h', FALSE),
('group_r3', 'F', 'Tunísia', 'P. Baixos', '2026-06-25', '20h', FALSE),
('group_r3', 'D', 'Turquia', 'EUA', '2026-06-25', '23h', FALSE),
('group_r3', 'D', 'Paraguai', 'Austrália', '2026-06-25', '23h', FALSE),
-- 26/06
('group_r3', 'I', 'Noruega', 'França', '2026-06-26', '16h', FALSE),
('group_r3', 'I', 'Senegal', 'Iraque', '2026-06-26', '16h', FALSE),
('group_r3', 'H', 'Cabo Verde', 'A. Saudita', '2026-06-26', '21h', FALSE),
('group_r3', 'H', 'Uruguai', 'Espanha', '2026-06-26', '21h', FALSE),
-- 27/06
('group_r3', 'G', 'Egito', 'Irã', '2026-06-27', '0h', FALSE),
('group_r3', 'G', 'N. Zelândia', 'Bélgica', '2026-06-27', '0h', FALSE),
('group_r3', 'L', 'Panamá', 'Inglaterra', '2026-06-27', '18h', FALSE),
('group_r3', 'L', 'Croácia', 'Gana', '2026-06-27', '18h', FALSE),
('group_r3', 'K', 'Colômbia', 'Portugal', '2026-06-27', '20h30', FALSE),
('group_r3', 'K', 'RD Congo', 'Uzbequistão', '2026-06-27', '20h30', FALSE),
('group_r3', 'J', 'Argélia', 'Áustria', '2026-06-27', '23h', FALSE),
('group_r3', 'J', 'Jordânia', 'Argentina', '2026-06-27', '23h', FALSE);

-- ======= 32-AVOS (Round of 32) - 16 matches =======
-- Teams TBD after group stage, using placeholders
INSERT INTO matches (phase, home_team, away_team, match_date, match_time, is_brasil) VALUES
('32avos', 'TBD_32_1A', 'TBD_32_1B', '2026-06-28', '16h', FALSE),
('32avos', 'TBD_32_2A', 'TBD_32_2B', '2026-06-29', '14h', FALSE),
('32avos', 'TBD_32_3A', 'TBD_32_3B', '2026-06-29', '17h30', FALSE),
('32avos', 'TBD_32_4A', 'TBD_32_4B', '2026-06-29', '22h', FALSE),
('32avos', 'TBD_32_5A', 'TBD_32_5B', '2026-06-30', '14h', FALSE),
('32avos', 'TBD_32_6A', 'TBD_32_6B', '2026-06-30', '18h', FALSE),
('32avos', 'TBD_32_7A', 'TBD_32_7B', '2026-06-30', '22h', FALSE),
('32avos', 'TBD_32_8A', 'TBD_32_8B', '2026-07-01', '13h', FALSE),
('32avos', 'TBD_32_9A', 'TBD_32_9B', '2026-07-01', '17h', FALSE),
('32avos', 'TBD_32_10A', 'TBD_32_10B', '2026-07-01', '21h', FALSE),
('32avos', 'TBD_32_11A', 'TBD_32_11B', '2026-07-02', '0h', FALSE),
('32avos', 'TBD_32_12A', 'TBD_32_12B', '2026-07-02', '16h', FALSE),
('32avos', 'TBD_32_13A', 'TBD_32_13B', '2026-07-02', '20h', FALSE),
('32avos', 'TBD_32_14A', 'TBD_32_14B', '2026-07-03', '15h', FALSE),
('32avos', 'TBD_32_15A', 'TBD_32_15B', '2026-07-03', '17h', FALSE),
('32avos', 'TBD_32_16A', 'TBD_32_16B', '2026-07-03', '22h30', FALSE);

-- ======= OITAVAS (Round of 16) - 8 matches =======
INSERT INTO matches (phase, home_team, away_team, match_date, match_time, is_brasil) VALUES
('oitavas', 'TBD_OIT_1A', 'TBD_OIT_1B', '2026-07-04', '14h', FALSE),
('oitavas', 'TBD_OIT_2A', 'TBD_OIT_2B', '2026-07-04', '18h', FALSE),
('oitavas', 'TBD_OIT_3A', 'TBD_OIT_3B', '2026-07-05', '17h', FALSE),
('oitavas', 'TBD_OIT_4A', 'TBD_OIT_4B', '2026-07-05', '21h', FALSE),
('oitavas', 'TBD_OIT_5A', 'TBD_OIT_5B', '2026-07-06', '15h', FALSE),
('oitavas', 'TBD_OIT_6A', 'TBD_OIT_6B', '2026-07-06', '20h', FALSE),
('oitavas', 'TBD_OIT_7A', 'TBD_OIT_7B', '2026-07-07', '13h', FALSE),
('oitavas', 'TBD_OIT_8A', 'TBD_OIT_8B', '2026-07-07', '17h', FALSE);

-- ======= QUARTAS - 4 matches =======
INSERT INTO matches (phase, home_team, away_team, match_date, match_time, is_brasil) VALUES
('quartas', 'TBD_QUA_1A', 'TBD_QUA_1B', '2026-07-09', '17h', FALSE),
('quartas', 'TBD_QUA_2A', 'TBD_QUA_2B', '2026-07-10', '16h', FALSE),
('quartas', 'TBD_QUA_3A', 'TBD_QUA_3B', '2026-07-11', '18h', FALSE),
('quartas', 'TBD_QUA_4A', 'TBD_QUA_4B', '2026-07-11', '21h', FALSE);

-- ======= SEMI - 2 matches =======
INSERT INTO matches (phase, home_team, away_team, match_date, match_time, is_brasil) VALUES
('semi', 'TBD_SEMI_1A', 'TBD_SEMI_1B', '2026-07-14', '16h', FALSE),
('semi', 'TBD_SEMI_2A', 'TBD_SEMI_2B', '2026-07-15', '16h', FALSE);

-- ======= TERCEIRO LUGAR =======
INSERT INTO matches (phase, home_team, away_team, match_date, match_time, is_brasil) VALUES
('terceiro', 'TBD_3RD_A', 'TBD_3RD_B', '2026-07-18', '18h', FALSE);

-- ======= FINAL =======
INSERT INTO matches (phase, home_team, away_team, match_date, match_time, is_brasil) VALUES
('final', 'TBD_FIN_A', 'TBD_FIN_B', '2026-07-19', '16h', FALSE);

-- ============================================
-- ADMIN USER (default password: meladores2026)
-- Password hash should be generated by the app
-- ============================================
-- INSERT INTO users (name, login, password_hash, is_admin, first_access) 
-- VALUES ('Admin', 'admin', '<hash>', TRUE, FALSE);

-- ============================================
-- SCORING FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION calculate_match_points(
  guess_h INTEGER, guess_a INTEGER,
  result_h INTEGER, result_a INTEGER,
  brasil BOOLEAN
) RETURNS TABLE(points INTEGER, is_exact BOOLEAN) AS $$
DECLARE
  g_winner TEXT;
  r_winner TEXT;
  g_h BOOLEAN;
  g_a BOOLEAN;
  pts INTEGER := 0;
  exact BOOLEAN := FALSE;
BEGIN
  -- Determine winners
  g_winner := CASE WHEN guess_h > guess_a THEN 'H' WHEN guess_h < guess_a THEN 'A' ELSE 'D' END;
  r_winner := CASE WHEN result_h > result_a THEN 'H' WHEN result_h < result_a THEN 'A' ELSE 'D' END;
  g_h := guess_h = result_h;
  g_a := guess_a = result_a;

  IF r_winner = 'D' THEN
    IF guess_h = result_h AND guess_a = result_a THEN pts := 10; exact := TRUE;
    ELSIF g_winner = 'D' THEN pts := 7;
    ELSIF g_h OR g_a THEN pts := 2;
    END IF;
  ELSE
    IF guess_h = result_h AND guess_a = result_a THEN pts := 10; exact := TRUE;
    ELSIF g_winner = r_winner AND (g_h OR g_a) THEN pts := 7;
    ELSIF g_winner = r_winner THEN pts := 5;
    ELSIF g_h OR g_a THEN pts := 2;
    END IF;
  END IF;

  IF brasil THEN pts := pts * 2; END IF;

  RETURN QUERY SELECT pts, exact;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEW: RANKING
-- ============================================
CREATE OR REPLACE VIEW ranking AS
SELECT
  u.id,
  u.name,
  u.avatar_choice,
  u.avatar_url_1,
  u.avatar_url_2,
  u.avatar_url_3,
  COALESCE(mg.match_pts, 0) + COALESCE(gc.group_pts, 0) + COALESCE(ip.initial_pts, 0) AS total_points,
  COALESCE(mg.exact_count, 0) AS exact_count,
  COALESCE(mg.match_pts, 0) AS match_points,
  COALESCE(gc.group_pts, 0) AS group_points,
  COALESCE(ip.initial_pts, 0) AS initial_points
FROM users u
LEFT JOIN (
  SELECT user_id, 
    SUM(COALESCE(points, 0)) AS match_pts,
    COUNT(*) FILTER (WHERE is_exact = TRUE) AS exact_count
  FROM match_guesses
  GROUP BY user_id
) mg ON mg.user_id = u.id
LEFT JOIN (
  SELECT user_id, SUM(COALESCE(points, 0)) AS group_pts
  FROM group_class_guesses
  GROUP BY user_id
) gc ON gc.user_id = u.id
LEFT JOIN (
  SELECT user_id, COALESCE(points, 0) AS initial_pts
  FROM initial_predictions
) ip ON ip.user_id = u.id
WHERE u.is_admin = FALSE
ORDER BY total_points DESC, exact_count DESC;
