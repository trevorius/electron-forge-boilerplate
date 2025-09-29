// Mock ipcRenderer
const mockIpcRenderer = {
  invoke: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
};

jest.mock('electron', () => ({
  ipcRenderer: mockIpcRenderer,
}));

import { ChatApi } from './preload.chat';

describe('ChatApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('chatCreate', () => {
    it('should invoke chat-create with name', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ id: 1, name: 'Test Chat' });
      await ChatApi.chatCreate('Test Chat');
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('chat-create', 'Test Chat');
    });

    it('should invoke chat-create without name', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ id: 1, name: 'New Chat' });
      await ChatApi.chatCreate();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('chat-create', undefined);
    });
  });

  describe('chatGet', () => {
    it('should invoke chat-get with chatId', async () => {
      const mockChat = { id: 1, name: 'Test', messages: [] };
      mockIpcRenderer.invoke.mockResolvedValue(mockChat);
      await ChatApi.chatGet(1);
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('chat-get', 1);
    });
  });

  describe('chatGetAll', () => {
    it('should invoke chat-get-all', async () => {
      mockIpcRenderer.invoke.mockResolvedValue([]);
      await ChatApi.chatGetAll();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('chat-get-all');
    });
  });

  describe('chatUpdateName', () => {
    it('should invoke chat-update-name with chatId and name', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ id: 1, name: 'Updated' });
      await ChatApi.chatUpdateName(1, 'Updated');
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('chat-update-name', 1, 'Updated');
    });
  });

  describe('chatDelete', () => {
    it('should invoke chat-delete with chatId', async () => {
      mockIpcRenderer.invoke.mockResolvedValue(undefined);
      await ChatApi.chatDelete(1);
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('chat-delete', 1);
    });
  });

  describe('chatSendMessage', () => {
    it('should invoke chat-send-message with chatId and content', async () => {
      const mockResponse = {
        userMessage: { id: 1, chatId: 1, content: 'Hello', role: 'user' as const, createdAt: new Date() },
        assistantMessage: { id: 2, chatId: 1, content: 'Hi', role: 'assistant' as const, createdAt: new Date() },
        autoNamed: false,
      };
      mockIpcRenderer.invoke.mockResolvedValue(mockResponse);
      await ChatApi.chatSendMessage(1, 'Hello');
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('chat-send-message', 1, 'Hello');
    });
  });

  describe('chatGetMessages', () => {
    it('should invoke chat-get-messages with chatId', async () => {
      mockIpcRenderer.invoke.mockResolvedValue([]);
      await ChatApi.chatGetMessages(1);
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('chat-get-messages', 1);
    });
  });

  describe('chatGetMessageCount', () => {
    it('should invoke chat-get-message-count with chatId', async () => {
      mockIpcRenderer.invoke.mockResolvedValue(5);
      await ChatApi.chatGetMessageCount(1);
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('chat-get-message-count', 1);
    });
  });

  describe('chatOnMessageStream', () => {
    it('should register listener and return cleanup function', () => {
      const callback = jest.fn();
      const cleanup = ChatApi.chatOnMessageStream(callback);

      expect(mockIpcRenderer.on).toHaveBeenCalledWith('chat-message-stream', expect.any(Function));

      // Get the registered listener
      const listener = (mockIpcRenderer.on as jest.Mock).mock.calls[0][1];

      // Trigger the listener
      const streamData = { chatId: 1, messageId: 1, content: 'test', done: false };
      listener(null, streamData);

      expect(callback).toHaveBeenCalledWith(streamData);

      // Test cleanup
      cleanup();
      expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith('chat-message-stream', listener);
    });
  });
});