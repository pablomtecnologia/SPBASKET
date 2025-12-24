import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';

interface UserProfile {
  id?: number;
  username: string;
  email: string;
  nombre?: string;
  apellidos?: string;
  rol?: string;
  licencia?: string;
  telefono?: string;
  avatar?: string;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.css']
})
export class PerfilComponent implements OnInit {
  user: UserProfile = {
    username: '',
    email: '',
    nombre: '',
    apellidos: '',
    rol: '',
    licencia: '',
    telefono: '',
    avatar: ''
  };

  originalUser: UserProfile | null = null;
  loading = false;
  uploadingAvatar = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    public authService: AuthService,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.authService.currentUser.subscribe(u => {
      if (u) {
        this.user = { ...u };
        this.originalUser = { ...u };
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  onAvatarSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Por favor, selecciona una imagen válida.';
      return;
    }

    this.uploadingAvatar = true;
    const formData = new FormData();
    formData.append('avatar', file);

    this.http.post<{ url: string }>('https://common-lions-grab.loca.lt/api/upload-avatar', formData)
      .pipe(finalize(() => {
        this.uploadingAvatar = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          this.user.avatar = res.url + '?t=' + new Date().getTime();
          this.cdr.detectChanges();
          this.saveChanges();
          this.successMessage = '📸 ¡Foto de perfil actualizada!';
        },
        error: (err) => {
          this.errorMessage = 'Error al subir la imagen.';
          this.cdr.detectChanges();
        }
      });
  }

  saveChanges() {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const headers = this.authService.getAuthHeaders();

    const userToSave = { ...this.user };
    if (userToSave.avatar && userToSave.avatar.includes('?t=')) {
      userToSave.avatar = userToSave.avatar.split('?t=')[0];
    }

    this.http.put<{ message: string, user: UserProfile }>('https://common-lions-grab.loca.lt/api/users/profile', userToSave, { headers })
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          this.successMessage = '✅ Perfil actualizado correctamente.';
          this.authService.updateCurrentUser(res.user);
          this.user = { ...res.user };
          this.originalUser = { ...res.user };
          this.cdr.detectChanges();
          setTimeout(() => {
            this.successMessage = '';
            this.cdr.detectChanges();
          }, 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Error al guardar los cambios.';
          this.cdr.detectChanges();
        }
      });
  }

  verHistorial() {
    this.router.navigate(['/historial']);
  }

  getInitials(): string {
    if (!this.user.nombre) return this.user.username.substring(0, 2).toUpperCase();
    return (this.user.nombre[0] + (this.user.apellidos?.[0] || '')).toUpperCase();
  }

  get hasChanges(): boolean {
    if (!this.originalUser) return false;
    return (
      this.user.nombre !== this.originalUser.nombre ||
      this.user.apellidos !== this.originalUser.apellidos ||
      this.user.email !== this.originalUser.email ||
      this.user.telefono !== this.originalUser.telefono ||
      this.user.avatar !== this.originalUser.avatar
    );
  }
}
