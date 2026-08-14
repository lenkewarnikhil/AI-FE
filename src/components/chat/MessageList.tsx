import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Compass, ChevronDown } from 'lucide-react';
import type { Message } from '../../types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: Message[];
  isGenerating?: boolean;
  onRegenerate?: () => void;
  onSendMessage?: (content: string) => void;
  onNewChat?: () => void;
  showTimestamps?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isGenerating = false,
  onRegenerate,
  onSendMessage,
  showTimestamps = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollDownBtn, setShowScrollDownBtn] = useState(false);
  const initialScrollDoneRef = useRef(false);

  // Handle scroll events to detect if user has scrolled up
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isScrolledUp = scrollHeight - (scrollTop + clientHeight) > 120;
    setShowScrollDownBtn(isScrolledUp);
  };

  // Scroll to bottom on initial load / refresh
  useEffect(() => {
    if (messages.length > 0 && !initialScrollDoneRef.current) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'auto' });
        initialScrollDoneRef.current = true;
      }, 50);
    }
  }, [messages]);

  // Handle streaming auto-scroll
  useEffect(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 140;

    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isGenerating]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const starterPrompts = [
    'Explain quantum computing in simple terms',
    'Write a Python FastAPI service for OAuth',
    'Help me debug a React state re-render issue',
    'Draft a polite email to request project feedback',
  ];

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-white tracking-tight mb-1">Nikhil's Personal AI</h2>
        <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">
          Select a prompt below or type your question to start chatting.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full mt-8">
          {starterPrompts.map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage && onSendMessage(promptText)}
              className="glass-card p-3.5 rounded-xl text-xs text-slate-300 hover:text-white hover:border-slate-400 transition-all text-left flex items-start gap-2.5 group cursor-pointer"
            >
              <Compass className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{promptText}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-4 space-y-1 scroll-smooth"
      >
        {messages.map((msg, index) => {
          const isLastAssistant =
            msg.role === 'assistant' && index === messages.length - 1;
          return (
            <MessageItem
              key={msg.id || index}
              message={msg}
              onRegenerate={isLastAssistant ? onRegenerate : undefined}
              showTimestamps={showTimestamps}
            />
          );
        })}

        {isGenerating && (
          <div className="flex items-center gap-2 px-6 py-2 text-xs text-blue-400">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Nikhil's Personal AI is generating response...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Floating Scroll to Bottom Down Arrow Button */}
      {showScrollDownBtn && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-4 right-6 p-2.5 rounded-full bg-[#161d2e]/90 hover:bg-[#1f293d] text-slate-200 hover:text-white border border-white/20 shadow-2xl transition-all duration-200 hover:scale-110 z-30 cursor-pointer backdrop-blur-xl"
          title="Scroll to bottom"
        >
          <ChevronDown className="w-4 h-4 text-blue-400" />
        </button>
      )}
    </div>
  );
};
