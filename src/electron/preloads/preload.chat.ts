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
function chatCreate(name?: string): Promise<ChatRecord> {
  return ipcRenderer.invoke('chat-create', name);
}

function chatGet(chatId: number): Promise<ChatWithMessages | null> {
  return ipcRenderer.invoke('chat-get', chatId);
}

function chatGetAll(): Promise<ChatRecord[]> {
  return ipcRenderer.invoke('chat-get-all');
}

function chatUpdateName(chatId: number, name: string): Promise<ChatRecord> {
  return ipcRenderer.invoke('chat-update-name', chatId, name);
}

function chatDelete(chatId: number): Promise<void> {
  return ipcRenderer.invoke('chat-delete', chatId);
}

function chatSendMessage(chatId: number, content: string): Promise<{
  userMessage: MessageRecord;
  assistantMessage: MessageRecord;
  autoNamed: boolean;
}> {
  return ipcRenderer.invoke('chat-send-message', chatId, content);
}

function chatGetMessages(chatId: number): Promise<MessageRecord[]> {
  return ipcRenderer.invoke('chat-get-messages', chatId);
}

function chatGetMessageCount(chatId: number): Promise<number> {
  return ipcRenderer.invoke('chat-get-message-count', chatId);
}

function chatOnMessageStream(callback: (data: ChatMessageStreamData) => void): () => void {
  const listener = (_event: unknown, data: ChatMessageStreamData) => callback(data);
  ipcRenderer.on('chat-message-stream', listener);
  return () => ipcRenderer.removeListener('chat-message-stream', listener);
}

export const ChatApi = {
  chatCreate,
  chatGet,
  chatGetAll,
  chatUpdateName,
  chatDelete,
  chatSendMessage,
  chatGetMessages,
  chatGetMessageCount,
  chatOnMessageStream
};