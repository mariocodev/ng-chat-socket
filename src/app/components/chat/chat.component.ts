import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChatMessage } from 'src/app/models/chat-message.interface';
import { ChatService } from 'src/app/services/chat.service';

@Component({
	selector: 'app-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {

	messageInput: string = "";
	userId: string = "";
	messageList: any[] = [];
	private salaName: string = 'Sala-1';
	@ViewChild('messageContainer') messageContainer: ElementRef | undefined;

	constructor(
		private chatService: ChatService,
		private route: ActivatedRoute){
	}

	ngOnInit(): void {
		this.userId = this.route.snapshot.params["userId"];
		this.chatService.joinRoom(this.salaName);
		this.listenerMessage();
	}

	ngAfterViewInit(): void {
        this.scrollToBottom();
    }

	sendMessage() {
		console.log("sendMessage : ", this.messageInput)
		if (!this.messageInput) return;
		const chatMessage = {
			message: this.messageInput,
			user: this.userId
		} as ChatMessage
		this.chatService.sendMessage(this.salaName, chatMessage);
		this.messageInput = '';
		// Después de enviar el mensaje, hacer scroll hacia el último mensaje
		this.scrollToBottom();
	}

	scrollToBottom() {
        setTimeout(() => {
			if (this.messageContainer) {
				this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
			}
		}, 100); // Aumentamos el tiempo de espera a 100 milisegundos
    }

	listenerMessage() {
		this.chatService.getMessageSubject().subscribe((messages: any) => {
			this.messageList = messages.map((item: any) => ({
				...item,
				message_side: item.user === this.userId ? 'sender' : 'receiver',
				user: item.user === this.userId ? 'You' : item.user
			}))
		});
	}
}
