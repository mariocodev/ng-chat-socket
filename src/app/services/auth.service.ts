import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, shareReplay, switchMap } from 'rxjs';
import { ChatUser } from '../models/chat-message.interface';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private session$?: Observable<ChatUser>;

    constructor(private http: HttpClient) {}

    hydrateSession(): Observable<ChatUser> {
        this.session$ ??= this.http.get<ChatUser>(
            `${environment.apiUrl}/api/auth/me`,
            { withCredentials: true }
        ).pipe(shareReplay(1));
        return this.session$;
    }

    currentUser(): Observable<ChatUser> {
        return this.hydrateSession();
    }

    clearSession(): void {
        this.session$ = undefined;
    }

    users(): Observable<ChatUser[]> {
        return this.http.get<ChatUser[]>(`${environment.apiUrl}/api/users`, { withCredentials: true });
    }

    logout(): Observable<void> {
        return this.http.get(`${environment.apiUrl}/api/auth/csrf`, {
            withCredentials: true,
            responseType: 'text'
        }).pipe(
            switchMap(token => this.http.post<void>(`${environment.apiUrl}/logout`, {}, {
                withCredentials: true,
                headers: new HttpHeaders({ 'X-XSRF-TOKEN': token })
            }))
        );
    }

    login(): void {
        window.location.href = `${environment.apiUrl}/oauth2/authorization/google`;
    }
}
