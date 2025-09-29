import { useState } from 'react';
import ChatInterface from "@/components/chat/ChatInterface";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function ChatPage() {
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);

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

  const handleChatNamed = () => {
    // Refresh the sidebar to show the updated chat name
    setSidebarRefreshKey(prev => prev + 1);
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 to-slate-700 text-white flex">
        <ChatSidebar
          key={sidebarRefreshKey}
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
            onChatNamed={handleChatNamed}
          />
        </div>
      </div>
    </SidebarProvider>
  );
}
