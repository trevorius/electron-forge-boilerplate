import { BrowserWindow } from 'electron';

// Mock electron and chat service before imports
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn((name: string) => `/mock/user/${name}`),
  },
  BrowserWindow: {
    fromWebContents: jest.fn(),
  },
  ipcMain: {
    handle: jest.fn(),
    removeHandler: jest.fn(),
  },
}));

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

// Mock the LLM service
const mockLLMService = {
  isModelLoaded: jest.fn(),
  generateResponse: jest.fn(),
};

jest.mock('../services/llm.service', () => ({
  getLLMService: jest.fn(() => mockLLMService),
}));

// Now import after mocks are set up
import { generateLLMResponse, generateChatTitle } from './chat.controller';

describe('Chat Controller Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateLLMResponse', () => {
    it('should generate response with LLM and stream tokens', async () => {
      mockLLMService.isModelLoaded.mockReturnValue(true);
      mockLLMService.generateResponse.mockImplementation(async (prompt: string, callback?: (token: string) => void) => {
        if (callback) {
          callback('Hello ');
          callback('world');
        }
        return 'Hello world';
      });

      const mockWindow = {
        webContents: {
          send: jest.fn(),
        },
      } as unknown as BrowserWindow;

      const result = await generateLLMResponse(mockWindow, 'test prompt', 1, 1);

      expect(result).toBe('Hello world');
      expect(mockWindow.webContents.send).toHaveBeenCalledWith('chat-message-stream', {
        chatId: 1,
        messageId: 1,
        content: 'Hello ',
        done: false,
      });
      expect(mockWindow.webContents.send).toHaveBeenCalledWith('chat-message-stream', {
        chatId: 1,
        messageId: 1,
        content: 'Hello world',
        done: false,
      });
      expect(mockWindow.webContents.send).toHaveBeenCalledWith('chat-message-stream', {
        chatId: 1,
        messageId: 1,
        content: 'Hello world',
        done: true,
      });
    });

    it('should work without window', async () => {
      mockLLMService.isModelLoaded.mockReturnValue(true);
      mockLLMService.generateResponse.mockImplementation(async (prompt: string, callback?: (token: string) => void) => {
        if (callback) {
          callback('test');
        }
        return 'test response';
      });

      const result = await generateLLMResponse(null, 'test prompt', 1, 1);

      expect(result).toBe('test response');
    });

    it('should fallback to lorem ipsum if no model loaded', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockLLMService.isModelLoaded.mockReturnValue(false);

      const result = await generateLLMResponse(null, 'test prompt', 1, 1);

      expect(result).toContain('lorem');
      expect(result).toContain('ipsum');
      expect(consoleSpy).toHaveBeenCalledWith('No LLM model loaded, falling back to Lorem Ipsum');
      expect(mockLLMService.generateResponse).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should fallback to lorem ipsum on error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockLLMService.isModelLoaded.mockReturnValue(true);
      mockLLMService.generateResponse.mockRejectedValue(new Error('LLM error'));

      const result = await generateLLMResponse(null, 'test prompt', 1, 1);

      expect(result).toContain('lorem');
      expect(result).toContain('ipsum');
      expect(consoleSpy).toHaveBeenCalledWith('LLM generation failed, falling back to Lorem Ipsum:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('generateChatTitle', () => {
    it('should generate title using LLM', async () => {
      mockLLMService.isModelLoaded.mockReturnValue(true);
      mockLLMService.generateResponse.mockResolvedValue('  "Generated Title"  \n');

      const result = await generateChatTitle('Hello', 'Hi there');

      expect(result).toBe('Generated Title');
      expect(mockLLMService.generateResponse).toHaveBeenCalledWith(
        expect.stringContaining('Generate a very short title')
      );
    });

    it('should use default title if no model loaded', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockLLMService.isModelLoaded.mockReturnValue(false);

      const result = await generateChatTitle('Hello world this is a test', 'Response');

      expect(result).toBe('Chat about Hello world this is a test...');
      expect(consoleSpy).toHaveBeenCalledWith('No LLM model loaded, using default title');
      expect(mockLLMService.generateResponse).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should fallback to default title on error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockLLMService.isModelLoaded.mockReturnValue(true);
      mockLLMService.generateResponse.mockRejectedValue(new Error('LLM error'));

      const result = await generateChatTitle('Hello world', 'Response');

      expect(result).toBe('Chat about Hello world...');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to generate chat title:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should clean up title - remove quotes', async () => {
      mockLLMService.isModelLoaded.mockReturnValue(true);
      mockLLMService.generateResponse.mockResolvedValue('"Quoted Title"');

      const result = await generateChatTitle('Test', 'Response');

      expect(result).toBe('Quoted Title');
    });

    it('should clean up title - take first line', async () => {
      mockLLMService.isModelLoaded.mockReturnValue(true);
      mockLLMService.generateResponse.mockResolvedValue('First Line\nSecond Line');

      const result = await generateChatTitle('Test', 'Response');

      expect(result).toBe('First Line');
    });

    it('should clean up title - truncate long titles', async () => {
      mockLLMService.isModelLoaded.mockReturnValue(true);
      const longTitle = 'A'.repeat(60);
      mockLLMService.generateResponse.mockResolvedValue(longTitle);

      const result = await generateChatTitle('Test', 'Response');

      expect(result).toBe('A'.repeat(50));
    });

    it('should return default if cleaned title is empty', async () => {
      mockLLMService.isModelLoaded.mockReturnValue(true);
      mockLLMService.generateResponse.mockResolvedValue('""');

      const result = await generateChatTitle('Hello', 'Response');

      expect(result).toBe('Chat about Hello...');
    });

    it('should trim whitespace from title', async () => {
      mockLLMService.isModelLoaded.mockReturnValue(true);
      mockLLMService.generateResponse.mockResolvedValue('  Title with spaces  ');

      const result = await generateChatTitle('Test', 'Response');

      expect(result).toBe('Title with spaces');
    });
  });
});