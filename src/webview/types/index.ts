export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isThinking?: boolean;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  description: string;
}

export interface ChatState {
  messages: Message[];
  currentModel: Model;
  isLoading: boolean;
}