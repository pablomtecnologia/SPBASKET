-- Limpiar y crear datos reales de competición
-- SP ROSA

DELETE FROM competition_standings WHERE team_id = 'sp-rosa';
DELETE FROM competition_matches WHERE team_id = 'sp-rosa';

-- Clasificación SP ROSA (datos reales actuales)
INSERT INTO competition_standings (team_id, position, team_name, played, won, lost, points_for, points_against, points_diff, points) VALUES
('sp-rosa', 1, 'CB SOLARES', 11, 10, 1, 702, 518, 184, 21),
('sp-rosa', 2, 'BEZANA SEGUROS', 11, 9, 2, 645, 503, 142, 20),
('sp-rosa', 3, 'ASTILLERO AUTOMOCIÓN', 11, 8, 3, 607, 558, 49, 19),
('sp-rosa', 4, 'SPBASKET ROSA', 11, 7, 4, 592, 571, 21, 18),
('sp-rosa', 5, 'FINANCIALBROK', 11, 6, 5, 584, 571, 13, 17);

-- Partidos SP ROSA (próximo partido)
INSERT INTO competition_matches (team_id, round, match_date, match_time, home_team, away_team, home_score, away_score, location, status) VALUES
('sp-rosa', 12, '16/02/2026', '18:00', 'SPBASKET ROSA', 'CB SOLARES', NULL, NULL, 'Pab. Municipal Bezana', 'upcoming');

-- SP NEGRO

DELETE FROM competition_standings WHERE team_id = 'sp-negro';
DELETE FROM competition_matches WHERE team_id = 'sp-negro';

-- Clasificación SP NEGRO (datos reales actuales)
INSERT INTO competition_standings (team_id, position, team_name, played, won, lost, points_for, points_against, points_diff, points) VALUES
('sp-negro', 1, 'ASTILLERO AUTOMOCIÓN', 8, 7, 1, 548, 422, 126, 15),
('sp-negro', 2, 'SPBASKET NEGRO', 8, 6, 2, 521, 461, 60, 14),
('sp-negro', 3, 'CORRALES CB', 8, 5, 3, 498, 476, 22, 13),
('sp-negro', 4, 'BALONCESTO CAYON', 8, 4, 4, 487, 489, -2, 12);

-- Partidos SP NEGRO (próximo partido)
INSERT INTO competition_matches (team_id, round, match_date, match_time, home_team, away_team, home_score, away_score, location, status) VALUES
('sp-negro', 9, '15/02/2026', '17:30', 'SPBASKET NEGRO', 'ASTILLERO AUTOMOCIÓN', NULL, NULL, 'Pab. Bezana', 'upcoming');
