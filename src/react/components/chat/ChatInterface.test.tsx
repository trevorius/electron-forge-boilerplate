import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatInterface from './ChatInterface';

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

// Mock window.electronAPI
const mockChatCreate = jest.fn();
const mockChatSendMessage = jest.fn();
const mockChatOnMessageStream = jest.fn();

beforeAll(() => {
  (global as any).window.electronAPI = {
    chatCreate: mockChatCreate,
    chatSendMessage: mockChatSendMessage,
    chatOnMessageStream: mockChatOnMessageStream,
  };
});

describe('ChatInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChatOnMessageStream.mockReturnValue(() => {});
  });

  it('should render without crashing', () => {
    mockChatCreate.mockResolvedValue({
      id: 1,
      name: 'New Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    render(<ChatInterface />);

    expect(screen.getByText('New Chat')).toBeInTheDocument();
  });

  it('should initialize chat on mount', async () => {
    mockChatCreate.mockResolvedValue({
      id: 1,
      name: 'Test Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    render(<ChatInterface />);

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

    render(<ChatInterface />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Failed to create chat:', expect.any(Error));
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

    const { container } = render(<ChatInterface />);

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

    const { container } = render(<ChatInterface />);

    await waitFor(() => {
      expect(mockChatCreate).toHaveBeenCalled();
    });

    const input = container.querySelector('input') as HTMLInputElement;
    const button = container.querySelector('button') as HTMLButtonElement;

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(button);

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

    const { container } = render(<ChatInterface />);

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

    const { container } = render(<ChatInterface />);

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

    mockChatSendMessage.mockResolvedValue({
      userMessage: { id: 1, chatId: 1, content: 'Hello', role: 'user', createdAt: new Date() },
      assistantMessage: { id: 2, chatId: 1, content: 'Hi', role: 'assistant', createdAt: new Date() },
      autoNamed: true,
    });

    const { container } = render(<ChatInterface />);

    await waitFor(() => {
      expect(mockChatCreate).toHaveBeenCalled();
    });

    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('Generated Name')).toBeInTheDocument();
    });
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

    const { container } = render(<ChatInterface />);

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

    render(<ChatInterface />);

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

    render(<ChatInterface />);

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

    const { container } = render(<ChatInterface />);

    await waitFor(() => {
      expect(mockChatCreate).toHaveBeenCalled();
    });

    const input = container.querySelector('input') as HTMLInputElement;
    const button = container.querySelector('button') as HTMLButtonElement;

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(input.disabled).toBe(true);
      expect(button.disabled).toBe(true);
    });
  });
});