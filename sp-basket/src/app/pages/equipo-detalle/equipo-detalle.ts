import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Player {
  number: number;
  name: string;
  position: string;
  height: string;
  age: number;
}

interface TeamDetail {
  id: string;
  name: string;
  category: string;
  coach: string;
  assistantCoach: string;
  players: Player[];
}

@Component({
  selector: 'app-equipo-detalle',
  imports: [CommonModule],
  templateUrl: './equipo-detalle.html',
  styleUrls: ['./equipo-detalle.css']
})
export class EquipoDetalleComponent implements OnInit {
  team: TeamDetail | null = null;

  private teamsData: { [key: string]: TeamDetail } = {
    'senior-1': {
      id: 'senior-1',
      name: 'Senior 1ª División Masculina',
      category: 'Femenino',
      coach: 'María González',
      assistantCoach: 'Carlos Fernández',
      players: [
        { number: 4, name: 'Laura Martínez', position: 'Base', height: '1.68m', age: 24 },
        { number: 7, name: 'Ana Rodríguez', position: 'Escolta', height: '1.72m', age: 22 },
        { number: 9, name: 'Carmen López', position: 'Alero', height: '1.78m', age: 26 },
        { number: 11, name: 'Elena Sánchez', position: 'Ala-Pívot', height: '1.82m', age: 25 },
        { number: 13, name: 'Patricia Ruiz', position: 'Pívot', height: '1.88m', age: 27 },
        { number: 5, name: 'Isabel García', position: 'Base', height: '1.65m', age: 23 },
        { number: 8, name: 'Sofía Jiménez', position: 'Escolta', height: '1.70m', age: 21 },
        { number: 10, name: 'Marta Díaz', position: 'Alero', height: '1.76m', age: 24 },
        { number: 12, name: 'Lucía Torres', position: 'Ala-Pívot', height: '1.80m', age: 26 },
        { number: 14, name: 'Paula Moreno', position: 'Pívot', height: '1.85m', age: 28 },
        { number: 6, name: 'Andrea Vega', position: 'Base', height: '1.67m', age: 22 },
        { number: 15, name: 'Cristina Ramos', position: 'Escolta', height: '1.73m', age: 25 }
      ]
    },
    'senior-2': {
      id: 'senior-2',
      name: 'Senior 2ª División',
      category: 'Femenino',
      coach: 'Laura Martínez',
      assistantCoach: 'Diego Pérez',
      players: [
        { number: 4, name: 'Beatriz Castro', position: 'Base', height: '1.66m', age: 23 },
        { number: 7, name: 'Raquel Ortiz', position: 'Escolta', height: '1.71m', age: 21 },
        { number: 9, name: 'Silvia Romero', position: 'Alero', height: '1.77m', age: 24 },
        { number: 11, name: 'Natalia Serrano', position: 'Ala-Pívot', height: '1.81m', age: 23 },
        { number: 13, name: 'Victoria Molina', position: 'Pívot', height: '1.86m', age: 25 },
        { number: 5, name: 'Alba Navarro', position: 'Base', height: '1.64m', age: 20 },
        { number: 8, name: 'Claudia Delgado', position: 'Escolta', height: '1.69m', age: 22 },
        { number: 10, name: 'Marina Iglesias', position: 'Alero', height: '1.75m', age: 23 },
        { number: 12, name: 'Irene Campos', position: 'Ala-Pívot', height: '1.79m', age: 24 },
        { number: 14, name: 'Nerea Gil', position: 'Pívot', height: '1.84m', age: 26 },
        { number: 6, name: 'Sara Mendoza', position: 'Base', height: '1.65m', age: 21 },
        { number: 15, name: 'Julia Vargas', position: 'Escolta', height: '1.72m', age: 24 },
        { number: 16, name: 'Eva Santos', position: 'Alero', height: '1.76m', age: 22 },
        { number: 17, name: 'Rosa Blanco', position: 'Pívot', height: '1.87m', age: 25 }
      ]
    },
    'juvenil': {
      id: 'juvenil',
      name: 'Proyecto Pioneers',
      category: 'Juvenil Femenino',
      coach: 'Ana Rodríguez',
      assistantCoach: 'Miguel Ángel Ruiz',
      players: [
        { number: 4, name: 'Carla Hernández', position: 'Base', height: '1.65m', age: 17 },
        { number: 7, name: 'Daniela Muñoz', position: 'Escolta', height: '1.70m', age: 16 },
        { number: 9, name: 'Emma Alonso', position: 'Alero', height: '1.74m', age: 17 },
        { number: 11, name: 'Gabriela Cortés', position: 'Ala-Pívot', height: '1.78m', age: 18 },
        { number: 13, name: 'Helena Prieto', position: 'Pívot', height: '1.83m', age: 17 },
        { number: 5, name: 'Inés Rubio', position: 'Base', height: '1.63m', age: 16 },
        { number: 8, name: 'Jimena Cano', position: 'Escolta', height: '1.68m', age: 17 },
        { number: 10, name: 'Lara Medina', position: 'Alero', height: '1.73m', age: 16 },
        { number: 12, name: 'Mía Guerrero', position: 'Ala-Pívot', height: '1.77m', age: 18 },
        { number: 14, name: 'Noa Pascual', position: 'Pívot', height: '1.82m', age: 17 },
        { number: 6, name: 'Olivia Soler', position: 'Base', height: '1.64m', age: 16 },
        { number: 15, name: 'Valeria Vidal', position: 'Escolta', height: '1.71m', age: 17 },
        { number: 16, name: 'Zoe Marín', position: 'Alero', height: '1.75m', age: 16 },
        { number: 17, name: 'Aitana Sanz', position: 'Ala-Pívot', height: '1.79m', age: 18 },
        { number: 18, name: 'Martina León', position: 'Pívot', height: '1.84m', age: 17 }
      ]
    },
    'cadete': {
      id: 'cadete',
      name: 'Cadete Femenino',
      category: 'Cadete',
      coach: 'Carmen López',
      assistantCoach: 'Javier Mora',
      players: [
        { number: 4, name: 'Abril Domínguez', position: 'Base', height: '1.62m', age: 15 },
        { number: 7, name: 'Blanca Peña', position: 'Escolta', height: '1.67m', age: 14 },
        { number: 9, name: 'Celia Cruz', position: 'Alero', height: '1.71m', age: 15 },
        { number: 11, name: 'Diana Flores', position: 'Ala-Pívot', height: '1.75m', age: 16 },
        { number: 13, name: 'Elsa Reyes', position: 'Pívot', height: '1.80m', age: 15 },
        { number: 5, name: 'Fátima Ortega', position: 'Base', height: '1.60m', age: 14 },
        { number: 8, name: 'Gisela Ramírez', position: 'Escolta', height: '1.65m', age: 15 },
        { number: 10, name: 'Héctor Silva', position: 'Alero', height: '1.70m', age: 14 },
        { number: 12, name: 'Iris Aguilar', position: 'Ala-Pívot', height: '1.74m', age: 16 },
        { number: 14, name: 'Jana Herrera', position: 'Pívot', height: '1.79m', age: 15 },
        { number: 6, name: 'Kiara Méndez', position: 'Base', height: '1.61m', age: 14 },
        { number: 15, name: 'Luna Cabrera', position: 'Escolta', height: '1.68m', age: 15 },
        { number: 16, name: 'Maya Fuentes', position: 'Alero', height: '1.72m', age: 14 }
      ]
    },
    'infantil': {
      id: 'infantil',
      name: 'Infantil Femenino',
      category: 'Infantil',
      coach: 'Elena Sánchez',
      assistantCoach: 'Roberto Castro',
      players: [
        { number: 4, name: 'Naia Rojas', position: 'Base', height: '1.58m', age: 13 },
        { number: 7, name: 'Ona Núñez', position: 'Escolta', height: '1.63m', age: 12 },
        { number: 9, name: 'Petra Lara', position: 'Alero', height: '1.67m', age: 13 },
        { number: 11, name: 'Quima Bravo', position: 'Ala-Pívot', height: '1.71m', age: 14 },
        { number: 13, name: 'Rita Parra', position: 'Pívot', height: '1.76m', age: 13 },
        { number: 5, name: 'Sofía Ibáñez', position: 'Base', height: '1.56m', age: 12 },
        { number: 8, name: 'Telma Carrasco', position: 'Escolta', height: '1.61m', age: 13 },
        { number: 10, name: 'Uma Hidalgo', position: 'Alero', height: '1.66m', age: 12 },
        { number: 12, name: 'Vera Montero', position: 'Ala-Pívot', height: '1.70m', age: 14 },
        { number: 14, name: 'Wendy Calvo', position: 'Pívot', height: '1.75m', age: 13 },
        { number: 6, name: 'Xenia Duran', position: 'Base', height: '1.57m', age: 12 },
        { number: 15, name: 'Yaiza Benítez', position: 'Escolta', height: '1.64m', age: 13 },
        { number: 16, name: 'Zara Esteban', position: 'Alero', height: '1.68m', age: 12 },
        { number: 17, name: 'Alma Garrido', position: 'Ala-Pívot', height: '1.72m', age: 14 },
        { number: 18, name: 'Berta Santana', position: 'Pívot', height: '1.77m', age: 13 },
        { number: 19, name: 'Cora Velasco', position: 'Base', height: '1.59m', age: 12 }
      ]
    },
    'mini': {
      id: 'mini',
      name: 'Mini Femenino',
      category: 'Mini',
      coach: 'Patricia Ruiz',
      assistantCoach: 'Fernando Ortiz',
      players: [
        { number: 4, name: 'Delia Carmona', position: 'Base', height: '1.52m', age: 11 },
        { number: 7, name: 'Elisa Moya', position: 'Escolta', height: '1.57m', age: 10 },
        { number: 9, name: 'Fiona Ponce', position: 'Alero', height: '1.61m', age: 11 },
        { number: 11, name: 'Gala Suárez', position: 'Ala-Pívot', height: '1.65m', age: 12 },
        { number: 13, name: 'Hada Gallego', position: 'Pívot', height: '1.70m', age: 11 },
        { number: 5, name: 'Iris Caballero', position: 'Base', height: '1.50m', age: 10 },
        { number: 8, name: 'Jana Nieto', position: 'Escolta', height: '1.55m', age: 11 },
        { number: 10, name: 'Kira Vázquez', position: 'Alero', height: '1.60m', age: 10 },
        { number: 12, name: 'Lina Román', position: 'Ala-Pívot', height: '1.64m', age: 12 },
        { number: 14, name: 'Mila Soto', position: 'Pívot', height: '1.69m', age: 11 },
        { number: 6, name: 'Nora Crespo', position: 'Base', height: '1.51m', age: 10 },
        { number: 15, name: 'Olga Ferrer', position: 'Escolta', height: '1.58m', age: 11 },
        { number: 16, name: 'Pilar Arias', position: 'Alero', height: '1.62m', age: 10 },
        { number: 17, name: 'Queta Lorenzo', position: 'Ala-Pívot', height: '1.66m', age: 12 },
        { number: 18, name: 'Rocío Mora', position: 'Pívot', height: '1.71m', age: 11 },
        { number: 19, name: 'Sonia Castillo', position: 'Base', height: '1.53m', age: 10 },
        { number: 20, name: 'Tania Rubio', position: 'Escolta', height: '1.59m', age: 11 },
        { number: 21, name: 'Úrsula Pastor', position: 'Alero', height: '1.63m', age: 10 }
      ]
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    const teamId = this.route.snapshot.paramMap.get('id');
    if (teamId && this.teamsData[teamId]) {
      this.team = this.teamsData[teamId];
    } else {
      this.router.navigate(['/equipos']);
    }
  }

  goBack() {
    this.router.navigate(['/equipos']);
  }
}
