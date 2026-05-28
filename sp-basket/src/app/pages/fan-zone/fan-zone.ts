import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
  styleUrls: ['./fan-zone.css', './team-controls.css']
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
  // --- QUINIELA ---
  quinielas: any[] = [];


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

  // --- SETTINGS & ADMIN ---
  isAdmin = false;
  settings: any = {
    quiniela_rosa_open: false,
    quiniela_negro_open: false,
    mvp_rosa_open: false,
    mvp_negro_open: false
  };

  // --- ADMIN DATA ---
  adminVotes: { quinielas: any[], mvp_votes: any[] } = { quinielas: [], mvp_votes: [] };

  constructor(private auth: AuthService, private http: HttpClient, private cdr: ChangeDetectorRef) {
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
      this.isAdmin = user?.rol === 'admin';
    });

    const savedRunner = localStorage.getItem('spRunnerHighScore');
    if (savedRunner) this.highScoreRunner = parseInt(savedRunner, 10);

    // Initial load
    this.loadSettings();
    this.loadMvpCandidates();
    if (this.isAdmin) this.loadAdminVotes();
  }



  loadSettings() {
    this.http.get(`${environment.apiUrl}/settings`).subscribe({
      next: (data: any) => {
        console.log('📥 Raw Settings from DB:', data);

        // Helper to safely parse boolean
        const parseBool = (val: any): boolean => {
          if (typeof val === 'boolean') return val;
          if (val === 'true' || val === 1 || val === 't') return true;
          return false;
        };

        this.settings = {
          quiniela_rosa_open: parseBool(data.quiniela_rosa_open),
          quiniela_negro_open: parseBool(data.quiniela_negro_open),
          mvp_rosa_open: parseBool(data.mvp_rosa_open),
          mvp_negro_open: parseBool(data.mvp_negro_open)
        };

        console.log('✅ Processed Settings:', this.settings);
        this.cdr.detectChanges(); // FORCE UI UPDATE

        this.loadMatches();
        if (this.isAdmin) this.loadAdminVotes(); // Reload if admin
      },
      error: (e) => {
        console.error('❌ Error loading settings:', e);
        // Set defaults on error
        this.settings = {
          quiniela_rosa_open: false,
          quiniela_negro_open: false,
          mvp_rosa_open: false,
          mvp_negro_open: false
        };
        this.cdr.detectChanges(); // FORCE UI UPDATE
      }
    });
  }

  loadAdminVotes() {
    this.http.get<any>(`${environment.apiUrl}/admin/votes`, { headers: this.auth.getAuthHeaders() })
      .subscribe({
        next: (data) => {
          this.adminVotes = data;
          console.log('📊 Admin Votes loaded:', this.adminVotes);
        },
        error: (e) => console.error('Error loading admin votes', e)
      });
  }

  loadMatches() {
    this.http.get<any[]>(`${environment.apiUrl}/matches`).subscribe({
      next: (matches) => {
        console.log('📥 Raw matches from API:', matches);

        if (!Array.isArray(matches)) {
          console.error('❌ Matches is not an array:', matches);
          this.quinielas = [];
          return;
        }

        // Map backend matches to frontend structure
        this.quinielas = matches.map(m => {
          let isOpen = m.isOpen; // Default from Date logic

          // Override if Admin Force Open is active
          if (m.team_type === 'rosa' && this.settings.quiniela_rosa_open) isOpen = true;
          if (m.team_type === 'negro' && this.settings.quiniela_negro_open) isOpen = true;

          return {
            id: m.id,
            team: m.team_type,
            competition: m.competition,
            home: m.home_team,
            visitor: m.visitor_team,
            date: new Date(m.match_date).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' }),
            rawDate: m.match_date,
            logoHome: m.logo_home,
            logoVisitor: m.logo_visitor,
            prediction: { home: null, visitor: null },
            submitted: false,
            isOpen: isOpen
          };
        });

        console.log('✅ Quinielas loaded:', this.quinielas.length);
        this.loadUserPredictions();
        this.loadUserMvpVotes(); // Load MVP history
      },
      error: (e) => {
        console.error('❌ Error loading matches:', e);
        console.error('   Status:', e.status);
        console.error('   Message:', e.message);
        console.error('   Error body:', e.error);
        this.quinielas = [];
      }
    });
  }

  loadUserPredictions() {
    if (!this.isLoggedIn) return;
    this.http.get<any[]>(`${environment.apiUrl}/quiniela/my-predictions`, { headers: this.auth.getAuthHeaders() }).subscribe({
      next: (preds) => {
        if (!Array.isArray(preds)) return;
        preds.forEach(p => {
          const match = this.quinielas.find(m => m.id === p.match_id);
          if (match) {
            match.prediction = { home: p.home_score, visitor: p.visitor_score };
            match.submitted = true;
          }
        });
      }
    });
  }

  // NEW: Load user MPV votes to block duplicates
  userMvpVotes: number[] = []; // Match IDs where user already voted MVP

  loadUserMvpVotes() {
    if (!this.isLoggedIn) return;
    this.http.get<any[]>(`${environment.apiUrl}/mvp/my-votes`, { headers: this.auth.getAuthHeaders() }).subscribe({
      next: (votes) => {
        if (Array.isArray(votes)) {
          this.userMvpVotes = votes.map(v => v.match_id);
          // Check if user has voted for the current visible match context
          this.checkMvpVotedState();
        }
      }
    });
  }

  checkMvpVotedState() {
    // Find the match for current team
    const currentMatch = this.quinielas.find(q => q.team === this.currentTeam);
    if (currentMatch && this.userMvpVotes.includes(currentMatch.id)) {
      this.mvpVoted = true;
    } else {
      this.mvpVoted = false;
    }
  }

  toggleSetting(key: string) {
    if (!this.isAdmin) return;
    const newValue = !this.settings[key];
    const previousValue = this.settings[key];
    this.settings[key] = newValue; // Optimistic update

    this.http.put(`${environment.apiUrl}/settings`, { key, value: newValue }, { headers: this.auth.getAuthHeaders() }).subscribe({
      next: (res) => {
        console.log('✅ Setting updated successfully:', key, '=', newValue);
        // Reload settings to ensure sync
        this.loadSettings();
      },
      error: (err) => {
        console.error('❌ Error saving setting:', err);
        this.settings[key] = previousValue; // Revert on error
        alert('Error guardando configuración: ' + (err.error?.message || err.message));
      }
    });
  }

  ngAfterViewInit() { }

  ngOnDestroy() { this.stopRunner(); }

  // --- EQUIPOS TOGGLE ---
  switchTeam(team: 'rosa' | 'negro') {
    this.currentTeam = team;
    this.updatePlayerAsset();
    this.selectedMvp = ''; // Reset selección
    this.checkMvpVotedState(); // Update MVP vote status for new team
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
    this.http.get<any[]>(`${environment.apiUrl}/mvp-candidates`).subscribe({
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
  // --- QUINIELA ---
  submitQuiniela(q: any) {
    if (!this.isLoggedIn) { alert('Debes iniciar sesión para participar'); return; }
    if (q.prediction.home === null || q.prediction.visitor === null) {
      alert('Por favor introduce un resultado completo.');
      return;
    }

    this.http.post(`${environment.apiUrl}/quiniela`, {
      match_id: q.id,
      home_score: q.prediction.home,
      visitor_score: q.prediction.visitor
    }, { headers: this.auth.getAuthHeaders() }).subscribe({
      next: () => {
        q.submitted = true;
        alert('✅ ¡Pronóstico enviado correctamente!');
        if (this.isAdmin) this.loadAdminVotes();
      },
      error: (e) => {
        // Handle 409 Conflict specifically
        if (e.status === 409) {
          q.submitted = true; // Mark as submitted so UI blocks it
          alert(e.error.message);
        } else {
          alert('❌ Error al enviar pronóstico: ' + (e.error?.message || 'Error desconocido'));
        }
      }
    });
  }

  // --- MVP ---
  submitMvp() {
    if (!this.isLoggedIn) { alert('Debes iniciar sesión para votar'); return; }
    if (!this.selectedMvp) { alert('Selecciona un jugador primero.'); return; }

    // Find the match ID for the current team context
    // We prioritize the OPEN match if exists, or the first one in the list for that team
    const currentMatch = this.quinielas.find(q => q.team === this.currentTeam && q.isOpen) ||
      this.quinielas.find(q => q.team === this.currentTeam);

    if (!currentMatch) {
      alert('⚠️ No se ha encontrado un partido para votar MVP en este equipo.');
      return;
    }

    this.http.post(`${environment.apiUrl}/mvp`, {
      match_id: currentMatch.id,
      player_name: this.selectedMvp
    }, { headers: this.auth.getAuthHeaders() })
      .subscribe({
        next: () => {
          this.mvpVoted = true;
          this.userMvpVotes.push(currentMatch.id); // Add to local cache
          alert('✅ ¡Voto MVP registrado!');
          if (this.isAdmin) this.loadAdminVotes();
        },
        error: (e) => {
          if (e.status === 409) {
            this.mvpVoted = true;
            this.userMvpVotes.push(currentMatch.id);
            alert(e.error.message);
          } else {
            alert('❌ Error al votar: ' + (e.error?.message || 'Error desconocido'));
          }
        }
      });
  }

  loadMvpResults() {
    this.http.get<any[]>(`${environment.apiUrl}/mvp-results`).subscribe(data => this.mvpResults = data);
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
    this.gameSpeed = 8; // Faster start
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
      this.player.dy = -17; // Higher jump for speed
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
    this.scoreRunner += 0.15; // Score faster
    this.gameSpeed += 0.002;
    this.obstacleTimer++;

    // Spawning (More frequent but escapable)
    // Reduce max gap to prevent impossible waits, ensure min gap allows landing
    if (this.obstacleTimer > Math.random() * 50 + 40) {
      const type = Math.random() > 0.6 ? 'pipe' : 'defender';
      const width = type === 'pipe' ? 50 : 45;
      const height = type === 'pipe' ? (Math.random() * 50 + 40) : 45;

      this.obstacles.push({ x: W, y: FloorY - height, width, height, type: type as any });
      this.obstacleTimer = 0;
    }

    // Physics
    this.player.dy += 0.9; // Stronger gravity for snappy jumps
    this.player.y += this.player.dy;

    // Suelo colisión
    if (this.player.y + this.player.height > FloorY) {
      this.player.y = FloorY - this.player.height;
      this.player.dy = 0;
      this.player.grounded = true;
    }

    // Drawing Elements... (omitted for brevity, matched by context)

    // 1. Sky...
    var grd = this.ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, "#0f0c29");
    grd.addColorStop(1, "#302b63");
    this.ctx.fillStyle = grd;
    this.ctx.fillRect(0, 0, W, H);

    // 2. Stars
    this.ctx.fillStyle = "#FFF";
    if (Math.random() > 0.9) this.ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);

    // 3. Floor (Bricked)
    this.ctx.fillStyle = '#5c3d2e';
    this.ctx.fillRect(0, FloorY, W, H - FloorY);
    this.ctx.fillStyle = '#65C256';
    this.ctx.fillRect(0, FloorY, W, 10);

    // 4. Player...
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
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        this.ctx.strokeStyle = '#006400';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
        this.ctx.fillRect(obs.x - 5, obs.y, obs.width + 10, 20);
      } else {
        const rivalIdx = Math.floor(obs.x / 200) % this.rivalLogos.length;
        const img = this.rivalLogos[Math.abs(rivalIdx)] || this.rivalLogos[0];
        try {
          if (img && img.complete) {
            this.ctx.drawImage(img, obs.x, obs.y, obs.width, obs.height);
          } else { throw new Error(); }
        } catch {
          this.ctx.fillStyle = 'red';
          this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        }
      }

      // Collision (More Forgiving: +10 margin)
      if (this.player.x < obs.x + obs.width - 10 && this.player.x + this.player.width > obs.x + 10 &&
        this.player.y < obs.y + obs.height - 10 && this.player.height + this.player.y > obs.y + 10) {
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
      this.http.post(`${environment.apiUrl}/api/scores`, { game, score }, { headers: this.auth.getAuthHeaders() }).subscribe();
    }
  }
}
