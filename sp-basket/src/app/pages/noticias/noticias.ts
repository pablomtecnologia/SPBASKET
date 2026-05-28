import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
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
  slug?: string;
  meta_descripcion?: string;
}

@Component({
  selector: 'app-noticias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './noticias.html',
  styleUrls: ['./noticias.css']
})
export class NoticiasComponent implements OnInit {
  noticias: Noticia[] = [];
  loading = true;
  showModal = false;
  showPreview = false;
  editingId: number | null = null; // ID if editing
  apiUrl = environment.apiUrl;

  nuevaNoticia = {
    titulo: '',
    subtitulo: '',
    contenido: '',
    imagen_url: '',
    enlace: '',
    destacada: false,
    hashtags: '',
    categoria: 'General',
    meta_descripcion: ''
  };

  // Editor config (same as before)
  quillConfig = { /* ... */ };

  categorias = [
    'General', 'Competición', 'Entrenamiento', 'Fichajes', 'Campus', 'Eventos', 'Noticias del Club'
  ];

  hashtagsList: string[] = [];
  hashtagInput = '';

  // Upload
  uploadProgress = 0;
  selectedFileName = '';
  successMessage = '';
  errorMessage = '';

  constructor(
    private http: HttpClient,
    public authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadNoticias();
  }

  loadNoticias() {
    this.loading = true;
    this.errorMessage = '';
    this.http.get<any[]>(`${this.apiUrl}/noticias`).subscribe({
      next: (data) => {
        // MAP BACKEND DATA TO FRONTEND INTERFACE
        this.noticias = data.map(item => ({
          id: item.id,
          titulo: item.title,
          subtitulo: item.subtitle,
          contenido: item.content,
          imagen_url: item.image_url,
          fecha_creacion: item.date,
          destacada: item.is_featured,
          categoria: item.category,
          autor: item.author,
          hashtags: item.tags,
          slug: item.slug
        }));
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error cargando noticias:', err);
        this.errorMessage = 'Error al cargar las noticias';
        this.loading = false;
        this.noticias = [];
        this.cdr.detectChanges();
      }
    });
  }

  openModal() {
    if (!this.authService.isAdmin()) {
      this.errorMessage = 'No tienes permisos para crear noticias';
      return;
    }
    this.showModal = true;
    this.editingId = null;
    this.resetForm();
  }

  closeModal() {
    this.showModal = false;
    this.showPreview = false;
    this.editingId = null;
    this.resetForm();
  }

  editarNoticia(noticia: Noticia) {
    if (!this.authService.isAdmin()) return;
    this.showModal = true;
    this.editingId = noticia.id;

    this.nuevaNoticia = {
      titulo: noticia.titulo,
      subtitulo: noticia.subtitulo || '',
      contenido: noticia.contenido,
      imagen_url: noticia.imagen_url || '',
      enlace: noticia.enlace || '',
      destacada: noticia.destacada,
      hashtags: '',
      categoria: noticia.categoria || 'General',
      meta_descripcion: '' // not stored in backend yet fully
    };

    this.hashtagsList = this.parseHashtags(noticia.hashtags);
    // Remove # for internal logic
    this.hashtagsList = this.hashtagsList.map(h => h.replace('#', ''));
  }

  resetForm() {
    if (!this.editingId) {
      this.nuevaNoticia = {
        titulo: '',
        subtitulo: '',
        contenido: '',
        imagen_url: '',
        enlace: '',
        destacada: false,
        hashtags: '',
        categoria: 'General',
        meta_descripcion: ''
      };
      this.hashtagsList = [];
    }
    this.hashtagInput = '';
    this.successMessage = '';
    this.errorMessage = '';
    this.uploadProgress = 0;
    this.selectedFileName = '';
  }

  // Hashtags
  addHashtag() {
    if (this.hashtagInput.trim()) {
      const tag = this.hashtagInput.trim().replace(/^#/, '');
      if (!this.hashtagsList.includes(tag)) {
        this.hashtagsList.push(tag);
        // this.nuevaNoticia.hashtags updated on submit
      }
      this.hashtagInput = '';
    }
  }

  removeHashtag(tag: string) {
    this.hashtagsList = this.hashtagsList.filter(t => t !== tag);
  }

  onHashtagKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.addHashtag();
    }
  }

  // Preview
  togglePreview() {
    this.showPreview = !this.showPreview;
  }

  // Generar slug automático
  generateSlug() {
    const slug = this.nuevaNoticia.titulo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return slug;
  }

  // Subir archivo
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedFileName = file.name;
    this.uploadProgress = 0;

    const formData = new FormData();
    formData.append('image', file);

    const headers = this.authService.getAuthHeaders();

    this.http.post<any>(`${this.apiUrl}/upload`, formData, {
      headers,
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event: any) => {
        if (event.type === 4) { // HttpEventType.Response
          this.nuevaNoticia.imagen_url = event.body.url;
          this.uploadProgress = 100;
          setTimeout(() => {
            this.uploadProgress = 0;
          }, 2000);
        }
      },
      error: (err) => {
        console.error('Error subiendo imagen:', err);
        this.errorMessage = 'Error al subir la imagen';
        this.uploadProgress = 0;
        this.selectedFileName = '';
      }
    });
  }

  crearNoticia() {
    if (!this.nuevaNoticia.titulo || !this.nuevaNoticia.contenido) {
      this.errorMessage = 'Título y contenido son obligatorios';
      return;
    }

    const headers = this.authService.getAuthHeaders();

    // Prepare tags string
    const tagsString = this.hashtagsList.map(t => '#' + t).join(' ');

    const noticiaData = {
      ...this.nuevaNoticia,
      hashtags: tagsString,
      slug: this.generateSlug()
    };

    if (this.editingId) {
      // UPDATE
      this.http.put<any>(`${this.apiUrl}/noticias/${this.editingId}`, noticiaData, { headers }).subscribe({
        next: (response) => {
          this.loadNoticias();
          this.closeModal();
          this.successMessage = response.message || '✅ Noticia actualizada correctamente';
          setTimeout(() => { this.successMessage = ''; }, 3000);
        },
        error: (err) => {
          console.error('Error actualizando noticia:', err);
          this.errorMessage = err.error?.message || 'Error al actualizar';
        }
      });
    } else {
      // CREATE
      this.http.post<any>(`${this.apiUrl}/noticias`, noticiaData, { headers }).subscribe({
        next: (response) => {
          this.loadNoticias();
          this.closeModal();
          this.successMessage = response.message || '✅ Noticia creada correctamente';
          setTimeout(() => { this.successMessage = ''; }, 3000);
        },
        error: (err) => {
          console.error('Error creando noticia:', err);
          this.errorMessage = err.error?.message || 'Error al crear la noticia';
        }
      });
    }
  }

  eliminarNoticia(id: number) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta noticia?')) {
      return;
    }

    const headers = this.authService.getAuthHeaders();

    this.http.delete(`${this.apiUrl}/noticias/${id}`, { headers }).subscribe({
      next: () => {
        this.successMessage = 'Noticia eliminada correctamente';
        this.errorMessage = '';
        this.loadNoticias();
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (err) => {
        console.error('Error eliminando noticia:', err);
        this.errorMessage = err.error?.message || 'Error al eliminar la noticia';
        this.successMessage = '';
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'FECHA VÁLIDA';
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  parseHashtags(hashtags?: string): string[] {
    if (!hashtags) return [];
    return hashtags.split(' ').filter(t => t.startsWith('#'));
  }

  verDetalle(id: number) {
    this.router.navigate(['/noticias', id]);
  }
}
