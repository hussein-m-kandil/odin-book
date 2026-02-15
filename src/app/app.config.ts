import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { initColorScheme, DARK_SCHEME_CN } from './color-scheme';
import { retryingInterceptor } from './retrying-interceptor';
import { routes, RouteTitleStrategy } from './app.routes';
import { default as Aura } from '@primeuix/themes/aura';
import { notFoundInterceptor } from './not-found';
import { providePrimeNG } from 'primeng/config';
import { authInterceptor } from './auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([retryingInterceptor, authInterceptor, notFoundInterceptor]),
    ),
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
    { provide: TitleStrategy, useClass: RouteTitleStrategy },
  ],
};
