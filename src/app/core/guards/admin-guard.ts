import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../../features/auth/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.getCurrentUser();

  if (currentUser?.role === 'ADMINISTRADOR') {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};