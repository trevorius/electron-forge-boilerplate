import { Card } from '@/__mocks__/components/ui/card';
import { Send } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { CardContent, CardHeader, CardTitle } from '../ui/card';

const ChatInterface = () => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');

 const messages = [
  {
    author: "user",
    message:"Lorem ipsum dolor sit amet consectetur adipisicing elit. Autem a iste architecto dicta animi id culpa, pariatur, minus eum quidem quam. Nulla asperiores animi saepe!"
  },
  {
  author: "assistant",
  message: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Autem a iste architecto dicta animi id culpa, pariatur, minus eum quidem quam. Nulla asperiores animi saepe!"
  },
  {
    author: "user",
    message:"Lorem ipsum dolor sit amet consectetur adipisicing elit. Autem a iste architecto dicta animi id culpa, pariatur, minus eum quidem quam. Nulla asperiores animi saepe!"
  },
  {
  author: "assistant",
  message: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Autem a iste architecto dicta animi id culpa, pariatur, minus eum quidem quam. Nulla asperiores animi saepe!"
  },
  {
    author: "user",
    message:"Lorem ipsum dolor sit amet consectetur adipisicing elit. Autem a iste architecto dicta animi id culpa, pariatur, minus eum quidem quam. Nulla asperiores animi saepe!"
  },
  {
  author: "assistant",
  message: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Autem a iste architecto dicta animi id culpa, pariatur, minus eum quidem quam. Nulla asperiores animi saepe!"
  }
 ]

  return (
  <div className="flex flex-col h-full">
    <div id="chat-history-container" className="flex-1 overflow-y-auto w-full p-4 min-h-0 mt-12">
      {messages.map((message, index) => (
        <div key={index} className={`flex flex-row w-full pb-4 ${message.author === 'assistant' ? 'justify-start': 'justify-end'}`}>
          <Card className={`p-6 ${message.author === 'assistant' ? 'bg-slate-800 border-slate-400 w-3/4': 'bg-blue-500 border-slate-400 w-3/4'} border-2 rounded-2xl`}>
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
          onKeyDown={(e) => {
            if (e.key === 'Enter' && inputValue.trim()) {
              console.log('Send message:', inputValue);
              setInputValue('');
            }
          }}
        />
        <Button
          size="lg"
          className="mr-2 rounded-full bg-slate-700 hover:cursor-pointer hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          onClick={() => {
            if (inputValue.trim()) {
              console.log('Send message:', inputValue);
              setInputValue('');
            }
          }}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  </div>
  );
};

export default ChatInterface;
