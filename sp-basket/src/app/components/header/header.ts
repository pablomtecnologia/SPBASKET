import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { GestionesComponent } from '../gestiones/gestiones';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, GestionesComponent],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent {
  mobileMenuOpen = false;
  profileDropdownOpen = false;

  constructor(public authService: AuthService, private router: Router) { }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  toggleProfileDropdown() {
    this.profileDropdownOpen = !this.profileDropdownOpen;
  }

  closeProfileDropdown() {
    this.profileDropdownOpen = false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
    this.closeMobileMenu();
    this.closeProfileDropdown();
  }
}
