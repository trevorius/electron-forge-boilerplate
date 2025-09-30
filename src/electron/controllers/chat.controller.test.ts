import { ChatController, generateLoremIpsum, streamMessage } from './chat.controller';
import { chatService } from '../services/chat.service';
import { ipcMain, BrowserWindow } from 'electron';

// Mock the chat service
jest.mock('../services/chat.service', () => ({
  chatService: {
    initialize: jest.fn(),
    createChat: jest.fn(),
    getChat: jest.fn(),
    getAllChats: jest.fn(),
    updateChatName: jest.fn(),
    deleteChat: jest.fn(),
    createMessage: jest.fn(),
    updateMessage: jest.fn(),
    getMessages: jest.fn(),
    getMessageCount: jest.fn(),
    shouldAutoNameChat: jest.fn(),
  },
}));

// Mock electron
jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn(),
    removeHandler: jest.fn(),
  },
  BrowserWindow: {
    fromWebContents: jest.fn(),
  },
}));

describe('ChatController', () => {
  let handlersMap: Map<string, Function>;

  beforeEach(() => {
    jest.clearAllMocks();
    handlersMap = new Map();

    // Capture handlers
    (ipcMain.handle as jest.Mock).mockImplementation((channel: string, handler: Function) => {
      handlersMap.set(channel, handler);
    });
  });

  afterEach(() => {
    ChatController.removeHandlers();
  });

  describe('registerHandlers', () => {
    it('should initialize chat service successfully', async () => {
      (chatService.initialize as jest.Mock).mockResolvedValue(undefined);

      await ChatController.registerHandlers();

      expect(chatService.initialize).toHaveBeenCalled();
    });

    it('should continue even if initialization fails', async () => {
      (chatService.initialize as jest.Mock).mockRejectedValue(new Error('Init failed'));

      await expect(ChatController.registerHandlers()).resolves.not.toThrow();
    });

    it('should register all handlers', async () => {
      (chatService.initialize as jest.Mock).mockResolvedValue(undefined);

      await ChatController.registerHandlers();

      expect(ipcMain.handle).toHaveBeenCalledWith('chat-create', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('chat-get', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('chat-get-all', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('chat-update-name', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('chat-delete', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('chat-send-message', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('chat-get-messages', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('chat-get-message-count', expect.any(Function));
    });
  });

  describe('chat-create handler', () => {
    beforeEach(async () => {
      (chatService.initialize as jest.Mock).mockResolvedValue(undefined);
      await ChatController.registerHandlers();
    });

    it('should create a chat', async () => {
      const mockChat = { id: 1, name: 'Test Chat', createdAt: new Date(), updatedAt: new Date() };
      (chatService.createChat as jest.Mock).mockResolvedValue(mockChat);

      const handler = handlersMap.get('chat-create')!;
      const result = await handler({}, 'Test Chat');

      expect(chatService.createChat).toHaveBeenCalledWith('Test Chat');
      expect(result).toEqual(mockChat);
    });

    it('should throw error if creation fails', async () => {
      (chatService.createChat as jest.Mock).mockRejectedValue(new Error('Creation failed'));

      const handler = handlersMap.get('chat-create')!;

      await expect(handler({}, 'Test Chat')).rejects.toThrow('Creation failed');
    });
  });

  describe('chat-get handler', () => {
    beforeEach(async () => {
      (chatService.initialize as jest.Mock).mockResolvedValue(undefined);
      await ChatController.registerHandlers();
    });

    it('should get a chat', async () => {
      const mockChat = {
        id: 1,
        name: 'Test Chat',
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [],
      };
      (chatService.getChat as jest.Mock).mockResolvedValue(mockChat);

      const handler = handlersMap.get('chat-get')!;
      const result = await handler({}, 1);

      expect(chatService.getChat).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockChat);
    });

    it('should throw error if get fails', async () => {
      (chatService.getChat as jest.Mock).mockRejectedValue(new Error('Get failed'));

      const handler = handlersMap.get('chat-get')!;

      await expect(handler({}, 1)).rejects.toThrow('Get failed');
    });
  });

  describe('chat-get-all handler', () => {
    beforeEach(async () => {
      (chatService.initialize as jest.Mock).mockResolvedValue(undefined);
      await ChatController.registerHandlers();
    });

    it('should get all chats', async () => {
      const mockChats = [
        { id: 1, name: 'Chat 1', createdAt: new Date(), updatedAt: new Date() },
        { id: 2, name: 'Chat 2', createdAt: new Date(), updatedAt: new Date() },
      ];
      (chatService.getAllChats as jest.Mock).mockResolvedValue(mockChats);

      const handler = handlersMap.get('chat-get-all')!;
      const result = await handler({});

      expect(chatService.getAllChats).toHaveBeenCalled();
      expect(result).toEqual(mockChats);
    });

    it('should throw error if get fails', async () => {
      (chatService.getAllChats as jest.Mock).mockRejectedValue(new Error('Get failed'));

      const handler = handlersMap.get('chat-get-all')!;

      await expect(handler({})).rejects.toThrow('Get failed');
    });
  });

  describe('chat-update-name handler', () => {
    beforeEach(async () => {
      (chatService.initialize as jest.Mock).mockResolvedValue(undefined);
      await ChatController.registerHandlers();
    });

    it('should update chat name', async () => {
      const mockChat = { id: 1, name: 'Updated Name', createdAt: new Date(), updatedAt: new Date() };
      (chatService.updateChatName as jest.Mock).mockResolvedValue(mockChat);

      const handler = handlersMap.get('chat-update-name')!;
      const result = await handler({}, 1, 'Updated Name');

      expect(chatService.updateChatName).toHaveBeenCalledWith(1, 'Updated Name');
      expect(result).toEqual(mockChat);
    });

    it('should throw error if update fails', async () => {
      (chatService.updateChatName as jest.Mock).mockRejectedValue(new Error('Update failed'));

      const handler = handlersMap.get('chat-update-name')!;

      await expect(handler({}, 1, 'Updated Name')).rejects.toThrow('Update failed');
    });
  });

  describe('chat-delete handler', () => {
    beforeEach(async () => {
      (chatService.initialize as jest.Mock).mockResolvedValue(undefined);
      await ChatController.registerHandlers();
    });

    it('should delete a chat', async () => {
      (chatService.deleteChat as jest.Mock).mockResolvedValue(undefined);

      const handler = handlersMap.get('chat-delete')!;
      await handler({}, 1);

      expect(chatService.deleteChat).toHaveBeenCalledWith(1);
    });

    it('should throw error if delete fails', async () => {
      (chatService.deleteChat as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      const handler = handlersMap.get('chat-delete')!;

      await expect(handler({}, 1)).rejects.toThrow('Delete failed');
    });
  });

  describe('chat-send-message handler', () => {
    beforeEach(async () => {
      (chatService.initialize as jest.Mock).mockResolvedValue(undefined);
      await ChatController.registerHandlers();
    });

    it('should send a message and stream response', async () => {
      const mockUserMessage = {
        id: 1,
        chatId: 1,
        content: 'Hello',
        role: 'user' as const,
        createdAt: new Date(),
      };
      const mockAssistantMessage = {
        id: 2,
        chatId: 1,
        content: generateLoremIpsum(),
        role: 'assistant' as const,
        createdAt: new Date(),
      };

      (chatService.createMessage as jest.Mock)
        .mockResolvedValueOnce(mockUserMessage)
        .mockResolvedValueOnce(mockAssistantMessage);
      (chatService.shouldAutoNameChat as jest.Mock).mockResolvedValue(false);

      const mockWindow = {
        webContents: {
          send: jest.fn(),
        },
      };
      (BrowserWindow.fromWebContents as jest.Mock).mockReturnValue(mockWindow);

      const mockEvent = { sender: {} };
      const handler = handlersMap.get('chat-send-message')!;
      const result = await handler(mockEvent, 1, 'Hello');

      expect(chatService.createMessage).toHaveBeenCalledTimes(2);
      expect(chatService.createMessage).toHaveBeenCalledWith({
        chatId: 1,
        content: 'Hello',
        role: 'user',
      });
      expect(result.userMessage).toEqual(mockUserMessage);
      expect(result.assistantMessage).toEqual(mockAssistantMessage);
      expect(result.autoNamed).toBe(false);
    });

    it('should auto-name chat after 4 messages', async () => {
      const mockUserMessage = {
        id: 1,
        chatId: 1,
        content: 'Hello',
        role: 'user' as const,
        createdAt: new Date(),
      };
      const mockAssistantMessage = {
        id: 2,
        chatId: 1,
        content: generateLoremIpsum(),
        role: 'assistant' as const,
        createdAt: new Date(),
      };

      (chatService.createMessage as jest.Mock)
        .mockResolvedValueOnce(mockUserMessage)
        .mockResolvedValueOnce(mockAssistantMessage);
      (chatService.shouldAutoNameChat as jest.Mock).mockResolvedValue(true);
      (chatService.updateChatName as jest.Mock).mockResolvedValue({});

      const mockWindow = {
        webContents: {
          send: jest.fn(),
        },
      };
      (BrowserWindow.fromWebContents as jest.Mock).mockReturnValue(mockWindow);

      const mockEvent = { sender: {} };
      const handler = handlersMap.get('chat-send-message')!;
      const result = await handler(mockEvent, 1, 'Hello');

      expect(chatService.updateChatName).toHaveBeenCalledWith(1, 'Chat about Hello...');
      expect(result.autoNamed).toBe(true);
    });

    it('should throw error if message creation fails', async () => {
      (chatService.createMessage as jest.Mock).mockRejectedValue(new Error('Creation failed'));

      const mockEvent = { sender: {} };
      const handler = handlersMap.get('chat-send-message')!;

      await expect(handler(mockEvent, 1, 'Hello')).rejects.toThrow('Creation failed');
    });
  });

  describe('chat-get-messages handler', () => {
    beforeEach(async () => {
      (chatService.initialize as jest.Mock).mockResolvedValue(undefined);
      await ChatController.registerHandlers();
    });

    it('should get messages', async () => {
      const mockMessages = [
        { id: 1, chatId: 1, content: 'Hello', role: 'user', createdAt: new Date() },
        { id: 2, chatId: 1, content: 'Hi', role: 'assistant', createdAt: new Date() },
      ];
      (chatService.getMessages as jest.Mock).mockResolvedValue(mockMessages);

      const handler = handlersMap.get('chat-get-messages')!;
      const result = await handler({}, 1);

      expect(chatService.getMessages).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMessages);
    });

    it('should throw error if get fails', async () => {
      (chatService.getMessages as jest.Mock).mockRejectedValue(new Error('Get failed'));

      const handler = handlersMap.get('chat-get-messages')!;

      await expect(handler({}, 1)).rejects.toThrow('Get failed');
    });
  });

  describe('chat-get-message-count handler', () => {
    beforeEach(async () => {
      (chatService.initialize as jest.Mock).mockResolvedValue(undefined);
      await ChatController.registerHandlers();
    });

    it('should get message count', async () => {
      (chatService.getMessageCount as jest.Mock).mockResolvedValue(5);

      const handler = handlersMap.get('chat-get-message-count')!;
      const result = await handler({}, 1);

      expect(chatService.getMessageCount).toHaveBeenCalledWith(1);
      expect(result).toBe(5);
    });

    it('should throw error if count fails', async () => {
      (chatService.getMessageCount as jest.Mock).mockRejectedValue(new Error('Count failed'));

      const handler = handlersMap.get('chat-get-message-count')!;

      await expect(handler({}, 1)).rejects.toThrow('Count failed');
    });
  });

  describe('removeHandlers', () => {
    it('should remove all handlers', () => {
      ChatController.removeHandlers();

      expect(ipcMain.removeHandler).toHaveBeenCalledWith('chat-create');
      expect(ipcMain.removeHandler).toHaveBeenCalledWith('chat-get');
      expect(ipcMain.removeHandler).toHaveBeenCalledWith('chat-get-all');
      expect(ipcMain.removeHandler).toHaveBeenCalledWith('chat-update-name');
      expect(ipcMain.removeHandler).toHaveBeenCalledWith('chat-delete');
      expect(ipcMain.removeHandler).toHaveBeenCalledWith('chat-send-message');
      expect(ipcMain.removeHandler).toHaveBeenCalledWith('chat-get-messages');
      expect(ipcMain.removeHandler).toHaveBeenCalledWith('chat-get-message-count');
    });
  });

  describe('generateLoremIpsum', () => {
    it('should generate a 25-word lorem ipsum string', () => {
      const result = generateLoremIpsum();
      const words = result.replace('.', '').split(' ');

      expect(words).toHaveLength(25);
      expect(result).toContain('lorem');
      expect(result).toContain('ipsum');
    });
  });

  describe('streamMessage', () => {
    it('should stream message word by word', async () => {
      const mockWindow = {
        webContents: {
          send: jest.fn(),
        },
      } as unknown as BrowserWindow;

      const message = 'Hello world test';
      await streamMessage(mockWindow, message, 1, 1);

      // Should send for each word + final done message
      expect(mockWindow.webContents.send).toHaveBeenCalledTimes(4);
      expect(mockWindow.webContents.send).toHaveBeenLastCalledWith('chat-message-stream', {
        chatId: 1,
        messageId: 1,
        content: 'Hello world test',
        done: true,
      });
    });

    it('should do nothing if window is null', async () => {
      await expect(streamMessage(null, 'test', 1, 1)).resolves.not.toThrow();
    });
  });
});