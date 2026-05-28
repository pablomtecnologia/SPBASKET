#!/bin/bash
sudo -u postgres psql spbasket -c "SELECT team_name FROM competition_standings WHERE team_id = 'sp-negro';"
sudo -u postgres psql spbasket -c "SELECT team_name FROM competition_standings WHERE team_id = 'sp-rosa';"
