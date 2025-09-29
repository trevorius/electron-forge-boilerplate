import { MessageSquare, Trash2, Plus } from "lucide-react";
import { useEffect, useState } from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';

interface ChatRecord {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatSidebarProps {
  selectedChatId: number | null;
  onChatSelect: (chatId: number) => void;
  onNewChat: () => void;
  onChatDeleted?: () => void;
}

export function ChatSidebar({ selectedChatId, onChatSelect, onNewChat, onChatDeleted }: ChatSidebarProps) {
  const { t } = useTranslation();
  const [chats, setChats] = useState<ChatRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadChats = async () => {
    try {
      setIsLoading(true);
      const allChats = await window.electronAPI.chatGetAll();
      setChats(allChats);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  const handleDeleteChat = async (chatId: number, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await window.electronAPI.chatDelete(chatId);
      setChats(prev => prev.filter(chat => chat.id !== chatId));

      if (selectedChatId === chatId && onChatDeleted) {
        onChatDeleted();
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const handleNewChat = () => {
    onNewChat();
    loadChats();
  };

  return (
    <Sidebar className="mt-12 bg-slate-800">
      <SidebarHeader className="flex justify-between items-center flex-row p-4">
        <h1 className="text-lg font-semibold">{t("chat").toUpperCase()}</h1>
        <SidebarTrigger />
      </SidebarHeader>
      <div className="px-4 pb-2">
        <Button
          onClick={handleNewChat}
          className="w-full bg-slate-700 hover:bg-slate-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('newChat')}
        </Button>
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('conversations')}</SidebarGroupLabel>
          <SidebarGroupContent>
            {isLoading ? (
              <div className="px-4 py-2 text-sm text-slate-400">
                {t('loading')}...
              </div>
            ) : chats.length === 0 ? (
              <div className="px-4 py-2 text-sm text-slate-400">
                {t('noChats')}
              </div>
            ) : (
              <SidebarMenu>
                {chats.map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton
                      onClick={() => onChatSelect(chat.id)}
                      className={`group flex items-center justify-between ${
                        selectedChatId === chat.id ? 'bg-slate-700' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <MessageSquare className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{chat.name}</span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-600 rounded"
                        aria-label={t('deleteChat')}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
