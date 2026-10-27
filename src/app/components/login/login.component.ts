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

    constructor(private auth: AuthService, private router: Router) {}

    ngOnInit(): void {
        this.auth.currentUser().pipe(
            catchError(error => {
                if (error instanceof HttpErrorResponse && error.status === 401) return of(null);
                this.error = 'No se pudo conectar con el servidor. Intenta nuevamente.';
                return of(null);
            })
        ).subscribe(user => {
            this.loading = false;
            if (!user) return;

            this.auth.users().subscribe({
                next: users => {
                    if (users.length) {
                        this.router.navigate(['/chat', user.id, users[0].id]);
                    } else {
                        this.error = 'Tu sesión está activa. Cuando otro usuario inicie sesión, aparecerá aquí.';
                    }
                },
                error: () => this.error = 'No se pudo cargar la lista de usuarios.'
            });
        });
    }

    login(): void {
        this.auth.login();
    }
}
