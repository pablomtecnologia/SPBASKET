import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagos.html',
  styleUrls: ['./pagos.css']
})
export class PagosComponent implements OnInit, OnDestroy {
  status: string | null = null;
  loading = false;

  montoFicha: number = 50;
  conceptoFicha: string = 'Cuota Mensual';

  cantidadPapeletas: number = 50;
  precioPapeleta: number = 2;
  totalPapeletas: number = 100;

  fotoTalones: File | null = null;
  papeletaUploaded = false;
  uploadingFoto = false;

  estadoPapeletas: 'none' | 'pendiente' | 'validado_sin_pagar' | 'pagado' | 'rechazado' = 'none';

  private pollSub: Subscription | null = null;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    public auth: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.status = params['status'];
    });
    this.startPolling();
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  startPolling() {
    // Inicia check inmediato y luego cada 4s
    this.checkPapeletasStatus();
    if (!this.pollSub) {
      this.pollSub = interval(4000).subscribe(() => this.checkPapeletasStatus());
    }
  }

  stopPolling() {
    if (this.pollSub) {
      this.pollSub.unsubscribe();
      this.pollSub = null;
    }
  }

  checkPapeletasStatus() {
    if (!this.auth.currentUserValue) return;

    const headers = this.auth.getAuthHeaders();
    // Añadimos timestamp para evitar caché del navegador
    const url = `http://localhost:3001/api/papeletas?t=${new Date().getTime()}`;

    this.http.get<any[]>(url, { headers }).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          const ultima = data[0];

          if (ultima.estado === 'pendiente') {
            this.estadoPapeletas = 'pendiente';
            this.papeletaUploaded = true;
          } else if (ultima.estado === 'validado') {
            if (ultima.pagado) {
              this.estadoPapeletas = 'pagado';
            } else {
              this.estadoPapeletas = 'validado_sin_pagar';
              this.papeletaUploaded = true;
            }
          } else if (ultima.estado === 'rechazado') {
            this.estadoPapeletas = 'rechazado';
            this.papeletaUploaded = false;
          }
        } else {
          this.estadoPapeletas = 'none';
        }
        this.cdr.detectChanges(); // Forzar actualización vista
      },
      error: (err) => console.error('Error status papeletas', err)
    });
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.fotoTalones = event.target.files[0];
    }
  }

  subirFoto() {
    if (!this.fotoTalones) {
      alert('Selecciona una foto primero.');
      return;
    }

    const token = this.auth.currentUserValue?.token;

    if (!token) {
      alert('Tu sesión no es válida. Por favor, inicia sesión de nuevo.');
      return;
    }

    this.uploadingFoto = true;
    const formData = new FormData();
    formData.append('fotoTalones', this.fotoTalones);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Bypass-Tunnel-Reminder': 'true'
    });

    this.http.post('http://localhost:3001/api/papeletas/upload', formData, { headers })
      .subscribe({
        next: () => {
          this.papeletaUploaded = true;
          this.uploadingFoto = false;
          this.estadoPapeletas = 'pendiente';
          alert('✅ Foto subida. Esperando validación del administrador.');
          // Forzar refresh inmediato del estado
          this.checkPapeletasStatus();
        },
        error: (err) => {
          console.error(err);
          this.uploadingFoto = false;
          if (err.status === 400) {
            alert(`⚠️ ${err.error.message}`);
          } else if (err.status === 401) {
            alert('❌ Error de autenticación.');
          } else {
            alert('❌ Error al subir la foto.');
          }
        }
      });
  }

  pagarFicha() {
    if (this.montoFicha <= 0) return;
    this.iniciarPago([{ name: `Pago Ficha: ${this.conceptoFicha}`, amount: this.montoFicha * 100, quantity: 1 }]);
  }

  pagarPapeletas() {
    if (this.estadoPapeletas === 'pendiente') {
      alert('🚫 Tu foto está pendiente de validación. Espera a que el administrador la apruebe.');
      return;
    }

    if (this.estadoPapeletas === 'rechazado') {
      alert('🚫 Tu foto fue rechazada. Debes subir una nueva correcta.');
      return;
    }

    if (this.estadoPapeletas === 'none' && !this.papeletaUploaded) {
      alert('🚫 Debes subir la foto y esperar validación.');
      return;
    }

    this.iniciarPago([{ name: 'Abono Papeletas Navidad (100€)', amount: 10000, quantity: 1 }]);
  }

  comprarProducto(nombre: string, precio: number) {
    this.iniciarPago([{ name: nombre, amount: precio * 100, quantity: 1 }]);
  }

  iniciarPago(items: any[]) {
    if (!this.auth.currentUserValue) {
      alert('Debes iniciar sesión para realizar pagos.');
      return;
    }

    this.loading = true;
    const headers = this.auth.getAuthHeaders();

    this.http.post<any>('http://localhost:3001/api/create-checkout-session', {
      items,
      successUrl: window.location.origin + '/pagos?status=success',
      cancelUrl: window.location.origin + '/pagos?status=cancel'
    }, { headers }).subscribe({
      next: (res) => {
        console.log('Pago iniciado. URL:', res.url);
        window.location.href = res.url;
      },
      error: (err) => {
        console.error('Error pago:', err);
        this.loading = false;
        alert('Ocurrió un error al conectar con la pasarela de pago.');
      }
    });
  }
}
