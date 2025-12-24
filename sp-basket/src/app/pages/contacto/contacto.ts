import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contacto',
  imports: [CommonModule, FormsModule],
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

  onSubmit() {
    console.log('Form submitted:', this.formData);
    this.submitted = true;

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
  }
}
