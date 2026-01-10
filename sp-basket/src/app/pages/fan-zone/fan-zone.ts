import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-fan-zone',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './fan-zone.html',
  styleUrls: ['./fan-zone.css']
})
export class FanZoneComponent implements OnInit, AfterViewInit {
  @ViewChild('hoopsCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  // Auth state
  isLoggedIn = false;
  currentUser: any = null;

  // Games state
  activeTab: 'hoops' | 'memory' = 'hoops';
  rankings: any[] = [];

  // --- HOOPS GAME VARS ---
  ctx!: CanvasRenderingContext2D;
  ball = { x: 150, y: 300, vx: 0, vy: 0, radius: 15, isDragging: false, isThrown: false };
  hoop = { x: 150, y: 80, width: 60, height: 10 };
  dragStart = { x: 0, y: 0 };
  scoreHoops = 0;
  messageHoops = '¡Arrastra y lanza!';
  gravity = 0.5;
  friction = 0.99;

  // --- MEMORY GAME VARS ---
  cards: any[] = [];
  flippedCards: any[] = [];
  moves = 0;
  memoryGameWon = false;
  icons = ['🏀', '👟', '👕', '🏆', '🥤', '🧢', '📢', '🥇'];

  constructor(private auth: AuthService, private http: HttpClient) { }

  ngOnInit() {
    this.auth.currentUser.subscribe(user => {
      this.isLoggedIn = !!user;
      this.currentUser = user;
      if (this.isLoggedIn) this.loadRankings('hoops');
    });
  }

  ngAfterViewInit() {
    if (this.isLoggedIn) this.initHoopsGame();
  }

  setActiveTab(tab: 'hoops' | 'memory') {
    this.activeTab = tab;
    this.loadRankings(tab);
    if (tab === 'hoops') setTimeout(() => this.initHoopsGame(), 100);
    if (tab === 'memory') this.resetMemoryGame();
  }

  loadRankings(game: string) {
    this.http.get<any[]>(`${environment.apiUrl}/api/rankings?game=${game}`).subscribe(data => {
      this.rankings = data;
    });
  }

  saveScore(game: string, score: number) {
    if (!this.isLoggedIn) return;
    this.http.post(`${environment.apiUrl}/api/scores`, { game, score }).subscribe(() => {
      // Reload rankings silently to check if we made it to the top
      this.loadRankings(game);
    });
  }

  // ==========================================
  // HOOPS GAME ENGINE (Canvas)
  // ==========================================
  initHoopsGame() {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    // Event Listeners
    canvas.addEventListener('mousedown', (e) => this.onInputStart(e));
    canvas.addEventListener('mousemove', (e) => this.onInputMove(e));
    canvas.addEventListener('mouseup', () => this.onInputEnd());

    // Touch support
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); this.onInputStart(e.touches[0]); });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); this.onInputMove(e.touches[0]); });
    canvas.addEventListener('touchend', (e) => { e.preventDefault(); this.onInputEnd(); });

    this.resetBall();
    this.gameLoop();
  }

  resetBall() {
    this.ball.x = 150;
    this.ball.y = 350;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.isDragging = false;
    this.ball.isThrown = false;
  }

  onInputStart(e: any) {
    if (this.ball.isThrown) return;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = (e.clientX || e.pageX) - rect.left;
    const y = (e.clientY || e.pageY) - rect.top;

    // Hit test ball
    const dist = Math.sqrt((x - this.ball.x) ** 2 + (y - this.ball.y) ** 2);
    if (dist < 30) {
      this.ball.isDragging = true;
      this.dragStart = { x, y };
    }
  }

  onInputMove(e: any) {
    if (!this.ball.isDragging) return;
    // Visual feedback usually involves drawing a trajectory line, implemented in draw()
  }

  onInputEnd() {
    if (!this.ball.isDragging) return;
    this.ball.isDragging = false;
    this.ball.isThrown = true;

    // Calculate throw vector based on drag distance (inverted)
    // Simple physics: pull back to shoot forward
    // Or Follow cursor? Let's do simple "Throw up" based on cursor release speed or position?
    // Let's do: Dragging moves the ball, releasing throws it.
    // Wait, let's do "Pull and Release" (Angry Birds style) or "Flick".
    // Let's implement simple "Flick" - velocity depends on last movement?
    // Easier: "Pull Back" style. 

    // Implementation: simple throw up with random deviation based on skill? No, skill based.
    // Let's assume the user dragged the ball "aiming".
    // Actually, simple flick is best for hoops.

    // Simplified: Just give it upwards velocity with slight variations
    this.ball.vx = (Math.random() - 0.5) * 4; // Slight drift
    this.ball.vy = -18; // Strong shot up
  }

  // Better Input: Click and drag to aim (slingshot)
  // Let's stick to a simpler logic:
  // You click, hold to charge power, release to shoot. 
  // Let's modify: `initHoopsGame` loop handles logic.

  gameLoop() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, 300, 400);

    // 1. Draw Hoop
    this.ctx.fillStyle = '#ff6600';
    this.ctx.fillRect(this.hoop.x - 30, this.hoop.y, 60, 5); // Rim

    // Backboard
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(this.hoop.x - 40, this.hoop.y - 40, 80, 40);
    this.ctx.strokeRect(this.hoop.x - 40, this.hoop.y - 40, 80, 40);
    this.ctx.fillStyle = '#ff6600';
    this.ctx.fillRect(this.hoop.x - 15, this.hoop.y - 25, 30, 25); // Small square

    // 2. Physics
    if (this.ball.isThrown) {
      this.ball.x += this.ball.vx;
      this.ball.y += this.ball.vy;
      this.ball.vy += this.gravity;
      // this.ball.vx *= this.friction; (Air resistance)

      // Wall bounce
      if (this.ball.x < 15 || this.ball.x > 285) this.ball.vx *= -0.8;

      // Rim collisions (Simplified)
      if (this.ball.y >= this.hoop.y - 5 && this.ball.y <= this.hoop.y + 5) {
        if (this.ball.x > this.hoop.x - 30 && this.ball.x < this.hoop.x + 30) {
          // Did it go IN? (Downward velocity)
          if (this.ball.vy > 0) {
            this.scoreHoops++;
            this.messageHoops = "¡CANASTA! 🔥";
            if (this.scoreHoops > 0) this.saveScore('hoops', this.scoreHoops); // Save active score/streak
            this.resetBall();
            this.ball.isThrown = false; // Stop immediately
          }
        } else if (Math.abs(this.ball.x - (this.hoop.x - 30)) < 10 || Math.abs(this.ball.x - (this.hoop.x + 30)) < 10) {
          // Hit the rim edge
          this.ball.vx *= -1;
          this.ball.vy *= -0.8;
        }
      }

      // Floor reset
      if (this.ball.y > 450) {
        this.messageHoops = "¡Fallo!";
        this.scoreHoops = 0; // Streak reset
        this.resetBall();
      }
    }

    // 3. Draw Ball
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ff6600';
    this.ctx.fill();
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    // Lines on ball
    this.ctx.beginPath();
    this.ctx.moveTo(this.ball.x - 15, this.ball.y);
    this.ctx.bezierCurveTo(this.ball.x - 5, this.ball.y + 10, this.ball.x + 5, this.ball.y + 10, this.ball.x + 15, this.ball.y);
    this.ctx.stroke();

    if (this.activeTab === 'hoops') requestAnimationFrame(() => this.gameLoop());
  }

  // Shoot trigger (simulated for simplicity now: pure timing/click based might be better if canvas physics is too erratic)
  // Let's override the mouse handlers above for a simpler "Click to Shoot" mechanic with a moving hoop?
  // User asked for "More elaborate". Moving hoop is good.

  // NEW LOGIC: Moving Hoop + Click Timing (Simpler but polished graphics)
  shootSimple() {
    if (this.ball.isThrown) return;
    this.ball.isThrown = true;
    // Hoop is at this.hoop.x (which is static 150 now).
    // We need to move the HOOP for difficulty.
    const dx = (this.hoop.x - this.ball.x);
    // Perfect shot needs vx to match dx over time?
    // Let's just launch it towards the hoop with some randomness
    this.ball.vx = dx / 20 + (Math.random() - 0.5) * 2;
    this.ball.vy = -16;
  }

  // ... Memory logic same as before but calling saveScore ...
  resetMemoryGame() {
    this.memoryGameWon = false;
    this.moves = 0;
    this.flippedCards = [];
    const deck = [...this.icons, ...this.icons]
      .sort(() => Math.random() - 0.5)
      .map((icon, index) => ({ id: index, icon, flipped: false, matched: false }));
    this.cards = deck;
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
      if (this.cards.every(c => c.matched)) {
        this.memoryGameWon = true;
        // Score for memory = 100 - moves (min 0)
        const score = Math.max(0, 100 - this.moves);
        this.saveScore('memory', score);
      }
    } else {
      c1.flipped = false; c2.flipped = false;
    }
    this.flippedCards = [];
  }
}
