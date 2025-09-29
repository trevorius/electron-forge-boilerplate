import { ipcRenderer } from 'electron';

/**
 * Chat Types and Interfaces
 * Shared between main and renderer processes
 */
interface ChatRecord {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MessageRecord {
  id: number;
  chatId: number;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
}

interface ChatWithMessages extends ChatRecord {
  messages: MessageRecord[];
}

interface ChatMessageStreamData {
  chatId: number;
  messageId: number;
  content: string;
  done: boolean;
}

/**
 * Chat API functions for preload script
 * These functions handle IPC communication for chat operations
 */
export const ChatApi = {
  chatCreate: (name?: string): Promise<ChatRecord> =>
    ipcRenderer.invoke('chat-create', name),

  chatGet: (chatId: number): Promise<ChatWithMessages | null> =>
    ipcRenderer.invoke('chat-get', chatId),

  chatGetAll: (): Promise<ChatRecord[]> =>
    ipcRenderer.invoke('chat-get-all'),

  chatUpdateName: (chatId: number, name: string): Promise<ChatRecord> =>
    ipcRenderer.invoke('chat-update-name', chatId, name),

  chatDelete: (chatId: number): Promise<void> =>
    ipcRenderer.invoke('chat-delete', chatId),

  chatSendMessage: (chatId: number, content: string): Promise<{
    userMessage: MessageRecord;
    assistantMessage: MessageRecord;
    autoNamed: boolean;
  }> =>
    ipcRenderer.invoke('chat-send-message', chatId, content),

  chatGetMessages: (chatId: number): Promise<MessageRecord[]> =>
    ipcRenderer.invoke('chat-get-messages', chatId),

  chatGetMessageCount: (chatId: number): Promise<number> =>
    ipcRenderer.invoke('chat-get-message-count', chatId),

  chatOnMessageStream: (callback: (data: ChatMessageStreamData) => void): (() => void) => {
    const listener = (_event: unknown, data: ChatMessageStreamData) => callback(data);
    ipcRenderer.on('chat-message-stream', listener);
    return () => ipcRenderer.removeListener('chat-message-stream', listener);
  }
};