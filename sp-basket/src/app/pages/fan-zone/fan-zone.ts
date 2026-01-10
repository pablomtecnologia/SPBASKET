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

  // ... (rest of props)

  constructor(private auth: AuthService, private http: HttpClient) {
    this.playerImg.src = 'assets/images/logo-sp-pink.png';
    // Usamos el logo de competición negro como rival por defecto en el juego
    this.logoRivalImg.src = 'assets/images/comp-negro-new.jpg';
  }

  // ...

  // --- DATA FETCHING ---
  loadMvpCandidates() {
    this.http.get<any[]>(`${environment.apiUrl}/api/mvp-candidates`).subscribe({
      next: (data) => this.mvpCandidates = data,
      error: () => {
        // FALLBACK: Datos reales basados en la carpeta 'cromos'
        this.mvpCandidates = [
          // SP NEGRO
          { id: 1, name: 'Hugo García', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/47.png' },
          { id: 2, name: 'Pablo Martínez', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/48.png' },
          { id: 3, name: 'Alex T.', team: 'SP Negro', avatar: 'assets/images/cromos/spnegro/49.png' },

          // SP ROSA
          { id: 4, name: 'Lucía F.', team: 'SP Rosa', avatar: 'assets/images/cromos/sprosa/26.png' },
          { id: 5, name: 'Elena Ruiz', team: 'SP Rosa', avatar: 'assets/images/cromos/sprosa/27.png' },
          { id: 6, name: 'Laura G.', team: 'SP Rosa', avatar: 'assets/images/cromos/sprosa/28.png' }
        ];
      }
    });
  }

  // --- QUINIELA ---
  submitQuiniela() {
    if (!this.isLoggedIn) { alert('Debes iniciar sesión para participar'); return; }
    if (this.prediction.home === null || this.prediction.visitor === null) return;

    this.http.post(`${environment.apiUrl}/api/quiniela`, {
      match_id: 'sp_negro_vs_sp_rosa', // Partido Real
      home: this.prediction.home,
      visitor: this.prediction.visitor
    }).subscribe({
      next: () => { this.predictionSubmitted = true; alert('¡Pronóstico enviado!'); },
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
