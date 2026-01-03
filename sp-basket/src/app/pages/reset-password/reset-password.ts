
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './reset-password.html',
    styleUrls: ['./reset-password.css']
})
export class ResetPasswordComponent implements OnInit {
    token = '';
    password = '';
    confirmPassword = '';
    loading = false;
    message = '';
    isError = false;

    constructor(
        private route: ActivatedRoute,
        private http: HttpClient,
        private router: Router
    ) { }

    ngOnInit() {
        this.token = this.route.snapshot.queryParams['token'];
        if (!this.token) {
            this.isError = true;
            this.message = 'Token inválido o no proporcionado.';
        }
    }

    onSubmit() {
        if (this.password !== this.confirmPassword) {
            this.message = 'Las contraseñas no coinciden';
            this.isError = true;
            return;
        }

        if (this.password.length < 6) {
            this.message = 'La contraseña debe tener al menos 6 caracteres';
            this.isError = true;
            return;
        }

        this.loading = true;
        this.message = '';
        this.isError = false;

        this.http.post('http://localhost:3001/api/confirm-password-reset', {
            token: this.token,
            newPassword: this.password
        })
            .subscribe({
                next: (res: any) => {
                    this.loading = false;
                    this.message = 'Contraseña actualizada correctamente. Redirigiendo...';
                    this.isError = false;
                    setTimeout(() => {
                        this.router.navigate(['/login']);
                    }, 3000);
                },
                error: (err) => {
                    this.loading = false;
                    this.message = err.error?.message || 'Error al actualizar la contraseña.';
                    this.isError = true;
                }
            });
    }
}
