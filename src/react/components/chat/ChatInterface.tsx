import { Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Message,
  handleKeyDown,
  handleSendClick,
  getMessageCardClasses,
  getMessageContainerClasses,
  updateStreamingMessage,
  canSendMessage,
} from './ChatInterface.helpers';

interface ChatInterfaceProps {
  chatId?: number | null;
  onChatCreated?: (chatId: number) => void;
}

const ChatInterface = ({ chatId: propChatId, onChatCreated }: ChatInterfaceProps) => {
  const { t } = useTranslation();
  const [chatId, setChatId] = useState<number | null>(propChatId || null);
  const [chatName, setChatName] = useState<string>('New Chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  // Initialize or load chat
  useEffect(() => {
    const initializeChat = async () => {
      try {
        if (propChatId) {
          // Load existing chat
          const chat = await window.electronAPI.chatGet(propChatId);
          const chatMessages = await window.electronAPI.chatGetMessages(propChatId);

          setChatId(chat.id);
          setChatName(chat.name);
          setMessages(
            chatMessages.map((msg) => ({
              author: msg.role,
              message: msg.content,
            }))
          );
        } else {
          // Create new chat
          const chat = await window.electronAPI.chatCreate();
          setChatId(chat.id);
          setChatName(chat.name);
          setMessages([]);

          if (onChatCreated) {
            onChatCreated(chat.id);
          }
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      }
    };

    initializeChat();
  }, [propChatId]);

  // Set up streaming message listener
  useEffect(() => {
    if (!chatId) return;

    const cleanup = window.electronAPI.chatOnMessageStream((data) => {
      if (data.chatId === chatId) {
        setMessages((prev) => updateStreamingMessage(prev, data.messageId, data.content));

        if (data.done) {
          setIsStreaming(false);
        }
      }
    });

    return cleanup;
  }, [chatId]);

  const handleSend = async (message: string) => {
    if (!chatId || !canSendMessage(message, isStreaming)) return;

    try {
      // Add user message immediately
      setMessages((prev) => [
        ...prev,
        {
          author: 'user',
          message: message,
        },
      ]);

      setInputValue('');
      setIsStreaming(true);

      // Send message to backend
      const result = await window.electronAPI.chatSendMessage(chatId, message);

      // Update chat name if auto-named
      if (result.autoNamed) {
        setChatName('Generated Name');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div id="chat-name-container" className="flex-shrink-0 w-full p-4">
        <h1 className="text-2xl font-bold">{chatName}</h1>
      </div>
      <div
        id="chat-history-container"
        className="flex-1 overflow-y-auto w-full p-4 min-h-0 mt-12"
      >
        {messages.map((message, index) => (
          <div
            key={message.id || index}
            className={getMessageContainerClasses(message.author)}
          >
            <Card className={getMessageCardClasses(message.author)}>
              <CardHeader>
                <CardTitle>{message.author}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{message.message}</p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      <div id="chat-input-container" className="flex-shrink-0 w-full p-4 ">
        <div className="flex gap-2 items-center gap-0 bg-blue-500 shadow-lg rounded-l-none rounded-r-full overflow-hidden border-2 border-blue-600 transition-all duration-300 hover:shadow-xl focus-within:shadow-xl focus-within:border-blue-400 p-3 rounded-2xl">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t('chat.inputPlaceholder')}
            className="flex-1 bg- px-6 py-4 text-base outline-none placeholder:text-muted-foreground text-slate-900 bg-slate-800"
            disabled={isStreaming}
            onKeyDown={(e) => handleKeyDown(e, inputValue, handleSend)}
          />
          <Button
            size="lg"
            className="mr-2 rounded-full bg-slate-700 hover:cursor-pointer hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            disabled={isStreaming}
            onClick={() => handleSendClick(inputValue, handleSend)}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;