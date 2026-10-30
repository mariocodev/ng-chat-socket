import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    standalone: true
})
export class LoginComponent implements OnInit {
    readonly loading = signal(true);
    readonly error = signal('');
    readonly info = signal('');
    readonly sessionActive = signal(false);
    readonly status = signal('Comprobando sesión...');

    constructor(private auth: AuthService, private router: Router) {}

    ngOnInit(): void {
        this.auth.hydrateSession().pipe(
            catchError(error => {
                if (error instanceof HttpErrorResponse && error.status === 401) return of(null);
                this.error.set(error instanceof HttpErrorResponse && error.status === 0
                    ? 'No se pudo contactar con el servidor. Comprueba que el backend esté activo y que la API esté configurada correctamente.'
                    : error instanceof HttpErrorResponse && error.status === 404
                        ? 'La sesión de Google está activa, pero tu usuario no está registrado en el backend.'
                        : `No se pudo verificar la sesión${error instanceof HttpErrorResponse ? ` (HTTP ${error.status})` : ''}. Revisa el backend e inténtalo nuevamente.`);
                return of(null);
            })
        ).subscribe(user => {
            if (!user) {
                this.loading.set(false);
                return;
            }

            this.sessionActive.set(true);
            this.status.set('Iniciando sesión en el chat...');
            this.auth.users().subscribe({
                next: users => {
                    this.loading.set(false);
                    if (users.length) {
                        this.router.navigate(['/chat', user.id, users[0].id]);
                    } else {
                        this.info.set('Iniciaste sesión correctamente. No hay otros usuarios registrados todavía. Cuando alguien más inicie sesión, podrás iniciar una conversación desde aquí.');
                    }
                },
                error: () => {
                    this.loading.set(false);
                    this.error.set('No se pudo cargar la lista de usuarios.');
                }
            });
        });
    }

    login(): void {
        this.auth.login();
    }

    logout(): void {
        this.auth.logout().subscribe({
            next: () => {
                this.auth.clearSession();
                this.sessionActive.set(false);
                this.info.set('');
                this.error.set('');
            },
            error: () => this.error.set('No se pudo cerrar sesión. Intenta nuevamente.')
        });
    }
}
