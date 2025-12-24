import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth';

interface Reconocimiento {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  licencia: string;
  archivo_url: string;
  estado: 'pendiente' | 'validado' | 'rechazado';
  mensaje_admin?: string;
  fecha_subida: string;
  fecha_validacion?: string;
}

@Component({
  selector: 'app-medical-recognition',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medical-recognition.html',
  styleUrls: ['./medical-recognition.css']
})
export class MedicalRecognitionComponent implements OnInit {
  // Form data
  nombre = '';
  apellido = '';
  email = '';
  licencia = '';
  selectedFile: File | null = null;
  selectedFileName = '';

  // UI states
  sending = false;
  successMessage = '';
  errorMessage = '';

  // Reconocimientos del usuario
  misReconocimientos: Reconocimiento[] = [];
  pendientesAdmin: Reconocimiento[] = []; // Admin
  loading = false;
  isAdmin = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.authService.currentUser.subscribe(user => {
      this.isAdmin = this.authService.isAdmin();

      if (user) {
        if (!this.isAdmin) {
          this.nombre = user.nombre || '';
          this.apellido = user.apellidos || '';
          this.email = user.email || '';
          this.cargarMisReconocimientos();
        } else {
          // Si es admin, cargamos sus datos
          this.cargarDatosAdmin();
        }
      } else {
        this.loading = false;
        this.errorMessage = 'Debes iniciar sesión para acceder a esta página';
      }
    });
  }

  cargarMisReconocimientos() {
    if (this.isAdmin) return;
    if (this.loading) return; // ✅ Evitar llamadas múltiples

    this.loading = true;
    const headers = this.authService.getAuthHeaders();
    console.log('🔄 Iniciando carga de reconocimientos...');

    this.http.get<Reconocimiento[]>('https://common-lions-grab.loca.lt/api/reconocimientos', { headers })
      .pipe(finalize(() => {
        console.log('🏁 Fin de carga - Forzando actualización vista');
        this.loading = false;
        this.cd.detectChanges(); // ✅ Forzar vista
      }))
      .subscribe({
        next: (data) => {
          console.log('✅ Datos recibidos:', data);
          this.misReconocimientos = data;
        },
        error: (err) => {
          console.error('❌ Error cargando:', err);
          this.errorMessage = 'No se pudieron cargar los datos.';
        }
      });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validar tamaño (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.errorMessage = 'El archivo es demasiado grande (Máx. 10MB)';
        return;
      }

      // Validar tipo (PDF)
      if (file.type !== 'application/pdf') {
        this.errorMessage = 'Solo se permiten archivos PDF';
        return;
      }

      this.selectedFile = file;
      this.selectedFileName = file.name;
      this.errorMessage = '';
    }
  }

  enviarReconocimiento() {
    if (!this.nombre || !this.apellido || !this.email) {
      this.errorMessage = 'Por favor complete todos los campos obligatorios';
      return;
    }

    if (!this.selectedFile) {
      this.errorMessage = 'Por favor seleccione un archivo PDF';
      return;
    }

    this.sending = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = new FormData();
    formData.append('nombre', this.nombre);
    formData.append('apellido', this.apellido);
    formData.append('email', this.email);
    formData.append('licencia', this.licencia || '');
    formData.append('archivo', this.selectedFile);

    const headers = this.authService.getAuthHeaders();

    this.http.post('https://common-lions-grab.loca.lt/api/reconocimientos', formData, { headers })
      .pipe(finalize(() => {
        // Asegurar que sending se desactiva pase lo que pase
        // Lo ponemos en un timeout minúsculo para dar tiempo a que se procese el next/error
        setTimeout(() => { this.sending = false; }, 100);
      }))
      .subscribe({
        next: (response: any) => {
          console.log('✅ Respuesta recibida:', response);
          this.successMessage = '✅ Reconocimiento médico enviado correctamente. Recibirás un email cuando sea validado.';

          // Limpiar formulario
          this.licencia = '';
          this.selectedFile = null;
          this.selectedFileName = '';

          // Recargar lista tras 1 segundo
          setTimeout(() => {
            this.cargarMisReconocimientos();
            // Borrar mensaje tras 5s
            setTimeout(() => this.successMessage = '', 5000);
          }, 1000);
        },
        error: (err) => {
          console.error('❌ Error en frontend:', err);
          this.errorMessage = err.error?.message || 'Error de conexión o servidor al enviar.';
        }
      });
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'validado': return 'estado-validado';
      case 'rechazado': return 'estado-rechazado';
      default: return 'estado-pendiente';
    }
  }

  getEstadoTexto(estado: string): string {
    switch (estado) {
      case 'validado': return '✅ Validado';
      case 'rechazado': return '❌ Rechazado';
      default: return '⏳ Pendiente';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  // Carga para administradores (TODOS los reconocimientos)
  cargarDatosAdmin() {
    this.loading = true;
    const headers = this.authService.getAuthHeaders();

    this.http.get<Reconocimiento[]>('https://common-lions-grab.loca.lt/api/reconocimientos', { headers })
      .pipe(finalize(() => {
        this.loading = false;
        this.cd.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          // Filtramos solo los pendientes para mostrarlos
          this.pendientesAdmin = data.filter(r => r.estado === 'pendiente');
        },
        error: (err) => console.error('Error cargando admin:', err)
      });
  }

  // Acción de Admin: Validar o Rechazar
  procesarReconocimiento(id: number, accion: 'validar' | 'rechazar') {
    if (!confirm(`¿Estás seguro de que quieres ${accion} este reconocimiento?`)) return;

    // Pedir mensaje si es rechazo (opcional en validación)
    let mensaje = '';
    if (accion === 'rechazar') {
      mensaje = prompt('Motivo del rechazo:') || '';
      if (!mensaje) return; // Cancelar si no pone mensaje
    }

    const estado = accion === 'validar' ? 'validado' : 'rechazado';
    const headers = this.authService.getAuthHeaders();

    this.http.put(`https://common-lions-grab.loca.lt/api/reconocimientos/${id}`, { estado, mensaje }, { headers })
      .subscribe({
        next: () => {
          this.successMessage = `Reconocimiento ${estado} correctamente`;
          this.cargarDatosAdmin(); // Recargar lista
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          alert('Error al procesar la solicitud');
          console.error(err);
        }
      });
  }

  verArchivo(url: string) {
    window.open(url, '_blank');
  }
}
