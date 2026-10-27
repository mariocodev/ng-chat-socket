import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatUser } from '../models/chat-message.interface';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly apiUrl = 'http://localhost:3000';

    constructor(private http: HttpClient) {}

    currentUser(): Observable<ChatUser> {
        return this.http.get<ChatUser>(`${this.apiUrl}/api/auth/me`, { withCredentials: true });
    }

    users(): Observable<ChatUser[]> {
        return this.http.get<ChatUser[]>(`${this.apiUrl}/api/users`, { withCredentials: true });
    }

    login(): void {
        window.location.href = `${this.apiUrl}/oauth2/authorization/google`;
    }
}
