import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PageHeaderComponent } from '../../components/page-header/page-header';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth';

declare const Chart: any; // Use global Chart.js from CDN

@Component({
    selector: 'app-admin-stats',
    standalone: true,
    imports: [CommonModule, PageHeaderComponent],
    templateUrl: './admin-stats.html',
    styleUrls: ['./admin-stats.css']
})
export class AdminStatsComponent implements OnInit, OnDestroy {
    stats: any = null;
    loading = true;
    error = '';
    activeTab = 'overview';
    private userSubscription?: Subscription;

    // Chart instances
    private charts: { [key: string]: any } = {};

    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        // Check user
        const currentUser = this.authService.currentUserValue;
        if (!currentUser) {
            this.router.navigate(['/login']);
            return;
        }
        if (!this.authService.isAdmin()) {
            this.router.navigate(['/']);
            return;
        }

        this.loadStats();

        this.userSubscription = this.authService.currentUser.subscribe(user => {
            if (!user && this.stats) this.router.navigate(['/login']);
        });
    }

    ngOnDestroy() {
        if (this.userSubscription) this.userSubscription.unsubscribe();
        this.destroyCharts();
    }

    // Tab change handler to resize/redraw charts if needed
    changeTab(tab: string) {
        this.activeTab = tab;
        this.cdr.detectChanges(); // Update view

        // Re-init charts for the active tab after view update
        setTimeout(() => {
            this.initChartsForTab(tab);
        }, 100);
    }

    loadStats() {
        this.loading = true;
        this.error = '';
        const headers = this.authService.getAuthHeaders();

        this.http.get(`${environment.apiUrl}/admin/analytics/overview`, { headers }).subscribe({
            next: (data: any) => {
                this.stats = data;
                this.loading = false;
                this.cdr.detectChanges();
                // Init charts for the default tab
                setTimeout(() => this.initChartsForTab(this.activeTab), 100);
            },
            error: (err: any) => {
                console.error('Stats Error:', err);
                this.error = 'Error cargando estadísticas.';
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    destroyCharts() {
        Object.values(this.charts).forEach(chart => chart.destroy());
        this.charts = {};
    }

    initChartsForTab(tab: string) {
        if (!this.stats) return;

        // Destroy existing before re-creating to avoid overlapping
        // But only for the current tab's charts

        if (tab === 'overview' || tab === 'traffic') {
            this.initDailyVisitsChart();
            this.initHourlyVisitsChart(); // New functionality: Hourly
        }

        if (tab === 'devices') {
            this.initDevicesChart();
        }

        if (tab === 'users') {
            this.initUserRolesChart();
        }

        if (tab === 'content') {
            this.initTopPagesChart();
        }
    }

    initDailyVisitsChart() {
        const ctx = document.getElementById('dailyVisitsChart') as HTMLCanvasElement;
        if (!ctx || this.charts['daily']) {
            if (this.charts['daily']) this.charts['daily'].destroy(); // Force re-create
            // return; // Or re-create
        }
        if (!ctx) return;

        const labels = this.stats.traffic?.dailyVisits?.map((v: any) => new Date(v.date).toLocaleDateString()) || [];
        const data = this.stats.traffic?.dailyVisits?.map((v: any) => v.count) || [];

        this.charts['daily'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Visitas Diarias',
                    data: data,
                    borderColor: '#eb3489',
                    backgroundColor: 'rgba(235, 52, 137, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#eb3489'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    initHourlyVisitsChart() {
        const ctx = document.getElementById('hourlyVisitsChart') as HTMLCanvasElement;
        if (!ctx || !this.stats.traffic?.hourlyToday) return;
        if (this.charts['hourly']) { this.charts['hourly'].destroy(); }

        // Sort properly by hour just in case
        const hourlyData = this.stats.traffic.hourlyToday.sort((a: any, b: any) => a.hour - b.hour);
        const labels = hourlyData.map((h: any) => `${h.hour}:00`);
        const data = hourlyData.map((h: any) => parseInt(h.count));

        this.charts['hourly'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Visitas por Hora (Hoy)',
                    data: data,
                    backgroundColor: '#3498db',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    initDevicesChart() {
        const ctx = document.getElementById('devicesChart') as HTMLCanvasElement;
        if (!ctx || !this.stats.devices?.byType) return;
        if (this.charts['devices']) { this.charts['devices'].destroy(); }

        const labels = this.stats.devices.byType.map((d: any) => d.device_type);
        const data = this.stats.devices.byType.map((d: any) => parseInt(d.count));

        this.charts['devices'] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#eb3489', '#3498db', '#9b59b6', '#f1c40f'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%'
            }
        });
    }

    initUserRolesChart() {
        const ctx = document.getElementById('userRolesChart') as HTMLCanvasElement;
        if (!ctx || !this.stats.users?.byRole) return;
        if (this.charts['roles']) { this.charts['roles'].destroy(); }

        const labels = this.stats.users.byRole.map((r: any) => r.rol);
        const data = this.stats.users.byRole.map((r: any) => parseInt(r.count));

        this.charts['roles'] = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#2ecc71', '#e74c3c', '#f39c12', '#34495e'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    initTopPagesChart() {
        const ctx = document.getElementById('topPagesChart') as HTMLCanvasElement;
        if (!ctx || !this.stats.content?.topPages) return;
        if (this.charts['pages']) { this.charts['pages'].destroy(); }

        // Take top 5
        const top5 = this.stats.content.topPages.slice(0, 5);
        const labels = top5.map((p: any) => p.page_path);
        const data = top5.map((p: any) => parseInt(p.views));

        this.charts['pages'] = new Chart(ctx, {
            type: 'bar',
            indexAxis: 'y', // Horizontal
            data: {
                labels: labels,
                datasets: [{
                    label: 'Vistas',
                    data: data,
                    backgroundColor: 'rgba(52, 152, 219, 0.7)',
                    borderColor: '#3498db',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { beginAtZero: true }
                }
            }
        });
    }

    // Helpers
    formatDuration(seconds: number): string {
        if (!seconds) return '0s';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins > 0) return `${mins}m ${secs}s`;
        return `${secs}s`;
    }

    formatUptime(seconds: number): string {
        if (!seconds) return '0s';
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    }

    getPercentage(value: number, total: number): string {
        if (!total || !value) return '0';
        return ((value / total) * 100).toFixed(1);
    }

    getOrderApprovalRate(): string {
        const total = this.stats?.shop?.totalOrders || 0;
        const approved = (this.stats?.shop?.approvedOrders || 0) + (this.stats?.shop?.completedOrders || 0);
        if (total === 0) return '0';
        return ((approved / total) * 100).toFixed(0);
    }

    getOrderStatusLabel(status: string): string {
        const labels: { [key: string]: string } = {
            'pending': '⏳ Pendiente',
            'approved': '✅ Aprobado',
            'rejected': '❌ Rechazado',
            'completed': '🏁 Completado'
        };
        return labels[status] || status;
    }

    updateOrderStatus(orderId: number, status: string): void {
        const headers = this.authService.getAuthHeaders();
        this.http.put(`${environment.apiUrl}/admin/orders/${orderId}`, { status }, { headers })
            .subscribe({
                next: () => {
                    this.loadStats(); // Recargar datos para ver el cambio
                    alert('Pedido actualizado correctamente');
                },
                error: (err) => {
                    console.error('Error actualizando pedido:', err);
                    alert('Error al actualizar el pedido');
                }
            });
    }
}
