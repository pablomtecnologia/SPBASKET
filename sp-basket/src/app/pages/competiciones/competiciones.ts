import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../components/page-header/page-header';
import { Router } from '@angular/router';
import { CompetitionService } from '../../services/competition.service';
import { forkJoin, of, timeout } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface Competition {
  id: string;
  name: string;
  color: string;
  image: string;
  matches: number;
  wins: number;
  losses: number;
  position: number;
  points: number;
  nextMatch?: {
    teams: string;
    date: string;
    location: string;
  };
}

@Component({
  selector: 'app-competiciones',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  templateUrl: './competiciones.html',
  styleUrls: ['./competiciones.css']
})
export class CompeticionesComponent implements OnInit {
  competitions: Competition[] = [
    {
      id: 'sp-rosa',
      name: 'SP BASKET ROSA - 1ª Div. Masculina',
      color: 'linear-gradient(135deg, #E6007E 0%, #C0006A 100%)',
      image: '/assets/images/comp-rosa-v4.jpg',
      matches: 12,
      wins: 5,
      losses: 7,
      position: 6,
      points: 17
    },
    {
      id: 'sp-negro',
      name: 'SP BASKET NEGRO - 2ª Div. Masculina',
      color: 'linear-gradient(135deg, #2D2D2D 0%, #1A1A1A 100%)',
      image: '/assets/images/comp-negro-v4.jpg',
      matches: 13,
      wins: 7,
      losses: 6,
      position: 4,
      points: 20
    }
  ];

  loading = false;

  constructor(
    private router: Router,
    private competitionService: CompetitionService
  ) { }

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    // No mostramos loading porque ya tenemos datos iniciales
    // Solo actualizamos en segundo plano

    // Cargar datos de ambos equipos desde la base de datos
    forkJoin({
      rosaData: this.competitionService.getCompletaData('sp-rosa').pipe(
        timeout(8000),
        catchError(err => {
          console.error('❌ Error cargando sp-rosa:', err);
          return of(null);
        })
      ),
      negroData: this.competitionService.getCompletaData('sp-negro').pipe(
        timeout(8000),
        catchError(err => {
          console.error('❌ Error cargando sp-negro:', err);
          return of(null);
        })
      )
    }).subscribe({
      next: (result) => {
        console.log('📊 Datos de competiciones recibidos:', result);
        if (result.rosaData) this.updateCompetitionStats('sp-rosa', result.rosaData);
        if (result.negroData) this.updateCompetitionStats('sp-negro', result.negroData);
        // No cambiamos loading porque nunca lo activamos
      },
      error: (err) => {
        console.error('❌ Error crítico o timeout en forkJoin:', err);
        // Mantenemos los datos iniciales que ya se están mostrando
      }
    });
  }

  updateCompetitionStats(teamId: string, data: any) {
    const comp = this.competitions.find(c => c.id === teamId);
    if (!comp || !data) return;

    // Encontrar nuestro equipo en la clasificación
    const ourTeam = data.clasificacion.find((team: any) => {
      const name = team.team_name.toUpperCase();
      return (teamId === 'sp-rosa' && name.includes('ROSA')) ||
        (teamId === 'sp-negro' && name.includes('NEGRO'));
    });

    if (ourTeam) {
      comp.position = ourTeam.position || 0;
      comp.matches = ourTeam.played || 0;
      comp.wins = ourTeam.won || 0;
      comp.losses = ourTeam.lost || 0;
      comp.points = ourTeam.points || 0;
    } else if (teamId === 'sp-rosa') {
      // Fallback rosa
      comp.position = 4;
      comp.matches = 11;
      comp.wins = 7;
      comp.losses = 4;
      comp.points = 18;
    } else if (teamId === 'sp-negro') {
      // Fallback negro
      comp.position = 2;
      comp.matches = 8;
      comp.wins = 6;
      comp.losses = 2;
      comp.points = 14;
    }

    // Obtener próximo partido
    const upcomingMatches = data.partidos.filter((p: any) => (p.estado === 'upcoming' || p.status === 'upcoming'));
    if (upcomingMatches.length > 0) {
      const nextMatchData = upcomingMatches.sort((a: any, b: any) => {
        const jornadaA = parseInt(a.jornada || a.round) || 0;
        const jornadaB = parseInt(b.jornada || b.round) || 0;
        return jornadaA - jornadaB;
      })[0];

      const home = nextMatchData.equipo_local ?? nextMatchData.home_team;
      const away = nextMatchData.equipo_visitante ?? nextMatchData.away_team;
      const date = nextMatchData.fecha ?? nextMatchData.match_date;
      const time = nextMatchData.hora ?? nextMatchData.match_time;

      comp.nextMatch = {
        teams: `${home} vs ${away}`,
        date: this.formatFecha(date, time),
        location: nextMatchData.pabellon ?? nextMatchData.location
      };
    }
  }

  formatFecha(fecha: string, hora: string): string {
    if (!fecha) return '';
    const [day, month, year] = fecha.split('/');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthName = months[parseInt(month) - 1] || month;
    return `${day} ${monthName}${hora ? ` ${hora}` : ''}`;
  }

  navigateToCompetition(competitionId: string) {
    this.router.navigate(['/competiciones', competitionId]);
  }
}
