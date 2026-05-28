import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import type { CanActivateFn } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated() && authService.isAdmin()) {
        return true;
    }

    // If not authenticated, go to login
    if (!authService.isAuthenticated()) {
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
    }

    // If authenticated but not admin, redirect to home
    router.navigate(['/']);
    return false;
};
