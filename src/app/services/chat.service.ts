import { Injectable } from '@angular/core';
import { Stomp, StompSubscription } from '@stomp/stompjs';
import { BehaviorSubject } from 'rxjs';
import * as SockJS from 'sockjs-client';
import { ChatMessage } from 'src/app/models/chat-message.interface';

@Injectable({
	providedIn: 'root'
})
export class ChatService {
	private stompClient: any;
	private messageSubject = new BehaviorSubject<ChatMessage[]>([]);
	private conversations: Record<string, ChatMessage[]> = {};
	private localStorageKey = '';
	private unreadCounts = new BehaviorSubject<Record<string, number>>({});
	private inboxSubscription?: StompSubscription;
	private activeConversationId = '';
	private activeUser = '';
	private activeContact = '';
	private subscribedUser = '';
	private connecting = false;

	openConversation(user: string, contact: string): void {
		if (!this.stompClient) {
			const socket = new SockJS('//localhost:3000/chat-socket');
			this.stompClient = Stomp.over(socket);
		}

		this.activeUser = user;
		this.activeContact = contact;
		this.activeConversationId = this.conversationId(user, contact);
		if (this.localStorageKey !== `private_chat_messages_${user}`) {
			this.localStorageKey = `private_chat_messages_${user}`;
			this.conversations = JSON.parse(localStorage.getItem(this.localStorageKey) || '{}') as Record<string, ChatMessage[]>;
		}
		const unread = this.loadUnreadCounts(user);
		delete unread[contact];
		this.saveUnreadCounts(user, unread);
		this.messageSubject.next(this.conversations[this.activeConversationId] || []);

		if (this.stompClient.connected) {
			this.subscribeToInbox(user);
		} else if (!this.connecting) {
			this.connecting = true;
			this.stompClient.connect({}, () => {
				this.connecting = false;
				this.subscribeToInbox(this.activeUser);
			}, (error: unknown) => {
				this.connecting = false;
				console.error('No se pudo conectar al chat', error);
			});
		}
	}

	getMessageSubject() {
		return this.messageSubject.asObservable();
	}

	getUnreadCounts() {
		return this.unreadCounts.asObservable();
	}

	sendMessage(message: string): void {
		if (!this.stompClient?.connected) {
			throw new Error('El chat todavía no está conectado.');
		}

		const chatMessage: ChatMessage = {
			message,
			user: this.activeUser,
			roomId: this.activeConversationId
		};
		this.stompClient.send(`/app/private/${this.activeUser}/${this.activeContact}`, {}, JSON.stringify(chatMessage));
		const messages = [...(this.conversations[this.activeConversationId] || []), chatMessage];
		this.conversations[this.activeConversationId] = messages;
		this.saveConversations();
		this.messageSubject.next(messages);
	}

	clearConversation(): void {
		this.conversations[this.activeConversationId] = [];
		this.saveConversations();
		const unread = this.loadUnreadCounts(this.activeUser);
		delete unread[this.activeContact];
		this.saveUnreadCounts(this.activeUser, unread);
		this.messageSubject.next([]);
	}

	private subscribeToInbox(user: string): void {
		if (this.activeUser !== user) return;
		if (this.subscribedUser === user) return;
		this.inboxSubscription?.unsubscribe();
		this.subscribedUser = user;
		this.inboxSubscription = this.stompClient.subscribe(`/topic/users/${encodeURIComponent(user)}`, (frame: { body: string }) => {
			if (this.activeUser !== user) return;
			const message = JSON.parse(frame.body) as ChatMessage;
			if (!message.roomId || message.user === user) return;
			const conversationId = message.roomId;
			const messages = [...(this.conversations[conversationId] || []), message];
			this.conversations[conversationId] = messages;
			this.saveConversations();
			if (conversationId === this.activeConversationId) {
				this.messageSubject.next(messages);
			} else {
				const unread = this.loadUnreadCounts(user);
				const contact = message.user;
				unread[contact] = (unread[contact] || 0) + 1;
				this.saveUnreadCounts(user, unread);
			}
		});
	}

	private conversationId(user: string, contact: string): string {
		return [user, contact].sort().join('-').toLowerCase();
	}

	private saveConversations(): void {
		localStorage.setItem(this.localStorageKey, JSON.stringify(this.conversations));
	}

	private loadUnreadCounts(user: string): Record<string, number> {
		const counts = JSON.parse(localStorage.getItem(`private_chat_unread_${user}`) || '{}') as Record<string, number>;
		this.unreadCounts.next(counts);
		return counts;
	}

	private saveUnreadCounts(user: string, counts: Record<string, number>): void {
		localStorage.setItem(`private_chat_unread_${user}`, JSON.stringify(counts));
		this.unreadCounts.next(counts);
	}
}
