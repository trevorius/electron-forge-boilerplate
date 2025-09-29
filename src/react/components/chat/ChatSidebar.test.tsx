import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatSidebar } from './ChatSidebar';

// Mock translation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock lucide icons
jest.mock('lucide-react', () => ({
  MessageSquare: () => <span>MessageSquare Icon</span>,
  Trash2: () => <span>Trash Icon</span>,
  Plus: () => <span>Plus Icon</span>,
}));

// Mock electronAPI
const mockChatGetAll = jest.fn();
const mockChatDelete = jest.fn();

beforeAll(() => {
  (global as any).window.electronAPI = {
    chatGetAll: mockChatGetAll,
    chatDelete: mockChatDelete,
  };
});

// Mock sidebar components
jest.mock('@/components/ui/sidebar', () => {
  const React = require('react');
  return {
    Sidebar: ({ children, className }: any) => <div className={className} data-testid="sidebar">{children}</div>,
    SidebarContent: ({ children }: any) => <div data-testid="sidebar-content">{children}</div>,
    SidebarGroup: ({ children }: any) => <div data-testid="sidebar-group">{children}</div>,
    SidebarGroupContent: ({ children }: any) => <div data-testid="sidebar-group-content">{children}</div>,
    SidebarGroupLabel: ({ children }: any) => <div data-testid="sidebar-group-label">{children}</div>,
    SidebarHeader: ({ children, className }: any) => <div className={className} data-testid="sidebar-header">{children}</div>,
    SidebarMenu: ({ children }: any) => <ul data-testid="sidebar-menu">{children}</ul>,
    SidebarMenuButton: ({ children, onClick, className }: any) => (
      <button onClick={onClick} className={className} data-testid="sidebar-menu-button">
        {children}
      </button>
    ),
    SidebarMenuItem: ({ children }: any) => <li data-testid="sidebar-menu-item">{children}</li>,
    SidebarTrigger: () => <button data-testid="sidebar-trigger">Toggle</button>,
  };
});

// Mock Button component
jest.mock('@/components/ui/button', () => {
  const React = require('react');
  return {
    Button: React.forwardRef<HTMLButtonElement, any>(({ children, onClick, className, ...props }, ref) => (
      <button ref={ref} onClick={onClick} className={className} {...props}>
        {children}
      </button>
    ))
  };
});

describe('ChatSidebar', () => {
  const mockOnChatSelect = jest.fn();
  const mockOnNewChat = jest.fn();
  const mockOnChatDeleted = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', async () => {
    mockChatGetAll.mockResolvedValue([]);
    render(
      <ChatSidebar
        selectedChatId={null}
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
      />
    );

    await waitFor(() => {
      expect(mockChatGetAll).toHaveBeenCalled();
    });
  });

  it('should render sidebar with correct styling', async () => {
    mockChatGetAll.mockResolvedValue([]);
    render(
      <ChatSidebar
        selectedChatId={null}
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
      />
    );

    await waitFor(() => {
      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toHaveClass('mt-12');
      expect(sidebar).toHaveClass('bg-slate-800');
    });
  });

  it('should render header with chat title', async () => {
    mockChatGetAll.mockResolvedValue([]);
    render(
      <ChatSidebar
        selectedChatId={null}
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('CHAT')).toBeInTheDocument();
    });
  });

  it('should render sidebar trigger', async () => {
    mockChatGetAll.mockResolvedValue([]);
    render(
      <ChatSidebar
        selectedChatId={null}
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('sidebar-trigger')).toBeInTheDocument();
    });
  });

  it('should load and display chats', async () => {
    const mockChats = [
      { id: 1, name: 'Chat 1', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: 'Chat 2', createdAt: new Date(), updatedAt: new Date() },
    ];
    mockChatGetAll.mockResolvedValue(mockChats);

    render(
      <ChatSidebar
        selectedChatId={null}
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Chat 1')).toBeInTheDocument();
      expect(screen.getByText('Chat 2')).toBeInTheDocument();
    });
  });

  it('should show loading state', () => {
    mockChatGetAll.mockReturnValue(new Promise(() => {})); // Never resolves

    render(
      <ChatSidebar
        selectedChatId={null}
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
      />
    );

    expect(screen.getByText('loading...')).toBeInTheDocument();
  });

  it('should show no chats message when empty', async () => {
    mockChatGetAll.mockResolvedValue([]);

    render(
      <ChatSidebar
        selectedChatId={null}
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('noChats')).toBeInTheDocument();
    });
  });

  it('should handle chat selection', async () => {
    const mockChats = [
      { id: 1, name: 'Chat 1', createdAt: new Date(), updatedAt: new Date() },
    ];
    mockChatGetAll.mockResolvedValue(mockChats);

    render(
      <ChatSidebar
        selectedChatId={null}
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Chat 1')).toBeInTheDocument();
    });

    const chatItem = screen.getByText('Chat 1');
    fireEvent.click(chatItem);

    expect(mockOnChatSelect).toHaveBeenCalledWith(1);
  });

  it('should handle new chat button click', async () => {
    mockChatGetAll.mockResolvedValue([]);

    render(
      <ChatSidebar
        selectedChatId={null}
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
      />
    );

    await waitFor(() => {
      const newChatButton = screen.getByText('newChat').closest('button');
      expect(newChatButton).toBeInTheDocument();
    });

    const newChatButton = screen.getByText('newChat').closest('button');
    fireEvent.click(newChatButton!);

    expect(mockOnNewChat).toHaveBeenCalled();
  });

  it('should handle delete chat', async () => {
    const mockChats = [
      { id: 1, name: 'Chat 1', createdAt: new Date(), updatedAt: new Date() },
    ];
    mockChatGetAll.mockResolvedValue(mockChats);
    mockChatDelete.mockResolvedValue(undefined);

    const { container } = render(
      <ChatSidebar
        selectedChatId={null}
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
        onChatDeleted={mockOnChatDeleted}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Chat 1')).toBeInTheDocument();
    });

    const deleteButtons = container.querySelectorAll('button[aria-label="deleteChat"]');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockChatDelete).toHaveBeenCalledWith(1);
    });
  });

  it('should call onChatDeleted when deleting selected chat', async () => {
    const mockChats = [
      { id: 1, name: 'Chat 1', createdAt: new Date(), updatedAt: new Date() },
    ];
    mockChatGetAll.mockResolvedValue(mockChats);
    mockChatDelete.mockResolvedValue(undefined);

    const { container } = render(
      <ChatSidebar
        selectedChatId={1}
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
        onChatDeleted={mockOnChatDeleted}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Chat 1')).toBeInTheDocument();
    });

    const deleteButtons = container.querySelectorAll('button[aria-label="deleteChat"]');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockOnChatDeleted).toHaveBeenCalled();
    });
  });

  it('should highlight selected chat', async () => {
    const mockChats = [
      { id: 1, name: 'Chat 1', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: 'Chat 2', createdAt: new Date(), updatedAt: new Date() },
    ];
    mockChatGetAll.mockResolvedValue(mockChats);

    render(
      <ChatSidebar
        selectedChatId={1}
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
      />
    );

    await waitFor(() => {
      const chat1Container = screen.getByText('Chat 1').closest('div.group');
      expect(chat1Container).toHaveClass('bg-slate-700');
    });
  });

  it('should handle chat load error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockChatGetAll.mockRejectedValue(new Error('Failed to load'));

    render(
      <ChatSidebar
        selectedChatId={null}
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
      />
    );

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load chats:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('should handle chat delete error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const mockChats = [
      { id: 1, name: 'Chat 1', createdAt: new Date(), updatedAt: new Date() },
    ];
    mockChatGetAll.mockResolvedValue(mockChats);
    mockChatDelete.mockRejectedValue(new Error('Failed to delete'));

    const { container } = render(
      <ChatSidebar
        selectedChatId={null}
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Chat 1')).toBeInTheDocument();
    });

    const deleteButtons = container.querySelectorAll('button[aria-label="deleteChat"]');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to delete chat:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });
});