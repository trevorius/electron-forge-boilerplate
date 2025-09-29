import { ipcMain, BrowserWindow } from 'electron';
import { chatService } from '../services/chat.service';

/**
 * Generate a 25-word Lorem Ipsum response
 */
export function generateLoremIpsum(): string {
  const words = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
    'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
    'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  ];
  return words.join(' ') + '.';
}

/**
 * Stream a message word by word to the renderer process
 */
export async function streamMessage(
  window: BrowserWindow | null,
  message: string,
  chatId: number,
  messageId: number
): Promise<void> {
  if (!window) return;

  const words = message.split(' ');
  let accumulated = '';

  for (const word of words) {
    accumulated += (accumulated ? ' ' : '') + word;
    window.webContents.send('chat-message-stream', {
      chatId,
      messageId,
      content: accumulated,
      done: false,
    });

    // Small delay to simulate streaming
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  // Send final message indicating completion
  window.webContents.send('chat-message-stream', {
    chatId,
    messageId,
    content: accumulated,
    done: true,
  });
}

/**
 * Chat IPC Controller
 * Handles all IPC communication for chat operations
 */
export class ChatController {
  /**
   * Initialize all chat-related IPC handlers
   */
  static async registerHandlers(): Promise<void> {
    try {
      await chatService.initialize();
      console.log('Chat service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize chat service:', error);
    }

    // Create a new chat
    ipcMain.handle('chat-create', async (_event, name?: string) => {
      try {
        return await chatService.createChat(name);
      } catch (error) {
        console.error('Failed to create chat:', error);
        throw error;
      }
    });

    // Get a specific chat with messages
    ipcMain.handle('chat-get', async (_event, chatId: number) => {
      try {
        return await chatService.getChat(chatId);
      } catch (error) {
        console.error('Failed to get chat:', error);
        throw error;
      }
    });

    // Get all chats
    ipcMain.handle('chat-get-all', async () => {
      try {
        return await chatService.getAllChats();
      } catch (error) {
        console.error('Failed to get all chats:', error);
        throw error;
      }
    });

    // Update chat name
    ipcMain.handle('chat-update-name', async (_event, chatId: number, name: string) => {
      try {
        return await chatService.updateChatName(chatId, name);
      } catch (error) {
        console.error('Failed to update chat name:', error);
        throw error;
      }
    });

    // Delete chat
    ipcMain.handle('chat-delete', async (_event, chatId: number) => {
      try {
        await chatService.deleteChat(chatId);
      } catch (error) {
        console.error('Failed to delete chat:', error);
        throw error;
      }
    });

    // Send a message (user message + streamed assistant response)
    ipcMain.handle('chat-send-message', async (event, chatId: number, content: string) => {
      try {
        // Save user message
        const userMessage = await chatService.createMessage({
          chatId,
          content,
          role: 'user',
        });

        // Generate and save assistant response
        const assistantResponse = generateLoremIpsum();
        const assistantMessage = await chatService.createMessage({
          chatId,
          content: assistantResponse,
          role: 'assistant',
        });

        // Get the sender window
        const senderWindow = BrowserWindow.fromWebContents(event.sender);

        // Stream the assistant response
        await streamMessage(senderWindow, assistantResponse, chatId, assistantMessage.id);

        // Check if we should auto-name the chat
        const shouldAutoName = await chatService.shouldAutoNameChat(chatId);
        if (shouldAutoName) {
          await chatService.updateChatName(chatId, 'Generated Name');
        }

        return {
          userMessage,
          assistantMessage,
          autoNamed: shouldAutoName,
        };
      } catch (error) {
        console.error('Failed to send message:', error);
        throw error;
      }
    });

    // Get messages for a chat
    ipcMain.handle('chat-get-messages', async (_event, chatId: number) => {
      try {
        return await chatService.getMessages(chatId);
      } catch (error) {
        console.error('Failed to get messages:', error);
        throw error;
      }
    });

    // Get message count
    ipcMain.handle('chat-get-message-count', async (_event, chatId: number) => {
      try {
        return await chatService.getMessageCount(chatId);
      } catch (error) {
        console.error('Failed to get message count:', error);
        throw error;
      }
    });
  }

  /**
   * Remove all chat IPC handlers
   */
  static removeHandlers(): void {
    ipcMain.removeHandler('chat-create');
    ipcMain.removeHandler('chat-get');
    ipcMain.removeHandler('chat-get-all');
    ipcMain.removeHandler('chat-update-name');
    ipcMain.removeHandler('chat-delete');
    ipcMain.removeHandler('chat-send-message');
    ipcMain.removeHandler('chat-get-messages');
    ipcMain.removeHandler('chat-get-message-count');
  }
}