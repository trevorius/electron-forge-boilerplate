/**
 * Helper functions for ChatInterface component
 * These functions are extracted to enable 100% test coverage
 */

export interface Message {
  author: 'user' | 'assistant';
  message: string;
  id?: number;
}

export interface ChatState {
  chatId: number | null;
  chatName: string;
  messages: Message[];
  inputValue: string;
  isStreaming: boolean;
}

/**
 * Handles the key down event for the input field
 */
export function handleKeyDown(
  e: React.KeyboardEvent<HTMLInputElement>,
  inputValue: string,
  onSend: (message: string) => void
): void {
  if (e.key === 'Enter' && inputValue.trim()) {
    onSend(inputValue);
  }
}

/**
 * Handles the click event for the send button
 */
export function handleSendClick(
  inputValue: string,
  onSend: (message: string) => void
): void {
  if (inputValue.trim()) {
    onSend(inputValue);
  }
}

/**
 * Formats a message for display
 */
export function formatMessage(author: string, content: string, id?: number): Message {
  return {
    author: author as 'user' | 'assistant',
    message: content,
    id,
  };
}

/**
 * Determines if the chat name should be displayed
 */
export function shouldDisplayChatName(chatName: string): boolean {
  return chatName !== '';
}

/**
 * Determines the CSS classes for a message card based on author
 */
export function getMessageCardClasses(author: string): string {
  const baseClasses = 'p-6 border-2 rounded-2xl';
  const authorClasses = author === 'assistant'
    ? 'bg-slate-800 border-slate-400 w-3/4'
    : 'bg-blue-500 border-slate-400 w-3/4';

  return `${baseClasses} ${authorClasses}`;
}

/**
 * Determines the container alignment classes based on message author
 */
export function getMessageContainerClasses(author: string): string {
  const baseClasses = 'flex flex-row w-full pb-4';
  const alignmentClass = author === 'assistant' ? 'justify-start' : 'justify-end';

  return `${baseClasses} ${alignmentClass}`;
}


/**
 * Updates a streaming message in the messages array
 */
export function updateStreamingMessage(
  messages: Message[],
  messageId: number,
  content: string
): Message[] {
  const existingIndex = messages.findIndex(m => m.id === messageId);

  if (existingIndex !== -1) {
    // Update existing message
    const updatedMessages = [...messages];
    updatedMessages[existingIndex] = {
      ...updatedMessages[existingIndex],
      message: content,
    };
    return updatedMessages;
  } else {
    // Add new streaming message
    return [
      ...messages,
      {
        author: 'assistant',
        message: content,
        id: messageId,
      },
    ];
  }
}

/**
 * Validates if a message can be sent
 */
export function canSendMessage(inputValue: string, isStreaming: boolean): boolean {
  return inputValue.trim() !== '' && !isStreaming;
}