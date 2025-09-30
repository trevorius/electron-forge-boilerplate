import React from 'react';
import { render } from '@testing-library/react';
import {
  handleKeyDown,
  handleSendClick,
  formatMessage,
  shouldDisplayChatName,
  getMessageCardClasses,
  getMessageContainerClasses,
  updateStreamingMessage,
  canSendMessage,
  scrollToBottom,
  focusInput,
  markdownComponents,
} from './ChatInterface.helpers';

describe('ChatInterface.helpers', () => {
  describe('handleKeyDown', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      // Mock document.getElementById
      document.getElementById = jest.fn().mockReturnValue({
        focus: jest.fn()
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should call onSend when Enter is pressed with non-empty input', () => {
      const mockOnSend = jest.fn();
      const mockEvent = {
        key: 'Enter',
      } as React.KeyboardEvent<HTMLInputElement>;

      handleKeyDown(mockEvent, 'Hello', mockOnSend);

      expect(mockOnSend).toHaveBeenCalledWith('Hello');

      // Fast-forward timers to trigger setTimeout
      jest.runAllTimers();

      expect(document.getElementById).toHaveBeenCalledWith('chat-input-field');
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

    it('should handle missing input element gracefully', () => {
      document.getElementById = jest.fn().mockReturnValue(null);
      const mockOnSend = jest.fn();
      const mockEvent = {
        key: 'Enter',
      } as React.KeyboardEvent<HTMLInputElement>;

      handleKeyDown(mockEvent, 'Hello', mockOnSend);

      expect(mockOnSend).toHaveBeenCalledWith('Hello');

      // Fast-forward timers
      jest.runAllTimers();

      expect(document.getElementById).toHaveBeenCalledWith('chat-input-field');
    });
  });

  describe('handleSendClick', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      document.getElementById = jest.fn().mockReturnValue({
        focus: jest.fn()
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should call onSend when input is non-empty', () => {
      const mockOnSend = jest.fn();

      handleSendClick('Hello', mockOnSend);

      expect(mockOnSend).toHaveBeenCalledWith('Hello');

      // Fast-forward timers to trigger setTimeout
      jest.runAllTimers();

      expect(document.getElementById).toHaveBeenCalledWith('chat-input-field');
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

    it('should handle missing input element gracefully', () => {
      document.getElementById = jest.fn().mockReturnValue(null);
      const mockOnSend = jest.fn();

      handleSendClick('Hello', mockOnSend);

      expect(mockOnSend).toHaveBeenCalledWith('Hello');

      // Fast-forward timers
      jest.runAllTimers();

      expect(document.getElementById).toHaveBeenCalledWith('chat-input-field');
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

  describe('scrollToBottom', () => {
    it('should scroll element to bottom when element is provided', () => {
      const mockElement = {
        scrollTop: 0,
        scrollHeight: 1000,
      } as HTMLDivElement;

      scrollToBottom(mockElement);

      expect(mockElement.scrollTop).toBe(1000);
    });

    it('should handle null element gracefully', () => {
      // Should not throw
      expect(() => scrollToBottom(null)).not.toThrow();
    });
  });

  describe('focusInput', () => {
    it('should focus input when element is provided', () => {
      const mockElement = {
        focus: jest.fn(),
      } as unknown as HTMLInputElement;

      focusInput(mockElement);

      expect(mockElement.focus).toHaveBeenCalled();
    });

    it('should handle null element gracefully', () => {
      // Should not throw
      expect(() => focusInput(null)).not.toThrow();
    });
  });

  describe('markdownComponents', () => {
    it('should render p component with correct styling', () => {
      const PComponent = markdownComponents.p;
      const { container } = render(<PComponent>Test paragraph</PComponent>);
      const p = container.querySelector('p');
      expect(p).toBeInTheDocument();
      expect(p).toHaveTextContent('Test paragraph');
      expect(p).toHaveClass('mb-2', 'last:mb-0');
    });

    it('should render ul component with correct styling', () => {
      const UlComponent = markdownComponents.ul;
      const { container } = render(<UlComponent>Test list</UlComponent>);
      const ul = container.querySelector('ul');
      expect(ul).toBeInTheDocument();
      expect(ul).toHaveTextContent('Test list');
      expect(ul).toHaveClass('list-disc', 'ml-4', 'space-y-1');
    });

    it('should render ol component with correct styling', () => {
      const OlComponent = markdownComponents.ol;
      const { container } = render(<OlComponent>Test ordered list</OlComponent>);
      const ol = container.querySelector('ol');
      expect(ol).toBeInTheDocument();
      expect(ol).toHaveTextContent('Test ordered list');
      expect(ol).toHaveClass('list-decimal', 'ml-4', 'space-y-1');
    });

    it('should render li component with correct styling', () => {
      const LiComponent = markdownComponents.li;
      const { container } = render(<LiComponent>Test list item</LiComponent>);
      const li = container.querySelector('li');
      expect(li).toBeInTheDocument();
      expect(li).toHaveTextContent('Test list item');
      expect(li).toHaveClass('my-1');
    });
  });
});