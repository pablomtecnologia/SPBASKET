import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CompetitionService } from '../../services/competition.service';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth';

interface Partido {
  jornada: string;
  fecha: string;
  hora: string;
  equipo_local: string;
  equipo_visitante: string;
  logo_local: string;
  logo_visitante: string;
  resultado_local: number | null;
  resultado_visitante: number | null;
  pabellon: string;
  estado: string;
}

interface EquipoClasificacion {
  position: number;
  team_name: string;
  played: number;
  won: number;
  lost: number;
  points_for: number;
  points_against: number;
  points_diff: number;
  points: number;
  logo: string;
}

@Component({
  selector: 'app-competicion-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './competicion-detalle.html',
  styleUrls: ['./competicion-detalle.css']
})
export class CompetitionDetailComponent implements OnInit {

  competitionId: string | null = null;
  currentComp: any = null;
  partidos: Partido[] = [];
  clasificacion: EquipoClasificacion[] = [];
  competicionInfo: any = {};
  loading = false;

  competitionInfo: any = {
    'sp-rosa': {
      name: 'SP BASKET ROSA',
      category: 'Primera División Autonómica - Temporada 2025/2026',
      logo: '/assets/images/logos/sp_rosa.jpg'
    },
    'sp-negro': {
      name: 'SP BASKET NEGRO',
      category: 'Segunda División Autonómica - Temporada 2025/2026',
      logo: '/assets/images/logo-sp-pink.png'
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private competitionService: CompetitionService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.competitionId = this.route.snapshot.paramMap.get('id');
    if (this.competitionId && this.competitionInfo[this.competitionId]) {
      this.currentComp = this.competitionInfo[this.competitionId];
      // Cargar lo que haya en DB/Cache rápido, y si no hay, sincronizar
      this.loadInitialData();
    } else {
      this.router.navigate(['/competiciones']);
    }
  }

  loadInitialData() {
    if (!this.competitionId) return;

    // 0. INTENTO INSTANTÁNEO: Consultar cache del servicio (Pre-cargado por el listado)
    const cached = this.competitionService.getCachedData(this.competitionId);
    if (cached) {
      console.log('⚡ Instant pop from Service Cache:', this.competitionId);
      this.processCompetitionData(cached);
      // Ya no ponemos loading = true; los datos se abren YA.
    } else {
      this.loading = true; // Solo si no hay NADA absoluto
    }

    // 1. Cargar desde API (Cache del Servidor/DB)
    this.http.get<any>(`${environment.apiUrl}/competition/complete/${this.competitionId}`).subscribe({
      next: (data) => {
        const hasData = this.processCompetitionData(data);
        this.loading = false;

        // Si no hay nada de nada, sync vivo
        if (!hasData) {
          this.loadScrapedData(false);
        }
      },
      error: (err) => {
        console.error('❌ Error cargando datos iniciales:', err);
        if (!cached) this.loadScrapedData(false);
        else this.loading = false;
      }
    });
  }

  loadScrapedData(force: boolean = false) {
    if (!this.competitionId) return;
    this.loading = true;

    const endpoint = force
      ? `${environment.apiUrl}/scrape-live/${this.competitionId}?force=true`
      : `${environment.apiUrl}/scrape-live/${this.competitionId}`;

    this.http.get<any>(endpoint).subscribe({
      next: (data) => {
        this.processCompetitionData(data);
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error syncing data:', err);
        this.loading = false;
      }
    });
  }

  processCompetitionData(data: any): boolean {
    if (!data) return false;
    this.competicionInfo = data;

    if (data.clasificacion) {
      this.clasificacion = data.clasificacion;
    }

    if (data.partidos) {
      this.partidos = data.partidos.map((p: any) => {
        const scoreL = (p.home_score !== undefined && p.home_score !== null) ? p.home_score : p.resultado_local;
        const scoreV = (p.away_score !== undefined && p.away_score !== null) ? p.away_score : p.resultado_visitante;

        return {
          ...p,
          jornada: p.round || p.jornada || '?',
          equipo_local: p.home_team || p.equipo_local || '',
          equipo_visitante: p.away_team || p.equipo_visitante || '',
          resultado_local: scoreL,
          resultado_visitante: scoreV,
          pabellon: p.location || p.pabellon || 'Pabellón no especificado',
          fecha: p.match_date || p.fecha || '',
          hora: p.match_time || p.hora || '',
          estado: p.status || p.estado || ((scoreL !== null && scoreL !== undefined && scoreL > 0) ? 'played' : 'upcoming'),
          logo_local: p.home_team_logo || p.logo_local,
          logo_visitante: p.away_team_logo || p.logo_visitante
        };
      });
    }

    return (this.clasificacion.length > 0 || this.partidos.length > 0);
  }

  refreshData() {
    this.loadScrapedData(true);
  }

  getMatches(): Partido[] {
    return this.partidos.sort((a, b) => parseInt(a.jornada) - parseInt(b.jornada));
  }

  getNextMatch(): Partido | null {
    const upcoming = this.partidos
      .filter(p => p.estado === 'upcoming')
      .sort((a, b) => {
        const dateA = this.parseFecha(a.fecha);
        const dateB = this.parseFecha(b.fecha);
        return dateA.getTime() - dateB.getTime();
      });
    return upcoming[0] || null;
  }

  getPlayedMatches(): Partido[] {
    return this.partidos
      .filter(p => p.estado === 'played' || (p.resultado_local !== null && p.resultado_local !== undefined && p.resultado_local > 0) || (p.resultado_visitante !== null && p.resultado_visitante !== undefined && p.resultado_visitante > 0))
      .sort((a, b) => {
        // Ordenar por jornada descendente
        const jA = parseInt(a.jornada) || 0;
        const jB = parseInt(b.jornada) || 0;
        if (jA !== jB) return jB - jA;

        // Si la jornada es igual (o nula), ordenar por fecha
        const dateA = this.parseFecha(a.fecha);
        const dateB = this.parseFecha(b.fecha);
        return dateB.getTime() - dateA.getTime();
      });
  }

  isOurTeam(teamName: string): boolean {
    if (!teamName) return false;
    const n = teamName.toLowerCase();
    return n.includes('saski') || n.includes('penguins') || n.includes('spbasket') || n.includes('sp basket');
  }

  getStanding(): EquipoClasificacion[] {
    return this.clasificacion;
  }

  isWin(match: Partido): boolean {
    if (match.resultado_local === null || match.resultado_visitante === null) return false;

    const teamId = this.competitionId;
    const isSaskiLocal = match.equipo_local.toLowerCase().includes('saski') ||
      match.equipo_local.toLowerCase().includes('penguins') ||
      match.equipo_local.toLowerCase().includes('spbasket') ||
      (teamId === 'sp-rosa' && match.equipo_local.toLowerCase().includes('rosa')) ||
      (teamId === 'sp-negro' && (match.equipo_local.toLowerCase().includes('negro') || match.equipo_local.toLowerCase().includes('black')));

    if (isSaskiLocal) {
      return (match.resultado_local || 0) > (match.resultado_visitante || 0);
    } else {
      return (match.resultado_visitante || 0) > (match.resultado_local || 0);
    }
  }

  goBack() {
    this.router.navigate(['/competiciones']);
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  getLogo(teamName: string): string {
    if (!teamName) return '/assets/images/logo-sp-pink.png';
    const normalized = teamName.toLowerCase().trim();

    if (normalized.includes('saski') || normalized.includes('penguins') || normalized.includes('spbasket')) {
      if (this.competitionId === 'sp-rosa' || normalized.includes('rosa')) return '/assets/images/logos/sp_rosa.jpg';
      return '/assets/images/logo-sp-pink.png';
    }
    return '/assets/images/logo-sp-pink.png';
  }

  formatFecha(fecha: string): string {
    if (!fecha || fecha === '?') return 'Pendiente';
    try {
      const parts = fecha.split('/');
      const day = parts[0];
      const month = parts[1];
      const year = parts[2] || '2026';

      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const mIdx = parseInt(month) - 1;
      return `${day} ${months[mIdx]} ${year}`;
    } catch (e) {
      return fecha;
    }
  }

  private parseFecha(fechaStr: string): Date {
    if (!fechaStr || fechaStr === '?') return new Date(0);
    const parts = fechaStr.split('/');
    if (parts.length < 2) return new Date(0);

    const d = parseInt(parts[0]);
    const m = parseInt(parts[1]);
    const y = parts[2] ? parseInt(parts[2]) : 2026;

    return new Date(y, m - 1, d);
  }
}
