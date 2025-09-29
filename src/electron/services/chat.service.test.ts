import { ChatService } from './chat.service';
import { PrismaClient } from '../generated/prisma';
import * as fs from 'fs';
import * as path from 'path';

// Mock Electron's app module
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => '/mock/user/data'),
  },
}));

// Mock fs module
jest.mock('fs');

// Mock PrismaClient
jest.mock('../generated/prisma', () => {
  const mockPrismaClient = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    chat: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

describe('ChatService', () => {
  let chatService: ChatService;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fs methods before creating service
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);

    chatService = new ChatService();
    mockPrisma = (chatService as any).prisma;

    // Reset all mock implementations to default successful state
    mockPrisma.$connect.mockResolvedValue(undefined);
    mockPrisma.$disconnect.mockResolvedValue(undefined);
    mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
    mockPrisma.$executeRaw.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    try {
      await chatService.close();
    } catch (error) {
      // Ignore errors during cleanup
    }
  });

  describe('initialize', () => {
    it('should initialize the service successfully', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);

      await chatService.initialize();

      expect(mockPrisma.$connect).toHaveBeenCalled();
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it('should not initialize twice', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);

      await chatService.initialize();
      await chatService.initialize();

      expect(mockPrisma.$connect).toHaveBeenCalledTimes(1);
    });

    it('should create tables if they do not exist', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Table does not exist'));
      mockPrisma.$executeRaw.mockResolvedValue(undefined);

      await chatService.initialize();

      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(2);
    });

    it('should create database directory if it does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);

      await chatService.initialize();

      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    });

    it('should throw error if initialization fails', async () => {
      mockPrisma.$connect.mockRejectedValue(new Error('Connection failed'));

      await expect(chatService.initialize()).rejects.toThrow('Connection failed');
    });
  });

  describe('createChat', () => {
    beforeEach(async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
      await chatService.initialize();
    });

    it('should create a chat with default name', async () => {
      const mockChat = { id: 1, name: 'New Chat', createdAt: new Date(), updatedAt: new Date() };
      mockPrisma.chat.create.mockResolvedValue(mockChat);

      const result = await chatService.createChat();

      expect(mockPrisma.chat.create).toHaveBeenCalledWith({
        data: { name: 'New Chat' },
      });
      expect(result).toEqual(mockChat);
    });

    it('should create a chat with custom name', async () => {
      const mockChat = { id: 1, name: 'Custom Chat', createdAt: new Date(), updatedAt: new Date() };
      mockPrisma.chat.create.mockResolvedValue(mockChat);

      const result = await chatService.createChat('Custom Chat');

      expect(mockPrisma.chat.create).toHaveBeenCalledWith({
        data: { name: 'Custom Chat' },
      });
      expect(result).toEqual(mockChat);
    });

    it('should throw error if creation fails', async () => {
      mockPrisma.chat.create.mockRejectedValue(new Error('Creation failed'));

      await expect(chatService.createChat()).rejects.toThrow('Creation failed');
    });
  });

  describe('getChat', () => {
    beforeEach(async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
      await chatService.initialize();
    });

    it('should get a chat with messages', async () => {
      const mockChat = {
        id: 1,
        name: 'Test Chat',
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [
          { id: 1, chatId: 1, content: 'Hello', role: 'user', createdAt: new Date() },
        ],
      };
      mockPrisma.chat.findUnique.mockResolvedValue(mockChat);

      const result = await chatService.getChat(1);

      expect(mockPrisma.chat.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
      expect(result).toEqual(mockChat);
    });

    it('should return null if chat not found', async () => {
      mockPrisma.chat.findUnique.mockResolvedValue(null);

      const result = await chatService.getChat(999);

      expect(result).toBeNull();
    });

    it('should throw error if query fails', async () => {
      mockPrisma.chat.findUnique.mockRejectedValue(new Error('Query failed'));

      await expect(chatService.getChat(1)).rejects.toThrow('Query failed');
    });
  });

  describe('getAllChats', () => {
    beforeEach(async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
      await chatService.initialize();
    });

    it('should get all chats ordered by updatedAt', async () => {
      const mockChats = [
        { id: 1, name: 'Chat 1', createdAt: new Date(), updatedAt: new Date() },
        { id: 2, name: 'Chat 2', createdAt: new Date(), updatedAt: new Date() },
      ];
      mockPrisma.chat.findMany.mockResolvedValue(mockChats);

      const result = await chatService.getAllChats();

      expect(mockPrisma.chat.findMany).toHaveBeenCalledWith({
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toEqual(mockChats);
    });

    it('should throw error if query fails', async () => {
      mockPrisma.chat.findMany.mockRejectedValue(new Error('Query failed'));

      await expect(chatService.getAllChats()).rejects.toThrow('Query failed');
    });
  });

  describe('updateChatName', () => {
    beforeEach(async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
      await chatService.initialize();
    });

    it('should update chat name', async () => {
      const mockChat = { id: 1, name: 'Updated Chat', createdAt: new Date(), updatedAt: new Date() };
      mockPrisma.chat.update.mockResolvedValue(mockChat);

      const result = await chatService.updateChatName(1, 'Updated Chat');

      expect(mockPrisma.chat.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Updated Chat' },
      });
      expect(result).toEqual(mockChat);
    });

    it('should throw error if update fails', async () => {
      mockPrisma.chat.update.mockRejectedValue(new Error('Update failed'));

      await expect(chatService.updateChatName(1, 'Updated Chat')).rejects.toThrow('Update failed');
    });
  });

  describe('deleteChat', () => {
    beforeEach(async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
      await chatService.initialize();
    });

    it('should delete a chat', async () => {
      mockPrisma.chat.delete.mockResolvedValue({});

      await chatService.deleteChat(1);

      expect(mockPrisma.chat.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw error if deletion fails', async () => {
      mockPrisma.chat.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(chatService.deleteChat(1)).rejects.toThrow('Delete failed');
    });
  });

  describe('createMessage', () => {
    beforeEach(async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
      await chatService.initialize();
    });

    it('should create a message and update chat timestamp', async () => {
      const mockMessage = {
        id: 1,
        chatId: 1,
        content: 'Hello',
        role: 'user' as const,
        createdAt: new Date(),
      };
      mockPrisma.message.create.mockResolvedValue(mockMessage);
      mockPrisma.chat.update.mockResolvedValue({});

      const result = await chatService.createMessage({
        chatId: 1,
        content: 'Hello',
        role: 'user',
      });

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          chatId: 1,
          content: 'Hello',
          role: 'user',
        },
      });
      expect(mockPrisma.chat.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { updatedAt: expect.any(Date) },
      });
      expect(result).toEqual(mockMessage);
    });

    it('should throw error if message creation fails', async () => {
      mockPrisma.message.create.mockRejectedValue(new Error('Creation failed'));

      await expect(
        chatService.createMessage({
          chatId: 1,
          content: 'Hello',
          role: 'user',
        })
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('getMessages', () => {
    beforeEach(async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
      await chatService.initialize();
    });

    it('should get all messages for a chat', async () => {
      const mockMessages = [
        { id: 1, chatId: 1, content: 'Hello', role: 'user', createdAt: new Date() },
        { id: 2, chatId: 1, content: 'Hi', role: 'assistant', createdAt: new Date() },
      ];
      mockPrisma.message.findMany.mockResolvedValue(mockMessages);

      const result = await chatService.getMessages(1);

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: { chatId: 1 },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual(mockMessages);
    });

    it('should throw error if query fails', async () => {
      mockPrisma.message.findMany.mockRejectedValue(new Error('Query failed'));

      await expect(chatService.getMessages(1)).rejects.toThrow('Query failed');
    });
  });

  describe('getMessageCount', () => {
    beforeEach(async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
      await chatService.initialize();
    });

    it('should get message count for a chat', async () => {
      mockPrisma.message.count.mockResolvedValue(5);

      const result = await chatService.getMessageCount(1);

      expect(mockPrisma.message.count).toHaveBeenCalledWith({
        where: { chatId: 1 },
      });
      expect(result).toBe(5);
    });

    it('should throw error if count fails', async () => {
      mockPrisma.message.count.mockRejectedValue(new Error('Count failed'));

      await expect(chatService.getMessageCount(1)).rejects.toThrow('Count failed');
    });
  });

  describe('shouldAutoNameChat', () => {
    beforeEach(async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
      await chatService.initialize();
    });

    it('should return true when chat has 4+ messages and name is "New Chat"', async () => {
      mockPrisma.message.count.mockResolvedValue(4);
      mockPrisma.chat.findUnique.mockResolvedValue({
        id: 1,
        name: 'New Chat',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await chatService.shouldAutoNameChat(1);

      expect(result).toBe(true);
    });

    it('should return false when chat has less than 4 messages', async () => {
      mockPrisma.message.count.mockResolvedValue(3);
      mockPrisma.chat.findUnique.mockResolvedValue({
        id: 1,
        name: 'New Chat',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await chatService.shouldAutoNameChat(1);

      expect(result).toBe(false);
    });

    it('should return false when chat name is not "New Chat"', async () => {
      mockPrisma.message.count.mockResolvedValue(4);
      mockPrisma.chat.findUnique.mockResolvedValue({
        id: 1,
        name: 'Custom Chat',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await chatService.shouldAutoNameChat(1);

      expect(result).toBe(false);
    });

    it('should return false when error occurs', async () => {
      mockPrisma.message.count.mockRejectedValue(new Error('Query failed'));

      const result = await chatService.shouldAutoNameChat(1);

      expect(result).toBe(false);
    });
  });

  describe('close', () => {
    it('should disconnect prisma when initialized', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
      await chatService.initialize();

      await chatService.close();

      expect(mockPrisma.$disconnect).toHaveBeenCalled();
    });

    it('should not disconnect when not initialized', async () => {
      await chatService.close();

      expect(mockPrisma.$disconnect).not.toHaveBeenCalled();
    });
  });

  describe('getDatabaseUrl', () => {
    it('should return dev path in development', () => {
      process.env.NODE_ENV = 'development';
      const service = new ChatService();
      const url = (service as any).getDatabaseUrl();

      expect(url).toContain('prisma/database.db');
    });

    it('should return userData path in production', () => {
      process.env.NODE_ENV = 'production';
      const service = new ChatService();
      const url = (service as any).getDatabaseUrl();

      expect(url).toContain('/mock/user/data');
    });
  });
});