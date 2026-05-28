import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './components/header/header';
import { FooterComponent } from './components/footer/footer';
import { CookieConsentComponent } from './components/cookie-consent/cookie-consent';
import { VisitService } from './services/visit.service';
import { AuthService } from './services/auth';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, CookieConsentComponent],
  template: `
    <app-header></app-header>
    <main>
      <router-outlet></router-outlet>
    </main>
    <app-footer></app-footer>
    <app-cookie-consent></app-cookie-consent>
  `,
  styles: [`
    main {
      min-height: calc(100vh - 80px - 400px);
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'SP Basket';

  constructor(
    private router: Router,
    private visitService: VisitService,
    private authService: AuthService
  ) {
    // Inicializar tema
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    }
  }

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const user = this.authService.currentUserValue;
      this.visitService.recordVisit(event.urlAfterRedirects, user?.id).subscribe({
        error: (err) => console.error('Visit log error (silent)', err)
      });
    });
  }
}
