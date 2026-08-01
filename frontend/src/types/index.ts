export type Sender = 'student' | 'assistant' | 'advisor';

export interface ChatMessage {
  id: string;
  sender: Sender;
  content: string;
  intent?: string | null;
  confidence?: number | null;
  escalated?: boolean;
  createdAt: string;
}

export interface ChatResponse {
  conversationId: string;
  reply: string;
  intent: string;
  confidence: number;
  escalated: boolean;
  data?: unknown;
}
