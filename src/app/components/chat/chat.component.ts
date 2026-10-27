import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatMessage, ChatUser } from '../../models/chat-message.interface';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';

type DisplayMessage = ChatMessage & { message_side: 'sender' | 'receiver' };

@Component({
	selector: 'app-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
	contactUsers: ChatUser[] = [];
	currentUser?: ChatUser;
	userId = '';
	contactId = '';
	messageInput = '';
	messageList: DisplayMessage[] = [];
	private failedPictures = new Set<string>();
	hasMore = false;
	error = '';
	@ViewChild('messageContainer') messageContainer?: ElementRef<HTMLElement>;

	constructor(
		private auth: AuthService,
		private chatService: ChatService,
		private route: ActivatedRoute,
		private router: Router
	) {}

	ngOnInit(): void {
		this.userId = this.route.snapshot.paramMap.get('userId') || '';
		this.chatService.getMessageSubject().subscribe(messages => this.updateMessages(messages));
		this.chatService.getHasMore().subscribe(hasMore => this.hasMore = hasMore);
		this.chatService.getErrors().subscribe(error => this.error = error);
		this.chatService.getUnreadRefresh().subscribe(() => this.refreshUsers());
		this.chatService.getPresenceUpdates().subscribe(presence => {
			this.contactUsers = this.contactUsers.map(user =>
				user.id === presence.userId ? { ...user, online: presence.online } : user);
			if (this.currentUser?.id === presence.userId) {
				this.currentUser = { ...this.currentUser, online: presence.online };
			}
		});
		this.chatService.getConnectionState().subscribe(online => {
			if (this.currentUser) this.currentUser = { ...this.currentUser, online };
		});
		this.auth.currentUser().subscribe({
			next: user => {
				this.currentUser = user;
				this.chatService.connect(user.id);
			},
			error: () => this.error = 'No se pudo cargar tu perfil.'
		});
		this.auth.users().subscribe({
			next: users => {
				this.contactUsers = users;
				const routeContact = this.route.snapshot.paramMap.get('contactId');
				this.contactId = users.some(user => user.id === routeContact)
					? routeContact!
					: users[0]?.id || '';
				if (this.contactId) this.chatService.openConversation(this.userId, this.contactId);
				if (this.contactId !== routeContact) this.updateUrl();
			},
			error: () => this.error = 'No se pudo cargar la lista de usuarios.'
		});
	}

	selectContact(contact: ChatUser): void {
		if (!this.contactUsers.some(user => user.id === contact.id)) return;
		this.contactId = contact.id;
		this.contactUsers = this.contactUsers.map(user => user.id === contact.id ? { ...user, unreadCount: 0 } : user);
		this.messageInput = '';
		this.chatService.openConversation(this.userId, contact.id);
		this.updateUrl();
	}

	sendMessage(): void {
		const message = this.messageInput.trim();
		if (!message) return;

		try {
			this.chatService.sendMessage(message);
			this.messageInput = '';
			this.error = '';
		} catch (error) {
			this.error = error instanceof Error ? error.message : 'No se pudo enviar el mensaje.';
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
			error: () => this.error = 'No se pudo cerrar sesión. Intenta nuevamente.'
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

	private updateMessages(messages: ChatMessage[]): void {
		const shouldScroll = messages[messages.length - 1]?.id !== this.messageList[this.messageList.length - 1]?.id;
		this.messageList = messages.map(message => ({
			...message,
			message_side: message.user === this.userId ? 'sender' : 'receiver'
		}));
		if (shouldScroll) this.scrollToBottom();
	}

	private refreshUsers(): void {
		this.auth.users().subscribe({
			next: users => this.contactUsers = users,
			error: () => this.error = 'No se pudo actualizar la lista de usuarios.'
		});
	}

	displayName(userId: string): string {
		return this.userFor(userId)?.name || 'Usuario';
	}

	userPicture(userId: string): string | null {
		return this.userFor(userId)?.picture || null;
	}

	hasPicture(picture: string | null | undefined): picture is string {
		return !!picture && !this.failedPictures.has(picture);
	}

	onPictureError(picture: string | null | undefined): void {
		if (!picture) return;
		this.failedPictures = new Set(this.failedPictures).add(picture);
	}

	private userFor(userId: string): ChatUser | undefined {
		return this.currentUser?.id === userId
			? this.currentUser
			: this.contactUsers.find(user => user.id === userId);
	}

	get contact(): ChatUser | undefined {
		return this.contactUsers.find(user => user.id === this.contactId);
	}

	private updateUrl(): void {
		this.router.navigate(['/chat', this.userId, this.contactId]);
	}
}
