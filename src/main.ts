import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { HttpInterceptorFn } from '@angular/common/http';

const storedTheme = localStorage.getItem('app-theme') as 'light' | 'dark' | 'system' | null;
const root = document.documentElement;
const body = document.body;
root.classList.remove('app-dark', 'dark');
body.classList.remove('app-dark', 'dark');
if (storedTheme === 'dark') {
	root.classList.add('app-dark', 'dark');
	body.classList.add('app-dark', 'dark');
} else if (storedTheme === 'system' || !storedTheme) {
	if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
		root.classList.add('app-dark', 'dark');
		body.classList.add('app-dark', 'dark');
	}
}

// interceptor funcional
const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  	return next(req.clone({ withCredentials: true }));
};

bootstrapApplication(AppComponent, {
	providers: [
		provideHttpClient(
			withInterceptors([credentialsInterceptor]),
            // Error 403 en Chrome:
			withXsrfConfiguration({
				cookieName: 'XSRF-TOKEN',
				headerName: 'X-XSRF-TOKEN'
			})
		),
		provideRouter(routes),
		// el preset inyecta los tokens (--p-skeleton-*) sin los cuales el skeleton sale transparente
		providePrimeNG({
			theme: {
				preset: Aura,
				options: {
					darkModeSelector: '.app-dark'
				}
			}
		})
	]
}).catch(error => console.error(error));