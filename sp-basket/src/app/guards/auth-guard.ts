import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import type { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirigir al login con la URL de retorno
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
