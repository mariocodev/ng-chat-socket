import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { HttpInterceptorFn } from '@angular/common/http';

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
		provideRouter(routes)
	]
}).catch(error => console.error(error));