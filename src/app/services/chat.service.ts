import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Stomp, StompSubscription } from '@stomp/stompjs';
import { BehaviorSubject, Observable, Subject, switchMap } from 'rxjs';
import * as SockJS from 'sockjs-client';
import { ChatMessage, ChatRoom, MessagePage, UserPresence } from '../models/chat-message.interface';
import { environment } from '../../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class ChatService {
	private stompClient: any;
	private messageSubject = new BehaviorSubject<ChatMessage[]>([]);
	private hasMoreSubject = new BehaviorSubject(false);
	private unreadRefreshSubject = new Subject<void>();
	private presenceSubject = new Subject<UserPresence>();
	private connectionSubject = new BehaviorSubject(false);
	private errorSubject = new BehaviorSubject('');
	private activeRoomId = '';
	private activeUser = '';
	private activeContact = '';
	private page = 0;
	private inboxSubscription?: StompSubscription;
	private presenceSubscription?: StompSubscription;
	private subscribedUser = '';
	private connecting = false;

	constructor(private http: HttpClient) {}

	openConversation(user: string, contact: string): void {
		this.activeUser = user;
		this.activeContact = contact;
		this.activeRoomId = '';
		this.page = 0;
		this.messageSubject.next([]);
		this.hasMoreSubject.next(false);
		this.errorSubject.next('');
		this.connectInbox(user);

		this.withCsrf(token => this.http.post<ChatRoom>(
				`${environment.apiUrl}/api/rooms/private`,
				{ contactId: contact },
				{ withCredentials: true, headers: new HttpHeaders({ 'X-XSRF-TOKEN': token }) }
			)).subscribe({
			next: room => {
				if (this.activeUser !== user || this.activeContact !== contact) return;
				this.activeRoomId = room.id;
				this.loadPage(0, room.id, false);
			},
			error: error => this.fail(error, 'No se pudo abrir la conversación.')
		});
	}

	getMessageSubject(): Observable<ChatMessage[]> {
		return this.messageSubject.asObservable();
	}

	getHasMore(): Observable<boolean> {
		return this.hasMoreSubject.asObservable();
	}

	getUnreadRefresh(): Observable<void> {
		return this.unreadRefreshSubject.asObservable();
	}

	getPresenceUpdates(): Observable<UserPresence> {
		return this.presenceSubject.asObservable();
	}

	getConnectionState(): Observable<boolean> {
		return this.connectionSubject.asObservable();
	}

	getErrors(): Observable<string> {
		return this.errorSubject.asObservable();
	}

	connect(user: string): void {
		this.activeUser = user;
		this.connectInbox(user);
	}

	sendMessage(message: string): void {
		if (!this.stompClient?.connected || !this.activeRoomId) {
			throw new Error('La conversación todavía se está preparando.');
		}

		this.stompClient.send(
			`/app/private/${encodeURIComponent(this.activeUser)}/${encodeURIComponent(this.activeContact)}`,
			{},
			JSON.stringify({ message })
		);
	}

	loadOlderMessages(): void {
		if (!this.activeRoomId || !this.hasMoreSubject.value) return;
		this.loadPage(this.page + 1, this.activeRoomId, true);
	}

	clearConversation(): void {
		if (!this.activeRoomId) return;
		this.withCsrf(token => this.http.delete<void>(
			`${environment.apiUrl}/api/rooms/${this.activeRoomId}/messages`,
			{ withCredentials: true, headers: new HttpHeaders({ 'X-XSRF-TOKEN': token }) }
		)).subscribe({
			next: () => {
				this.messageSubject.next([]);
				this.page = 0;
				this.hasMoreSubject.next(false);
				this.unreadRefreshSubject.next();
			},
			error: error => this.fail(error, 'No se pudo borrar la conversación.')
		});
	}

	disconnect(): void {
		this.inboxSubscription?.unsubscribe();
		this.presenceSubscription?.unsubscribe();
		this.inboxSubscription = undefined;
		this.presenceSubscription = undefined;
		this.subscribedUser = '';
		this.stompClient?.disconnect();
		this.stompClient = undefined;
		this.connecting = false;
		this.connectionSubject.next(false);
	}

	private connectInbox(user: string): void {
		if (!this.stompClient) {
			this.stompClient = Stomp.over(new SockJS(`${environment.apiUrl}/chat-socket`));
		}
		if (this.stompClient.connected) {
			this.subscribeToInbox(user);
		} else if (!this.connecting) {
			this.connecting = true;
			this.stompClient.connect({}, () => {
				this.connecting = false;
				this.subscribeToInbox(this.activeUser);
			}, (error: unknown) => {
				this.connecting = false;
				this.connectionSubject.next(false);
				this.fail(error, 'No se pudo conectar al chat.');
			});
		}
	}

	private subscribeToInbox(user: string): void {
		if (this.activeUser !== user || this.subscribedUser === user) return;
		this.inboxSubscription?.unsubscribe();
		this.subscribedUser = user;
		this.inboxSubscription = this.stompClient.subscribe(
			`/topic/users/${encodeURIComponent(user)}`,
			(frame: { body: string }) => this.receiveMessage(JSON.parse(frame.body) as ChatMessage, user)
		);
		this.presenceSubscription = this.stompClient.subscribe('/topic/presence', (frame: { body: string }) => {
			this.presenceSubject.next(JSON.parse(frame.body) as UserPresence);
		});
		this.connectionSubject.next(true);
		this.unreadRefreshSubject.next();
	}

	private receiveMessage(message: ChatMessage, user: string): void {
		if (this.activeUser !== user || !message.roomId) return;

		if (message.user === user) {
			if (message.roomId === this.activeRoomId) this.appendMessage(message);
			return;
		}

		this.withCsrf(token => this.http.post<void>(
			`${environment.apiUrl}/api/messages/${message.id}/delivered`,
			{},
			{ withCredentials: true, headers: new HttpHeaders({ 'X-XSRF-TOKEN': token }) }
		)).subscribe({
			next: () => {
				if (message.roomId === this.activeRoomId) {
					this.withCsrf(token => this.http.post<void>(
						`${environment.apiUrl}/api/rooms/${message.roomId}/read`,
						{},
						{ withCredentials: true, headers: new HttpHeaders({ 'X-XSRF-TOKEN': token }) }
					)).subscribe({
						next: () => this.unreadRefreshSubject.next(),
						error: error => this.fail(error, 'No se pudo actualizar el estado de lectura.')
					});
					this.appendMessage(message);
				} else if (message.user !== this.activeContact) {
					this.unreadRefreshSubject.next();
				}
			},
			error: error => this.fail(error, 'No se pudo confirmar la entrega del mensaje.')
		});
	}

	private loadPage(page: number, roomId: string, prepend: boolean): void {
		this.http.get<MessagePage>(
			`${environment.apiUrl}/api/rooms/${roomId}/messages?page=${page}&size=50`,
			{ withCredentials: true }
		).subscribe({
			next: result => {
				if (roomId !== this.activeRoomId) return;
				const messages = [...result.content].reverse();
				this.messageSubject.next(prepend
					? this.mergeMessages(messages, this.messageSubject.value)
					: this.mergeMessages(this.messageSubject.value, messages));
				this.page = result.number;
				this.hasMoreSubject.next(result.number + 1 < result.totalPages);
				this.unreadRefreshSubject.next();
			},
			error: error => this.fail(error, 'No se pudo cargar el historial.')
		});
	}

	private appendMessage(message: ChatMessage): void {
		this.messageSubject.next(this.mergeMessages(this.messageSubject.value, [message]));
	}

	private mergeMessages(first: ChatMessage[], second: ChatMessage[]): ChatMessage[] {
		const byId = new Map([...first, ...second].map(message => [message.id, message]));
		return [...byId.values()].sort((a, b) =>
			a.timestamp.localeCompare(b.timestamp) || a.id.localeCompare(b.id));
	}

	private withCsrf<T>(request: (token: string) => Observable<T>): Observable<T> {
		return this.http.get(`${environment.apiUrl}/api/auth/csrf`, {
			withCredentials: true,
			responseType: 'text'
		}).pipe(
			switchMap(token => request(token))
		);
	}

	private fail(error: unknown, fallback: string): void {
		console.error(fallback, error);
		this.errorSubject.next(fallback);
	}
}
