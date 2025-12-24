import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Competition {
  id: string;
  name: string;
  color: string;
  image: string; // Nueva propiedad para la imagen
  matches: number;
  wins: number;
  losses: number;
  nextMatch?: {
    teams: string;
    date: string;
    location: string;
  };
}

@Component({
  selector: 'app-competiciones',
  imports: [CommonModule],
  templateUrl: './competiciones.html',
  styleUrls: ['./competiciones.css']
})
export class CompeticionesComponent {
  constructor(private router: Router) { }

  competitions: Competition[] = [
    {
      id: 'sp-rosa',
      name: 'SP ROSA - 1ª División Masculina',
      color: 'linear-gradient(135deg, #E6007E 0%, #C0006A 100%)',
      image: 'assets/images/comp-rosa-new.jpg',
      matches: 9,
      wins: 3,
      losses: 6,
      nextMatch: {
        teams: 'SP Rosa vs AMIDE',
        date: 'Domingo 18 Enero, 16:30',
        location: 'Pabellón Angel Pelayo'
      }
    },
    {
      id: 'sp-negro',
      name: 'SP NEGRO - 2ª División Masculina',
      color: 'linear-gradient(135deg, #2D2D2D 0%, #1A1A1A 100%)',
      image: 'assets/images/comp-negro-new.jpg',
      matches: 10,
      wins: 5,
      losses: 5,
      nextMatch: {
        teams: 'Intermodal Sea Solutions vs SP Negro',
        date: 'Sábado 17 Enero, 18:30',
        location: 'Pabellón Monte'
      }
    }
  ];

  navigateToCompetition(competitionId: string) {
    this.router.navigate(['/competiciones', competitionId]);
  }
}
