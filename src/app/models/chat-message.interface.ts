export interface ChatMessage {
    message: string;
    user: string;
    roomId?: string;
}

export const CHAT_USERS = ['Bart', 'Lisa', 'Homero', 'Marge'] as const;