import { useState } from 'react';
import ChatInterface from "@/components/chat/ChatInterface";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function ChatPage() {
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleChatSelect = (chatId: number) => {
    setSelectedChatId(chatId);
  };

  const handleNewChat = () => {
    setSelectedChatId(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleChatDeleted = () => {
    setSelectedChatId(null);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <SidebarProvider>
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 to-slate-700 text-white flex">
        <ChatSidebar
          selectedChatId={selectedChatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          onChatDeleted={handleChatDeleted}
        />
        <div className="flex-1">
          <ChatInterface
            key={refreshKey}
            chatId={selectedChatId}
            onChatCreated={(chatId) => setSelectedChatId(chatId)}
          />
        </div>
      </div>
    </SidebarProvider>
  );
}
