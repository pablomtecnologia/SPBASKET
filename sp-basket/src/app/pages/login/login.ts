import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  errorMessage = '';
  returnUrl = '/';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    // Si ya está autenticado, redirigir
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
      return;
    }

    const query = this.route.snapshot.queryParams;
    if (query['returnUrl']) {
      this.returnUrl = query['returnUrl'];
    }
  }

  login() {
    this.errorMessage = '';
    this.loading = true;

    this.authService.login(this.username, this.password).subscribe({
      next: (success) => {
        this.loading = false;
        if (success) {
          this.router.navigateByUrl(this.returnUrl);
        } else {
          this.errorMessage = 'Usuario o contraseña incorrectos.';
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Login component error:', err);
        this.errorMessage = 'Error de conexión al servidor.';
      }
    });
  }
}
