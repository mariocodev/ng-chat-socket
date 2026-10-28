import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { provideHttpClient } from '@angular/common/http';

describe('AuthService', () => {
    let service: AuthService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
        service = TestBed.inject(AuthService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('sends the CSRF token when logging out', () => {
        let completed = false;
        service.logout().subscribe(() => completed = true);

        const csrf = http.expectOne(`${environment.apiUrl}/api/auth/csrf`);
        expect(csrf.request.withCredentials).toBeTrue();
        expect(csrf.request.responseType).toBe('text');
        csrf.flush('csrf-token');

        const logout = http.expectOne(`${environment.apiUrl}/logout`);
        expect(logout.request.method).toBe('POST');
        expect(logout.request.withCredentials).toBeTrue();
        expect(logout.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-token');
        logout.flush(null, { status: 204, statusText: 'No Content' });

        expect(completed).toBeTrue();
    });
});
