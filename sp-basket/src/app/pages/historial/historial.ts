import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { interval, Subscription } from 'rxjs';
import { Router } from '@angular/router';

interface HistorialReconocimiento {
    id: number;
    fecha_subida: string;
    estado: 'pendiente' | 'validado' | 'rechazado';
    mensaje_admin: string | null;
    archivo_url: string;
}

interface HistorialPapeleta {
    id: number;
    fecha_subida: string;
    estado: 'pendiente' | 'validado' | 'rechazado';
    pagado: boolean;
    foto_url: string;
}

interface HistorialPago {
    id: number;
    concepto: string;
    monto: number;
    fecha: string;
}

@Component({
    selector: 'app-historial',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './historial.html',
    styleUrls: ['./historial.css']
})
export class HistorialComponent implements OnInit, OnDestroy {
    historialReconocimientos: HistorialReconocimiento[] = [];
    historialPapeletas: HistorialPapeleta[] = [];
    historialPagos: HistorialPago[] = []; // Nueva lista
    loading = true;
    private pollSub: Subscription | null = null;

    constructor(
        private authService: AuthService,
        private http: HttpClient,
        private cdr: ChangeDetectorRef,
        private router: Router
    ) { }

    ngOnInit() {
        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/login']);
            return;
        }
        this.startPolling();
    }

    ngOnDestroy() {
        if (this.pollSub) this.pollSub.unsubscribe();
    }

    startPolling() {
        this.loadData();
        this.pollSub = interval(4000).subscribe(() => this.loadData());
    }

    loadData() {
        const headers = this.authService.getAuthHeaders();
        const t = new Date().getTime(); // Timestamp para evitar caché

        this.http.get<HistorialReconocimiento[]>(`http://localhost:3001/api/reconocimientos?t=${t}`, { headers })
            .subscribe({
                next: (data) => {
                    this.historialReconocimientos = data;
                    this.cdr.detectChanges();
                },
                error: () => {
                    // Error handled
                }
            });

        this.http.get<HistorialPapeleta[]>(`http://localhost:3001/api/papeletas?t=${t}`, { headers })
            .subscribe({
                next: (data) => {
                    this.historialPapeletas = data;
                    this.cdr.detectChanges();
                },
                error: () => {
                    // Error handled
                }
            });

        // Cargar historial de pagos generales con anti-caché
        this.http.get<HistorialPago[]>(`http://localhost:3001/api/pagos/historial?t=${t}`, { headers })
            .subscribe({
                next: (data) => {
                    console.log('Pagos cargados:', data);
                    this.historialPagos = data;
                    this.loading = false;
                    this.cdr.detectChanges();
                },
                error: () => this.loading = false
            });
    }

    descargarFactura(p: HistorialPapeleta) {
        if (!p.pagado) return;
        this.downloadPdf(`http://localhost:3001/api/papeletas/invoice`, `factura_papeletas.pdf`);
    }

    descargarFacturaGenerica(p: HistorialPago) {
        this.downloadPdf(`http://localhost:3001/api/pagos/factura/${p.id}`, `factura_compra_${p.id}.pdf`);
    }

    private downloadPdf(url: string, name: string) {
        const headers = this.authService.getAuthHeaders();
        this.http.get(url, { headers, responseType: 'blob' })
            .subscribe({
                next: (blob) => {
                    const objUrl = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = objUrl;
                    a.download = name;
                    a.click();
                    window.URL.revokeObjectURL(objUrl);
                },
                error: (e) => {
                    console.error(e);
                    alert('Error descargando factura.');
                }
            });
    }

    volverPerfil() {
        this.router.navigate(['/perfil']);
    }
}
