import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { map, tap } from 'rxjs/operators';

export const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated$.pipe(
    tap(isAuthenticated => {
      if (!isAuthenticated) {
        router.navigate(['/']);
        auth.loginWithRedirect({
          appState: { target: router.url }
        });
      }
    }),
    map(isAuthenticated => isAuthenticated)
  );
};
