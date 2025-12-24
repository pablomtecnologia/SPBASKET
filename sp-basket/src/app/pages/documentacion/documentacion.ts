import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Document {
  title: string;
  description: string;
  link: string;
}

@Component({
  selector: 'app-documentacion',
  imports: [CommonModule, RouterLink],
  templateUrl: './documentacion.html',
  styleUrls: ['./documentacion.css']
})
export class DocumentacionComponent {
  documents: Document[] = [
    {
      title: 'Actuación ante Lesiones',
      description: 'Protocolo de actuación en caso de lesiones durante entrenamientos y partidos.',
      link: '#'
    },
    {
      title: 'Pago Ficha Deportiva',
      description: 'Información sobre el proceso de pago de la ficha deportiva y cuotas mensuales.',
      link: '#'
    },
    {
      title: 'Normativa Interna',
      description: 'Reglamento interno del club y normas de conducta para jugadores y familias.',
      link: '#'
    },
    {
      title: 'Calendario de Entrenamientos',
      description: 'Horarios y ubicaciones de los entrenamientos de todos los equipos.',
      link: '#'
    },
    {
      title: 'Autorización Menores',
      description: 'Formulario de autorización para menores de edad.',
      link: '#'
    },
    {
      title: 'Seguro Deportivo',
      description: 'Información sobre la cobertura del seguro deportivo del club.',
      link: '#'
    }
  ];

  constructor() { }
}
