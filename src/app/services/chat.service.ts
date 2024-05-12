import { Injectable } from '@angular/core';
import { Stomp } from '@stomp/stompjs';
import { BehaviorSubject } from 'rxjs';
import * as SockJS from 'sockjs-client';
import { ChatMessage } from 'src/app/models/chat-message.interface';

@Injectable({
  	providedIn: 'root'
})
export class ChatService {

	private stompClient: any;
	private messageSubject: BehaviorSubject<ChatMessage[]> = new BehaviorSubject<ChatMessage[]>([]); // listener
	private readonly localStorageKey = 'chat_messages';
	private unreadMessagesMap: Map<string, number> = new Map<string, number>();

	constructor(){
		this.initConnectionSocket();
		this.loadMessagesFromLocalStorage();
	}

	// Inicializa la conexión del socket y otros ajustes necesarios
	initConnectionSocket(){
		const url = '//localhost:3000/chat-socket';
		const socket = new SockJS(url);
		this.stompClient = Stomp.over(socket);
	}

	joinRoom(roomId: string){
		// Lógica para unirse a la sala de chat
		this.stompClient.connect({}, () => {
			this.stompClient.subscribe(`/topic/${roomId}`, (messages: any) => {
				const messageContent = JSON.parse(messages.body);
				const currentMessage = this.messageSubject.getValue();
				currentMessage.push(messageContent);

				this.messageSubject.next(currentMessage ); // lsitener recibe los mensajes
				this.saveMessagesToLocalStorage(currentMessage); // guardar en localstorage el mensaje, borrar en otro commit

			})
		})
	}

	getMessageSubject(){
		return this.messageSubject.asObservable();
	}

	sendMessage(roomId: string, chatMessage: ChatMessage){
		this.stompClient.send(`/app/chat/${roomId}`, {}, JSON.stringify(chatMessage));
	}
	
	private saveMessagesToLocalStorage(messages: ChatMessage[]) {
		localStorage.setItem(this.localStorageKey, JSON.stringify(messages));
	}
	
	private loadMessagesFromLocalStorage() {
		const messagesJson = localStorage.getItem(this.localStorageKey);
		if (messagesJson) {
		  	const messages = JSON.parse(messagesJson) as ChatMessage[];
		  	this.messageSubject.next(messages);
		}
	}

	// Método para obtener el contador de mensajes no leídos
    getUnreadMessagesCount(roomId: string): number {
		return this.unreadMessagesMap.get(roomId) || 0;
	}

	incrementUnreadMessagesCount(roomId: string): void {
		const count = this.unreadMessagesMap.get(roomId) || 0;
		this.unreadMessagesMap.set(roomId, count + 1);
	}

	// Método para restablecer el contador de mensajes no leídos
    resetUnreadMessagesCount(roomId: string): void {
		this.unreadMessagesMap.set(roomId, 0);
	}

	clearLocalStorageData() {
		localStorage.removeItem(this.localStorageKey);
		// Después de eliminar del localStorage, restablece el BehaviorSubject
		this.messageSubject.next([]);
	}
}
