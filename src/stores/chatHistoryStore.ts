import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  role: 'user' | 'assistant';
  selected?: string;
}

interface ChatHistoryState {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearHistory: () => void;
}

export const useChatHistoryStore = create<ChatHistoryState>((set) => ({
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message]
    })),
  clearHistory: () => set({ messages: [] })
}));
