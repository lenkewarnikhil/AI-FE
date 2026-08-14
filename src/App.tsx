import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/useAuthStore';
import { useChatStore } from './store/useChatStore';
import { useSettingsStore } from './store/useSettingsStore';
import { BackgroundWallpaper } from './components/layout/BackgroundWallpaper';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MessageList } from './components/chat/MessageList';
import { MessageInput } from './components/chat/MessageInput';
import type { FileAttachment } from './components/chat/MessageInput';
import { AuthModal } from './components/auth/AuthModal';
import { SessionTimeoutModal } from './components/auth/SessionTimeoutModal';
import { SettingsView } from './components/settings/SettingsView';
import { LoginPage } from './components/auth/LoginPage';
import { GoogleCallback } from './components/auth/GoogleCallback';
import { ToastContainer } from './components/ui/ToastContainer';
import type { Message } from './types';
import { getApiUrl } from './services/api';

const queryClient = new QueryClient();

const ProtectedWorkspace: React.FC = () => {
  const { token, isAuthenticated } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const activeView = location.hash === '#settings' ? 'settings' : 'chat';
  const setActiveView = (view: 'chat' | 'settings') => {
    navigate(view === 'settings' ? '#settings' : '#', { replace: true });
  };

  const {
    activeId,
    activeConversation,
    fetchConversations,
    createConversation,
    addMessage,
    updateLastMessageContent,
    updateLastMessageModel,
    finishStreamingMessage,
    isGenerating,
    setGenerating,
    stopGeneration,
  } = useChatStore();

  const { fetchSettings, settings } = useSettingsStore();

  useEffect(() => {
    if (token && isAuthenticated) {
      fetchConversations();
      fetchSettings();
    }
  }, [token, isAuthenticated]);

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  const handleSendMessage = async (content: string, attachments?: FileAttachment[]) => {
    setActiveView('chat');
    let targetConvId = activeId;
    if (!targetConvId) {
      targetConvId = await createConversation();
    }

    const tempUserMsg: any = {
      id: Date.now(),
      conversation_id: targetConvId,
      role: 'user',
      content,
      attachments: attachments || [],
      created_at: new Date().toISOString(),
    };

    addMessage(targetConvId, tempUserMsg);

    const currentModel = settings.default_model || 'gemini-3.6-flash';
    const tempAssistantMsg: Message = {
      id: Date.now() + 1,
      conversation_id: targetConvId,
      role: 'assistant',
      content: '',
      model: currentModel,
      created_at: new Date().toISOString(),
      isStreaming: true,
    };

    addMessage(targetConvId, tempAssistantMsg);

    const controller = new AbortController();
    setGenerating(true, controller);

    try {
      const response = await fetch(getApiUrl(`/conversations/${targetConvId}/messages/stream`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content, attachments, model: currentModel }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to stream response from server');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const rawEvent of events) {
          const trimmed = rawEvent.trim();
          if (!trimmed) continue;

          const dataLine = trimmed.split('\n').find((l) => l.startsWith('data: '));
          if (dataLine) {
            try {
              const jsonStr = dataLine.slice(6).trim();
              const data = JSON.parse(jsonStr);
              if (data.type === 'init' && data.model) {
                updateLastMessageModel(targetConvId, data.model);
              } else if (data.type === 'chunk') {
                updateLastMessageContent(targetConvId, data.text);
              } else if (data.type === 'error') {
                updateLastMessageContent(targetConvId, `\n\n⚠️ **Error:** ${data.message}`);
              }
            } catch (e) {
              console.error('SSE JSON parse error:', e, dataLine);
            }
          }
        }
      }

      if (buffer.trim().startsWith('data: ')) {
        try {
          const dataLine = buffer.trim().split('\n').find((l) => l.startsWith('data: '));
          if (dataLine) {
            const data = JSON.parse(dataLine.slice(6).trim());
            if (data.type === 'chunk') {
              updateLastMessageContent(targetConvId, data.text);
            }
          }
        } catch (e) {}
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        updateLastMessageContent(targetConvId, '\n\n⚠️ *Connection error. Please try again.*');
      }
    } finally {
      finishStreamingMessage(targetConvId);
      setGenerating(false, null);
      fetchConversations();
    }
  };

  const handleRegenerate = () => {
    const msgs = activeConversation?.messages || [];
    const lastUserMsg = [...msgs].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content);
    }
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden">
      <BackgroundWallpaper />

      <div className="relative z-10 flex w-full h-full">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenSettings={() => {
            setActiveView('settings');
            setIsSidebarOpen(false);
          }}
        />

        <div className="flex-1 flex flex-col min-w-0 h-full chat-panel">
          {activeView === 'settings' ? (
            <SettingsView onBack={() => setActiveView('chat')} />
          ) : (
            <>
              <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

              <MessageList
                messages={activeConversation?.messages || []}
                isGenerating={isGenerating}
                onRegenerate={handleRegenerate}
                onSendMessage={handleSendMessage}
                onNewChat={() => createConversation()}
                showTimestamps={settings.show_timestamps ?? true}
              />

              <MessageInput
                onSendMessage={handleSendMessage}
                isGenerating={isGenerating}
                onStopGeneration={stopGeneration}
              />
            </>
          )}
        </div>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <SessionTimeoutModal />
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProtectedWorkspace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
