import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatMessage, ChatUser } from 'src/app/models/chat-message.interface';
import { AuthService } from 'src/app/services/auth.service';
import { ChatService } from 'src/app/services/chat.service';

type DisplayMessage = ChatMessage & { message_side: 'sender' | 'receiver' };

@Component({
	selector: 'app-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
	contactUsers: ChatUser[] = [];
	userId = '';
	contactId = '';
	messageInput = '';
	messageList: DisplayMessage[] = [];
	unreadCounts: Record<string, number> = {};
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
		this.chatService.getUnreadCounts().subscribe(counts => this.unreadCounts = counts);
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

	scrollToBottom(): void {
		setTimeout(() => {
			if (this.messageContainer) {
				this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
			}
		});
	}

	private updateMessages(messages: ChatMessage[]): void {
		this.messageList = messages.map(message => ({
			...message,
			message_side: message.user === this.userId ? 'sender' : 'receiver'
		}));
		this.scrollToBottom();
	}

	displayName(userId: string): string {
		return this.contactUsers.find(user => user.id === userId)?.name || userId;
	}

	get contact(): ChatUser | undefined {
		return this.contactUsers.find(user => user.id === this.contactId);
	}

	private updateUrl(): void {
		this.router.navigate(['/chat', this.userId, this.contactId]);
	}
}
