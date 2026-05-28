import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PageHeaderComponent } from '../../components/page-header/page-header';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './contacto.html',
  styleUrls: ['./contacto.css']
})
export class ContactoComponent {
  formData = {
    name: '',
    email: '',
    age: null,
    message: ''
  };

  submitted = false;
  isLoading = false;
  errorMessage = '';

  constructor(private http: HttpClient) { }

  onSubmit() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.http.post(`${environment.apiUrl}/contact`, this.formData).subscribe({
      next: (response) => {
        console.log('Message sent:', response);
        this.submitted = true;
        this.isLoading = false;

        // Reset form after 3 seconds
        setTimeout(() => {
          this.formData = {
            name: '',
            email: '',
            age: null,
            message: ''
          };
          this.submitted = false;
        }, 3000);
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.errorMessage = 'Hubo un error al enviar el mensaje. Por favor intenta de nuevo.';
        this.isLoading = false;
      }
    });
  }
}
