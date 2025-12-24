import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface VotingProduct {
  id: number;
  name: string;
  description: string;
  image: string;
  votes: number;
  userVoted: boolean;
}

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

@Component({
  selector: 'app-productos',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './productos.html',
  styleUrls: ['./productos.css']
})
export class ProductosComponent implements OnInit, OnDestroy {
  private apiUrl = 'http://localhost:3001/api';

  // Countdown
  countdown: Countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  private countdownInterval: any;
  private launchDate = new Date('2025-02-01T00:00:00');

  // Authentication
  isLoggedIn = false;
  currentUser: any = null;

  // Voting
  votingProducts: VotingProduct[] = [
    {
      id: 1,
      name: 'Camiseta Oficial Rosa',
      description: 'Camiseta oficial del equipo con diseño exclusivo y tecnología transpirable',
      image: 'assets/images/products/tshirt-pink.png',
      votes: 0,
      userVoted: false
    },
    {
      id: 2,
      name: 'Sudadera con Capucha',
      description: 'Sudadera premium de algodón con logo bordado y capucha ajustable',
      image: 'assets/images/products/hoodie-black.png',
      votes: 0,
      userVoted: false
    },
    {
      id: 3,
      name: 'Gorra SP Basket',
      description: 'Gorra ajustable con logo del club y cierre de velcro',
      image: 'assets/images/products/cap-pink.png',
      votes: 0,
      userVoted: false
    },
    {
      id: 4,
      name: 'Bufanda Oficial',
      description: 'Bufanda en colores rosa y negro del club, perfecta para los partidos',
      image: 'assets/images/logo.png',
      votes: 0,
      userVoted: false
    },
    {
      id: 5,
      name: 'Mochila Deportiva',
      description: 'Mochila espaciosa con compartimentos para equipamiento deportivo',
      image: 'assets/images/logo.png',
      votes: 0,
      userVoted: false
    },
    {
      id: 6,
      name: 'Botella Térmica',
      description: 'Botella de acero inoxidable que mantiene bebidas frías o calientes',
      image: 'assets/images/logo.png',
      votes: 0,
      userVoted: false
    }
  ];

  isVoting = false;
  votingProductId: number | null = null;

  // Product Previews
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

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.startCountdown();
    this.checkAuthStatus();
    this.loadVotes();
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  // ==================== AUTHENTICATION ====================
  checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      this.isLoggedIn = true;
      this.currentUser = JSON.parse(user);
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

  // ==================== VOTING ====================
  loadVotes() {
    this.http.get<any[]>(`${this.apiUrl}/product-votes`).subscribe({
      next: (votes) => {
        // Actualizar votos de los productos
        votes.forEach(vote => {
          const product = this.votingProducts.find(p => p.id === vote.productId);
          if (product) {
            product.votes = vote.votes;
          }
        });

        // Si el usuario está logueado, cargar sus votos
        if (this.isLoggedIn && this.currentUser) {
          this.loadUserVotes();
        }
      },
      error: (err) => {
        console.error('Error loading votes:', err);
        // Cargar votos locales como fallback
        this.loadLocalVotes();
      }
    });
  }

  loadUserVotes() {
    const userId = this.currentUser.userId || this.currentUser.id;

    this.http.get<any[]>(`${this.apiUrl}/product-votes/user/${userId}`).subscribe({
      next: (userVotes) => {
        userVotes.forEach(vote => {
          const product = this.votingProducts.find(p => p.id === vote.productId);
          if (product) {
            product.userVoted = true;
          }
        });
      },
      error: (err) => {
        console.error('Error loading user votes:', err);
      }
    });
  }

  loadLocalVotes() {
    const saved = localStorage.getItem('sp_basket_votes');
    if (saved) {
      const votes = JSON.parse(saved);
      votes.forEach((vote: any) => {
        const product = this.votingProducts.find(p => p.id === vote.id);
        if (product) {
          product.votes = vote.votes;
          product.userVoted = vote.voted;
        }
      });
    }
  }

  voteProduct(product: VotingProduct) {
    if (!this.isLoggedIn || product.userVoted || this.isVoting) return;

    this.isVoting = true;
    this.votingProductId = product.id;

    const userId = this.currentUser.userId || this.currentUser.id;
    const token = localStorage.getItem('token');

    this.http.post(`${this.apiUrl}/product-votes`, {
      productId: product.id,
      userId: userId
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: (response: any) => {
        // Actualizar UI
        product.votes = response.votes;
        product.userVoted = true;

        this.isVoting = false;
        this.votingProductId = null;

        // Guardar en localStorage como cache
        this.saveVotesToLocal();
      },
      error: (err) => {
        console.error('Error voting:', err);
        this.isVoting = false;
        this.votingProductId = null;

        // Fallback: guardar localmente
        product.votes++;
        product.userVoted = true;
        this.saveVotesToLocal();
      }
    });
  }

  saveVotesToLocal() {
    const votes = this.votingProducts.map(p => ({
      id: p.id,
      votes: p.votes,
      voted: p.userVoted
    }));
    localStorage.setItem('sp_basket_votes', JSON.stringify(votes));
  }

  getVotePercentage(product: VotingProduct): number {
    const totalVotes = this.votingProducts.reduce((sum, p) => sum + p.votes, 0);
    if (totalVotes === 0) return 0;
    return Math.round((product.votes / totalVotes) * 100);
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
