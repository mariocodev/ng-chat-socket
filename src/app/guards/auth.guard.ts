import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
    constructor(private auth: AuthService, private router: Router) {}

    canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
        return this.auth.currentUser().pipe(
            map(user => user.id === route.paramMap.get('userId') || this.router.parseUrl('/')),
            catchError(error => error instanceof HttpErrorResponse && error.status === 401
                ? of(this.router.parseUrl('/'))
                : throwError(() => error))
        );
    }
}
