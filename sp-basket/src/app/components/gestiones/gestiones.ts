import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { interval, Subscription, forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

interface Reconocimiento {
    id: number;
    user_id: number;
    nombre: string;
    apellido: string;
    email: string;
    licencia: string;
    archivo_url: string;
    estado: 'pendiente' | 'validado' | 'rechazado';
    mensaje_admin: string | null;
    fecha_subida: string;
    fecha_validacion: string | null;
    validado_por: number | null;
}

interface Papeleta {
    id: number;
    user_id: number;
    nombre: string;
    apellidos: string;
    email: string;
    foto_url: string;
    estado: 'pendiente' | 'validado' | 'rechazado';
    pagado: number;
    fecha_subida: string;
}

interface OrderNotification {
    id: number;
    type: string;
    title: string;
    message: string;
    reference_id: number;
    is_read: boolean;
    created_at: string;
}

@Component({
    selector: 'app-gestiones',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './gestiones.html',
    styleUrls: ['./gestiones.css']
})
export class GestionesComponent implements OnInit, OnDestroy {
    reconocimientosPendientes: Reconocimiento[] = [];
    papeletasPendientes: Papeleta[] = [];
    pedidosPendientes: OrderNotification[] = [];

    showDropdown = false;
    loading = false;
    viewMode: 'reconocimientos' | 'papeletas' | 'pedidos' = 'reconocimientos';

    badgeCount: number = 0;

    // Modal Reconocimientos
    selectedReconocimiento: Reconocimiento | null = null;
    showModal = false;
    mensajeAdmin = '';
    accionSeleccionada: 'validar' | 'rechazar' | null = null;

    private pollSubscription: Subscription | null = null;
    private userSubscription: Subscription | null = null;

    constructor(
        private http: HttpClient,
        public authService: AuthService,
        private router: Router
    ) { }

    ngOnInit() {
        // Suscribirse a cambios de usuario (Login/Logout dinámico)
        this.userSubscription = this.authService.currentUser.subscribe(user => {
            if (user) {
                this.iniciarPolling();
            } else {
                this.detenerPolling();
            }
        });
    }

    ngOnDestroy() {
        if (this.pollSubscription) {
            this.pollSubscription.unsubscribe();
        }
        if (this.userSubscription) {
            this.userSubscription.unsubscribe();
        }
    }

    iniciarPolling() {
        if (this.pollSubscription) return;

        this.loadData();
        this.pollSubscription = interval(10000).subscribe(() => {
            this.loadData();
        });
    }

    detenerPolling() {
        if (this.pollSubscription) {
            this.pollSubscription.unsubscribe();
            this.pollSubscription = null;
        }
        this.badgeCount = 0;
        this.reconocimientosPendientes = [];
        this.papeletasPendientes = [];
        this.pedidosPendientes = [];
    }

    loadData() {
        if (!this.authService.isAuthenticated()) return;

        const headers = this.authService.getAuthHeaders();
        const isAdmin = this.authService.isAdmin();

        forkJoin({
            reconocimientos: this.http.get<Reconocimiento[]>(`${environment.apiUrl}/reconocimientos`, { headers }).pipe(catchError(() => of([]))),
            papeletas: this.http.get<Papeleta[]>(`${environment.apiUrl}/papeletas`, { headers }).pipe(catchError(() => of([]))),
            pedidos: this.http.get<OrderNotification[]>(`${environment.apiUrl}/admin/notifications`, { headers }).pipe(catchError(() => of([])))
        }).subscribe(results => {
            if (isAdmin) {
                this.reconocimientosPendientes = results.reconocimientos.filter(r => r.estado === 'pendiente');
                this.papeletasPendientes = results.papeletas.filter(p => p.estado === 'pendiente');
            } else {
                this.reconocimientosPendientes = results.reconocimientos;
                this.papeletasPendientes = results.papeletas;
            }
            this.pedidosPendientes = results.pedidos.filter(n => !n.is_read);
            this.updateBadge();
        });
    }

    updateBadge() {
        const total = this.reconocimientosPendientes.length + this.papeletasPendientes.length + this.pedidosPendientes.length;
        const lastSeen = parseInt(localStorage.getItem('lastViewedNotifs') || '0');

        if (this.showDropdown) {
            localStorage.setItem('lastViewedNotifs', total.toString());
            this.badgeCount = 0;
        } else {
            if (total < lastSeen) {
                localStorage.setItem('lastViewedNotifs', total.toString());
                this.badgeCount = 0;
            } else {
                this.badgeCount = Math.max(0, total - lastSeen);
            }
        }
    }

    toggleDropdown() {
        this.showDropdown = !this.showDropdown;
        if (this.showDropdown) {
            const total = this.reconocimientosPendientes.length + this.papeletasPendientes.length;
            localStorage.setItem('lastViewedNotifs', total.toString());
            this.badgeCount = 0;
        }
    }

    switchTab(tab: 'reconocimientos' | 'papeletas' | 'pedidos') {
        this.viewMode = tab;
    }

    isAdmin() {
        return this.authService.isAdmin();
    }

    abrirModal(rec: Reconocimiento, accion: 'validar' | 'rechazar') {
        this.selectedReconocimiento = rec;
        this.accionSeleccionada = accion;
        this.mensajeAdmin = '';
        this.showModal = true;
    }

    cerrarModal() {
        this.showModal = false;
        this.selectedReconocimiento = null;
        this.accionSeleccionada = null;
    }

    procesarAccion() {
        if (!this.selectedReconocimiento || !this.accionSeleccionada) return;

        const estado = this.accionSeleccionada === 'validar' ? 'validado' : 'rechazado';
        // Backend espera 'mensaje', no 'mensaje_admin'
        const body = { estado, mensaje: this.mensajeAdmin };
        const headers = this.authService.getAuthHeaders();

        this.loading = true;
        this.http.put(`${environment.apiUrl}/reconocimientos/${this.selectedReconocimiento.id}`, body, { headers })
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: () => {
                    this.cerrarModal();
                    this.loadData();
                    alert(`Reconocimiento ${estado} correctamente.`);
                },
                error: (err) => {
                    console.error(err);
                    alert('Error al procesar la solicitud. Inténtalo de nuevo.');
                    this.cerrarModal(); // Asegurar que se cierra para no bloquear
                }
            });
    }

    validarPapeleta(papeleta: Papeleta, estado: 'validado' | 'rechazado') {
        if (!confirm(`¿Confirmar ${estado} para ${papeleta.nombre}?`)) return;

        const headers = this.authService.getAuthHeaders();
        this.http.put(`${environment.apiUrl}/papeletas/${papeleta.id}`, { estado }, { headers })
            .subscribe({
                next: () => {
                    this.loadData();
                },
                error: (err) => alert('Error actualizando estado')
            });
    }

    verFoto(url: string) {
        window.open(url, '_blank');
    }

    getBadgeCount(): number {
        return this.badgeCount;
    }

    irAPagar() {
        this.router.navigate(['/pagos']);
        this.showDropdown = false;
    }

    marcarNotificacionLeida(notif: OrderNotification) {
        const headers = this.authService.getAuthHeaders();
        this.http.put(`${environment.apiUrl}/admin/notifications/${notif.id}/read`, {}, { headers })
            .subscribe({
                next: () => {
                    this.loadData();
                },
                error: () => { }
            });
    }

    marcarTodasLeidas() {
        const headers = this.authService.getAuthHeaders();
        this.http.put(`${environment.apiUrl}/admin/notifications/read-all`, {}, { headers })
            .subscribe({
                next: () => {
                    this.pedidosPendientes = [];
                    this.updateBadge();
                },
                error: () => { }
            });
    }
}
