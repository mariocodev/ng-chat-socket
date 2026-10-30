export interface ChatMessage {
    id: string;
    message: string;
    user: string;
    roomId: string;
    timestamp: string;
    status: 'SENT' | 'DELIVERED' | 'READ';
}

export interface ChatUser {
    id: string;
    name: string;
    email: string;
    picture: string | null;
    unreadCount: number;
    online: boolean;
}

export interface UserPresence {
    userId: string;
    online: boolean;
}

export interface TypingEvent {
    userId: string;
}

export interface ChatRoom {
    id: string;
    type: 'PRIVATE' | 'GROUP';
    createdAt: string;
}

export interface MessagePage {
    content: ChatMessage[];
    number: number;
    totalPages: number;
}