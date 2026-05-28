import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PageHeaderComponent } from '../../components/page-header/page-header';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment';

interface ClubDocument {
  id: number;
  title: string;
  description: string;
  file_url?: string;
  is_active: boolean;
  coming_soon: boolean;
}

@Component({
  selector: 'app-documentacion',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, FormsModule],
  templateUrl: './documentacion.html',
  styleUrls: ['./documentacion.css']
})
export class DocumentacionComponent implements OnInit {
  documents: ClubDocument[] = [];
  isAdmin = false;
  private apiUrl = environment.apiUrl;

  // New Doc Form
  showForm = false;
  newDocTitle = '';
  newDocDesc = '';
  newDocFile: File | null = null;
  newDocComingSoon = false;
  isSubmitting = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.authService.currentUser.subscribe(() => {
      this.isAdmin = this.authService.isAdmin();
      this.cdr.detectChanges();
    });
    this.loadDocuments();
  }

  loadDocuments() {
    this.http.get<ClubDocument[]>(`${this.apiUrl}/documents`).subscribe({
      next: (docs) => {
        // Ensure boolean types from Postgres
        this.documents = docs.map(d => ({
          ...d,
          is_active: d.is_active === true || String(d.is_active) === 'true',
          coming_soon: d.coming_soon === true || String(d.coming_soon) === 'true'
        }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading docs:', err)
    });
  }

  // Helper to filter for view
  get visibleDocuments(): ClubDocument[] {
    if (this.isAdmin) return this.documents;
    return this.documents.filter(d => d.is_active);
  }

  // Admin Actions
  toggleStatus(doc: ClubDocument, field: 'is_active' | 'coming_soon') {
    if (!this.isAdmin) return;

    // Toggle logic for simple boolean fields
    const newValue = !doc[field];

    // Optimistic update
    const oldValue = doc[field];
    doc[field] = newValue;
    this.cdr.detectChanges();

    const payload: any = {
      is_active: doc.is_active,
      coming_soon: doc.coming_soon
    };

    this.http.put(`${this.apiUrl}/documents/${doc.id}`, payload, { headers: this.authService.getAuthHeaders() })
      .subscribe({
        next: () => {
          // Success, keep optimized update
        },
        error: () => {
          // Revert on error
          doc[field] = oldValue;
          this.cdr.detectChanges();
          alert('Error actualizando estado');
        }
      });
  }

  deleteDocument(id: number) {
    if (!confirm('¿Seguro que quieres eliminar este documento?')) return;
    this.http.delete(`${this.apiUrl}/documents/${id}`, { headers: this.authService.getAuthHeaders() })
      .subscribe({
        next: () => {
          this.documents = this.documents.filter(d => d.id !== id);
          this.cdr.detectChanges();
        },
        error: () => alert('Error eliminando documento')
      });
  }

  onFileSelected(event: any) {
    this.newDocFile = event.target.files[0];
  }

  createDocument() {
    if (!this.newDocTitle) return alert('El título es obligatorio');
    if (!this.newDocFile && !this.newDocComingSoon) return alert('Debes subir un archivo o marcar como "Próximamente"');

    this.isSubmitting = true;
    this.cdr.detectChanges();

    const formData = new FormData();
    formData.append('title', this.newDocTitle);
    formData.append('description', this.newDocDesc);
    formData.append('is_active', 'true'); // Active by default on create
    formData.append('coming_soon', String(this.newDocComingSoon));
    if (this.newDocFile) formData.append('file', this.newDocFile);

    this.http.post(`${this.apiUrl}/documents`, formData, { headers: this.authService.getAuthHeaders() })
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showForm = false;
          this.newDocTitle = '';
          this.newDocDesc = '';
          this.newDocFile = null;
          this.loadDocuments();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isSubmitting = false;
          alert('Error al crear documento');
          console.error(err);
          this.cdr.detectChanges();
        }
      });
  }
}
