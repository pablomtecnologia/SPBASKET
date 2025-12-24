import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './register.html',
    styleUrls: ['./register.css']
})
export class RegisterComponent {
    userData = {
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        nombre: '',
        apellidos: ''
    };

    loading = false;
    errorMessage = '';
    successMessage = '';

    constructor(private http: HttpClient, private router: Router) { }

    onSubmit() {
        if (this.userData.password !== this.userData.confirmPassword) {
            this.errorMessage = 'Las contraseñas no coinciden';
            return;
        }

        this.loading = true;
        this.errorMessage = '';

        this.http.post('https://common-lions-grab.loca.lt/api/register', this.userData)
            .subscribe({
                next: (response: any) => {
                    this.successMessage = '¡Registro completado! Redirigiendo al login...';
                    setTimeout(() => {
                        this.router.navigate(['/login']);
                    }, 2000);
                },
                error: (err) => {
                    console.error(err);
                    this.errorMessage = err.error?.message || 'Error al registrar usuario';
                    this.loading = false;
                }
            });
    }
}
