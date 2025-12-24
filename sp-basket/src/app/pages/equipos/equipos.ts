import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Player {
  id: number;
  nombre: string;
  apellidos: string;
  numero: number | string;
  posicion: string;
  foto: string;
  cromoFoto: string; // Foto del cromo real
  tipo: 'jugador' | 'tecnico';
  rol?: string;
  frase: string; // Frase motivadora
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
  imports: [CommonModule],
  templateUrl: './equipos.html',
  styleUrls: ['./equipos.css']
})
export class EquiposComponent {
  selectedTeam: Team | null = null;

  // Frases motivadoras genéricas para asignar
  private frasesMotivadoras = [
    "El esfuerzo de hoy es el éxito de mañana 💪",
    "Nunca subestimes el corazón de un campeón 🏆",
    "La actitud lo es todo en la cancha 🔥",
    "Juntos somos imparables 🤝",
    "El talento gana partidos, el equipo gana campeonatos ⭐",
    "Cada entrenamiento me hace más fuerte 💥",
    "La victoria se construye con trabajo diario 🏀",
    "Mi pasión es mi motor 🚀",
    "Defender con el corazón, atacar con la mente 🧠",
    "El basket es mi vida, el equipo mi familia 💗",
    "Sin sacrificio no hay victoria ⚡",
    "Somos más que un equipo, somos una familia 👊",
    "El límite lo pones tú mismo 🌟",
    "Cada canasta cuenta, cada pase importa 🎯",
    "La presión es un privilegio 💎",
    "Rendirse jamás, luchar siempre 🦁",
    "El basket me enseñó a nunca rendirme 📖"
  ];

  teams: Team[] = [
    {
      id: 1,
      nombre: 'SP Negro',
      categoria: 'Segunda División Autonómica',
      foto: '/assets/images/team-sp-negro.jpg',
      jugadores: this.generateSPNegroPlayers()
    },
    {
      id: 2,
      nombre: 'SP Rosa',
      categoria: 'Primera División Autonómica',
      foto: '/assets/images/team-sp-rosa.jpg',
      jugadores: this.generateSPRosaPlayers()
    }
  ];

  private generateSPNegroPlayers(): Player[] {
    const players: Player[] = [];

    // Mapeo de cromos SP Negro (archivos 31-50.png) a jugadores
    // Orden basado en la disposición visual actual de los cromos (cromoNum secuencial)
    const spNegroData = [
      { id: 1, cromoNum: 31, nombre: 'Jesús Antonio', apellidos: 'Jiménez Contreras', numero: 81, posicion: 'Ala-Pívot' },
      { id: 2, cromoNum: 32, nombre: 'Ángel Marcelo', apellidos: 'Fernández García', numero: 21, posicion: 'Base' },
      { id: 3, cromoNum: 33, nombre: 'Pergentino', apellidos: 'Edjang Nchama', numero: 30, posicion: 'Alero' },
      { id: 4, cromoNum: 37, nombre: 'Daniel', apellidos: 'Puente Fernández', numero: 14, posicion: 'Base' },
      { id: 5, cromoNum: 38, nombre: 'Héctor', apellidos: 'San Miguel González', numero: 20, posicion: 'Pívot' },
      { id: 6, cromoNum: 39, nombre: 'Hugo', apellidos: 'Piñeiro Cotera', numero: 16, posicion: 'Alero' },
      { id: 7, cromoNum: 40, nombre: 'Samuel', apellidos: 'Benito Gutiérrez', numero: 97, posicion: 'Alero' },
      { id: 8, cromoNum: 41, nombre: 'Iván', apellidos: 'Abascal Díez', numero: 29, posicion: 'Pívot' },
      { id: 9, cromoNum: 42, nombre: 'Diego', apellidos: 'Gutiérrez Rodríguez', numero: 95, posicion: 'Alero' },
      { id: 10, cromoNum: 43, nombre: 'Pablo', apellidos: 'Martínez Fernández', numero: 69, posicion: 'Ala-Pívot' },
      { id: 11, cromoNum: 44, nombre: 'Rodrigo', apellidos: 'Oxinalde Pérez', numero: 9, posicion: 'Ala-Pívot' },
      { id: 12, cromoNum: 45, nombre: 'Ricardo', apellidos: 'Fraguas Bringas', numero: 33, posicion: 'Pívot' },
      { id: 13, cromoNum: 46, nombre: 'José', apellidos: 'Pacho Ubis', numero: 31, posicion: 'Escolta' },
      { id: 14, cromoNum: 47, nombre: 'Hugo', apellidos: 'Michelena García', numero: 23, posicion: 'Pívot' },
      { id: 15, cromoNum: 48, nombre: 'Juan', apellidos: 'Verde Merayo', numero: 50, posicion: 'Escolta' },
      { id: 16, cromoNum: 49, nombre: 'Mario', apellidos: 'Álvarez Pérez', numero: 13, posicion: 'Ala-Pívot' },
      { id: 17, cromoNum: 50, nombre: 'Pablo', apellidos: 'Elizalde Roldán', numero: 0, posicion: 'Alero' }
    ];

    spNegroData.forEach((p, index) => {
      players.push({
        id: p.id,
        nombre: p.nombre,
        apellidos: p.apellidos,
        numero: p.numero,
        posicion: p.posicion,
        foto: `/assets/images/cromos/spnegro/${p.cromoNum}.png`,
        cromoFoto: `/assets/images/cromos/spnegro/${p.cromoNum}.png`,
        tipo: 'jugador',
        frase: this.frasesMotivadoras[index % this.frasesMotivadoras.length]
      });
    });

    // Cuerpo Técnico SP Negro
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

    // Ordenar cromos por número de dorsal
    return players.sort((a, b) => Number(a.numero) - Number(b.numero));
  }

  private generateSPRosaPlayers(): Player[] {
    const players: Player[] = [];

    // Mapeo de cromos SP Rosa a jugadores
    // Orden visual proporcionado: izquierda a derecha, arriba a abajo -> cromoNum 26 a 36
    const spRosaData = [

      { id: 2, cromoNum: 27, nombre: 'Diego', apellidos: 'Alonso Antolín', numero: 5, posicion: 'Alero' },
      { id: 3, cromoNum: 28, nombre: 'Adrián', apellidos: 'Cossío Bolinaga', numero: 7, posicion: 'Alero' },
      { id: 4, cromoNum: 29, nombre: 'Rubén', apellidos: 'Roiz Rebollar', numero: 18, posicion: 'Ala-Pívot' },
      { id: 5, cromoNum: 30, nombre: 'John James', apellidos: 'Riascos', numero: 47, posicion: 'Pívot' },
      { id: 6, cromoNum: 31, nombre: 'Jesús', apellidos: 'Jiménez Contreras', numero: 81, posicion: 'Ala-Pívot' },
      { id: 7, cromoNum: 32, nombre: 'Ángel Marcelo', apellidos: 'Fernández García', numero: 21, posicion: 'Base' },
      { id: 8, cromoNum: 33, nombre: 'Pergentino', apellidos: 'Edjang Nchama', numero: 30, posicion: 'Alero' },
      { id: 9, cromoNum: 34, nombre: 'Daniel', apellidos: 'García Salinas', numero: 12, posicion: 'Pívot' },
      { id: 10, cromoNum: 35, nombre: 'Diego', apellidos: 'Fernández Ruiz', numero: 10, posicion: 'Alero' },
      { id: 11, cromoNum: 36, nombre: 'Diego', apellidos: 'Amayuelas López', numero: 11, posicion: 'Base' },
      // Jugadores sin foto
      { id: 12, cromoNum: 999, nombre: 'Javier', apellidos: 'Martínez Fernández', numero: '00', posicion: 'Alero', noPhoto: true },
      { id: 13, cromoNum: 999, nombre: 'Gaël', apellidos: 'Fournet Pérez', numero: 3, posicion: 'Pívot', noPhoto: true }
    ];

    spRosaData.forEach((p, index) => {
      // Si no tiene foto (cromoNum 999), usar un placeholder
      const fotoPath = p.noPhoto
        ? 'assets/images/logo-sp-pink.png' // Asegurar ruta relativa correcta si es necesario
        : `/assets/images/cromos/sprosa/${p.cromoNum}.png`;

      players.push({
        id: p.id,
        nombre: p.nombre,
        apellidos: p.apellidos,
        numero: p.numero,
        posicion: p.posicion,
        foto: fotoPath,
        cromoFoto: fotoPath,
        tipo: 'jugador',
        frase: this.frasesMotivadoras[(index + 5) % this.frasesMotivadoras.length]
      });
    });

    // Cuerpo Técnico SP Rosa
    players.push({
      id: 201,
      nombre: 'Enrique',
      apellidos: 'Pereda',
      numero: 'C',
      posicion: 'Entrenador Principal',
      foto: 'assets/images/cromos/tecnicos/kike_pereda_coach.png',
      cromoFoto: 'assets/images/cromos/tecnicos/kike_pereda_coach.png',
      tipo: 'tecnico',
      rol: 'Entrenador Principal',
      frase: 'La intensidad no se negocia.' // Frase añadida para evitar error de tipo
    });

    // Ordenar cromos por número de dorsal
    return players.sort((a, b) => Number(a.numero) - Number(b.numero));
  }

  selectTeam(team: Team) {
    this.selectedTeam = team;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  backToTeams() {
    this.selectedTeam = null;
  }

  getJugadores() {
    return this.selectedTeam?.jugadores.filter(p => p.tipo === 'jugador') || [];
  }

  getTecnicos() {
    return this.selectedTeam?.jugadores.filter(p => p.tipo === 'tecnico') || [];
  }

  // Toggle flip en móvil
  toggleFlip(event: Event) {
    const card = (event.currentTarget as HTMLElement).querySelector('.player-card');
    if (card) {
      card.classList.toggle('flipped');
    }
  }
}
