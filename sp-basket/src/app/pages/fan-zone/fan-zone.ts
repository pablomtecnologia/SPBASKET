import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Importante para Quiniela

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
  @ViewChild('runnerCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  isLoggedIn = false;
  currentUser: any = null;
  activeTab: string = 'dashboard'; // 'dashboard', 'runner', 'memory'

  // --- QUINIELA ---
  prediction = { home: null, visitor: null };
  predictionSubmitted = false;

  // --- ENCUESTA MVP ---
  mvpOptions = ['Laura G.', 'Marc P.', 'Elena R.', 'Coach Alex'];
  selectedMvp: string = '';
  mvpVoted = false;

  // --- RUNNER GAME STATE ---
  ctx!: CanvasRenderingContext2D;
  gameRunning = false;
  animationId: any;
  scoreRunner = 0;
  highScoreRunner = 0;
  gameSpeed = 5;

  player: RunnerPlayer = {
    x: 50,
    y: 200,
    width: 30,
    height: 50,
    dy: 0,
    jumpForce: 12,
    grounded: true,
    color: '#e6007e'
  };

  obstacles: Obstacle[] = [];
  obstacleTimer = 0;

  constructor(private auth: AuthService, private http: HttpClient) { }

  ngOnInit() {
    this.auth.currentUser.subscribe(user => {
      this.isLoggedIn = !!user;
      this.currentUser = user;
      // Cargar puntuaciones si es necesario
    });

    const savedRunner = localStorage.getItem('spRunnerHighScore');
    if (savedRunner) this.highScoreRunner = parseInt(savedRunner, 10);
  }

  ngAfterViewInit() {
    // Si la pestaña inicial fuera el juego
  }

  ngOnDestroy() {
    this.stopRunner();
  }

  // --- TABS & NAVIGATION ---
  showGame(game: string) {
    this.activeTab = game;
    if (game === 'runner') {
      setTimeout(() => this.initRunner(), 100);
    }
  }

  backToDashboard() {
    this.activeTab = 'dashboard';
    this.stopRunner();
  }

  // --- LOGICA QUINIELA ---
  submitQuiniela() {
    if (!this.isLoggedIn) return; // O mostrar aviso
    // Aquí iría la llamada al backend real
    setTimeout(() => {
      this.predictionSubmitted = true;
      // Podríamos guardar en localStorage o BD
    }, 500);
  }

  // --- LOGICA MVP ---
  voteMvp() {
    if (!this.selectedMvp) return;
    this.mvpVoted = true;
    // Llamada backend
  }

  // ===============================================
  // SP COURT RUN (Endless Runner)
  // ===============================================
  initRunner() {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    canvas.width = 800;
    canvas.height = 300;

    // Reset State
    this.player.y = 250; // Ground level - height
    this.player.dy = 0;
    this.obstacles = [];
    this.scoreRunner = 0;
    this.gameSpeed = 5;
    this.gameRunning = true;

    // Inputs
    window.addEventListener('keydown', this.handleInput.bind(this));
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); this.performJump(); });
    canvas.addEventListener('click', () => this.performJump());

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
    if (!this.gameRunning) {
      // Restart if game over
      this.initRunner();
      return;
    }
    if (this.player.grounded) {
      this.player.dy = -this.player.jumpForce;
      this.player.grounded = false;
    }
  }

  runnerLoop() {
    if (!this.gameRunning) return;

    this.ctx.clearRect(0, 0, 800, 300);

    // 1. UPDATE STATE
    this.scoreRunner++;
    this.gameSpeed += 0.002; // Aumentar velocidad progresivamente

    // Spawn Obstacles
    this.obstacleTimer++;
    if (this.obstacleTimer > Math.random() * 60 + 100) { // Random interval
      const type = Math.random() > 0.5 ? 'cone' : 'defender';
      const height = type === 'cone' ? 30 : 60;
      const width = type === 'cone' ? 30 : 30;

      this.obstacles.push({
        x: 800,
        y: 300 - height,
        width: width,
        height: height,
        type: type
      });
      this.obstacleTimer = 0;
    }

    // Physics Player
    this.player.dy += 0.6; // Gravity
    this.player.y += this.player.dy;

    // Floor Collision
    if (this.player.y + this.player.height > 300) {
      this.player.y = 300 - this.player.height;
      this.player.dy = 0;
      this.player.grounded = true;
    }

    // Move Obstacles & Collision Detection
    for (let i = 0; i < this.obstacles.length; i++) {
      let obs = this.obstacles[i];
      obs.x -= this.gameSpeed;

      // Draw Obstacle
      if (obs.type === 'cone') {
        this.ctx.fillStyle = 'orange';
        this.ctx.beginPath();
        this.ctx.moveTo(obs.x, obs.y + obs.height);
        this.ctx.lineTo(obs.x + obs.width / 2, obs.y);
        this.ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        this.ctx.fill();
      } else {
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        // Draw "arms"
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(obs.x - 5, obs.y + 10, 40, 5);
      }

      // Collision
      if (
        this.player.x < obs.x + obs.width &&
        this.player.x + this.player.width > obs.x &&
        this.player.y < obs.y + obs.height &&
        this.player.height + this.player.y > obs.y
      ) {
        this.gameOver();
      }

      // Remove off-screen
      if (obs.x + obs.width < 0) {
        this.obstacles.splice(i, 1);
        i--;
      }
    }

    // Draw Floor
    this.ctx.fillStyle = '#CBB26A'; // Parquet color
    this.ctx.fillRect(0, 290, 800, 10);
    this.ctx.strokeStyle = '#fff'; // Lines
    this.ctx.beginPath();
    this.ctx.moveTo(0, 290);
    this.ctx.lineTo(800, 290);
    this.ctx.stroke();

    // Draw Player (Jersey Style)
    this.ctx.fillStyle = this.player.color;
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    // Head
    this.ctx.fillStyle = '#ffccaa';
    this.ctx.beginPath();
    this.ctx.arc(this.player.x + this.player.width / 2, this.player.y - 10, 10, 0, Math.PI * 2);
    this.ctx.fill();
    // Number
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillText('SP', this.player.x + 2, this.player.y + 30);

    // Draw Score
    this.ctx.fillStyle = 'white';
    this.ctx.font = '20px Arial';
    this.ctx.fillText(`Puntos: ${Math.floor(this.scoreRunner)}`, 20, 30);
    this.ctx.fillText(`Récord: ${this.highScoreRunner}`, 20, 60);

    this.animationId = requestAnimationFrame(() => this.runnerLoop());
  }

  gameOver() {
    this.gameRunning = false;
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(0, 0, 800, 300);

    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('¡FIN DEL JUEGO!', 400, 120);
    this.ctx.font = '20px Arial';
    this.ctx.fillText(`Puntuación: ${Math.floor(this.scoreRunner)}`, 400, 160);
    this.ctx.fillText('Pulsa o Espacio para Reiniciar', 400, 200);
    this.ctx.textAlign = 'left';

    if (this.scoreRunner > this.highScoreRunner) {
      this.highScoreRunner = Math.floor(this.scoreRunner);
      localStorage.setItem('spRunnerHighScore', this.highScoreRunner.toString());
      // Save to backend
      this.http.post(`${environment.apiUrl}/api/scores`, { game: 'runner', score: this.highScoreRunner }).subscribe();
    }
  }
}
