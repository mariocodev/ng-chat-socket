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
	roomId: string = "";
	messageList: any[] = [];
	@ViewChild('messageContainer') messageContainer: ElementRef | undefined;
	unreadMessagesCount: number = 0;
	notAllowed: string = "";

	constructor(
		private chatService: ChatService,
		private route: ActivatedRoute
	) {}

	ngOnInit(): void {
		this.userId = this.route.snapshot.params["userId"];
		this.route.params.subscribe(params => { this.roomId = params['roomId'];	});
		
		// Verificar si el usuario tiene permiso para acceder a la sala antes de suscribirse a los mensajes
		if (this.userId && this.roomId) {
			this.chatService.joinRoom(this.roomId);
			this.listenerMessage();
		} else {
			// Si no hay usuario o roomId, redirigir a una página de error o a la página principal
			console.log("No tienes permiso")
		}		
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

		this.chatService.sendMessage(this.roomId, chatMessage);
		this.messageInput = '';
		// Después de enviar el mensaje, hacer scroll hacia el último mensaje
		this.scrollToBottom();
		this.unreadMessagesCount = 0;
		this.chatService.resetUnreadMessagesCount(this.roomId);
		
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
			console.log("messages : ", messages)
			this.messageList = messages.map((item: any) => ({
			  ...item,
			  message_side: item.user === this.userId ? 'sender' : 'receiver',
			  user: item.user === this.userId ? 'You' : item.user
			}));
	  
			// Verificar si hay mensajes antes de incrementar el contador de mensajes no leídos
			if (messages.length > 0) {
				// Actualizar el contador de mensajes no leídos solo para los usuarios receptores
				const isRoomFocused = this.roomId === messages.roomId;
				if (!isRoomFocused && messages.user !== this.userId) {
				  this.unreadMessagesCount++;
				}
			}
			
		});
	}

	clearLocalStorage() {
		this.unreadMessagesCount = 0;
		this.chatService.clearLocalStorageData();
	}
}
