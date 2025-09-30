import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatInterface from './ChatInterface';
import { SidebarProvider } from '../ui/sidebar';

// Mock the translation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock the Button component
jest.mock('../ui/button', () => {
  const React = require('react');
  return {
    Button: React.forwardRef<HTMLButtonElement, any>(({ children, onClick, disabled, className, ...props }, ref) => (
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        className={className}
        {...props}
      >
        {children}
      </button>
    ))
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Send: () => <span>Send Icon</span>
}));

// Mock react-markdown
jest.mock('react-markdown', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <div className="markdown">{children}</div>
  };
});

// Mock remark plugins
jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: jest.fn()
}));

jest.mock('remark-breaks', () => ({
  __esModule: true,
  default: jest.fn()
}));

// Mock the sidebar components
jest.mock('../ui/sidebar', () => {
  const React = require('react');
  return {
    SidebarProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SidebarTrigger: () => <button data-testid="sidebar-trigger">Toggle</button>,
  };
});

// Mock window.electronAPI
const mockChatCreate = jest.fn();
const mockChatGet = jest.fn();
const mockChatGetMessages = jest.fn();
const mockChatSendMessage = jest.fn();
const mockChatOnMessageStream = jest.fn();

beforeAll(() => {
  (global as any).window.electronAPI = {
    chatCreate: mockChatCreate,
    chatGet: mockChatGet,
    chatGetMessages: mockChatGetMessages,
    chatSendMessage: mockChatSendMessage,
    chatOnMessageStream: mockChatOnMessageStream,
  };
});

// Helper to render with SidebarProvider
const renderWithProvider = (ui: React.ReactElement) => {
  return render(<SidebarProvider>{ui}</SidebarProvider>);
};

describe('ChatInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChatOnMessageStream.mockReturnValue(() => {});
    mockChatGetMessages.mockResolvedValue([]);
  });

  it('should render without crashing', () => {
    mockChatCreate.mockResolvedValue({
      id: 1,
      name: 'New Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    renderWithProvider(<ChatInterface />);

    expect(screen.getByText('New Chat')).toBeInTheDocument();
  });

  it('should initialize chat on mount', async () => {
    mockChatCreate.mockResolvedValue({
      id: 1,
      name: 'Test Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    renderWithProvider(<ChatInterface />);

    await waitFor(() => {
      expect(mockChatCreate).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Chat')).toBeInTheDocument();
    });
  });

  it('should handle chat creation error', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockChatCreate.mockRejectedValue(new Error('Failed to create chat'));

    renderWithProvider(<ChatInterface />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Failed to initialize chat:', expect.any(Error));
    });

    consoleError.mockRestore();
  });

  it('should send message when Enter is pressed', async () => {
    mockChatCreate.mockResolvedValue({
      id: 1,
      name: 'Test Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockChatSendMessage.mockResolvedValue({
      userMessage: { id: 1, chatId: 1, content: 'Hello', role: 'user', createdAt: new Date() },
      assistantMessage: { id: 2, chatId: 1, content: 'Hi', role: 'assistant', createdAt: new Date() },
      autoNamed: false,
    });

    const { container } = renderWithProvider(<ChatInterface />);

    await waitFor(() => {
      expect(mockChatCreate).toHaveBeenCalled();
    });

    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(mockChatSendMessage).toHaveBeenCalledWith(1, 'Hello');
    });

    // User message should be visible
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });

  it('should send message when send button is clicked', async () => {
    mockChatCreate.mockResolvedValue({
      id: 1,
      name: 'Test Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockChatSendMessage.mockResolvedValue({
      userMessage: { id: 1, chatId: 1, content: 'Hello', role: 'user', createdAt: new Date() },
      assistantMessage: { id: 2, chatId: 1, content: 'Hi', role: 'assistant', createdAt: new Date() },
      autoNamed: false,
    });

    const { container } = renderWithProvider(<ChatInterface />);

    await waitFor(() => {
      expect(mockChatCreate).toHaveBeenCalled();
    });

    const input = container.querySelector('input') as HTMLInputElement;
    const buttons = container.querySelectorAll('button');
    const sendButton = Array.from(buttons).find(btn => !btn.hasAttribute('data-testid')) as HTMLButtonElement;

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockChatSendMessage).toHaveBeenCalledWith(1, 'Hello');
    });
  });

  it('should not send message when input is empty', async () => {
    mockChatCreate.mockResolvedValue({
      id: 1,
      name: 'Test Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { container } = renderWithProvider(<ChatInterface />);

    await waitFor(() => {
      expect(mockChatCreate).toHaveBeenCalled();
    });

    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockChatSendMessage).not.toHaveBeenCalled();
  });

  it('should clear input after sending message', async () => {
    mockChatCreate.mockResolvedValue({
      id: 1,
      name: 'Test Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockChatSendMessage.mockResolvedValue({
      userMessage: { id: 1, chatId: 1, content: 'Hello', role: 'user', createdAt: new Date() },
      assistantMessage: { id: 2, chatId: 1, content: 'Hi', role: 'assistant', createdAt: new Date() },
      autoNamed: false,
    });

    const { container } = renderWithProvider(<ChatInterface />);

    await waitFor(() => {
      expect(mockChatCreate).toHaveBeenCalled();
    });

    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('should update chat name when auto-named', async () => {
    mockChatCreate.mockResolvedValue({
      id: 1,
      name: 'New Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockChatGet.mockResolvedValue({
      id: 1,
      name: 'AI Generated Chat Title',
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
    });

    mockChatSendMessage.mockResolvedValue({
      userMessage: { id: 1, chatId: 1, content: 'Hello', role: 'user', createdAt: new Date() },
      assistantMessage: { id: 2, chatId: 1, content: 'Hi', role: 'assistant', createdAt: new Date() },
      autoNamed: true,
    });

    const mockOnChatNamed = jest.fn();
    const { container } = renderWithProvider(<ChatInterface onChatNamed={mockOnChatNamed} />);

    await waitFor(() => {
      expect(mockChatCreate).toHaveBeenCalled();
    });

    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(mockChatGet).toHaveBeenCalledWith(1);
      expect(screen.getByText('AI Generated Chat Title')).toBeInTheDocument();
      expect(mockOnChatNamed).toHaveBeenCalled();
    });
  });

  it('should update chat name when auto-named without onChatNamed callback', async () => {
    mockChatCreate.mockResolvedValue({
      id: 1,
      name: 'New Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockChatGet.mockResolvedValue({
      id: 1,
      name: 'Auto Generated Title',
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
    });

    mockChatSendMessage.mockResolvedValue({
      userMessage: { id: 1, chatId: 1, content: 'Hello', role: 'user', createdAt: new Date() },
      assistantMessage: { id: 2, chatId: 1, content: 'Hi', role: 'assistant', createdAt: new Date() },
      autoNamed: true,
    });

    // No onChatNamed callback provided
    const { container } = renderWithProvider(<ChatInterface />);

    await waitFor(() => {
      expect(mockChatCreate).toHaveBeenCalled();
    });

    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(mockChatGet).toHaveBeenCalledWith(1);
      expect(screen.getByText('Auto Generated Title')).toBeInTheDocument();
    });

    // Should not crash even without callback
  });

  it('should handle message send error', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockChatCreate.mockResolvedValue({
      id: 1,
      name: 'Test Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockChatSendMessage.mockRejectedValue(new Error('Failed to send message'));

    const { container } = renderWithProvider(<ChatInterface />);

    await waitFor(() => {
      expect(mockChatCreate).toHaveBeenCalled();
    });

    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Failed to send message:', expect.any(Error));
    });

    consoleError.mockRestore();
  });

  it('should handle streaming messages', async () => {
    let streamCallback: any;
    mockChatCreate.mockResolvedValue({
      id: 1,
      name: 'Test Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockChatOnMessageStream.mockImplementation((callback) => {
      streamCallback = callback;
      return () => {};
    });

    renderWithProvider(<ChatInterface />);

    await waitFor(() => {
      expect(mockChatCreate).toHaveBeenCalled();
      expect(mockChatOnMessageStream).toHaveBeenCalled();
    });

    // Simulate streaming message
    streamCallback({
      chatId: 1,
      messageId: 2,
      content: 'Streaming...',
      done: false,
    });

    await waitFor(() => {
      expect(screen.getByText('Streaming...')).toBeInTheDocument();
    });

    // Simulate streaming completion
    streamCallback({
      chatId: 1,
      messageId: 2,
      content: 'Streaming complete',
      done: true,
    });

    await waitFor(() => {
      expect(screen.getByText('Streaming complete')).toBeInTheDocument();
    });
  });

  it('should ignore streaming messages from other chats', async () => {
    let streamCallback: any;
    mockChatCreate.mockResolvedValue({
      id: 1,
      name: 'Test Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockChatOnMessageStream.mockImplementation((callback) => {
      streamCallback = callback;
      return () => {};
    });

    renderWithProvider(<ChatInterface />);

    await waitFor(() => {
      expect(mockChatCreate).toHaveBeenCalled();
      expect(mockChatOnMessageStream).toHaveBeenCalled();
    });

    // Simulate streaming message from different chat
    streamCallback({
      chatId: 999,
      messageId: 2,
      content: 'Other chat message',
      done: false,
    });

    // Message should not appear
    expect(screen.queryByText('Other chat message')).not.toBeInTheDocument();
  });

  it('should disable input and button while streaming', async () => {
    mockChatCreate.mockResolvedValue({
      id: 1,
      name: 'Test Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockChatSendMessage.mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            userMessage: { id: 1, chatId: 1, content: 'Hello', role: 'user', createdAt: new Date() },
            assistantMessage: { id: 2, chatId: 1, content: 'Hi', role: 'assistant', createdAt: new Date() },
            autoNamed: false,
          });
        }, 100);
      });
    });

    const { container } = renderWithProvider(<ChatInterface />);

    await waitFor(() => {
      expect(mockChatCreate).toHaveBeenCalled();
    });

    const input = container.querySelector('input') as HTMLInputElement;
    const buttons = container.querySelectorAll('button');
    const sendButton = Array.from(buttons).find(btn => !btn.hasAttribute('data-testid')) as HTMLButtonElement;

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(input.disabled).toBe(true);
      expect(sendButton.disabled).toBe(true);
    });
  });

  it('should not send message before chatId is initialized', async () => {
    // Make chatCreate hang so chatId stays null
    mockChatCreate.mockImplementation(() => new Promise(() => {}));

    const { container } = renderWithProvider(<ChatInterface />);

    const input = container.querySelector('input') as HTMLInputElement;

    // Try to send a message before chatId is set
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 50));

    // chatSendMessage should not have been called
    expect(mockChatSendMessage).not.toHaveBeenCalled();
  });

  it('should load existing chat when chatId prop is provided', async () => {
    const mockChat = {
      id: 5,
      name: 'Existing Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockMessages = [
      { id: 1, chatId: 5, content: 'Hello', role: 'user', createdAt: new Date() },
      { id: 2, chatId: 5, content: 'Hi there', role: 'assistant', createdAt: new Date() },
    ];

    mockChatGet.mockResolvedValue(mockChat);
    mockChatGetMessages.mockResolvedValue(mockMessages);

    renderWithProvider(<ChatInterface chatId={5} />);

    await waitFor(() => {
      expect(mockChatGet).toHaveBeenCalledWith(5);
      expect(mockChatGetMessages).toHaveBeenCalledWith(5);
    });

    await waitFor(() => {
      expect(screen.getByText('Existing Chat')).toBeInTheDocument();
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hi there')).toBeInTheDocument();
    });
  });

  it('should call onChatCreated when new chat is created', async () => {
    const mockOnChatCreated = jest.fn();
    mockChatCreate.mockResolvedValue({
      id: 10,
      name: 'New Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    renderWithProvider(<ChatInterface onChatCreated={mockOnChatCreated} />);

    await waitFor(() => {
      expect(mockOnChatCreated).toHaveBeenCalledWith(10);
    });
  });

  it('should not call onChatCreated when loading existing chat', async () => {
    const mockOnChatCreated = jest.fn();
    const mockChat = {
      id: 5,
      name: 'Existing Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (window.electronAPI as any).chatGet = jest.fn().mockResolvedValue(mockChat);
    (window.electronAPI as any).chatGetMessages = jest.fn().mockResolvedValue([]);

    renderWithProvider(<ChatInterface chatId={5} onChatCreated={mockOnChatCreated} />);

    await waitFor(() => {
      expect((window.electronAPI as any).chatGet).toHaveBeenCalled();
    });

    expect(mockOnChatCreated).not.toHaveBeenCalled();
  });

  it('should handle undefined chatId prop', async () => {
    mockChatCreate.mockResolvedValue({
      id: 1,
      name: 'New Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    renderWithProvider(<ChatInterface chatId={undefined} />);

    await waitFor(() => {
      expect(mockChatCreate).toHaveBeenCalled();
    });
  });

  it('should handle null chatId prop', async () => {
    mockChatCreate.mockResolvedValue({
      id: 1,
      name: 'New Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    renderWithProvider(<ChatInterface chatId={null} />);

    await waitFor(() => {
      expect(mockChatCreate).toHaveBeenCalled();
    });
  });

  it('should handle chatId of 0', async () => {
    const mockChat = {
      id: 0,
      name: 'Chat Zero',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (window.electronAPI as any).chatGet = jest.fn().mockResolvedValue(mockChat);
    (window.electronAPI as any).chatGetMessages = jest.fn().mockResolvedValue([]);

    renderWithProvider(<ChatInterface chatId={0} />);

    // Since 0 is falsy, it should create a new chat instead of loading
    await waitFor(() => {
      expect(mockChatCreate).toHaveBeenCalled();
    });
  });

});