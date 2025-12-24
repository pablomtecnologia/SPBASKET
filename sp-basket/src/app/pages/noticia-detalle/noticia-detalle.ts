import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Noticia {
    id: number;
    titulo: string;
    contenido: string;
    imagen_url?: string;
    enlace?: string;
    autor?: string;
    fecha_creacion: string;
    destacada: boolean;
    hashtags?: string;
    categoria?: string;
}

@Component({
    selector: 'app-noticia-detalle',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './noticia-detalle.html',
    styleUrls: ['./noticia-detalle.css']
})
export class NoticiaDetalleComponent implements OnInit {
    noticia: Noticia | null = null;
    loading = true;
    errorMessage = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private http: HttpClient,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        console.log('🔍 NoticiaDetalleComponent iniciado');
        const id = this.route.snapshot.paramMap.get('id');
        console.log('📝 ID obtenido de la ruta:', id);
        if (id) {
            this.cargarNoticia(parseInt(id));
        } else {
            console.error('❌ No se encontró ID en la ruta');
        }
    }

    cargarNoticia(id: number) {
        console.log('📡 Cargando noticia con ID:', id);
        this.loading = true;
        this.http.get<Noticia>(`https://common-lions-grab.loca.lt/api/noticias/${id}`).subscribe({
            next: (data) => {
                console.log('✅ Noticia recibida:', data);
                this.noticia = data;
                this.loading = false;
                this.cdr.detectChanges(); // Forzar actualización de la vista
                console.log('✅ Estado actualizado, loading:', this.loading);
            },
            error: (err) => {
                console.error('❌ Error cargando noticia:', err);
                this.errorMessage = 'Error al cargar la noticia';
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    volverANoticias() {
        this.router.navigate(['/noticias']);
    }

    parseHashtags(hashtags?: string): string[] {
        if (!hashtags) return [];
        return hashtags.split(' ').filter(t => t.startsWith('#'));
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
