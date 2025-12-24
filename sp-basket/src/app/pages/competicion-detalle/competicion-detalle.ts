import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Match {
  id: number;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  location: string;
  status: 'played' | 'upcoming';
  round: number;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
}

interface CompetitionDetail {
  id: string;
  name: string;
  color: string;
  season: string;
  image?: string; // Add optional image property
  matches: Match[];
}

@Component({
  selector: 'app-competicion-detalle',
  imports: [CommonModule],
  templateUrl: './competicion-detalle.html',
  styleUrls: ['./competicion-detalle.css']
})
export class CompeticionDetalleComponent implements OnInit {
  competition: CompetitionDetail | null = null;

  private competitionsData: { [key: string]: CompetitionDetail } = {
    'sp-rosa': {
      id: 'sp-rosa',
      name: 'SP ROSA - 1ª División Masculina',
      color: '#E6007E',
      season: '2024-2025',
      image: 'assets/images/comp-rosa-new.jpg',
      matches: [
        { id: 1, round: 1, date: '05/10/2025', time: '17:00', homeTeam: 'FISIOENERGIA CASTROBASKET', awayTeam: 'SP BASKET ROSA', homeScore: 68, awayScore: 48, location: 'PABELLON PACHI TORRE', status: 'played', homeTeamLogo: 'assets/images/logos/castrobasket.png', awayTeamLogo: 'assets/images/logos/sp_rosa.jpg' },
        { id: 2, round: 2, date: '10/10/2025', time: '21:00', homeTeam: 'SP BASKET ROSA', awayTeam: 'CBT TORRELAVEGA "A"', homeScore: 67, awayScore: 79, location: 'PABELLON JOSE ESCANDON', status: 'played', homeTeamLogo: 'assets/images/logos/sp_rosa.jpg', awayTeamLogo: 'assets/images/logos/torrelavega.png' },
        { id: 3, round: 3, date: '19/10/2025', time: '16:00', homeTeam: 'SP BASKET ROSA', awayTeam: 'C.D.E. PAS PIELAGOS', homeScore: 82, awayScore: 70, location: 'PABELLON JOSE ESCANDON', status: 'played', homeTeamLogo: 'assets/images/logos/sp_rosa.jpg', awayTeamLogo: 'assets/images/logos/pas_pielagos.jpg' },
        { id: 4, round: 4, date: '25/10/2025', time: '18:30', homeTeam: 'CB SOLARES', awayTeam: 'SP BASKET ROSA', homeScore: 85, awayScore: 86, location: 'PABELLON MIES DEL CORRO', status: 'played', homeTeamLogo: 'assets/images/logos/solares.jpg', awayTeamLogo: 'assets/images/logos/sp_rosa.jpg' },
        { id: 5, round: 5, date: '09/11/2025', time: '18:30', homeTeam: 'SP BASKET ROSA', awayTeam: 'VENTANAS ARSAN ASTILLERO A', homeScore: 78, awayScore: 68, location: 'PABELLON JOSE ESCANDON', status: 'played', homeTeamLogo: 'assets/images/logos/sp_rosa.jpg', awayTeamLogo: 'assets/images/logos/astillero.png' },
        { id: 6, round: 6, date: '15/11/2025', time: '16:30', homeTeam: 'LIS DATA SOLUTIONS BEZANA', awayTeam: 'SP BASKET ROSA', homeScore: 90, awayScore: 78, location: 'PABELLON JOSE ESCANDON', status: 'played', homeTeamLogo: 'assets/images/logos/bezana.jpg', awayTeamLogo: 'assets/images/logos/sp_rosa.jpg' },
        { id: 7, round: 7, date: '25/11/2025', time: '21:00', homeTeam: 'SP BASKET ROSA', awayTeam: 'FINANCIALBROK SEGUROS', homeScore: 49, awayScore: 69, location: 'PABELLON JOSE ESCANDON', status: 'played', homeTeamLogo: 'assets/images/logos/sp_rosa.jpg', awayTeamLogo: 'assets/images/logos/financialbrok.jpeg' },
        { id: 8, round: 8, date: '14/12/2025', time: '16:30', homeTeam: 'SP BASKET ROSA', awayTeam: 'CANTBASKET04', homeScore: 54, awayScore: 68, location: 'PABELLON JOSE ESCANDON', status: 'played', homeTeamLogo: 'assets/images/logos/sp_rosa.jpg', awayTeamLogo: 'assets/images/logos/cantbasket04.jpeg' },
        { id: 9, round: 9, date: '20/12/2025', time: '20:30', homeTeam: 'DAYGON SANTANDER', awayTeam: 'SP BASKET ROSA', homeScore: 73, awayScore: 81, location: 'PABELLON UCO LASTRA', status: 'played', homeTeamLogo: 'assets/images/logos/daygon.jpg', awayTeamLogo: 'assets/images/logos/sp_rosa.jpg' },
        { id: 10, round: 10, date: '18/01/2026', time: '16:30', homeTeam: 'SP BASKET ROSA', awayTeam: 'AMIDE', location: 'PABELLON ANGEL PELAYO', status: 'upcoming', homeTeamLogo: 'assets/images/logos/sp_rosa.jpg', awayTeamLogo: 'assets/images/logos/amide.jpeg' },
        { id: 11, round: 11, date: '01/02/2026', time: '16:30', homeTeam: 'SP BASKET ROSA', awayTeam: 'FISIOENERGIA CASTROBASKET', location: 'PABELLON ANGEL PELAYO', status: 'upcoming', homeTeamLogo: 'assets/images/logos/sp_rosa.jpg', awayTeamLogo: 'assets/images/logos/castrobasket.png' },
        { id: 12, round: 12, date: '07/02/2026', time: '18:30', homeTeam: 'CBT TORRELAVEGA "A"', awayTeam: 'SP BASKET ROSA', location: 'PABELLON HABANA VIEJA', status: 'upcoming', homeTeamLogo: 'assets/images/logos/torrelavega.png', awayTeamLogo: 'assets/images/logos/sp_rosa.jpg' },
        { id: 13, round: 13, date: '14/02/2026', time: '18:30', homeTeam: 'C.D.E. PAS PIELAGOS', awayTeam: 'SP BASKET ROSA', location: 'PABELLON ENRIQUE TAGLE', status: 'upcoming', homeTeamLogo: 'assets/images/logos/pas_pielagos.jpg', awayTeamLogo: 'assets/images/logos/sp_rosa.jpg' },
        { id: 14, round: 14, date: '01/03/2026', time: '16:30', homeTeam: 'SP BASKET ROSA', awayTeam: 'CB SOLARES', location: 'PABELLON ANGEL PELAYO', status: 'upcoming', homeTeamLogo: 'assets/images/logos/sp_rosa.jpg', awayTeamLogo: 'assets/images/logos/solares.jpg' },
        { id: 15, round: 15, date: '07/03/2026', time: '18:00', homeTeam: 'VENTANAS ARSAN ASTILLERO A', awayTeam: 'SP BASKET ROSA', location: 'PABELLON ANGEL FERNANDEZ', status: 'upcoming', homeTeamLogo: 'assets/images/logos/astillero.png', awayTeamLogo: 'assets/images/logos/sp_rosa.jpg' },
        { id: 16, round: 16, date: '15/03/2026', time: '16:30', homeTeam: 'SP BASKET ROSA', awayTeam: 'LIS DATA SOLUTIONS BEZANA', location: 'PABELLON ANGEL PELAYO', status: 'upcoming', homeTeamLogo: 'assets/images/logos/sp_rosa.jpg', awayTeamLogo: 'assets/images/logos/bezana.jpg' },
        { id: 17, round: 17, date: '21/03/2026', time: '18:30', homeTeam: 'FINANCIALBROK SEGUROS', awayTeam: 'SP BASKET ROSA', location: 'PABELLON MONTE', status: 'upcoming', homeTeamLogo: 'assets/images/logos/financialbrok.jpeg', awayTeamLogo: 'assets/images/logos/sp_rosa.jpg' },
        { id: 18, round: 18, date: '12/04/2026', time: '12:00', homeTeam: 'CANTBASKET04', awayTeam: 'SP BASKET ROSA', location: 'PABELLON MARCELINO BOTIN', status: 'upcoming', homeTeamLogo: 'assets/images/logos/cantbasket04.jpeg', awayTeamLogo: 'assets/images/logos/sp_rosa.jpg' },
        { id: 19, round: 19, date: '19/04/2026', time: '16:30', homeTeam: 'SP BASKET ROSA', awayTeam: 'DAYGON SANTANDER', location: 'PABELLON ANGEL PELAYO', status: 'upcoming', homeTeamLogo: 'assets/images/logos/sp_rosa.jpg', awayTeamLogo: 'assets/images/logos/daygon.jpg' },
        { id: 20, round: 20, date: '25/04/2026', time: '20:30', homeTeam: 'AMIDE', awayTeam: 'SP BASKET ROSA', location: 'PABELLON MATILDE DE LA TORRE', status: 'upcoming', homeTeamLogo: 'assets/images/logos/amide.jpeg', awayTeamLogo: 'assets/images/logos/sp_rosa.jpg' }
      ]
    },
    'sp-blanco': {
      id: 'sp-blanco',
      name: 'SP BLANCO - 2ª División',
      color: '#666666',
      season: '2024-2025',
      matches: [
        { id: 1, round: 1, date: '16 Sep 2024', time: '11:00', homeTeam: 'SP Blanco', awayTeam: 'CB Solares', homeScore: 65, awayScore: 58, location: 'Pabellón Municipal', status: 'played' },
        { id: 2, round: 2, date: '23 Sep 2024', time: '12:00', homeTeam: 'CB Revilla', awayTeam: 'SP Blanco', homeScore: 62, awayScore: 67, location: 'Pabellón Revilla', status: 'played' },
        { id: 3, round: 3, date: '30 Sep 2024', time: '11:30', homeTeam: 'SP Blanco', awayTeam: 'CB Sámano', homeScore: 71, awayScore: 64, location: 'Pabellón Municipal', status: 'played' },
        { id: 4, round: 4, date: '7 Oct 2024', time: '10:00', homeTeam: 'CB Penagos', awayTeam: 'SP Blanco', homeScore: 69, awayScore: 63, location: 'Pabellón Penagos', status: 'played' },
        { id: 5, round: 5, date: '14 Oct 2024', time: '11:00', homeTeam: 'SP Blanco', awayTeam: 'CB Meruelo', homeScore: 74, awayScore: 68, location: 'Pabellón Municipal', status: 'played' },
        { id: 6, round: 6, date: '21 Oct 2024', time: '12:30', homeTeam: 'CB Escalante', awayTeam: 'SP Blanco', homeScore: 60, awayScore: 72, location: 'Pabellón Escalante', status: 'played' },
        { id: 7, round: 7, date: '28 Oct 2024', time: '11:00', homeTeam: 'SP Blanco', awayTeam: 'CB Bareyo', homeScore: 66, awayScore: 69, location: 'Pabellón Municipal', status: 'played' },
        { id: 8, round: 8, date: '4 Nov 2024', time: '10:30', homeTeam: 'CB Arnuero', awayTeam: 'SP Blanco', homeScore: 65, awayScore: 70, location: 'Pabellón Arnuero', status: 'played' },
        { id: 9, round: 9, date: '11 Nov 2024', time: '11:00', homeTeam: 'SP Blanco', awayTeam: 'CB Ribamontán', homeScore: 73, awayScore: 67, location: 'Pabellón Municipal', status: 'played' },
        { id: 10, round: 10, date: '18 Nov 2024', time: '12:00', homeTeam: 'CB Santillana', awayTeam: 'SP Blanco', homeScore: 68, awayScore: 71, location: 'Pabellón Santillana', status: 'played' },
        { id: 11, round: 11, date: '25 Nov 2024', time: '11:00', homeTeam: 'SP Blanco', awayTeam: 'CB Miengo', homeScore: 70, awayScore: 64, location: 'Pabellón Municipal', status: 'played' },
        { id: 12, round: 12, date: '2 Dic 2024', time: '10:00', homeTeam: 'CB Polanco', awayTeam: 'SP Blanco', homeScore: 72, awayScore: 69, location: 'Pabellón Polanco', status: 'played' },
        { id: 13, round: 13, date: '9 Dic 2024', time: '11:00', homeTeam: 'SP Blanco', awayTeam: 'CB Torrelavega B', homeScore: 75, awayScore: 62, location: 'Pabellón Municipal', status: 'played' },
        { id: 14, round: 14, date: '16 Dic 2024', time: '12:30', homeTeam: 'CB Cartes', awayTeam: 'SP Blanco', homeScore: 64, awayScore: 73, location: 'Pabellón Cartes', status: 'played' },
        { id: 15, round: 15, date: '22 Dic 2024', time: '11:00', homeTeam: 'SP Blanco', awayTeam: 'CB Torrelavega', location: 'Pabellón Municipal', status: 'upcoming' },
        { id: 16, round: 16, date: '13 Ene 2025', time: '12:00', homeTeam: 'CB Solares', awayTeam: 'SP Blanco', location: 'Pabellón Solares', status: 'upcoming' }
      ]
    },
    'sp-negro': {
      id: 'sp-negro',
      name: 'SP NEGRO - 2ª División Masculina',
      color: '#1A1A1A',
      season: '2024-2025',
      image: 'assets/images/comp-negro-new.jpg',
      matches: [
        { id: 1, round: 1, date: '04/10/2025', time: '18:30', homeTeam: 'SPBASKET NEGRO', awayTeam: 'BALONCESTO CAYON', homeScore: 73, awayScore: 60, location: 'PABELLON ANGEL PELAYO', status: 'played', homeTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/C8mXlxiiZ2pgj1NZ.jpg', awayTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/yipA00mAa8oVuQbi.jpeg' },
        { id: 2, round: 2, date: '13/10/2025', time: '20:30', homeTeam: 'SPBASKET NEGRO', awayTeam: 'CANTBASKET04 U18', homeScore: 57, awayScore: 86, location: 'PABELLON MARCOS BERMEJO', status: 'played', homeTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/C8mXlxiiZ2pgj1NZ.jpg', awayTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/5L0T27FCx3EEndHb.jpeg' },
        { id: 3, round: 3, date: '18/10/2025', time: '18:30', homeTeam: 'RIBAMONTÁN AL MAR', awayTeam: 'SPBASKET NEGRO', homeScore: 41, awayScore: 59, location: 'PABELLON LATAS', status: 'played', homeTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/A4wED7wZH5ERIUeN.jpeg', awayTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/C8mXlxiiZ2pgj1NZ.jpg' },
        { id: 4, round: 4, date: '26/10/2025', time: '16:30', homeTeam: 'SPBASKET NEGRO', awayTeam: 'INTERMODAL SEA SOLUTIONS', homeScore: 59, awayScore: 76, location: 'PABELLON MARCOS BERMEJO', status: 'played', homeTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/C8mXlxiiZ2pgj1NZ.jpg', awayTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/bjqgUDurfgjiiPYv.jpeg' },
        { id: 5, round: 5, date: '08/11/2025', time: '18:30', homeTeam: 'CLUB BALONCESTO SANTILLANA', awayTeam: 'SPBASKET NEGRO', homeScore: 77, awayScore: 60, location: 'PABELLON SANTILLANA DEL MAR', status: 'played', homeTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/CIX91aTQ7CLA97PH.jpeg', awayTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/C8mXlxiiZ2pgj1NZ.jpg' },
        { id: 6, round: 6, date: '15/11/2025', time: '18:30', homeTeam: 'SPBASKET NEGRO', awayTeam: 'TREFILERIAS QUIJANO CB CORRALES', homeScore: 65, awayScore: 39, location: 'PABELLON MARCOS BERMEJO', status: 'played', homeTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/C8mXlxiiZ2pgj1NZ.jpg', awayTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/153lKwRqZMWyGeJr.jpg' },
        { id: 7, round: 7, date: '23/11/2025', time: '19:00', homeTeam: 'MIMOONDO- TVGA', awayTeam: 'SPBASKET NEGRO', homeScore: 76, awayScore: 41, location: 'PABELLON MARIA PARDO', status: 'played', homeTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/bK7F3s2dyYp3QFEM.jpg', awayTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/C8mXlxiiZ2pgj1NZ.jpg' },
        { id: 8, round: 8, date: '30/11/2025', time: '19:00', homeTeam: 'BALONCESTO CAYON', awayTeam: 'SPBASKET NEGRO', homeScore: 50, awayScore: 101, location: 'PABELLON GERARDO DIEGO', status: 'played', homeTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/yipA00mAa8oVuQbi.jpeg', awayTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/C8mXlxiiZ2pgj1NZ.jpg' },
        { id: 9, round: 9, date: '23/12/2025', time: '20:30', homeTeam: 'CANTBASKET04 U18', awayTeam: 'SPBASKET NEGRO', homeScore: 88, awayScore: 57, location: 'PABELLON SAGARDIA', status: 'played', homeTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/5L0T27FCx3EEndHb.jpeg', awayTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/C8mXlxiiZ2pgj1NZ.jpg' },
        { id: 10, round: 10, date: '20/12/2025', time: '18:30', homeTeam: 'SPBASKET NEGRO', awayTeam: 'RIBAMONTÁN AL MAR', homeScore: 81, awayScore: 67, location: 'PABELLON ANGEL PELAYO', status: 'played', homeTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/C8mXlxiiZ2pgj1NZ.jpg', awayTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/A4wED7wZH5ERIUeN.jpeg' },
        { id: 11, round: 11, date: '17/01/2026', time: '18:30', homeTeam: 'INTERMODAL SEA SOLUTIONS', awayTeam: 'SPBASKET NEGRO', location: 'PABELLON MONTE', status: 'upcoming', homeTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/bjqgUDurfgjiiPYv.jpeg', awayTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/C8mXlxiiZ2pgj1NZ.jpg' },
        { id: 12, round: 12, date: '31/01/2026', time: '18:30', homeTeam: 'SPBASKET NEGRO', awayTeam: 'CLUB BALONCESTO SANTILLANA', location: 'PABELLON ANGEL PELAYO', status: 'upcoming', homeTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/C8mXlxiiZ2pgj1NZ.jpg', awayTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/CIX91aTQ7CLA97PH.jpeg' },
        { id: 13, round: 13, date: '07/02/2026', time: '18:45', homeTeam: 'TREFILERIAS QUIJANO CB CORRALES', awayTeam: 'SPBASKET NEGRO', location: 'PABELLON LOS CORRALES', status: 'upcoming', homeTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/153lKwRqZMWyGeJr.jpg', awayTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/C8mXlxiiZ2pgj1NZ.jpg' },
        { id: 14, round: 14, date: '14/02/2026', time: '18:30', homeTeam: 'SPBASKET NEGRO', awayTeam: 'MIMOONDO- TVGA', location: 'PABELLON ANGEL PELAYO', status: 'upcoming', homeTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/C8mXlxiiZ2pgj1NZ.jpg', awayTeamLogo: 'https://d206q8529sjqpk.cloudfront.net/recursos/imatges/multimedia/bK7F3s2dyYp3QFEM.jpg' }
      ]
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    const competitionId = this.route.snapshot.paramMap.get('id');
    if (competitionId && this.competitionsData[competitionId]) {
      this.competition = this.competitionsData[competitionId];
    } else {
      this.router.navigate(['/competiciones']);
    }
  }

  goBack() {
    this.router.navigate(['/competiciones']);
  }

  getWins(): number {
    if (!this.competition) return 0;
    return this.competition.matches.filter(m =>
      m.status === 'played' &&
      ((m.homeTeam.includes('SP') && m.homeScore! > m.awayScore!) ||
        (m.awayTeam.includes('SP') && m.awayScore! > m.homeScore!))
    ).length;
  }

  getLosses(): number {
    if (!this.competition) return 0;
    return this.competition.matches.filter(m =>
      m.status === 'played' &&
      ((m.homeTeam.includes('SP') && m.homeScore! < m.awayScore!) ||
        (m.awayTeam.includes('SP') && m.awayScore! < m.homeScore!))
    ).length;
  }

  getPlayedMatches(): Match[] {
    return this.competition?.matches.filter(m => m.status === 'played') || [];
  }

  getUpcomingMatches(): Match[] {
    return this.competition?.matches.filter(m => m.status === 'upcoming') || [];
  }

  isWin(match: Match): boolean {
    return (match.homeTeam.includes('SP') && match.homeScore! > match.awayScore!) ||
      (match.awayTeam.includes('SP') && match.awayScore! > match.homeScore!);
  }
}
