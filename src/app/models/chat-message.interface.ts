export interface ChatMessage {
    message: string;
    user: string;
    roomId?: string;
}

export interface ChatUser {
    id: string;
    name: string;
    email: string;
    picture: string | null;
}