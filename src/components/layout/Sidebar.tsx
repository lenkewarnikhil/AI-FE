import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, Search, Trash2, Edit2, Check, X,
  Settings as SettingsIcon, User as UserIcon, MessageSquareText,
  ShieldCheck, FileText
} from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
  onOpenSettings,
}) => {
  const {
    conversations,
    activeId,
    searchQuery,
    setSearchQuery,
    setActiveId,
    createConversation,
    renameConversation,
    deleteConversation,
  } = useChatStore();

  const { user, isAuthenticated } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  const handleStartRename = (id: number, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveRename = async (id: number) => {
    if (editTitle.trim()) {
      await renameConversation(id, editTitle.trim());
      addToast('Conversation renamed', 'success');
    }
    setEditingId(null);
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId) {
      await deleteConversation(deleteTargetId);
      addToast('Conversation deleted', 'info');
      setDeleteTargetId(null);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 sidebar-panel flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-3 border-b border-white/5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white tracking-tight">Nikhil's Personal AI</span>
            </div>
            <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Same Line: Accent New Chat Button + Round Search Button */}
          <div className="flex items-center gap-2 h-10">
            {isSearchExpanded ? (
              <>
                <button
                  onClick={() => {
                    createConversation();
                    onClose();
                  }}
                  className="w-10 h-10 rounded-full btn-primary flex items-center justify-center shrink-0 shadow-md cursor-pointer"
                  title="New Chat"
                >
                  <Plus className="w-4 h-4 text-white" />
                </button>

                <div className="relative flex-1 flex items-center">
                  <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search history..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full glass-input pl-8 pr-8 py-2 rounded-2xl text-xs"
                  />
                  <button
                    onClick={() => {
                      setIsSearchExpanded(false);
                      setSearchQuery('');
                    }}
                    className="absolute right-2.5 p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    createConversation();
                    onClose();
                  }}
                  className="flex-1 btn-primary py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-medium cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>New Chat</span>
                </button>

                <button
                  onClick={() => setIsSearchExpanded(true)}
                  className="w-10 h-10 rounded-full btn-glass flex items-center justify-center text-slate-200 hover:text-white cursor-pointer shrink-0"
                  title="Search Conversations"
                >
                  <Search className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Recent Chats List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Conversations
          </div>

          {filteredConversations.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-slate-500">
              No chat history.
            </div>
          ) : (
            filteredConversations.map((chat) => {
              const isActive = chat.id === activeId;
              const isEditing = chat.id === editingId;

              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    setActiveId(chat.id);
                    onClose();
                  }}
                  className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-white/15 text-white font-medium border border-white/15 shadow-sm'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <MessageSquareText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(chat.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="bg-[#0f172a] px-1.5 py-0.5 rounded border border-blue-500 text-xs text-white outline-none"
                        autoFocus
                      />
                    ) : (
                      <span className="truncate">{chat.title}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditing ? (
                      <button onClick={(e) => { e.stopPropagation(); handleSaveRename(chat.id); }} className="p-1 hover:text-emerald-400">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <>
                        <button onClick={(e) => handleStartRename(chat.id, chat.title, e)} className="p-1 hover:text-blue-300">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTargetId(chat.id);
                          }}
                          className="p-1 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* User Profile Footer */}
        <div ref={profileRef} className="p-2.5 border-t border-white/5 relative">
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Avatar src={user.profile_image_url} name={user.name} email={user.email} size="sm" />
                  <div className="flex flex-col text-left truncate">
                    <span className="text-xs font-medium text-white truncate">{user.name || 'User'}</span>
                    <span className="text-[10px] text-slate-500 truncate">{user.email}</span>
                  </div>
                </div>
                {/* Green Shield Check Icon */}
                <ShieldCheck className="w-4 h-4 text-emerald-400 hover:text-emerald-300 shrink-0 ml-1" />
              </button>

              {showProfileMenu && (
                <div className="absolute bottom-full left-0 w-full mb-2 glass-card p-1.5 rounded-2xl shadow-2xl flex flex-col gap-1 z-50 bg-[#161d2e]/95 backdrop-blur-2xl border border-white/15">
                  <button
                    onClick={() => {
                      onOpenSettings();
                      setShowProfileMenu(false);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-200 hover:bg-white/10 rounded-xl transition-colors cursor-pointer w-full text-left"
                  >
                    <SettingsIcon className="w-4 h-4 text-blue-400" />
                    <span>Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowTermsModal(true);
                      setShowProfileMenu(false);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-200 hover:bg-white/10 rounded-xl transition-colors cursor-pointer w-full text-left"
                  >
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Terms & Conditions (T&C)</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="w-full btn-glass py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-medium cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </aside>

      {/* Terms & Conditions Modal */}
      <Modal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms & Conditions (T&C)"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
          <p className="font-semibold text-white">Welcome to Nikhil's Personal AI Workspace</p>
          
          <h4 className="font-bold text-slate-100 text-xs">1. Acceptable Use</h4>
          <p>You agree to use Nikhil's Personal AI solely for lawful personal and productivity purposes. You may not upload malicious code or attempt unauthorized system access.</p>
          
          <h4 className="font-bold text-slate-100 text-xs">2. Privacy & Data Handling</h4>
          <p>Your session tokens are securely encrypted and valid for 6 hours. Uploaded images and documents are processed via Google Gemini Multimodal APIs for generating chat responses.</p>
          
          <h4 className="font-bold text-slate-100 text-xs">3. Single Sign-On (SSO)</h4>
          <p>When authenticating via Google Single Sign-On (SSO), Google sends a standard notification confirming access permissions for your primary profile email. No unauthorized personal data is stored.</p>
          
          <h4 className="font-bold text-slate-100 text-xs">4. Service Availability</h4>
          <p>AI generation model rates and streaming responses depend on backend service availability and model configuration.</p>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        title="Delete Conversation"
        maxWidth="sm"
        showCloseButton={false}
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Are you sure you want to delete this conversation? All message history will be permanently removed.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="glass" onClick={() => setDeleteTargetId(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="danger" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
