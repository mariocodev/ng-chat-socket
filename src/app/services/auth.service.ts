import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { ChatUser } from '../models/chat-message.interface';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
    constructor(private http: HttpClient) {}

    currentUser(): Observable<ChatUser> {
        return this.http.get<ChatUser>(`${environment.apiUrl}/api/auth/me`, { withCredentials: true });
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
