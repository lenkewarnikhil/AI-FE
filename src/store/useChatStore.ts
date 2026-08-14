import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Conversation, Message } from '../types';
import { api } from '../services/api';

interface ChatStore {
  conversations: Conversation[];
  activeId: number | null;
  activeConversation: Conversation | null;
  searchQuery: string;
  isGenerating: boolean;
  abortController: AbortController | null;

  setSearchQuery: (query: string) => void;
  setActiveId: (id: number | null) => void;
  fetchConversations: () => Promise<void>;
  fetchConversationDetails: (id: number) => Promise<void>;
  createConversation: (title?: string) => Promise<number>;
  renameConversation: (id: number, title: string) => Promise<void>;
  deleteAllConversations: () => Promise<void>;
  deleteConversation: (id: number) => Promise<void>;
  deleteMessage: (messageId: number) => Promise<void>;
  addMessage: (conversationId: number, message: Message) => void;
  updateLastMessageContent: (conversationId: number, chunk: string) => void;
  updateLastMessageModel: (conversationId: number, model: string) => void;
  finishStreamingMessage: (conversationId: number) => void;
  setGenerating: (status: boolean, controller?: AbortController | null) => void;
  stopGeneration: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeId: null,
      activeConversation: null,
      searchQuery: '',
      isGenerating: false,
      abortController: null,

      setSearchQuery: (query) => set({ searchQuery: query }),
      setActiveId: (id) => {
        set({ activeId: id });
        if (id) {
          get().fetchConversationDetails(id);
        } else {
          set({ activeConversation: null });
        }
      },

      fetchConversations: async () => {
        try {
          const q = get().searchQuery;
          const res = await api.get<Conversation[]>('/conversations', {
            params: q ? { search: q } : {},
          });
          const fetchedConvs = res.data;
          set({ conversations: fetchedConvs });

          const curActive = get().activeId;
          // Do not fetch details for active conversation while generating response to avoid overwriting streaming state
          if (curActive && fetchedConvs.some((c) => c.id === curActive) && !get().isGenerating) {
            get().fetchConversationDetails(curActive);
          } else if (fetchedConvs.length > 0 && !curActive) {
            get().setActiveId(fetchedConvs[0].id);
          }
        } catch (e) {
          console.error('Failed to fetch conversations', e);
        }
      },

      fetchConversationDetails: async (id) => {
        // Skip background refetch for current conversation if generating
        if (get().isGenerating && get().activeId === id) return;

        try {
          const res = await api.get<Conversation>(`/conversations/${id}`);
          const conv = res.data;
          if (conv && conv.messages) {
            conv.messages = conv.messages.map((m: any) => {
              if (m.metadata_json) {
                try {
                  const meta = JSON.parse(m.metadata_json);
                  if (meta.model) m.model = meta.model;
                  if (meta.attachments) m.attachments = meta.attachments;
                } catch (err) {}
              }
              return m;
            });
          }
          set({ activeConversation: conv, activeId: id });
        } catch (e) {
          console.error('Failed to fetch conversation details', e);
        }
      },

      createConversation: async (title = 'New Conversation') => {
        const res = await api.post<Conversation>('/conversations', { title });
        const newConv = res.data;
        set((state) => ({
          conversations: [newConv, ...state.conversations],
          activeId: newConv.id,
          activeConversation: { ...newConv, messages: [] },
        }));
        return newConv.id;
      },

      renameConversation: async (id, title) => {
        const res = await api.patch<Conversation>(`/conversations/${id}`, { title });
        set((state) => ({
          conversations: state.conversations.map((c) => (c.id === id ? res.data : c)),
          activeConversation:
            state.activeConversation?.id === id
              ? { ...state.activeConversation, title: res.data.title }
              : state.activeConversation,
        }));
      },

      deleteAllConversations: async () => {
        await api.delete('/conversations');
        set({
          conversations: [],
          activeId: null,
          activeConversation: null,
        });
      },

      deleteConversation: async (id) => {
        await api.delete(`/conversations/${id}`);
        set((state) => {
          const remaining = state.conversations.filter((c) => c.id !== id);
          const nextActive = state.activeId === id ? (remaining[0]?.id ?? null) : state.activeId;
          return {
            conversations: remaining,
            activeId: nextActive,
            activeConversation: state.activeId === id ? null : state.activeConversation,
          };
        });
        if (get().activeId) {
          get().fetchConversationDetails(get().activeId!);
        }
      },

      deleteMessage: async (messageId) => {
        await api.delete(`/conversations/messages/${messageId}`);
        set((state) => {
          if (!state.activeConversation) return state;
          const updatedMsgs = state.activeConversation.messages.filter((m) => m.id !== messageId);
          return {
            activeConversation: {
              ...state.activeConversation,
              messages: updatedMsgs,
            },
          };
        });
      },

      addMessage: (conversationId, message) => {
        set((state) => {
          if (state.activeConversation?.id === conversationId) {
            const msgs = state.activeConversation.messages || [];
            let updatedTitle = state.activeConversation.title;

            // If first user message in a new chat, auto-update title immediately
            if (message.role === 'user' && (msgs.length === 0 || updatedTitle === 'New Conversation')) {
              const cleanText = (message.content || 'Attachment').trim().replace(/\n/g, ' ');
              updatedTitle = cleanText.slice(0, 40) + (cleanText.length > 40 ? '...' : '');
            }

            const updatedConvs = state.conversations.map((c) =>
              c.id === conversationId ? { ...c, title: updatedTitle } : c
            );

            return {
              conversations: updatedConvs,
              activeConversation: {
                ...state.activeConversation,
                title: updatedTitle,
                messages: [...msgs, message],
              },
            };
          }
          return state;
        });
      },

      updateLastMessageContent: (conversationId, chunk) => {
        set((state) => {
          if (state.activeConversation?.id === conversationId) {
            const msgs = [...(state.activeConversation.messages || [])];
            let targetIdx = -1;

            // Always target the assistant message
            for (let i = msgs.length - 1; i >= 0; i--) {
              if (msgs[i].role === 'assistant') {
                targetIdx = i;
                break;
              }
            }

            if (targetIdx !== -1) {
              const targetMsg = { ...msgs[targetIdx] };
              targetMsg.content += chunk;
              msgs[targetIdx] = targetMsg;
            } else {
              // If assistant message doesn't exist yet, append it cleanly
              msgs.push({
                id: Date.now(),
                conversation_id: conversationId,
                role: 'assistant',
                content: chunk,
                created_at: new Date().toISOString(),
                isStreaming: true,
              });
            }

            return {
              activeConversation: {
                ...state.activeConversation,
                messages: msgs,
              },
            };
          }
          return state;
        });
      },

      updateLastMessageModel: (conversationId, model) => {
        set((state) => {
          if (state.activeConversation?.id === conversationId) {
            const msgs = [...(state.activeConversation.messages || [])];
            let targetIdx = -1;
            for (let i = msgs.length - 1; i >= 0; i--) {
              if (msgs[i].role === 'assistant') {
                targetIdx = i;
                break;
              }
            }
            if (targetIdx !== -1) {
              const targetMsg = { ...msgs[targetIdx] };
              targetMsg.model = model;
              msgs[targetIdx] = targetMsg;
            }
            return {
              activeConversation: {
                ...state.activeConversation,
                messages: msgs,
              },
            };
          }
          return state;
        });
      },

      finishStreamingMessage: (conversationId) => {
        set((state) => {
          if (state.activeConversation?.id === conversationId) {
            const msgs = [...(state.activeConversation.messages || [])];
            if (msgs.length > 0) {
              const lastMsg = { ...msgs[msgs.length - 1], isStreaming: false };
              msgs[msgs.length - 1] = lastMsg;
            }
            return {
              activeConversation: {
                ...state.activeConversation,
                messages: msgs,
              },
            };
          }
          return state;
        });
      },

      setGenerating: (status, controller = null) =>
        set({ isGenerating: status, abortController: controller }),

      stopGeneration: () => {
        const controller = get().abortController;
        if (controller) {
          controller.abort();
        }
        set({ isGenerating: false, abortController: null });
      },
    }),
    {
      name: 'ai-chat-active-session',
      partialize: (state) => ({ activeId: state.activeId }),
    }
  )
);
