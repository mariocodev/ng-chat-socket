import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
    loading = true;
    error = '';
    info = '';
    sessionActive = false;

    constructor(private auth: AuthService, private router: Router) {}

    ngOnInit(): void {
        this.auth.currentUser().pipe(
            catchError(error => {
                if (error instanceof HttpErrorResponse && error.status === 401) return of(null);
                this.error = error instanceof HttpErrorResponse && error.status === 0
                    ? 'No se pudo contactar con el servidor. Comprueba que el backend esté activo y que la API esté configurada correctamente.'
                    : error instanceof HttpErrorResponse && error.status === 404
                        ? 'La sesión de Google está activa, pero tu usuario no está registrado en el backend.'
                        : `No se pudo verificar la sesión${error instanceof HttpErrorResponse ? ` (HTTP ${error.status})` : ''}. Revisa el backend e inténtalo nuevamente.`;
                return of(null);
            })
        ).subscribe(user => {
            this.loading = false;
            if (!user) return;

            this.sessionActive = true;
            this.auth.users().subscribe({
                next: users => {
                    if (users.length) {
                        this.router.navigate(['/chat', user.id, users[0].id]);
                    } else {
                        this.info = 'Iniciaste sesión correctamente. No hay otros usuarios registrados todavía. Cuando alguien más inicie sesión, podrás iniciar una conversación desde aquí.';
                    }
                },
                error: () => this.error = 'No se pudo cargar la lista de usuarios.'
            });
        });
    }

    login(): void {
        this.auth.login();
    }

    logout(): void {
        this.auth.logout().subscribe({
            next: () => {
                this.sessionActive = false;
                this.info = '';
                this.error = '';
            },
            error: () => this.error = 'No se pudo cerrar sesión. Intenta nuevamente.'
        });
    }
}
