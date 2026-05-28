import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../components/page-header/page-header';

interface Player {
  id: number;
  nombre: string;
  apellidos: string;
  numero: number | string;
  posicion: string;
  foto: string;
  cromoFoto: string;
  tipo: 'jugador' | 'tecnico';
  rol?: string;
  frase: string;
  audio?: string;
}

interface Team {
  id: number;
  nombre: string;
  categoria: string;
  foto: string;
  jugadores: Player[];
}

@Component({
  selector: 'app-equipos',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  templateUrl: './equipos.html',
  styleUrl: './equipos.css'
})
export class EquiposComponent implements OnInit {
  selectedTeam: Team | null = null;
  flippedStates: Map<number | string, boolean> = new Map();

  private frasesMotivadoras = [
    "El esfuerzo de hoy es el éxito de mañana 💪",
    "Nunca subestimes el corazón de un campeón 🏆",
    "La actitud lo es todo en la cancha 🔥",
    "Juntos somos imparables 🤝",
    "El talento gana partidos, el equipo gana campeonatos ⭐",
    "Cada entrenamiento me hace más fuerte 💥",
    "La victoria se construye con trabajo diario 🏀"
  ];

  teams: Team[] = [];

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.teams = [
      {
        id: 2,
        nombre: 'SP Rosa',
        categoria: 'Primera División Autonómica',
        foto: '/assets/images/team-senior-fem.jpg',
        jugadores: this.generateSPRosaPlayers()
      },
      {
        id: 1,
        nombre: 'SP Negro',
        categoria: '2ª División Autonómica',
        foto: '/assets/images/team-sp-negro.jpg',
        jugadores: this.generateSPNegroPlayers()
      },
      {
        id: 3,
        nombre: 'SP Pioneers',
        categoria: 'Equipo Inclusivo',
        foto: '/assets/images/team_pioneers.JPG',
        jugadores: this.generateSPPioneersPlayers()
      }
    ];
  }

  selectTeam(team: Team) {
    this.selectedTeam = team;
    this.flippedStates.clear();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  backToTeams() {
    this.selectedTeam = null;
    this.flippedStates.clear();
  }

  toggleFlip(event: Event) {
    const card = (event.currentTarget as HTMLElement).querySelector('.player-card');
    if (card) {
      card.classList.toggle('flipped');
    }
  }

  playAudio(event: Event, player: Player) {
    event.stopPropagation();
    if (player.audio) {
      const audio = new Audio(player.audio);
      audio.play().catch(err => console.error('Error playing audio:', err));
    }
  }

  getJugadores() {
    return this.selectedTeam ? this.selectedTeam.jugadores.filter(p => p.tipo === 'jugador') : [];
  }

  getTecnicos() {
    return this.selectedTeam ? this.selectedTeam.jugadores.filter(p => p.tipo === 'tecnico') : [];
  }

  private generateSPNegroPlayers(): Player[] {
    const players: Player[] = [];
    const spNegroData = [
      { id: 1, cromoNum: 31, nombre: 'Jesús Antonio', apellidos: 'Jiménez Contreras', numero: 81, posicion: 'Ala-Pívot' },
      { id: 2, cromoNum: 32, nombre: 'Ángel Marcelo', apellidos: 'Fernández García', numero: 21, posicion: 'Base' },
      { id: 3, cromoNum: 33, nombre: 'Pergentino', apellidos: 'Edjang Nchama', numero: 30, posicion: 'Alero' },
      { id: 4, cromoNum: 37, nombre: 'Daniel', apellidos: 'Puente Fernández', numero: 14, posicion: 'Base' },
      { id: 6, cromoNum: 39, nombre: 'Hugo', apellidos: 'Piñeiro Cotera', numero: 16, posicion: 'Alero' },
      { id: 7, cromoNum: 40, nombre: 'Samuel', apellidos: 'Benito Gutiérrez', numero: 97, posicion: 'Alero' },
      { id: 8, cromoNum: 41, nombre: 'Iván', apellidos: 'Abascal Díez', numero: 29, posicion: 'Pívot' },
      { id: 9, cromoNum: 42, nombre: 'Diego', apellidos: 'Gutiérrez Rodríguez', numero: 95, posicion: 'Alero' },
      { id: 10, cromoNum: 43, nombre: 'Pablo', apellidos: 'Martínez Fernández', numero: 69, posicion: 'Ala-Pívot' },
      { id: 11, cromoNum: 44, nombre: 'Rodrigo', apellidos: 'Oxinalde Pérez', numero: 9, posicion: 'Ala-Pívot' },
      { id: 12, cromoNum: 45, nombre: 'Ricardo', apellidos: 'Fraguas Bringas', numero: 33, posicion: 'Pívot', audio: '/assets/audio/richiaudio.ogg' },
      { id: 13, cromoNum: 46, nombre: 'José', apellidos: 'Pacho Ubis', numero: 31, posicion: 'Escolta' },
      { id: 14, cromoNum: 47, nombre: 'Hugo', apellidos: 'Michelena García', numero: 23, posicion: 'Pívot' },
      { id: 15, cromoNum: 48, nombre: 'Juan', apellidos: 'Verde Merayo', numero: 50, posicion: 'Escolta' },
      { id: 16, cromoNum: 49, nombre: 'Mario', apellidos: 'Álvarez Pérez', numero: 13, posicion: 'Ala-Pívot' },
      { id: 17, cromoNum: 50, nombre: 'Pablo', apellidos: 'Elizalde Roldán', numero: 0, posicion: 'Alero' }
    ];

    spNegroData.forEach((p, index) => {
      players.push({
        id: typeof p.id === 'string' ? parseInt(p.id) : p.id,
        nombre: p.nombre,
        apellidos: p.apellidos,
        numero: p.numero,
        posicion: p.posicion,
        foto: String(p.cromoNum) === 'default' ? 'assets/images/logo-sp-pink.png' : `assets/images/cromos/spnegro/${p.cromoNum}.png`,
        cromoFoto: String(p.cromoNum) === 'default' ? 'assets/images/logo-sp-pink.png' : `assets/images/cromos/spnegro/${p.cromoNum}.png`,
        tipo: 'jugador',
        frase: this.frasesMotivadoras[index % this.frasesMotivadoras.length],
        audio: (p as any).audio
      });
    });

    // Técnicos
    players.push({
      id: 101,
      nombre: 'Diego',
      apellidos: 'Alonso Antolín',
      numero: 'C',
      posicion: 'Entrenador Principal',
      foto: 'assets/images/cromos/tecnicos/diego_alonso_coach.png',
      cromoFoto: 'assets/images/cromos/tecnicos/diego_alonso_coach.png',
      tipo: 'tecnico',
      rol: 'Entrenador Principal',
      frase: 'El talento gana partidos, pero el trabajo en equipo gana campeonatos.'
    });

    players.push({
      id: 102,
      nombre: 'Enrique',
      apellidos: 'Pereda',
      numero: 'AC',
      posicion: 'Entrenador Asistente',
      foto: 'assets/images/cromos/tecnicos/kike_pereda_coach.png',
      cromoFoto: 'assets/images/cromos/tecnicos/kike_pereda_coach.png',
      tipo: 'tecnico',
      rol: 'Segundo Entrenador',
      frase: 'La defensa es la clave de la victoria.'
    });

    return players;
  }

  private generateSPRosaPlayers(): Player[] {
    const players: Player[] = [];
    const spRosaData = [
      { id: 18, cromoNum: 'default', nombre: 'Javier', apellidos: 'Martínez Fernández', numero: '00', posicion: 'Alero' },
      { id: 19, cromoNum: 'default', nombre: 'Gaël', apellidos: 'Fournet Pérez', numero: '3', posicion: 'Pívot' },
      { id: 2, cromoNum: 27, nombre: 'Diego', apellidos: 'Alonso Antolín', numero: 5, posicion: 'Alero' },
      { id: 3, cromoNum: 28, nombre: 'Adrián', apellidos: 'Cossío Bolinaga', numero: 7, posicion: 'Alero' },
      { id: 4, cromoNum: 29, nombre: 'Rubén', apellidos: 'Roiz Rebollar', numero: 18, posicion: 'Ala-Pívot' },
      { id: 5, cromoNum: 30, nombre: 'John James', apellidos: 'Riascos', numero: 47, posicion: 'Pívot' },
      { id: 6, cromoNum: 31, nombre: 'Jesús', apellidos: 'Jiménez Contreras', numero: 81, posicion: 'Ala-Pívot' },
      { id: 7, cromoNum: 32, nombre: 'Ángel Marcelo', apellidos: 'Fernández García', numero: 21, posicion: 'Base' },
      { id: 8, cromoNum: 33, nombre: 'Pergentino', apellidos: 'Edjang Nchama', numero: 30, posicion: 'Alero' },
      { id: 9, cromoNum: 34, nombre: 'Daniel', apellidos: 'García Salinas', numero: 12, posicion: 'Pívot' },
      { id: 10, cromoNum: 35, nombre: 'Diego', apellidos: 'Fernández Ruiz', numero: 10, posicion: 'Alero' },
      { id: 11, cromoNum: 36, nombre: 'Diego', apellidos: 'Amayuelas López', numero: 11, posicion: 'Base' }
    ];

    spRosaData.forEach((p, index) => {
      players.push({
        id: p.id,
        nombre: p.nombre,
        apellidos: p.apellidos,
        numero: p.numero,
        posicion: p.posicion,
        foto: String(p.cromoNum) === 'default' ? 'assets/images/logo-sp-pink.png' : `assets/images/cromos/sprosa/${p.cromoNum}.png`,
        cromoFoto: String(p.cromoNum) === 'default' ? 'assets/images/logo-sp-pink.png' : `assets/images/cromos/sprosa/${p.cromoNum}.png`,
        tipo: 'jugador',
        frase: this.frasesMotivadoras[(index + 3) % this.frasesMotivadoras.length]
      });
    });

    // Técnicos SP Rosa
    players.push({
      id: 200,
      nombre: 'Enrique',
      apellidos: 'Pereda',
      numero: 'C',
      posicion: 'Entrenador Principal',
      foto: 'assets/images/cromos/tecnicos/kike_pereda_coach.png',
      cromoFoto: 'assets/images/cromos/tecnicos/kike_pereda_coach.png',
      tipo: 'tecnico',
      rol: 'Entrenador Principal',
      frase: 'La defensa es la clave de la victoria.'
    });

    players.push({
      id: 201,
      nombre: 'Samu',
      apellidos: 'Benito',
      numero: 'C',
      posicion: 'Coach',
      foto: 'assets/images/logo-sp-pink.png',
      cromoFoto: 'assets/images/logo-sp-pink.png',
      tipo: 'tecnico',
      rol: 'Segundo Entrenador',
      frase: 'El trabajo duro supera al talento cuando el talento no trabaja duro.'
    });

    players.push({
      id: 202,
      nombre: 'Diana',
      apellidos: 'Coso',
      numero: 'D',
      posicion: 'Delegada',
      foto: 'assets/images/logo-sp-pink.png',
      cromoFoto: 'assets/images/logo-sp-pink.png',
      tipo: 'tecnico',
      rol: 'Delegada',
      frase: 'La organización es la base de todo gran equipo.'
    });

    return players;
  }

  private generateSPPioneersPlayers(): Player[] {
    const pioneersData = [
      { id: "1", nombre: "Lis", numero: "1", posicion: "Jugadora", lema: "Precisión, talento y buena actitud desde la línea de tiros libres.", foto: "/assets/pioneers_clean/pioneer-1-lis.jpg" },
      { id: "2", nombre: "Miguel", numero: "2", posicion: "Jugador", lema: "Alegre, apasionado y siempre dando el 100% en la cancha.", foto: "/assets/pioneers_clean/pioneer-2-miguel.jpg" },
      { id: "3", nombre: "Hugo", numero: "3", posicion: "Jugador", lema: "Cada partido es una oportunidad para crecer y disfrutar.", foto: "/assets/pioneers_clean/pioneer-hugo.jpg" },
      { id: "4", nombre: "Antonio", numero: "4", posicion: "Jugador", lema: "Risueño y alegre, contagiando felicidad al equipo.", foto: "/assets/pioneers_clean/pioneer-4-antonio.jpg" },
      { id: "5", nombre: "Julen", numero: "5", posicion: "Jugador", lema: "Mejora en cada partido y no deja de crecer.", foto: "/assets/pioneers_clean/pioneer-5-mejora.jpg" },
      { id: "6", nombre: "Daniel", numero: "6", posicion: "Jugador", lema: "Nuestro jugador más joven. Cada día crece y brilla.", foto: "/assets/pioneers_clean/pioneer-6-daniel.jpg" },
      { id: "7", nombre: "Gabi", numero: "7", posicion: "Jugador", lema: "Ejemplo de esfuerzo y constancia, siempre con energía.", foto: "/assets/pioneers_clean/pioneer-7-tenemos.jpg" },
      { id: "8", nombre: "Pablo", numero: "8", posicion: "Jugador", lema: "Con paso firme y a su propio ritmo, sumando al equipo.", foto: "/assets/pioneers_clean/pioneer-8-pablo.jpg" },
      { id: "9", nombre: "Leonid", numero: "9", posicion: "Jugador", lema: "Siempre en movimiento y con ocurrencias que animan.", foto: "/assets/pioneers_clean/pioneer-9-siempre.jpg" },
      { id: "10", nombre: "Hugo", numero: "10", posicion: "Jugador", lema: "Pieza clave, gran corazón dentro y fuera de la cancha.", foto: "/assets/pioneers_clean/pioneer-10-hugo.jpg" },
      { id: "11", nombre: "David", numero: "11", posicion: "Jugador", lema: "Sigue creciendo y aprendiendo en cada paso. Pura actitud.", foto: "/assets/pioneers_clean/pioneer-11-david.jpg" },
      { id: "12", nombre: "Mustafa", numero: "12", posicion: "Jugador", lema: "Ejemplo de superación y constancia inagotable.", foto: "/assets/pioneers_clean/pioneer-12-ejemplo.jpg" },
      { id: "14", nombre: "Javi", numero: "14", posicion: "Jugador", lema: "Siempre con buena actitud y ganas de dar lo mejor.", foto: "/assets/pioneers_clean/pioneer-14-javi.jpg" },
      { id: "15", nombre: "Elenita", numero: "15", posicion: "Jugadora", lema: "Pequeña pero matona. ¡Lista para brillar!", foto: "/assets/pioneers_clean/pioneer-15-elenita.jpg" },
      { id: "16", nombre: "Laura", numero: "16", posicion: "Jugadora", lema: "Trabajadora, guerrera y puro corazón en la cancha.", foto: "/assets/pioneers_clean/pioneer-16-laura.jpg" },
      { id: "17", nombre: "Magdalena", numero: "17", posicion: "Jugadora", lema: "Atenta, compañera y siempre dispuesta a ayudar.", foto: "/assets/pioneers_clean/pioneer-17-atenta.jpg" },
      { id: "18", nombre: "Paula", numero: "18", posicion: "Jugadora", lema: "Un torbellino de energía. Corre, sonríe y contagia.", foto: "/assets/pioneers_clean/pioneer-18-paula.jpg" },
      { id: "18_B", nombre: "Alberto", numero: "18", posicion: "Jugador", lema: "Alegre y con mucha energía, siempre con una sonrisa.", foto: "/assets/pioneers_clean/pioneer-18-alberto.jpg" },
      { id: "20", nombre: "Dani", numero: "20", posicion: "Capitán", lema: "Talento, potencia y compañerismo en estado puro.", foto: "/assets/pioneers_clean/pioneer-20-nuestro.jpg" },
      { id: "23", nombre: "Marco", numero: "23", posicion: "Jugador", lema: "Buen jugador y compañero de primera. Esfuerzo total.", foto: "/assets/pioneers_clean/pioneer-23-buen.jpg" },
      { id: "29", nombre: "Mónica", numero: "29", posicion: "Jugadora", lema: "Aprendiendo a su ritmo, siempre firme y con carácter.", foto: "/assets/pioneers_clean/pioneer-29-mnica.jpg" },
      { id: "30", nombre: "Manu", numero: "30", posicion: "Jugador", lema: "Siempre con una sonrisa y aprendiendo sin parar.", foto: "/assets/pioneers_clean/pioneer-30-manu.jpg" }
    ];

    return pioneersData.map(p => ({
      id: Math.floor(Math.random() * 10000), // Simple ID generation
      nombre: p.nombre,
      apellidos: '',
      numero: p.numero,
      posicion: p.posicion,
      foto: p.foto,
      cromoFoto: p.foto,
      tipo: 'jugador',
      frase: p.lema
    }));
  }
}
