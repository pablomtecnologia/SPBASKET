import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment';

interface RunnerPlayer {
  x: number;
  y: number;
  width: number;
  height: number;
  dy: number;
  jumpForce: number;
  grounded: boolean;
  color: string;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'cone' | 'defender';
}

@Component({
  selector: 'app-fan-zone',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './fan-zone.html',
  styleUrls: ['./fan-zone.css']
})
export class FanZoneComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('runnerCanvas') runnerCanvasRef!: ElementRef<HTMLCanvasElement>;

  isLoggedIn = false;
  currentUser: any = null;
  activeTab: string = 'dashboard';

  // --- ASSETS ---
  playerImg = new Image();
  logoRivalImg = new Image();

  // Logos de Equipos para Quiniela/Partidos
  logoSpNegro = 'assets/images/comp-negro-new.jpg'; // O el que sea correcto
  logoSpRosa = 'assets/images/comp-rosa-new.jpg';

  imagesLoaded = false;

  // --- QUINIELA ---
  quinielas = [
    {
      id: 'rosa-match',
      competition: '1ª Div. Nacional',
      home: 'SP Rosa',
      visitor: 'AMIDE',
      date: 'Dom 18 Ene, 16:30',
      logoHome: 'assets/images/logo-sp-pink.png',
      logoVisitor: 'assets/images/comp-rosa-new.jpg',
      prediction: { home: null, visitor: null },
      submitted: false
    },
    {
      id: 'negro-match',
      competition: '2ª Div. Autonómica',
      home: 'Intermodal Sea Solutions',
      visitor: 'SP Negro',
      date: 'Sab 17 Ene, 18:30',
      logoHome: 'assets/images/comp-negro-new.jpg',
      logoVisitor: 'assets/images/logo-sp-pink.png',
      prediction: { home: null, visitor: null },
      submitted: false
    }
  ];

  // --- ENCUESTA MVP ---
  // Inicializamos DIRECTAMENTE con los datos para evitar "Cargando..."
  mvpCandidates: any[] = [
    // --- SP NEGRO ---
    { id: 31, name: 'Jesús Antonio Jiménez', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/31.png' },
    { id: 32, name: 'Ángel Marcelo Fernández', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/32.png' },
    { id: 33, name: 'Pergentino Edjang', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/33.png' },
    { id: 37, name: 'Daniel Puente', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/37.png' },
    { id: 38, name: 'Héctor San Miguel', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/38.png' },
    { id: 39, name: 'Hugo Piñeiro', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/39.png' },
    { id: 40, name: 'Samuel Benito', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/40.png' },
    { id: 41, name: 'Iván Abascal', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/41.png' },
    { id: 42, name: 'Diego Gutiérrez', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/42.png' },
    { id: 43, name: 'Pablo Martínez', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/43.png' },
    { id: 44, name: 'Rodrigo Oxinalde', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/44.png' },
    { id: 45, name: 'Ricardo Fraguas', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/45.png' },
    { id: 46, name: 'José Pacho', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/46.png' },
    { id: 47, name: 'Hugo Michelena', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/47.png' },
    { id: 48, name: 'Juan Verde', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/48.png' },
    { id: 49, name: 'Mario Álvarez', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/49.png' },
    { id: 50, name: 'Pablo Elizalde', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/50.png' },
    // --- SP ROSA ---
    { id: 27, name: 'Diego Alonso', team: 'SP Rosa', avatar: 'assets/images/cromos/sprosa/27.png' },
    { id: 28, name: 'Adrián Cossío', team: 'SP Rosa', avatar: 'assets/images/cromos/sprosa/28.png' },
    { id: 29, name: 'Rubén Roiz', team: 'SP Rosa', avatar: 'assets/images/cromos/sprosa/29.png' },
    { id: 30, name: 'John James Riascos', team: 'SP Rosa', avatar: 'assets/images/cromos/sprosa/30.png' },
    { id: 131, name: 'Jesús Jiménez', team: 'SP Rosa', avatar: 'assets/images/cromos/sprosa/31.png' },
    { id: 132, name: 'Ángel M. Fernández', team: 'SP Rosa', avatar: 'assets/images/cromos/sprosa/32.png' },
    { id: 133, name: 'Pergentino Edjang', team: 'SP Rosa', avatar: 'assets/images/cromos/sprosa/33.png' },
    { id: 34, name: 'Daniel García', team: 'SP Rosa', avatar: 'assets/images/cromos/sprosa/34.png' },
    { id: 35, name: 'Diego Fernández', team: 'SP Rosa', avatar: 'assets/images/cromos/sprosa/35.png' },
    { id: 36, name: 'Diego Amayuelas', team: 'SP Rosa', avatar: 'assets/images/cromos/sprosa/36.png' },
    { id: 998, name: 'Javier Martínez', team: 'SP Rosa', avatar: 'assets/images/logo-sp-pink.png' },
    { id: 999, name: 'Gaël Fournet', team: 'SP Rosa', avatar: 'assets/images/logo-sp-pink.png' }
  ];
  selectedMvp: string = '';
  mvpVoted = false;
  mvpResults: any[] = [];

  // --- MEMORY GAME ---
  memoryCards: any[] = [];
  flippedCards: any[] = [];
  moves = 0;
  memoryGameWon = false;
  memoryIcons = ['🏀', '👟', '👕', '🏆', '🥤', '🧢', '📢', '🥇'];

  // --- RUNNER GAME ---
  ctx!: CanvasRenderingContext2D;
  gameRunning = false;
  animationId: any;
  scoreRunner = 0;
  highScoreRunner = 0;
  gameSpeed = 5;

  player: RunnerPlayer = {
    x: 50, y: 200, width: 40, height: 40, dy: 0, jumpForce: 13, grounded: true, color: '#e6007e'
  };
  obstacles: Obstacle[] = [];
  obstacleTimer = 0;

  constructor(private auth: AuthService, private http: HttpClient) {
    this.playerImg.src = 'assets/images/logo-sp-pink.png';
    // Usamos el logo de competición negro como rival por defecto en el juego
    this.logoRivalImg.src = 'assets/images/comp-negro-new.jpg';
  }

  ngOnInit() {
    this.auth.currentUser.subscribe(user => {
      this.isLoggedIn = !!user;
      this.currentUser = user;
    });

    const savedRunner = localStorage.getItem('spRunnerHighScore');
    if (savedRunner) this.highScoreRunner = parseInt(savedRunner, 10);

    this.loadMvpCandidates();
  }

  ngAfterViewInit() { }

  ngOnDestroy() { this.stopRunner(); }

  // --- TABS ---
  showGame(game: string) {
    this.activeTab = game;
    if (game === 'runner') setTimeout(() => this.initRunner(), 100);
    if (game === 'memory') this.resetMemoryGame();
  }

  backToDashboard() {
    this.activeTab = 'dashboard';
    this.stopRunner();
  }

  // --- DATA FETCHING ---
  loadMvpCandidates() {
    this.http.get<any[]>(`${environment.apiUrl}/api/mvp-candidates`).subscribe({
      next: (data) => this.mvpCandidates = data,
      error: () => {
        // FALLBACK: Lista COMPLETA de jugadores de SP Negro y SP Rosa (basado en EquiposComponent)
        this.mvpCandidates = [
          // --- SP NEGRO ---
          { id: 31, name: 'Jesús Antonio Jiménez', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/31.png' },
          { id: 32, name: 'Ángel Marcelo Fernández', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/32.png' },
          { id: 33, name: 'Pergentino Edjang', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/33.png' },
          { id: 37, name: 'Daniel Puente', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/37.png' },
          { id: 38, name: 'Héctor San Miguel', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/38.png' },
          { id: 39, name: 'Hugo Piñeiro', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/39.png' },
          { id: 40, name: 'Samuel Benito', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/40.png' },
          { id: 41, name: 'Iván Abascal', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/41.png' },
          { id: 42, name: 'Diego Gutiérrez', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/42.png' },
          { id: 43, name: 'Pablo Martínez', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/43.png' },
          { id: 44, name: 'Rodrigo Oxinalde', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/44.png' },
          { id: 45, name: 'Ricardo Fraguas', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/45.png' },
          { id: 46, name: 'José Pacho', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/46.png' },
          { id: 47, name: 'Hugo Michelena', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/47.png' },
          { id: 48, name: 'Juan Verde', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/48.png' },
          { id: 49, name: 'Mario Álvarez', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/49.png' },
          { id: 50, name: 'Pablo Elizalde', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/50.png' },

          // --- SP ROSA ---
          { id: 27, name: 'Diego Alonso', team: 'SP Rosa', avatar: 'assets/images/cromos/sprosa/27.png' },
          { id: 28, name: 'Adrián Cossío', team: 'SP Rosa', avatar: 'assets/images/cromos/sprosa/28.png' },
          { id: 29, name: 'Rubén Roiz', team: 'SP Rosa', avatar: 'assets/images/cromos/sprosa/29.png' },
          { id: 30, name: 'John James Riascos', team: 'SP Rosa', avatar: 'assets/images/cromos/sprosa/30.png' },
          { id: 131, name: 'Jesús Jiménez', team: 'SP Rosa', avatar: 'assets/images/cromos/sprosa/31.png' },
          { id: 132, name: 'Ángel Marcelo Fernández', team: 'SP Rosa', avatar: 'assets/images/cromos/sprosa/32.png' },
          { id: 133, name: 'Pergentino Edjang', team: 'SP Rosa', avatar: 'assets/images/cromos/sprosa/33.png' },
          { id: 34, name: 'Daniel García', team: 'SP Rosa', avatar: 'assets/images/cromos/sprosa/34.png' },
          { id: 35, name: 'Diego Fernández', team: 'SP Rosa', avatar: 'assets/images/cromos/sprosa/35.png' },
          { id: 36, name: 'Diego Amayuelas', team: 'SP Rosa', avatar: 'assets/images/cromos/sprosa/36.png' },
          // Sin foto pero miembros
          { id: 998, name: 'Javier Martínez', team: 'SP Rosa', avatar: 'assets/images/logo-sp-pink.png' },
          { id: 999, name: 'Gaël Fournet', team: 'SP Rosa', avatar: 'assets/images/logo-sp-pink.png' }
        ];
      }
    });
  }

  // --- QUINIELA ---
  submitQuiniela(q: any) {
    if (!this.isLoggedIn) { alert('Debes iniciar sesión para participar'); return; }
    if (q.prediction.home === null || q.prediction.visitor === null) return;

    this.http.post(`${environment.apiUrl}/api/quiniela`, {
      match_id: q.id,
      home: q.prediction.home,
      visitor: q.prediction.visitor
    }).subscribe({
      next: () => { q.submitted = true; alert('¡Pronóstico enviado!'); },
      error: () => alert('Error al enviar pronóstico')
    });
  }

  // --- MVP ---
  voteMvp() {
    if (!this.isLoggedIn) { alert('Debes iniciar sesión para votar'); return; }
    if (!this.selectedMvp) return;

    this.http.post(`${environment.apiUrl}/api/mvp-vote`, { player_name: this.selectedMvp })
      .subscribe({
        next: () => {
          this.mvpVoted = true;
          this.loadMvpResults();
        },
        error: () => alert('Error al votar')
      });
  }

  loadMvpResults() {
    this.http.get<any[]>(`${environment.apiUrl}/api/mvp-results`).subscribe(data => this.mvpResults = data);
  }

  getVotePercentage(playerName: string): number {
    const total = this.mvpResults.reduce((acc, curr) => acc + parseInt(curr.votes), 0);
    if (total === 0) return 0;
    const player = this.mvpResults.find(r => r.player_name === playerName);
    return player ? (parseInt(player.votes) / total) * 100 : 0;
  }

  // --- MEMORY GAME ---
  resetMemoryGame() {
    this.memoryGameWon = false;
    this.moves = 0;
    this.flippedCards = [];
    const deck = [...this.memoryIcons, ...this.memoryIcons]
      .sort(() => Math.random() - 0.5)
      .map((icon, index) => ({ id: index, icon, flipped: false, matched: false }));
    this.memoryCards = deck;
  }

  flipCard(card: any) {
    if (card.flipped || card.matched || this.flippedCards.length >= 2) return;
    card.flipped = true;
    this.flippedCards.push(card);
    if (this.flippedCards.length === 2) {
      this.moves++;
      setTimeout(() => this.checkMatch(), 600);
    }
  }

  checkMatch() {
    const [c1, c2] = this.flippedCards;
    if (c1.icon === c2.icon) {
      c1.matched = true; c2.matched = true;
      if (this.memoryCards.every(c => c.matched)) {
        this.memoryGameWon = true;
        const score = Math.max(0, 100 - this.moves);
        this.saveScore('memory', score);
      }
    } else {
      c1.flipped = false; c2.flipped = false;
    }
    this.flippedCards = [];
  }

  // --- RUNNER GAME ---
  initRunner() {
    if (!this.runnerCanvasRef) return;
    const canvas = this.runnerCanvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    canvas.width = 800;
    canvas.height = 300;

    this.player.y = 250;
    this.player.dy = 0;
    this.obstacles = [];
    this.scoreRunner = 0;
    this.gameSpeed = 6;
    this.gameRunning = true;

    window.addEventListener('keydown', this.handleInput.bind(this));
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); this.performJump(); });
    canvas.addEventListener('mousedown', () => this.performJump());

    this.runnerLoop();
  }

  stopRunner() {
    this.gameRunning = false;
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('keydown', this.handleInput.bind(this));
  }

  handleInput(e: KeyboardEvent) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      this.performJump();
    }
  }

  performJump() {
    if (!this.gameRunning) { this.initRunner(); return; }
    if (this.player.grounded) {
      this.player.dy = -this.player.jumpForce;
      this.player.grounded = false;
    }
  }

  runnerLoop() {
    if (!this.gameRunning) return;
    this.ctx.clearRect(0, 0, 800, 300);

    // Updates
    this.scoreRunner++;
    this.gameSpeed += 0.003;
    this.obstacleTimer++;

    // Spawning
    if (this.obstacleTimer > Math.random() * 60 + 90) {
      const type = Math.random() > 0.5 ? 'cone' : 'defender';
      const height = type === 'cone' ? 40 : 50;
      const width = 40;
      this.obstacles.push({ x: 800, y: 300 - height, width, height, type });
      this.obstacleTimer = 0;
    }

    // Physics
    this.player.dy += 0.7; // Gravity
    this.player.y += this.player.dy;
    if (this.player.y + this.player.height > 300) {
      this.player.y = 300 - this.player.height;
      this.player.dy = 0;
      this.player.grounded = true;
    }

    // Drawing Elements
    // 1. Floor
    this.ctx.fillStyle = '#CBB26A'; this.ctx.fillRect(0, 290, 800, 10);

    // 2. Player (Image or Fallback)
    try {
      this.ctx.drawImage(this.playerImg, this.player.x, this.player.y, this.player.width, this.player.height);
    } catch (e) {
      this.ctx.fillStyle = '#e6007e';
      this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    }

    // 3. Obstacles
    for (let i = 0; i < this.obstacles.length; i++) {
      let obs = this.obstacles[i];
      obs.x -= this.gameSpeed;

      if (obs.type === 'defender') {
        // Draw Rival Logo if available, else Red Box
        try {
          this.ctx.drawImage(this.logoRivalImg, obs.x, obs.y, obs.width, obs.height);
        } catch {
          this.ctx.fillStyle = 'red';
          this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        }
      } else {
        // Cone
        this.ctx.fillStyle = 'orange';
        this.ctx.beginPath();
        this.ctx.moveTo(obs.x, obs.y + obs.height);
        this.ctx.lineTo(obs.x + obs.width / 2, obs.y);
        this.ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        this.ctx.fill();
      }

      // Collision
      if (this.player.x < obs.x + obs.width - 10 && this.player.x + this.player.width > obs.x + 10 &&
        this.player.y < obs.y + obs.height - 10 && this.player.height + this.player.y > obs.y) {
        this.gameOver();
      }

      if (obs.x + obs.width < 0) { this.obstacles.splice(i, 1); i--; }
    }

    // 4. UI
    this.ctx.fillStyle = 'white'; this.ctx.font = '20px Arial';
    this.ctx.fillText(`Puntos: ${Math.floor(this.scoreRunner)}`, 20, 30);
    this.ctx.fillText(`Récord: ${this.highScoreRunner}`, 20, 60);

    this.animationId = requestAnimationFrame(() => this.runnerLoop());
  }

  gameOver() {
    this.gameRunning = false;
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, 800, 300);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 40px Arial'; this.ctx.textAlign = 'center';
    this.ctx.fillText('¡CAÍSTE!', 400, 120);
    this.ctx.font = '20px Arial';
    this.ctx.fillText(`Puntos: ${Math.floor(this.scoreRunner)}`, 400, 160);
    this.ctx.fillText('Click o Espacio para Reintentar', 400, 200);
    this.ctx.textAlign = 'left';

    if (this.scoreRunner > this.highScoreRunner) {
      this.highScoreRunner = Math.floor(this.scoreRunner);
      localStorage.setItem('spRunnerHighScore', this.highScoreRunner.toString());
      this.saveScore('runner', this.highScoreRunner);
    }
  }

  saveScore(game: string, score: number) {
    if (this.isLoggedIn) {
      this.http.post(`${environment.apiUrl}/api/scores`, { game, score }).subscribe();
    }
  }
}
