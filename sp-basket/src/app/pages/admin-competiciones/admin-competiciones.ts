import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-admin-competiciones',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-competiciones.html',
    styleUrl: './admin-competiciones.css'
})
export class AdminCompeticionesComponent implements OnInit {
    selectedTeam: 'sp-rosa' | 'sp-negro' = 'sp-rosa';

    clasificacionText = '';
    partidosText = '';

    saving = false;
    message = '';
    messageType: 'success' | 'error' = 'success';

    constructor(
        private http: HttpClient,
        private router: Router
    ) { }

    ngOnInit() {
        this.loadCurrentData();
    }

    loadCurrentData() {
        const apiUrl = environment.apiUrl || '/api';
        this.http.get(`${apiUrl}/competition/complete/${this.selectedTeam}`).subscribe({
            next: (data: any) => {
                // Convertir clasificación a texto editable
                if (data.clasificacion && data.clasificacion.length > 0) {
                    this.clasificacionText = this.convertClasificacionToText(data.clasificacion);
                }

                // Convertir partidos a texto editable
                if (data.partidos && data.partidos.length > 0) {
                    this.partidosText = this.convertPartidosToText(data.partidos);
                }
            },
            error: (err) => {
                console.error('Error cargando datos:', err);
            }
        });
    }

    convertClasificacionToText(clasificacion: any[]): string {
        let text = 'Pos | Equipo | J | G | P | PF | PC | Pts\n';
        text += '---|---|---|---|---|---|---|---\n';
        clasificacion.forEach(eq => {
            text += `${eq.position} | ${eq.team_name} | ${eq.played} | ${eq.won} | ${eq.lost} | ${eq.points_for} | ${eq.points_against} | ${eq.points}\n`;
        });
        return text;
    }

    convertPartidosToText(partidos: any[]): string {
        let text = 'Jornada | Fecha | Hora | Local | Visitante | Res_Local | Res_Visitante | Pabellón\n';
        text += '---|---|---|---|---|---|---|---\n';
        partidos.forEach(p => {
            const resLocal = p.home_score !== null ? p.home_score : '-';
            const resVisit = p.away_score !== null ? p.away_score : '-';
            text += `${p.round} | ${p.match_date} | ${p.match_time} | ${p.home_team} | ${p.away_team} | ${resLocal} | ${resVisit} | ${p.location}\n`;
        });
        return text;
    }

    parseClasificacionFromText(text: string): any[] {
        const lines = text.trim().split('\n').filter(l => l.trim() && !l.includes('---'));
        const clasificacion = [];

        for (let i = 1; i < lines.length; i++) { // Skip header
            const parts = lines[i].split('|').map(p => p.trim());
            if (parts.length >= 8) {
                clasificacion.push({
                    position: parseInt(parts[0]) || i,
                    team_name: parts[1],
                    played: parseInt(parts[2]) || 0,
                    won: parseInt(parts[3]) || 0,
                    lost: parseInt(parts[4]) || 0,
                    points_for: parseInt(parts[5]) || 0,
                    points_against: parseInt(parts[6]) || 0,
                    points: parseInt(parts[7]) || 0
                });
            }
        }

        return clasificacion;
    }

    parsePartidosFromText(text: string): any[] {
        const lines = text.trim().split('\n').filter(l => l.trim() && !l.includes('---'));
        const partidos = [];

        for (let i = 1; i < lines.length; i++) { // Skip header
            const parts = lines[i].split('|').map(p => p.trim());
            if (parts.length >= 8) {
                const resLocal = parts[5] === '-' ? null : parseInt(parts[5]);
                const resVisit = parts[6] === '-' ? null : parseInt(parts[6]);

                partidos.push({
                    round: parts[0],
                    match_date: parts[1],
                    match_time: parts[2],
                    home_team: parts[3],
                    away_team: parts[4],
                    home_score: resLocal,
                    away_score: resVisit,
                    location: parts[7],
                    status: (resLocal !== null && resVisit !== null) ? 'played' : 'upcoming'
                });
            }
        }

        return partidos;
    }

    saveData() {
        this.saving = true;
        this.message = '';

        const clasificacion = this.parseClasificacionFromText(this.clasificacionText);
        const partidos = this.parsePartidosFromText(this.partidosText);

        const data = {
            teamId: this.selectedTeam,
            clasificacion,
            partidos
        };

        const apiUrl = environment.apiUrl || '/api';
        this.http.post(`${apiUrl}/admin/update-competition`, data).subscribe({
            next: (response) => {
                this.message = '✅ Datos guardados correctamente';
                this.messageType = 'success';
                this.saving = false;

                setTimeout(() => {
                    this.message = '';
                }, 3000);
            },
            error: (err) => {
                this.message = '❌ Error guardando datos: ' + (err.error?.message || err.message);
                this.messageType = 'error';
                this.saving = false;
            }
        });
    }

    onTeamChange() {
        this.loadCurrentData();
    }

    resetToDefaults() {
        if (this.selectedTeam === 'sp-rosa') {
            this.clasificacionText = `Pos | Equipo | J | G | P | PF | PC | Pts
---|---|---|---|---|---|---|---
1 | CB SOLARES | 11 | 10 | 1 | 702 | 518 | 21
2 | BEZANA SEGUROS | 11 | 9 | 2 | 645 | 503 | 20
3 | ASTILLERO AUTOMOCIÓN | 11 | 8 | 3 | 607 | 558 | 19
4 | SPBASKET ROSA | 11 | 7 | 4 | 592 | 571 | 18
5 | FINANCIALBROK | 11 | 6 | 5 | 584 | 571 | 17`;

            this.partidosText = `Jornada | Fecha | Hora | Local | Visitante | Res_Local | Res_Visitante | Pabellón
---|---|---|---|---|---|---|---
12 | 16/02/2026 | 18:00 | SPBASKET ROSA | CB SOLARES | - | - | Pab. Municipal Bezana`;
        } else {
            this.clasificacionText = `Pos | Equipo | J | G | P | PF | PC | Pts
---|---|---|---|---|---|---|---
1 | ASTILLERO AUTOMOCIÓN | 8 | 7 | 1 | 548 | 422 | 15
2 | SPBASKET NEGRO | 8 | 6 | 2 | 521 | 461 | 14
3 | CORRALES CB | 8 | 5 | 3 | 498 | 476 | 13
4 | BALONCESTO CAYON | 8 | 4 | 4 | 487 | 489 | 12`;

            this.partidosText = `Jornada | Fecha | Hora | Local | Visitante | Res_Local | Res_Visitante | Pabellón
---|---|---|---|---|---|---|---
9 | 15/02/2026 | 17:30 | SPBASKET NEGRO | ASTILLERO | - | - | Pab. Bezana`;
        }
    }
    // Raw Input Properties
    showRawModal = false;
    parseMode: 'standings' | 'matches' | null = null;
    rawInputText = '';

    openRawModal(mode: 'standings' | 'matches') {
        this.parseMode = mode;
        this.rawInputText = '';
        this.showRawModal = true;
    }

    closeRawModal() {
        this.showRawModal = false;
        this.parseMode = null;
        this.rawInputText = '';
    }

    processRawInput() {
        if (!this.parseMode || !this.rawInputText.trim()) return;

        if (this.parseMode === 'standings') {
            const standings = this.parseRawStandings(this.rawInputText);
            if (standings.length > 0) {
                this.clasificacionText = this.convertClasificacionToText(standings);
                this.message = `✅ Se han procesado ${standings.length} filas de clasificación.`;
            } else {
                this.message = '❌ No se pudieron extraer datos de clasificación.';
                this.messageType = 'error';
            }
        } else if (this.parseMode === 'matches') {
            const matches = this.parseRawMatches(this.rawInputText);
            if (matches.length > 0) {
                this.partidosText = this.convertPartidosToText(matches);
                this.message = `✅ Se han procesado ${matches.length} partidos.`;
            } else {
                this.message = '❌ No se pudieron extraer partidos.';
                this.messageType = 'error';
            }
        }

        this.closeRawModal();
        setTimeout(() => this.message = '', 3000);
    }

    parseRawStandings(text: string): any[] {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const standings = [];

        let i = 0;
        while (i < lines.length) {
            // Buscamos un patrón de número (posición)
            const pos = parseInt(lines[i]);
            if (isNaN(pos) || pos > 20) {
                i++;
                continue;
            }

            try {
                // Formato típico de FECAN copiado:
                // Posición, Nombre, J, V, D, NP, PF, PC, PTS
                const position = pos;
                const teamName = lines[++i];
                const played = parseInt(lines[++i]);
                const won = parseInt(lines[++i]);
                const lost = parseInt(lines[++i]);
                const np = parseInt(lines[++i]); // No presentado
                const pf = parseInt(lines[++i]);
                const pc = parseInt(lines[++i]);
                const pts = parseInt(lines[++i]);

                if (!isNaN(played) && !isNaN(pts)) {
                    standings.push({
                        position,
                        team_name: teamName,
                        played,
                        won,
                        lost,
                        points_for: pf,
                        points_against: pc,
                        points: pts
                    });
                }
            } catch (e) {
                console.error('Error parseando bloque:', e);
            }
            i++;
        }
        return standings;
    }

    parseRawMatches(text: string): any[] {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const matches = [];
        let currentRound = '1';

        const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/; // Solo fecha o fecha+hora
        const dateTimeRegex = /^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}$/;

        let i = 0;
        while (i < lines.length) {
            const line = lines[i];

            // Si la línea dice "Jornada X", actualizamos el round
            if (line.toLowerCase().includes('jornada')) {
                const match = line.match(/\d+/);
                if (match) currentRound = match[0];
                i++;
                continue;
            }

            // Si detectamos una fecha, empieza un bloque de partido
            if (dateTimeRegex.test(line) || dateRegex.test(line)) {
                try {
                    const fullDate = line;
                    const fecha = fullDate.split(' ')[0];
                    const hora = fullDate.split(' ')[1] || '00:00';

                    let nextLine = lines[++i];

                    // A veces hay palabras como "Cambios", "|" o el nombre del pabellón
                    let pabellon = nextLine;
                    if (pabellon === 'Cambios' || pabellon === '|') {
                        pabellon = lines[++i];
                    }

                    const local = lines[++i];
                    let scoreLocalStr = lines[++i];

                    if (scoreLocalStr === '-' || isNaN(parseInt(scoreLocalStr))) {
                        // Partido no jugado (Upcoming)
                        // A veces hay una línea extra "Prepartido" o similar
                        let awayTeam = lines[++i];
                        if (awayTeam === 'Prepartido' || awayTeam === 'Acta' || awayTeam === 'Estadísticas') {
                            awayTeam = lines[++i];
                        }

                        matches.push({
                            round: currentRound,
                            match_date: fecha,
                            match_time: hora,
                            home_team: local,
                            away_team: awayTeam,
                            home_score: null,
                            away_score: null,
                            location: pabellon,
                            status: 'upcoming'
                        });
                    } else {
                        // Partido jugado
                        const scoreLocal = parseInt(scoreLocalStr);
                        const awayTeam = lines[++i];
                        const scoreAway = parseInt(lines[++i]);

                        matches.push({
                            round: currentRound,
                            match_date: fecha,
                            match_time: hora,
                            home_team: local,
                            away_team: awayTeam,
                            home_score: scoreLocal,
                            away_score: scoreAway,
                            location: pabellon,
                            status: 'played'
                        });
                    }
                } catch (e) {
                    console.error('Error parseando partido:', e);
                }
            }
            i++;
        }
        return matches;
    }
}
