import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
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
  imports: [CommonModule, FormsModule],
  templateUrl: './fan-zone.html',
  styleUrls: ['./fan-zone.css']
})
export class FanZoneComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('runnerCanvas') runnerCanvasRef!: ElementRef<HTMLCanvasElement>;

  isLoggedIn = false;
  currentUser: any = null;
  activeTab: string = 'dashboard';
  currentTeam: 'rosa' | 'negro' = 'rosa';

  // --- ASSETS ---
  playerImg = new Image();
  rivalLogos: HTMLImageElement[] = [];

  // Logos de Equipos para Quiniela/Partidos
  logoSpNegro = 'assets/images/comp-negro-new.jpg'; // O el que sea correcto
  logoSpRosa = 'assets/images/comp-rosa-new.jpg';

  imagesLoaded = false;

  // --- QUINIELA ---
  quinielas = [
    {
      id: 'rosa-match-9',
      team: 'rosa',
      competition: '1ª División Masculina',
      home: 'SP Basket Rosa',
      visitor: 'Cantbasket 04',
      date: 'Domingo 12 Ene, 12:00',
      logoHome: 'assets/images/logo-sp-pink.png',
      logoVisitor: 'assets/images/logos/cantbasket04.jpeg',
      prediction: { home: null, visitor: null },
      submitted: false
    },
    {
      id: 'negro-match-9',
      team: 'negro',
      competition: '2ª División Autonómica',
      home: 'Daygon Santander',
      visitor: 'SP Basket Negro',
      date: 'Sábado 11 Ene, 18:30',
      logoHome: 'assets/images/logos/daygon.jpg',
      logoVisitor: 'assets/images/comp-negro-new.jpg',
      prediction: { home: null, visitor: null },
      submitted: false
    }
  ];

  // --- ENCUESTA MVP ---
  // Inicializamos DIRECTAMENTE con los datos para evitar "Cargando..."
  allMvpCandidates: any[] = [
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
  gameSpeed = 6;

  player: RunnerPlayer = {
    x: 50, y: 300, width: 50, height: 50, dy: 0, jumpForce: 18, grounded: true, color: '#e6007e'
  };
  obstacles: Obstacle[] = [];
  obstacleTimer = 0;

  constructor(private auth: AuthService, private http: HttpClient) {
    this.updatePlayerAsset();

    // Cargar Logos Rivales para el juego
    const rivals = [
      'assets/images/logos/cantbasket04.jpeg',
      'assets/images/logos/daygon.jpg',
      'assets/images/logos/amide.jpeg',
      'assets/images/logos/solares.jpg'
    ];
    rivals.forEach(src => {
      const img = new Image(); img.src = src;
      this.rivalLogos.push(img);
    });
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

  // --- EQUIPOS TOGGLE ---
  switchTeam(team: 'rosa' | 'negro') {
    this.currentTeam = team;
    this.updatePlayerAsset();
    this.selectedMvp = ''; // Reset selección
  }

  updatePlayerAsset() {
    this.playerImg.src = this.currentTeam === 'rosa'
      ? 'assets/images/logo-sp-pink.png'
      : 'assets/images/comp-negro-new.jpg'; // O usa un logo negro específico si tienes
  }

  get filteredMvpCandidates() {
    const teamFilter = this.currentTeam === 'rosa' ? 'SP Rosa' : 'SP Negro';
    return this.allMvpCandidates.filter(c => c.team === teamFilter);
  }

  get currentQuiniela() {
    return this.quinielas.find(q => q.team === this.currentTeam);
  }

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
      next: (data) => this.allMvpCandidates = data,
      error: () => {
        // FALLBACK: Lista COMPLETA de jugadores de SP Negro y SP Rosa (basado en EquiposComponent)
        this.allMvpCandidates = [
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

  // --- RUNNER GAME (SUPER BASKET MARIO) ---
  initRunner() {
    if (!this.runnerCanvasRef) return;
    const canvas = this.runnerCanvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    canvas.width = 800;
    canvas.height = 400; // Más alto para saltos estilo Mario

    this.player.y = 300;
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
      this.player.dy = -15; // Salto potente
      this.player.grounded = false;
    }
  }

  runnerLoop() {
    if (!this.gameRunning) return;

    // Canvas Size
    const W = 800;
    const H = 400;
    const FloorY = 350;

    this.ctx.clearRect(0, 0, W, H);

    // Updates
    this.scoreRunner += 0.1;
    this.gameSpeed += 0.001;
    this.obstacleTimer++;

    // Spawning (Pipes & Rivals)
    if (this.obstacleTimer > Math.random() * 80 + 100) {
      const type = Math.random() > 0.6 ? 'pipe' : 'defender'; // 'pipe' is internal logic for Green Block
      const width = type === 'pipe' ? 50 : 45;
      const height = type === 'pipe' ? (Math.random() * 50 + 40) : 45;

      this.obstacles.push({ x: W, y: FloorY - height, width, height, type: type as any });
      this.obstacleTimer = 0;
    }

    // Physics
    this.player.dy += 0.7; // Gravity
    this.player.y += this.player.dy;

    // Suelo colisión
    if (this.player.y + this.player.height > FloorY) {
      this.player.y = FloorY - this.player.height;
      this.player.dy = 0;
      this.player.grounded = true;
    }

    // Drawing Elements

    // 1. Sky (Noche Premium)
    var grd = this.ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, "#0f0c29");
    grd.addColorStop(1, "#302b63");
    this.ctx.fillStyle = grd;
    this.ctx.fillRect(0, 0, W, H);

    // 2. Stars
    this.ctx.fillStyle = "#FFF";
    if (Math.random() > 0.9) this.ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);

    // 3. Floor (Bricked)
    this.ctx.fillStyle = '#5c3d2e'; // Tierra
    this.ctx.fillRect(0, FloorY, W, H - FloorY);
    this.ctx.fillStyle = '#65C256'; // Hierba
    this.ctx.fillRect(0, FloorY, W, 10);

    // 4. Player (Team Logo or Pink Box)
    try {
      this.ctx.drawImage(this.playerImg, this.player.x, this.player.y, this.player.width, this.player.height);
    } catch (e) {
      this.ctx.fillStyle = this.player.color;
      this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    }

    // 5. Obstacles
    for (let i = 0; i < this.obstacles.length; i++) {
      let obs = this.obstacles[i];
      obs.x -= this.gameSpeed;

      if ((obs.type as any) === 'pipe') {
        // Dibujar Tubería estilo Mario (Verde)
        this.ctx.fillStyle = '#228B22'; // ForestGreen
        this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        this.ctx.strokeStyle = '#006400';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
        // Cabeza tubería visual
        this.ctx.fillRect(obs.x - 5, obs.y, obs.width + 10, 20);
      } else {
        // Enigo (Rival Logo)
        // Pick random logo based on position to simulate variety
        const rivalIdx = Math.floor(obs.x / 200) % this.rivalLogos.length;
        const img = this.rivalLogos[Math.abs(rivalIdx)] || this.rivalLogos[0];

        try {
          if (img && img.complete) {
            this.ctx.drawImage(img, obs.x, obs.y, obs.width, obs.height);
          } else {
            throw new Error('Image not loaded');
          }
        } catch {
          this.ctx.fillStyle = 'red';
          this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        }
      }

      // Collision
      if (this.player.x < obs.x + obs.width - 5 && this.player.x + this.player.width > obs.x + 5 &&
        this.player.y < obs.y + obs.height - 5 && this.player.height + this.player.y > obs.y) {
        this.gameOver();
      }

      if (obs.x + obs.width < 0) { this.obstacles.splice(i, 1); i--; }
    }

    // 6. UI
    this.ctx.fillStyle = 'white'; this.ctx.font = 'bold 24px Arial';
    this.ctx.fillText(`Score: ${Math.floor(this.scoreRunner)}`, 20, 40);
    this.ctx.fillText(`High: ${this.highScoreRunner}`, 20, 70);

    this.animationId = requestAnimationFrame(() => this.runnerLoop());
  }

  gameOver() {
    this.gameRunning = false;
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, 0, 800, 400);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 40px Arial'; this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', 400, 150);
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`Score: ${Math.floor(this.scoreRunner)}`, 400, 200);
    this.ctx.fillStyle = '#e6007e';
    this.ctx.fillText('Press SPACE/CLICK to Restart', 400, 250);
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
