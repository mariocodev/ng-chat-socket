import { Component, ElementRef, OnDestroy, OnInit, computed, signal, ViewChild } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatMessage, ChatUser } from '../../models/chat-message.interface';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';

type DisplayMessage = ChatMessage & { message_side: 'sender' | 'receiver' };

@Component({
	selector: 'app-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['./chat.component.scss'],
	imports: [NgClass, FormsModule],
	standalone: true
})
export class ChatComponent implements OnInit, OnDestroy {
	readonly contactUsers = signal<ChatUser[]>([]);
	readonly currentUser = signal<ChatUser | undefined>(undefined);
	readonly userId = signal('');
	readonly contactId = signal('');
	readonly messageInput = signal('');
	readonly messageList = signal<DisplayMessage[]>([]);
	readonly hasMore = signal(false);
	readonly typingUsers = signal(new Set<string>());
	readonly contactTyping = computed(() => this.typingUsers().has(this.contactId()));
	readonly error = signal('');
	private failedPictures = signal(new Set<string>());
	private typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
	private lastTypingSentAt = 0;
	private readonly typingHideDelay = 3000;
	private readonly typingThrottle = 2000;
	@ViewChild('messageContainer') messageContainer?: ElementRef<HTMLElement>;

	constructor(
		private auth: AuthService,
		private chatService: ChatService,
		private route: ActivatedRoute,
		private router: Router
	) {}

	ngOnInit(): void {
		this.userId.set(this.route.snapshot.paramMap.get('userId') || '');
		this.chatService.getMessageSubject().subscribe(messages => this.updateMessages(messages));
		this.chatService.getHasMore().subscribe(hasMore => this.hasMore.set(hasMore));
		this.chatService.getErrors().subscribe(error => this.error.set(error));
		this.chatService.getUnreadRefresh().subscribe(() => this.refreshUsers());
		this.chatService.getPresenceUpdates().subscribe(presence => {
			this.contactUsers.update(users => users.map(user =>
				user.id === presence.userId ? { ...user, online: presence.online } : user));
			if (this.currentUser()?.id === presence.userId) {
				this.currentUser.update(user => user ? { ...user, online: presence.online } : user);
			}
		});
		this.chatService.getConnectionState().subscribe(online => {
			this.currentUser.update(user => user ? { ...user, online } : user);
		});
		this.chatService.getTyping().subscribe(state => this.setTyping(state.userId, state.typing));
		this.auth.currentUser().subscribe({
			next: user => {
				this.currentUser.set(user);
				this.chatService.connect(user.id);
			},
			error: () => this.error.set('No se pudo cargar tu perfil.')
		});
		this.auth.users().subscribe({
			next: users => {
				this.contactUsers.set(users);
				const routeContact = this.route.snapshot.paramMap.get('contactId');
				const contactId = users.some(user => user.id === routeContact) ? routeContact! : users[0]?.id || '';
				this.contactId.set(contactId);
				if (contactId) this.chatService.openConversation(this.userId(), contactId);
				if (contactId !== routeContact) this.updateUrl();
			},
			error: () => this.error.set('No se pudo cargar la lista de usuarios.')
		});
	}

	selectContact(contact: ChatUser): void {
		if (!this.contactUsers().some(user => user.id === contact.id)) return;
		this.contactId.set(contact.id);
		this.contactUsers.update(users => users.map(user =>
			user.id === contact.id ? { ...user, unreadCount: 0 } : user));
		this.messageInput.set('');
		this.lastTypingSentAt = 0;
		this.chatService.openConversation(this.userId(), contact.id);
		this.updateUrl();
	}

	onInputChange(value: string): void {
		this.messageInput.set(value);
		if (!value.trim()) return;
		const now = Date.now();
		if (now - this.lastTypingSentAt < this.typingThrottle) return;
		this.lastTypingSentAt = now;
		this.chatService.sendTyping();
	}

	setTyping(userId: string, typing: boolean): void {
		if (!userId) return;
		const timer = this.typingTimers.get(userId);
		if (timer) clearTimeout(timer);
		this.typingTimers.delete(userId);
		this.typingUsers.update(users => {
			const next = new Set(users);
			if (typing) next.add(userId);
			else next.delete(userId);
			return next;
		});
		if (typing) {
			this.typingTimers.set(userId, setTimeout(() => this.setTyping(userId, false), this.typingHideDelay));
		}
	}

	sendMessage(): void {
		const message = this.messageInput().trim();
		if (!message) return;

		try {
			this.chatService.sendMessage(message);
			this.messageInput.set('');
			this.error.set('');
		} catch (error) {
			this.error.set(error instanceof Error ? error.message : 'No se pudo enviar el mensaje.');
		}
	}

	clearConversation(): void {
		this.chatService.clearConversation();
	}

	logout(): void {
		this.auth.logout().subscribe({
			next: () => {
				this.chatService.disconnect();
				this.router.navigate(['/']);
			},
			error: () => this.error.set('No se pudo cerrar sesión. Intenta nuevamente.')
		});
	}

	loadOlderMessages(): void {
		this.chatService.loadOlderMessages();
	}

	scrollToBottom(): void {
		setTimeout(() => {
			if (this.messageContainer) {
				this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
			}
		});
	}

	ngOnDestroy(): void {
		this.typingTimers.forEach(timer => clearTimeout(timer));
		this.typingTimers.clear();
	}

	private updateMessages(messages: ChatMessage[]): void {
		const lastMessage = this.messageList().at(-1)?.id;
		const shouldScroll = messages.at(-1)?.id !== lastMessage;
		this.messageList.set(messages.map(message => ({
			...message,
			message_side: message.user === this.userId() ? 'sender' : 'receiver'
		})));
		if (shouldScroll) this.scrollToBottom();
	}

	private refreshUsers(): void {
		this.auth.users().subscribe({
			next: users => this.contactUsers.set(users),
			error: () => this.error.set('No se pudo actualizar la lista de usuarios.')
		});
	}

	displayName(userId: string): string {
		return this.userFor(userId)?.name || 'Usuario';
	}

	userPicture(userId: string): string | null {
		return this.userFor(userId)?.picture || null;
	}

	hasPicture(picture: string | null | undefined): picture is string {
		return !!picture && !this.failedPictures().has(picture);
	}

	onPictureError(picture: string | null | undefined): void {
		if (picture) this.failedPictures.update(failed => new Set(failed).add(picture));
	}

	private userFor(userId: string): ChatUser | undefined {
		return this.currentUser()?.id === userId
			? this.currentUser()
			: this.contactUsers().find(user => user.id === userId);
	}

	get contact(): ChatUser | undefined {
		return this.contactUsers().find(user => user.id === this.contactId());
	}

	private updateUrl(): void {
		this.router.navigate(['/chat', this.userId(), this.contactId()]);
	}
}
