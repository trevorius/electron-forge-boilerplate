import {
  handleKeyDown,
  handleSendClick,
  formatMessage,
  shouldDisplayChatName,
  getMessageCardClasses,
  getMessageContainerClasses,
  updateStreamingMessage,
  canSendMessage,
} from './ChatInterface.helpers';

describe('ChatInterface.helpers', () => {
  describe('handleKeyDown', () => {
    it('should call onSend when Enter is pressed with non-empty input', () => {
      const mockOnSend = jest.fn();
      const mockEvent = {
        key: 'Enter',
      } as React.KeyboardEvent<HTMLInputElement>;

      handleKeyDown(mockEvent, 'Hello', mockOnSend);

      expect(mockOnSend).toHaveBeenCalledWith('Hello');
    });

    it('should not call onSend when Enter is pressed with empty input', () => {
      const mockOnSend = jest.fn();
      const mockEvent = {
        key: 'Enter',
      } as React.KeyboardEvent<HTMLInputElement>;

      handleKeyDown(mockEvent, '', mockOnSend);

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('should not call onSend when Enter is pressed with whitespace only', () => {
      const mockOnSend = jest.fn();
      const mockEvent = {
        key: 'Enter',
      } as React.KeyboardEvent<HTMLInputElement>;

      handleKeyDown(mockEvent, '   ', mockOnSend);

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('should not call onSend when other keys are pressed', () => {
      const mockOnSend = jest.fn();
      const mockEvent = {
        key: 'a',
      } as React.KeyboardEvent<HTMLInputElement>;

      handleKeyDown(mockEvent, 'Hello', mockOnSend);

      expect(mockOnSend).not.toHaveBeenCalled();
    });
  });

  describe('handleSendClick', () => {
    it('should call onSend when input is non-empty', () => {
      const mockOnSend = jest.fn();

      handleSendClick('Hello', mockOnSend);

      expect(mockOnSend).toHaveBeenCalledWith('Hello');
    });

    it('should not call onSend when input is empty', () => {
      const mockOnSend = jest.fn();

      handleSendClick('', mockOnSend);

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('should not call onSend when input is whitespace only', () => {
      const mockOnSend = jest.fn();

      handleSendClick('   ', mockOnSend);

      expect(mockOnSend).not.toHaveBeenCalled();
    });
  });

  describe('formatMessage', () => {
    it('should format message with author and content', () => {
      const result = formatMessage('user', 'Hello world');

      expect(result).toEqual({
        author: 'user',
        message: 'Hello world',
        id: undefined,
      });
    });

    it('should format message with id', () => {
      const result = formatMessage('assistant', 'Hi there', 123);

      expect(result).toEqual({
        author: 'assistant',
        message: 'Hi there',
        id: 123,
      });
    });
  });

  describe('shouldDisplayChatName', () => {
    it('should return true for non-empty chat name', () => {
      expect(shouldDisplayChatName('My Chat')).toBe(true);
    });

    it('should return false for empty chat name', () => {
      expect(shouldDisplayChatName('')).toBe(false);
    });
  });

  describe('getMessageCardClasses', () => {
    it('should return correct classes for assistant message', () => {
      const result = getMessageCardClasses('assistant');

      expect(result).toContain('bg-slate-800');
      expect(result).toContain('border-slate-400');
      expect(result).toContain('w-3/4');
    });

    it('should return correct classes for user message', () => {
      const result = getMessageCardClasses('user');

      expect(result).toContain('bg-blue-500');
      expect(result).toContain('border-slate-400');
      expect(result).toContain('w-3/4');
    });
  });

  describe('getMessageContainerClasses', () => {
    it('should return correct classes for assistant message', () => {
      const result = getMessageContainerClasses('assistant');

      expect(result).toContain('flex');
      expect(result).toContain('justify-start');
    });

    it('should return correct classes for user message', () => {
      const result = getMessageContainerClasses('user');

      expect(result).toContain('flex');
      expect(result).toContain('justify-end');
    });
  });

  describe('updateStreamingMessage', () => {
    it('should update existing message', () => {
      const messages = [
        { author: 'user' as const, message: 'Hello', id: 1 },
        { author: 'assistant' as const, message: 'Hi', id: 2 },
      ];

      const result = updateStreamingMessage(messages, 2, 'Hi there!');

      expect(result[1].message).toBe('Hi there!');
      expect(result).toHaveLength(2);
    });

    it('should add new message if not found', () => {
      const messages = [
        { author: 'user' as const, message: 'Hello', id: 1 },
      ];

      const result = updateStreamingMessage(messages, 2, 'New message');

      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({
        author: 'assistant',
        message: 'New message',
        id: 2,
      });
    });

    it('should handle empty messages array', () => {
      const result = updateStreamingMessage([], 1, 'First message');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        author: 'assistant',
        message: 'First message',
        id: 1,
      });
    });
  });

  describe('canSendMessage', () => {
    it('should return true when input is non-empty and not streaming', () => {
      expect(canSendMessage('Hello', false)).toBe(true);
    });

    it('should return false when input is empty', () => {
      expect(canSendMessage('', false)).toBe(false);
    });

    it('should return false when input is whitespace only', () => {
      expect(canSendMessage('   ', false)).toBe(false);
    });

    it('should return false when streaming', () => {
      expect(canSendMessage('Hello', true)).toBe(false);
    });

    it('should return false when both empty and streaming', () => {
      expect(canSendMessage('', true)).toBe(false);
    });
  });
});