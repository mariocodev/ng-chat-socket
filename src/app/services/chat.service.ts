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

	constructor(){
		this.initConnectionSocket();
		this.loadMessagesFromLocalStorage();
	}

	initConnectionSocket(){
		const url = '//localhost:3000/chat-socket';
		const socket = new SockJS(url);
		this.stompClient = Stomp.over(socket);
	}

	joinRoom(roomId: string){
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
}
