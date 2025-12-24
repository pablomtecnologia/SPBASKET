import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-pioneers',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './pioneers.html',
    styleUrls: ['./pioneers.css']
})
export class PioneersComponent {

    // DATOS REALES DE PIONEERS (Extraídos y corregidos)
    jugadores = [
        {
            id: "1",
            nombre: "Lis",
            numero: "1",
            posicion: "Jugadora",
            lema: "Precisión, talento y buena actitud desde la línea de tiros libres.",
            foto: "/assets/pioneers_clean/pioneer-1-lis.jpg"
        },
        {
            id: "2",
            nombre: "Miguel",
            numero: "2",
            posicion: "Jugador",
            lema: "Alegre, apasionado y siempre dando el 100% en la cancha.",
            foto: "/assets/pioneers_clean/pioneer-2-miguel.jpg"
        },
        {
            id: "3",
            nombre: "Hugo",
            numero: "3",
            posicion: "Jugador",
            lema: "Cada partido es una oportunidad para crecer y disfrutar.",
            foto: "/assets/pioneers_clean/pioneer-hugo.jpg"
        },
        {
            id: "4",
            nombre: "Antonio",
            numero: "4",
            posicion: "Jugador",
            lema: "Risueño y alegre, contagiando felicidad al equipo.",
            foto: "/assets/pioneers_clean/pioneer-4-antonio.jpg"
        },
        {
            id: "5",
            nombre: "Julen", // Corregido de "mejora"
            numero: "5",
            posicion: "Jugador",
            lema: "Mejora en cada partido y no deja de crecer.",
            foto: "/assets/pioneers_clean/pioneer-5-mejora.jpg"
        },
        {
            id: "6",
            nombre: "Daniel",
            numero: "6",
            posicion: "Jugador",
            lema: "Nuestro jugador más joven. Cada día crece y brilla.",
            foto: "/assets/pioneers_clean/pioneer-6-daniel.jpg"
        },
        {
            id: "7",
            nombre: "Gabi", // Corregido de "Tenemos"
            numero: "7",
            posicion: "Jugador",
            lema: "Ejemplo de esfuerzo y constancia, siempre con energía.",
            foto: "/assets/pioneers_clean/pioneer-7-tenemos.jpg"
        },
        {
            id: "8",
            nombre: "Pablo",
            numero: "8",
            posicion: "Jugador",
            lema: "Con paso firme y a su propio ritmo, sumando al equipo.",
            foto: "/assets/pioneers_clean/pioneer-8-pablo.jpg"
        },
        {
            id: "9",
            nombre: "Leonid", // Corregido de "Siempre"
            numero: "9",
            posicion: "Jugador",
            lema: "Siempre en movimiento y con ocurrencias que animan.",
            foto: "/assets/pioneers_clean/pioneer-9-siempre.jpg"
        },
        {
            id: "10",
            nombre: "Hugo",
            numero: "10",
            posicion: "Jugador",
            lema: "Pieza clave, gran corazón dentro y fuera de la cancha.",
            foto: "/assets/pioneers_clean/pioneer-10-hugo.jpg"
        },
        {
            id: "11",
            nombre: "David",
            numero: "11",
            posicion: "Jugador",
            lema: "Sigue creciendo y aprendiendo en cada paso. Pura actitud.",
            foto: "/assets/pioneers_clean/pioneer-11-david.jpg"
        },
        {
            id: "12",
            nombre: "Mustafa", // Corregido de "ejemplo"
            numero: "12",
            posicion: "Jugador",
            lema: "Ejemplo de superación y constancia inagotable.",
            foto: "/assets/pioneers_clean/pioneer-12-ejemplo.jpg"
        },
        {
            id: "14",
            nombre: "Javi",
            numero: "14",
            posicion: "Jugador",
            lema: "Siempre con buena actitud y ganas de dar lo mejor.",
            foto: "/assets/pioneers_clean/pioneer-14-javi.jpg"
        },
        {
            id: "15",
            nombre: "Elenita",
            numero: "15",
            posicion: "Jugadora",
            lema: "Pequeña pero matona. ¡Lista para brillar!",
            foto: "/assets/pioneers_clean/pioneer-15-elenita.jpg"
        },
        {
            id: "16",
            nombre: "Laura",
            numero: "16",
            posicion: "Jugadora",
            lema: "Trabajadora, guerrera y puro corazón en la cancha.",
            foto: "/assets/pioneers_clean/pioneer-16-laura.jpg"
        },
        {
            id: "17",
            nombre: "Magdalena", // Corregido de "Atenta"
            numero: "17",
            posicion: "Jugadora",
            lema: "Atenta, compañera y siempre dispuesta a ayudar.",
            foto: "/assets/pioneers_clean/pioneer-17-atenta.jpg"
        },
        {
            id: "18",
            nombre: "Paula",
            numero: "18",
            posicion: "Jugadora",
            lema: "Un torbellino de energía. Corre, sonríe y contagia.",
            foto: "/assets/pioneers_clean/pioneer-18-paula.jpg"
        },
        {
            id: "18_B", // ID Único
            nombre: "Alberto",
            numero: "18",
            posicion: "Jugador",
            lema: "Alegre y con mucha energía, siempre con una sonrisa.",
            foto: "/assets/pioneers_clean/pioneer-18-alberto.jpg"
        },
        {
            id: "20",
            nombre: "Dani", // Corregido de "nuestro"
            numero: "20",
            posicion: "Capitán",
            lema: "Talento, potencia y compañerismo en estado puro.",
            foto: "/assets/pioneers_clean/pioneer-20-nuestro.jpg"
        },
        {
            id: "23",
            nombre: "Marco", // Corregido de "buen"
            numero: "23",
            posicion: "Jugador",
            lema: "Buen jugador y compañero de primera. Esfuerzo total.",
            foto: "/assets/pioneers_clean/pioneer-23-buen.jpg"
        },
        {
            id: "29",
            nombre: "Mónica",
            numero: "29",
            posicion: "Jugadora",
            lema: "Aprendiendo a su ritmo, siempre firme y con carácter.",
            foto: "/assets/pioneers_clean/pioneer-29-mnica.jpg"
        },
        {
            id: "30",
            nombre: "Manu",
            numero: "30",
            posicion: "Jugador",
            lema: "Siempre con una sonrisa y aprendiendo sin parar.",
            foto: "/assets/pioneers_clean/pioneer-30-manu.jpg"
        }
    ];

    constructor() {
        // Ordenar por número
        this.jugadores.sort((a, b) => parseInt(a.numero) - parseInt(b.numero));
    }
}
