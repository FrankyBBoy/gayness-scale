import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAuth0 } from '@auth0/auth0-angular';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAuth0({
      ...environment.auth0,
      authorizationParams: {
        ...environment.auth0.authorizationParams,
        redirect_uri: `${window.location.origin}/callback`,
        scope: 'openid profile email',
      },
      useRefreshTokens: true,
      cacheLocation: 'localstorage'
    })
  ]
};
