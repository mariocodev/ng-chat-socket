import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { HttpInterceptorFn } from '@angular/common/http';

// interceptor funcional
const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
	const clonedReq = req.clone({
		withCredentials: true
	});
	return next(clonedReq);
};

bootstrapApplication(AppComponent, {
	providers: [
		provideHttpClient(withInterceptors([credentialsInterceptor])),
		provideRouter(routes)
	]
}).catch(error => console.error(error));