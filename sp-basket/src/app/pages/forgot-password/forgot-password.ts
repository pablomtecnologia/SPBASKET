import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './forgot-password.html',
    styleUrls: ['./forgot-password.css'] // Reutilizamos estilos login/register o creamos uno simple
})
export class ForgotPasswordComponent {
    email = '';
    loading = false;
    message = '';
    isError = false;

    constructor(private http: HttpClient) { }

    onSubmit() {
        this.loading = true;
        this.message = '';
        this.isError = false;

        this.http.post('https://common-lions-grab.loca.lt/api/forgot-password', { email: this.email })
            .subscribe({
                next: (res: any) => {
                    this.loading = false;
                    this.message = res.message;
                    this.isError = false;
                },
                error: (err) => {
                    this.loading = false;
                    this.message = 'Error al procesar la solicitud. Inténtalo más tarde.';
                    this.isError = true;
                    console.error(err);
                }
            });
    }
}
