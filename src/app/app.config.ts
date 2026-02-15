import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { initColorScheme, DARK_SCHEME_CN } from './color-scheme';
import { retryingInterceptor } from './retrying-interceptor';
import { default as Aura } from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([retryingInterceptor])),
    provideRouter(routes, withComponentInputBinding()),
    provideAppInitializer(initColorScheme),
    provideBrowserGlobalErrorListeners(),
    providePrimeNG({
      inputVariant: 'filled',
      ripple: true,
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: `.${DARK_SCHEME_CN}`,
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng',
          },
        },
      },
    }),
  ],
};
