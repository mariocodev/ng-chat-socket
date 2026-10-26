import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatMessage, CHAT_USERS } from 'src/app/models/chat-message.interface';
import { ChatService } from 'src/app/services/chat.service';

type DisplayMessage = ChatMessage & { message_side: 'sender' | 'receiver' };

@Component({
	selector: 'app-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
	readonly users = CHAT_USERS;
	contactUsers: readonly string[] = [];
	userId = 'Bart';
	contactId = 'Lisa';
	messageInput = '';
	messageList: DisplayMessage[] = [];
	unreadCounts: Record<string, number> = {};
	@ViewChild('messageContainer') messageContainer?: ElementRef<HTMLElement>;

	constructor(
		private chatService: ChatService,
		private route: ActivatedRoute,
		private router: Router
	) {}

	ngOnInit(): void {
		const routeUser = this.route.snapshot.paramMap.get('userId') || '';
		const routeContact = this.route.snapshot.paramMap.get('contactId') || '';
		this.userId = this.users.find(user => user.toLowerCase() === routeUser.toLowerCase()) || 'Bart';
		this.contactUsers = this.users.filter(user => user !== this.userId);
		this.contactId = this.users.find(user => user.toLowerCase() === routeContact.toLowerCase() && user !== this.userId)
			|| this.users.find(user => user !== this.userId)!;

		this.chatService.getMessageSubject().subscribe(messages => this.updateMessages(messages));
		this.chatService.getUnreadCounts().subscribe(counts => this.unreadCounts = counts);
		this.chatService.openConversation(this.userId, this.contactId);

		if (routeUser !== this.userId || routeContact !== this.contactId) {
			this.updateUrl();
		}
	}

	selectContact(contact: string): void {
		if (contact === this.userId || !this.users.some(user => user === contact)) return;
		this.contactId = contact;
		this.messageInput = '';
		this.chatService.openConversation(this.userId, contact);
		this.updateUrl();
	}

	sendMessage(): void {
		const message = this.messageInput.trim();
		if (!message) return;

		this.chatService.sendMessage(message);
		this.messageInput = '';
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

	private updateUrl(): void {
		this.router.navigate(['/chat', this.userId, this.contactId]);
	}
}
