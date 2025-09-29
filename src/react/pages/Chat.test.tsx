import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import ChatPage from './Chat';

// Mock ChatInterface
jest.mock('@/components/chat/ChatInterface', () => {
  return {
    __esModule: true,
    default: function MockChatInterface({ chatId, onChatCreated }: any) {
      return (
        <div data-testid="mock-chat-interface" data-chat-id={String(chatId)}>
          Chat Interface
          <button onClick={() => onChatCreated?.(123)}>Create Chat</button>
        </div>
      );
    }
  };
});

// Mock ChatSidebar
jest.mock('@/components/chat/ChatSidebar', () => {
  return {
    ChatSidebar: function MockChatSidebar({ onChatSelect, onNewChat, onChatDeleted }: any) {
      return (
        <div data-testid="mock-chat-sidebar">
          Chat Sidebar
          <button onClick={() => onChatSelect(1)}>Select Chat 1</button>
          <button onClick={() => onNewChat()}>New Chat</button>
          <button onClick={() => onChatDeleted?.()}>Delete Chat</button>
        </div>
      );
    }
  };
});

// Mock SidebarProvider
jest.mock('@/components/ui/sidebar', () => {
  const React = require('react');
  return {
    SidebarProvider: ({ children }: any) => <div data-testid="sidebar-provider">{children}</div>,
  };
});

describe('ChatPage', () => {
  it('should render without crashing', () => {
    render(<ChatPage />);
  });

  it('should render ChatInterface and ChatSidebar components', () => {
    const { getByTestId } = render(<ChatPage />);
    expect(getByTestId('mock-chat-interface')).toBeInTheDocument();
    expect(getByTestId('mock-chat-sidebar')).toBeInTheDocument();
  });

  it('should have fixed inset container with gradient background', () => {
    const { container } = render(<ChatPage />);
    const mainDiv = container.querySelector('.fixed.inset-0') as HTMLElement;

    expect(mainDiv).toHaveClass('fixed');
    expect(mainDiv).toHaveClass('inset-0');
    expect(mainDiv).toHaveClass('bg-gradient-to-br');
  });

  it('should handle chat selection', () => {
    const { getByText, getByTestId } = render(<ChatPage />);

    const selectButton = getByText('Select Chat 1');
    fireEvent.click(selectButton);

    const chatInterface = getByTestId('mock-chat-interface');
    expect(chatInterface).toHaveAttribute('data-chat-id', '1');
  });

  it('should handle new chat', () => {
    const { getByText, getByTestId } = render(<ChatPage />);

    const newChatButton = getByText('New Chat');
    fireEvent.click(newChatButton);

    const chatInterface = getByTestId('mock-chat-interface');
    expect(chatInterface).toHaveAttribute('data-chat-id', 'null');
  });

  it('should handle chat deletion', () => {
    const { getByText, getByTestId } = render(<ChatPage />);

    // First select a chat
    const selectButton = getByText('Select Chat 1');
    fireEvent.click(selectButton);

    // Then delete it
    const deleteButton = getByText('Delete Chat');
    fireEvent.click(deleteButton);

    const chatInterface = getByTestId('mock-chat-interface');
    expect(chatInterface).toHaveAttribute('data-chat-id', 'null');
  });

  it('should update selected chat when chat is created', () => {
    const { getByText, getByTestId } = render(<ChatPage />);

    const createButton = getByText('Create Chat');
    fireEvent.click(createButton);

    const chatInterface = getByTestId('mock-chat-interface');
    expect(chatInterface).toHaveAttribute('data-chat-id', '123');
  });

  it('should wrap everything in SidebarProvider', () => {
    const { getByTestId } = render(<ChatPage />);
    expect(getByTestId('sidebar-provider')).toBeInTheDocument();
  });
});