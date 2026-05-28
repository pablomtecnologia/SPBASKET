// src/app/services/competition.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OfficialMatch {
    id?: number;
    team_id: string;
    round: number;
    match_date: string;
    match_time: string;
    home_team: string;
    away_team: string;
    location: string;
    home_score: number | null;
    away_score: number | null;
    home_team_logo: string;
    away_team_logo: string;
    status: 'played' | 'upcoming';
    last_updated?: string;
}

export interface OfficialMatchesResponse {
    success: boolean;
    teamId: string;
    matches: OfficialMatch[];
    count: number;
}

@Injectable({
    providedIn: 'root'
})
export class CompetitionService {
    private apiUrl = environment.apiUrl || 'http://localhost:80/api';
    private competitionCache: Map<string, any> = new Map();

    constructor(private http: HttpClient) { }

    /**
     * Obtiene los partidos oficiales para un equipo
     */
    getMatches(teamId: string): Observable<OfficialMatchesResponse> {
        return this.http.get<OfficialMatchesResponse>(`${this.apiUrl}/competition/matches/${teamId}`);
    }

    /**
     * Obtiene clasificación de un equipo
     */
    getClasificacion(teamId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/competition/clasificacion/${teamId}`);
    }

    /**
     * Obtiene partidos de un equipo
     */
    getPartidos(teamId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/competition/partidos/${teamId}`);
    }

    /**
     * Obtiene info de competición
     */
    getCompeticionInfo(teamId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/competition/info/${teamId}`);
    }

    /**
     * Obtiene TODO (clasificación, partidos, info) en una sola llamada
     */
    getCompletaData(teamId: string): Observable<any> {
        return new Observable(observer => {
            this.http.get<any>(`${this.apiUrl}/competition/complete/${teamId}`).subscribe({
                next: (data) => {
                    this.competitionCache.set(teamId, data);
                    observer.next(data);
                    observer.complete();
                },
                error: (err) => observer.error(err)
            });
        });
    }

    /**
     * Devuelve datos cacheados instantáneamente
     */
    getCachedData(teamId: string): any {
        return this.competitionCache.get(teamId);
    }

    /**
     * Obtiene todos los datos oficiales
     */
    getOficialData(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/competition-data`);
    }

    /**
     * Sincroniza los datos oficiales (Requiere Admin)
     */
    syncOficialData(): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/competition/sync`, {});
    }

    /**
     * Convierte un partido al formato usado en la aplicación
     */
    convertToAppMatch(match: OfficialMatch): any {
        return {
            id: match.id || match.round,
            round: match.round,
            date: match.match_date,
            time: match.match_time,
            homeTeam: match.home_team,
            awayTeam: match.away_team,
            homeScore: match.home_score,
            awayScore: match.away_score,
            location: match.location,
            status: match.status,
            homeTeamLogo: match.home_team_logo || this.getDefaultLogo(match.home_team),
            awayTeamLogo: match.away_team_logo || this.getDefaultLogo(match.away_team)
        };
    }

    /**
     * Obtiene un logo por defecto basado en el nombre del equipo
     */
    private getDefaultLogo(teamName: string): string {
        const normalizedName = teamName.toLowerCase();

        // Solo logos OFICIALES de SP BASKET
        if (normalizedName.includes('sp basket rosa') || normalizedName.includes('sp rosa')) {
            return '/assets/images/logos/sp_rosa.jpg';
        }
        if (normalizedName.includes('spbasket negro') || normalizedName.includes('sp negro')) {
            return '/assets/images/logo-sp-pink.png';
        }

        // Para rivales, no devolvemos nuestro logo. 
        // Devolvemos una cadena vacía para que el frontend use el placeholder neutro o el logo real.
        return '';
    }
}
