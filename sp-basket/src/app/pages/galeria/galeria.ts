import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-galeria',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './galeria.html',
  styleUrls: ['./galeria.css']
})
export class GaleriaComponent implements OnInit {

  driveLink = 'https://drive.google.com/file/d/1mbNGmXRi76Ryoi3mCO2Giq8FaFrRAt4I/view?usp=drivesdk';

  album = {
    id: 1,
    title: 'Colección Completa 2024-2025',
    description: 'Accede a todas las fotos de la temporada alojadas en nuestra nube.',
    date: 'Temporada Actual',
    coverImage: '/assets/images/bg-galeria.jpg', // Usamos la imagen de fondo asegurada
    photoCount: 'Ver Fotos'
  };

  constructor() { }

  ngOnInit() { }

  openDrive() {
    window.open(this.driveLink, '_blank');
  }
}
