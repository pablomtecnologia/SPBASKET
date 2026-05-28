import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompetitionService } from '../../services/competition.service';

@Component({
    selector: 'app-admin-competition',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="admin-fecan-container">
      <div class="header">
        <h1>🔄 Panel de Gestión</h1>
        <p class="subtitle">Sincroniza datos oficiales (Plantilla, Calendario y Clasificación)</p>
      </div>

      <div class="sync-card">
        <div class="sync-info">
          <h2>Sincronización Global</h2>
          <p>Esta acción actualizará los datos del club almacenados en el servidor.</p>
        </div>

        <div class="sync-actions">
          <button 
            class="btn btn-sync" 
            (click)="syncData()"
            [disabled]="loading"
          >
            <span *ngIf="!loading">📥 Sincronizar Ahora</span>
            <span *ngIf="loading">⏳ Sincronizando...</span>
          </button>
        </div>

        <div class="sync-status" *ngIf="status">
          <div [ngClass]="['status-message', status.success ? 'success' : 'error']">
            {{ status.message }}
          </div>
          <div class="stats" *ngIf="status.success">
              <div class="stat">
                  <span class="label">Partidos Sincronizados</span>
                  <span class="value">{{ status.matchesCount || 0 }}</span>
              </div>
          </div>
        </div>
      </div>

      <div class="info-grid">
          <div class="info-card">
              <h3>ℹ️ ¿Qué se sincroniza?</h3>
              <ul>
                  <li><strong>Partidos:</strong> Resultados pasados y horarios futuros.</li>
                  <li><strong>Clasificación:</strong> Posición actual en la liga.</li>
                  <li><strong>Club:</strong> Datos de contacto y logos oficiales.</li>
              </ul>
          </div>
          <div class="info-card">
              <h3>🕒 Automatización</h3>
              <p>El servidor mantiene una copia local de los datos para garantizar velocidad.</p>
          </div>
      </div>
    </div>
    `,
    styles: [`
    .admin-fecan-container {
      padding: 3rem;
      max-width: 1000px;
      margin: 0 auto;
      min-height: 100vh;
      color: #333;
    }

    .header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .header h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #EB3489 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      color: #666;
      font-size: 1.1rem;
    }

    .sync-card {
      background: white;
      border-radius: 24px;
      padding: 3rem;
      box-shadow: 0 20px 50px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
      text-align: center;
    }

    .sync-info h2 {
      font-size: 1.8rem;
      margin-bottom: 1rem;
    }

    .sync-info p {
      color: #777;
      margin-bottom: 2rem;
    }

    .btn-sync {
      background: linear-gradient(135deg, #EB3489 0%, #c7206e 100%);
      color: white;
      border: none;
      padding: 1.2rem 3rem;
      font-size: 1.2rem;
      font-weight: 700;
      border-radius: 50px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 10px 20px rgba(235,52,137,0.3);
    }

    .btn-sync:hover:not(:disabled) {
      transform: translateY(-3px);
      box-shadow: 0 15px 30px rgba(235,52,137,0.4);
    }

    .btn-sync:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .status-message {
      margin-top: 2rem;
      padding: 1rem;
      border-radius: 12px;
      font-weight: 600;
    }

    .status-message.success {
      background: #e6fffa;
      color: #2c7a7b;
      border: 1px solid #b2f5ea;
    }

    .status-message.error {
      background: #fff5f5;
      color: #c53030;
      border: 1px solid #fed7d7;
    }

    .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
    }

    .info-card {
        background: rgba(255,255,255,0.7);
        padding: 2rem;
        border-radius: 20px;
        backdrop-filter: blur(10px);
    }

    .info-card h3 {
        margin-bottom: 1rem;
        color: #555;
    }

    .info-card ul {
        list-style: none;
        padding: 0;
    }

    .info-card li {
        margin-bottom: 0.5rem;
        padding-left: 1.5rem;
        position: relative;
    }

    .info-card li::before {
        content: '•';
        position: absolute;
        left: 0;
        color: #EB3489;
        font-weight: bold;
    }
    `]
})
export class AdminCompetitionComponent {
    loading = false;
    status: any = null;

    constructor(private competitionService: CompetitionService) { }

    syncData() {
        this.loading = true;
        this.status = null;

        this.competitionService.syncOficialData().subscribe({
            next: (res) => {
                this.status = {
                    success: true,
                    message: res.message || 'Sincronización completada con éxito',
                    matchesCount: res.matchesCount
                };
                this.loading = false;
            },
            error: (err) => {
                this.status = {
                    success: false,
                    message: err.error?.message || 'Error en la conexión con el servidor'
                };
                this.loading = false;
            }
        });
    }
}
