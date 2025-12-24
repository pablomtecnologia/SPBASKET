import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-cookie-consent',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './cookie-consent.html',
    styleUrls: ['./cookie-consent.css']
})
export class CookieConsentComponent implements OnInit {
    showBanner = false;
    showSettings = false;

    // Configuración de cookies
    cookiePreferences = {
        necessary: true, // Siempre activadas
        analytics: false,
        marketing: false
    };

    ngOnInit() {
        // Verificar si ya se aceptaron las cookies
        const consent = localStorage.getItem('cookieConsent');
        if (!consent) {
            this.showBanner = true;
        } else {
            const prefs = JSON.parse(consent);
            this.cookiePreferences = { ...this.cookiePreferences, ...prefs };
        }
    }

    acceptAll() {
        this.cookiePreferences = {
            necessary: true,
            analytics: true,
            marketing: true
        };
        this.savePreferences();
    }

    rejectAll() {
        this.cookiePreferences = {
            necessary: true,
            analytics: false,
            marketing: false
        };
        this.savePreferences();
    }

    openSettings() {
        this.showSettings = true;
    }

    closeSettings() {
        this.showSettings = false;
    }

    savePreferences() {
        localStorage.setItem('cookieConsent', JSON.stringify(this.cookiePreferences));
        this.showBanner = false;
        this.showSettings = false;

        // Aquí puedes cargar scripts de analytics/marketing según las preferencias
        if (this.cookiePreferences.analytics) {
            this.loadAnalytics();
        }
        if (this.cookiePreferences.marketing) {
            this.loadMarketing();
        }
    }

    private loadAnalytics() {
        // Cargar Google Analytics u otra herramienta
        console.log('📊 Analytics activado');
    }

    private loadMarketing() {
        // Cargar scripts de marketing
        console.log('📢 Marketing activado');
    }
}
