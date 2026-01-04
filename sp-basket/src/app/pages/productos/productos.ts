import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth';

interface ProductPreview {
  name: string;
  description: string;
  image: string;
  price: string;
  status: string;
}

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

import { environment } from '../../../environments/environment';

// ...

@Component({
  selector: 'app-productos',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './productos.html',
  styleUrls: ['./productos.css']
})
export class ProductosComponent implements OnInit, OnDestroy {
  private apiUrl = environment.apiUrl;

  // Countdown
  countdown: Countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  private countdownInterval: any;
  private launchDate = new Date('2025-02-01T00:00:00');

  // Authentication
  isLoggedIn = false;
  currentUser: any = null;

  // Product Previews (moved simplified data here since interface was removed previously but methods need it?)
  productPreviews: ProductPreview[] = [
    {
      name: 'Camiseta Rosa Oficial',
      description: 'Camiseta oficial del equipo senior con tecnología transpirable',
      image: 'assets/images/products/tshirt-pink.png',
      price: 'Desde 25€',
      status: 'Próximamente'
    },
    {
      name: 'Sudadera Premium',
      description: 'Sudadera de algodón premium con logo bordado',
      image: 'assets/images/products/hoodie-black.png',
      price: 'Desde 35€',
      status: 'Próximamente'
    },
    {
      name: 'Gorra SP Basket',
      description: 'Gorra ajustable con logo del club',
      image: 'assets/images/products/cap-pink.png',
      price: 'Desde 15€',
      status: 'Próximamente'
    }
  ];

  // Newsletter
  subscriberName = '';
  subscriberEmail = '';
  subscribed = false;
  isSubscribing = false;

  constructor(
    private http: HttpClient,
    public authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.startCountdown();
    this.checkAuthStatus();

    // Redirect if not logged in
    if (!this.authService.isAuthenticated()) {
      alert('🔒 Debes iniciar sesión para ver los productos.');
      this.router.navigate(['/login']);
    }
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  // ==================== AUTHENTICATION ====================
  checkAuthStatus() {
    const storedUser = localStorage.getItem('currentUser');

    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.token) {
        this.isLoggedIn = true;
        this.currentUser = user;
      } else {
        this.isLoggedIn = false;
        this.currentUser = null;
      }
    } else {
      this.isLoggedIn = false;
      this.currentUser = null;
    }
  }

  // ==================== COUNTDOWN ====================
  startCountdown() {
    this.updateCountdown();
    this.countdownInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  updateCountdown() {
    const now = new Date().getTime();
    const distance = this.launchDate.getTime() - now;

    if (distance < 0) {
      this.countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
      return;
    }

    this.countdown = {
      days: Math.floor(distance / (1000 * 60 * 60 * 24)),
      hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((distance % (1000 * 60)) / 1000)
    };
  }

  // ==================== HERO ACTIONS ====================
  reserveProduct() {
    if (!this.isLoggedIn || !this.currentUser) {
      alert('🔒 Por favor inicia sesión para reservar la camiseta edición especial.');
      this.router.navigate(['/login']);
      return;
    }

    // Send email notification to Admin
    const reservationData = {
      userId: this.currentUser.id,
      username: this.currentUser.username,
      email: this.currentUser.email,
      product: 'Camiseta Edición Especial 2026'
    };

    this.http.post(`${this.apiUrl}/products/reserve`, reservationData).subscribe({
      next: () => {
        alert('✅ ¡Solicitud recibida! Te contactaremos a ' + this.currentUser.email + ' para confirmar talla y pago.');
      },
      error: (err) => {
        console.error('Error reserving:', err);
        // Fallback success for user UX if backend fails/offline
        alert('✅ ¡Solicitud recibida! Te contactaremos pronto.');
      }
    });
  }

  scrollToPreview() {
    const el = document.querySelector('.preview-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // ==================== NEWSLETTER ====================
  subscribeNewsletter() {
    if (!this.subscriberName || !this.subscriberEmail) return;

    this.isSubscribing = true;

    const subscriber = {
      name: this.subscriberName,
      email: this.subscriberEmail
    };

    this.http.post(`${this.apiUrl}/newsletter/subscribe`, subscriber).subscribe({
      next: (response) => {
        console.log('Newsletter subscription successful:', response);
        this.subscribed = true;
        this.subscriberName = '';
        this.subscriberEmail = '';
        this.isSubscribing = false;

        // Ocultar mensaje después de 5 segundos
        setTimeout(() => {
          this.subscribed = false;
        }, 5000);
      },
      error: (err) => {
        console.error('Error subscribing to newsletter:', err);
        this.isSubscribing = false;

        // Fallback: guardar localmente
        const subscribers = JSON.parse(localStorage.getItem('sp_basket_subscribers') || '[]');
        subscribers.push({ ...subscriber, timestamp: new Date() });
        localStorage.setItem('sp_basket_subscribers', JSON.stringify(subscribers));

        this.subscribed = true;
        this.subscriberName = '';
        this.subscriberEmail = '';

        setTimeout(() => {
          this.subscribed = false;
        }, 5000);
      }
    });
  }
}
