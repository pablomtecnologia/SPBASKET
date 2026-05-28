ALTER TABLE competition_matches ADD COLUMN IF NOT EXISTS home_team_logo TEXT;
ALTER TABLE competition_matches ADD COLUMN IF NOT EXISTS away_team_logo TEXT;
ALTER TABLE competition_standings ADD COLUMN IF NOT EXISTS logo TEXT;
