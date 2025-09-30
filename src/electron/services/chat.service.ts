import { PrismaClient } from '../generated/prisma';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

export interface ChatRecord {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageRecord {
  id: number;
  chatId: number;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
}

export interface ChatWithMessages extends ChatRecord {
  messages: MessageRecord[];
}

export interface CreateMessageRequest {
  chatId: number;
  content: string;
  role: 'user' | 'assistant';
}

export class ChatService {
  private prisma: PrismaClient;
  private initialized: boolean = false;

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: this.getDatabaseUrl(),
        },
      },
    });
  }

  private getDatabaseUrl(): string {
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
      const dbPath = path.join(process.cwd(), 'prisma', 'database.db');
      return `file:${dbPath}`;
    }

    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'database.db');
    return `file:${dbPath}`;
  }

  private getDatabasePath(): string {
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
      return path.join(process.cwd(), 'prisma', 'database.db');
    }

    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'database.db');
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.ensureDatabaseExists();
      await this.prisma.$connect();
      await this.ensureTablesExist();

      this.initialized = true;
      console.log('Chat service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize chat service:', error);
      throw error;
    }
  }

  private async ensureDatabaseExists(): Promise<void> {
    const dbPath = this.getDatabasePath();
    const dbDir = path.dirname(dbPath);

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    if (!fs.existsSync(dbPath)) {
      console.log('Creating new database at:', dbPath);
    }
  }

  private async ensureTablesExist(): Promise<void> {
    try {
      await this.prisma.$queryRaw`SELECT 1 FROM chats LIMIT 1`;
      console.log('Chat tables exist');
    } catch (error) {
      console.log('Creating chat tables...');
      await this.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "chats" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "name" TEXT NOT NULL DEFAULT 'New Chat',
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `;

      await this.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "messages" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "chatId" INTEGER NOT NULL,
          "content" TEXT NOT NULL,
          "role" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE
        )
      `;
      console.log('Chat tables created successfully');
    }
  }

  async createChat(name?: string): Promise<ChatRecord> {
    await this.ensureInitialized();

    try {
      const chat = await this.prisma.chat.create({
        data: {
          name: name || 'New Chat',
        },
      });

      return chat;
    } catch (error) {
      console.error('Failed to create chat:', error);
      throw error;
    }
  }

  async getChat(chatId: number): Promise<ChatWithMessages | null> {
    await this.ensureInitialized();

    try {
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      return chat as ChatWithMessages | null;
    } catch (error) {
      console.error('Failed to get chat:', error);
      throw error;
    }
  }

  async getAllChats(): Promise<ChatRecord[]> {
    await this.ensureInitialized();

    try {
      const chats = await this.prisma.chat.findMany({
        orderBy: { updatedAt: 'desc' },
      });

      return chats;
    } catch (error) {
      console.error('Failed to get all chats:', error);
      throw error;
    }
  }

  async updateChatName(chatId: number, name: string): Promise<ChatRecord> {
    await this.ensureInitialized();

    try {
      const chat = await this.prisma.chat.update({
        where: { id: chatId },
        data: { name },
      });

      return chat;
    } catch (error) {
      console.error('Failed to update chat name:', error);
      throw error;
    }
  }

  async deleteChat(chatId: number): Promise<void> {
    await this.ensureInitialized();

    try {
      await this.prisma.chat.delete({
        where: { id: chatId },
      });
    } catch (error) {
      console.error('Failed to delete chat:', error);
      throw error;
    }
  }

  async createMessage(messageData: CreateMessageRequest): Promise<MessageRecord> {
    await this.ensureInitialized();

    try {
      const message = await this.prisma.message.create({
        data: {
          chatId: messageData.chatId,
          content: messageData.content,
          role: messageData.role,
        },
      });

      // Update chat's updatedAt timestamp
      await this.prisma.chat.update({
        where: { id: messageData.chatId },
        data: { updatedAt: new Date() },
      });

      return message as MessageRecord;
    } catch (error) {
      console.error('Failed to create message:', error);
      throw error;
    }
  }

  async getMessages(chatId: number): Promise<MessageRecord[]> {
    await this.ensureInitialized();

    try {
      const messages = await this.prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: 'asc' },
      });

      return messages as MessageRecord[];
    } catch (error) {
      console.error('Failed to get messages:', error);
      throw error;
    }
  }

  async getMessageCount(chatId: number): Promise<number> {
    await this.ensureInitialized();

    try {
      const count = await this.prisma.message.count({
        where: { chatId },
      });

      return count;
    } catch (error) {
      console.error('Failed to get message count:', error);
      throw error;
    }
  }

  async updateMessage(messageId: number, content: string): Promise<MessageRecord> {
    await this.ensureInitialized();

    try {
      const message = await this.prisma.message.update({
        where: { id: messageId },
        data: { content },
      });

      return message as MessageRecord;
    } catch (error) {
      console.error('Failed to update message:', error);
      throw error;
    }
  }

  async shouldAutoNameChat(chatId: number): Promise<boolean> {
    await this.ensureInitialized();

    try {
      const count = await this.getMessageCount(chatId);
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
      });

      // Auto-name after 4 messages and only if it's still "New Chat"
      return count >= 4 && chat?.name === 'New Chat';
    } catch (error) {
      console.error('Failed to check auto-name condition:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.initialized) {
      await this.prisma.$disconnect();
      this.initialized = false;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}

export const chatService = new ChatService();