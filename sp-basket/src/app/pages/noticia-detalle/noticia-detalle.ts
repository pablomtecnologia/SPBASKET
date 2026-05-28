import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Noticia {
    id: number;
    titulo: string;
    subtitulo?: string;
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
    imports: [CommonModule, RouterLink],
    templateUrl: './noticia-detalle.html',
    styleUrls: ['./noticia-detalle.css']
})
export class NoticiaDetalleComponent implements OnInit {
    noticia: Noticia | null = null;
    loading = true;
    errorMessage = '';
    apiUrl = environment.apiUrl;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private http: HttpClient,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.cargarNoticia(parseInt(id));
        }
    }

    cargarNoticia(id: number) {
        this.loading = true;
        this.http.get<any>(`${this.apiUrl}/noticias/${id}`).subscribe({
            next: (data) => {
                // MAP BACKEND FIELDS TO FRONTEND
                this.noticia = {
                    id: data.id,
                    titulo: data.title,
                    subtitulo: data.subtitle,
                    contenido: data.content,
                    imagen_url: data.image_url,
                    fecha_creacion: data.date,
                    destacada: data.is_featured,
                    categoria: data.category,
                    autor: data.author,
                    hashtags: data.tags
                };
                this.loading = false;
                this.cdr.detectChanges();
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
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
}
