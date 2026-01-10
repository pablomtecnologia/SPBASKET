import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface MemoryCard {
  id: number;
  icon: string;
  flipped: boolean;
  matched: boolean;
}

@Component({
  selector: 'app-fan-zone',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fan-zone.html',
  styleUrls: ['./fan-zone.css']
})
export class FanZoneComponent implements OnInit {
  // --- JUEGO TIRO LIBRE ---
  score: number = 0;
  highScore: number = 0;
  cursorPosition: number = 50; // %
  movingRight: boolean = true;
  speed: number = 1.5;
  gameActive: boolean = false;
  message: string = '¡Pulsa para lanzar!';
  animationId: any;
  lastShotResult: 'success' | 'fail' | null = null;

  // --- JUEGO MEMORY ---
  cards: MemoryCard[] = [];
  flippedCards: MemoryCard[] = [];
  moves: number = 0;
  memoryGameWon: boolean = false;

  // Iconos para las cartas (Basket theme)
  icons = ['🏀', '👟', '👕', '🏆', '🥤', '🧢', '📢', '🥇'];

  constructor() { }

  ngOnInit(): void {
    // Cargar récord local
    const savedScore = localStorage.getItem('spShotHighScore');
    if (savedScore) this.highScore = parseInt(savedScore, 10);

    // Iniciar Memory
    this.resetMemoryGame();
  }

  // ==============================
  // LOGICA TIRO LIBRE
  // ==============================
  startGame() {
    if (this.gameActive) return;
    this.gameActive = true;
    this.message = '¡Concentración...!';
    this.lastShotResult = null;
    this.gameLoop();
  }

  gameLoop() {
    if (!this.gameActive) return;

    if (this.movingRight) {
      this.cursorPosition += this.speed;
      if (this.cursorPosition >= 95) this.movingRight = false;
    } else {
      this.cursorPosition -= this.speed;
      if (this.cursorPosition <= 5) this.movingRight = true;
    }

    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  shoot() {
    if (!this.gameActive) {
      this.startGame();
      return;
    }

    this.gameActive = false;
    cancelAnimationFrame(this.animationId);

    // Zona verde está entre 45% y 55% (centro)
    const isSuccess = this.cursorPosition >= 42 && this.cursorPosition <= 58;

    if (isSuccess) {
      this.score++;
      this.speed += 0.2; // Aumentar dificultad
      this.message = '¡CANASTA! 🔥 +1 Puntos';
      this.lastShotResult = 'success';
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('spShotHighScore', this.highScore.toString());
      }
      setTimeout(() => this.startGame(), 1500);
    } else {
      this.message = '¡Fallo! 🧱 Inténtalo de nuevo';
      this.lastShotResult = 'fail';
      this.score = 0;
      this.speed = 1.5; // Reset velocidad
    }
  }

  // ==============================
  // LOGICA MEMORY
  // ==============================
  resetMemoryGame() {
    this.memoryGameWon = false;
    this.moves = 0;
    this.flippedCards = [];

    // Duplicar iconos y mezclar
    const deck = [...this.icons, ...this.icons]
      .sort(() => Math.random() - 0.5)
      .map((icon, index) => ({
        id: index,
        icon,
        flipped: false,
        matched: false
      }));

    this.cards = deck;
  }

  flipCard(card: MemoryCard) {
    if (card.flipped || card.matched || this.flippedCards.length >= 2) return;

    card.flipped = true;
    this.flippedCards.push(card);

    if (this.flippedCards.length === 2) {
      this.moves++;
      this.checkMatch();
    }
  }

  checkMatch() {
    const [card1, card2] = this.flippedCards;

    if (card1.icon === card2.icon) {
      card1.matched = true;
      card2.matched = true;
      this.flippedCards = [];

      if (this.cards.every(c => c.matched)) {
        this.memoryGameWon = true;
      }
    } else {
      setTimeout(() => {
        card1.flipped = false;
        card2.flipped = false;
        this.flippedCards = [];
      }, 1000);
    }
  }
}
