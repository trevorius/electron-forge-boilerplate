import { ipcMain, BrowserWindow } from 'electron';
import { chatService } from '../services/chat.service';

let llmServicePromise: Promise<any> | null = null;

async function getLLMService() {
  if (!llmServicePromise) {
    llmServicePromise = (async () => {
      const { getLLMService: getService } = await import('../services/llm.service');
      return getService();
    })();
  }
  return llmServicePromise;
}

/**
 * Generate a 25-word Lorem Ipsum response (fallback)
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
 * Generate response using LLM with streaming
 */
export async function generateLLMResponse(
  window: BrowserWindow | null,
  prompt: string,
  chatId: number,
  messageId: number
): Promise<string> {
  try {
    const llmService = await getLLMService();

    // Check if model is loaded
    if (!llmService.isModelLoaded()) {
      console.log('No LLM model loaded, falling back to Lorem Ipsum');
      return generateLoremIpsum();
    }

    let fullResponse = '';

    // Generate with streaming
    const response = await llmService.generateResponse(prompt, (token: string) => {
      fullResponse += token;
      if (window) {
        window.webContents.send('chat-message-stream', {
          chatId,
          messageId,
          content: fullResponse,
          done: false,
        });
      }
    });

    // Send final message
    if (window) {
      window.webContents.send('chat-message-stream', {
        chatId,
        messageId,
        content: response,
        done: true,
      });
    }

    return response;
  } catch (error) {
    console.error('LLM generation failed, falling back to Lorem Ipsum:', error);
    return generateLoremIpsum();
  }
}

/**
 * Generate a chat title using LLM based on conversation context
 */
export async function generateChatTitle(userMessage: string, assistantResponse: string): Promise<string> {
  try {
    const llmService = await getLLMService();

    // Check if model is loaded
    if (!llmService.isModelLoaded()) {
      console.log('No LLM model loaded, using default title');
      return `Chat about ${userMessage.substring(0, 30)}...`;
    }

    // Create a prompt to generate a short title
    const titlePrompt = `Generate a very short title (3-5 words maximum) for this conversation. Only respond with the title, nothing else.

User: ${userMessage}
Assistant: ${assistantResponse}

Title:`;

    // Generate title without streaming
    const title = await llmService.generateResponse(titlePrompt);

    // Clean up the title - remove quotes, trim, limit length
    const cleanTitle = title
      .replace(/^["']|["']$/g, '')  // Remove surrounding quotes
      .trim()
      .split('\n')[0]  // Take only first line
      .substring(0, 50);  // Limit to 50 characters

    return cleanTitle || `Chat about ${userMessage.substring(0, 30)}...`;
  } catch (error) {
    console.error('Failed to generate chat title:', error);
    return `Chat about ${userMessage.substring(0, 30)}...`;
  }
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

        // Get the sender window
        const senderWindow = BrowserWindow.fromWebContents(event.sender);

        // Create a placeholder assistant message
        const assistantMessage = await chatService.createMessage({
          chatId,
          content: '',
          role: 'assistant',
        });

        // Generate assistant response with LLM (or fallback to Lorem Ipsum)
        const assistantResponse = await generateLLMResponse(
          senderWindow,
          content,
          chatId,
          assistantMessage.id
        );

        // Update the assistant message with the full response
        await chatService.updateMessage(assistantMessage.id, assistantResponse);

        // Check if we should auto-name the chat
        const shouldAutoName = await chatService.shouldAutoNameChat(chatId);
        if (shouldAutoName) {
          // Generate a title using the LLM
          const generatedTitle = await generateChatTitle(content, assistantResponse);
          await chatService.updateChatName(chatId, generatedTitle);
        }

        return {
          userMessage,
          assistantMessage: { ...assistantMessage, content: assistantResponse },
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