import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const activeConversation = useChatStore((state) => state.activeConversation);
  const logout = useAuthStore((state) => state.logout);

  return (
    <header className="h-14 bg-black/40 backdrop-blur-md border-b border-white/5 px-4 flex items-center justify-between shrink-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-sm font-medium text-white truncate max-w-xs md:max-w-md">
          {activeConversation?.title || "Nikhil's Personal AI"}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium transition-colors cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};
