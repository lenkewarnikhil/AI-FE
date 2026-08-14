import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, RotateCcw, Zap, Sparkles, FileText, Image, Cpu, Trash2 } from 'lucide-react';
import type { Message } from '../../types';
import { CodeBlock } from './CodeBlock';
import { Avatar } from '../ui/Avatar';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore } from '../../store/useChatStore';
import { getFileUrl } from '../../services/api';

interface MessageItemProps {
  message: Message & { attachments?: any[] };
  onRegenerate?: () => void;
  showTimestamps?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onRegenerate,
  showTimestamps = true,
}) => {
  const isUser = message.role === 'user';
  const user = useAuthStore((state) => state.user);
  const deleteMessage = useChatStore((state) => state.deleteMessage);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteMessage = async () => {
    if (!message.id) return;
    setIsDeleting(true);
    try {
      await deleteMessage(message.id);
    } catch (err) {
      console.error('Failed to delete message', err);
      setIsDeleting(false);
    }
  };

  const formattedTime = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const getModelInfo = (modelId?: string) => {
    switch (modelId) {
      case 'gemini-3.6-flash':
        return { label: 'Gemini 3.6 Flash', badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/20', avatarClass: 'bg-amber-600/15 border-amber-500/30 text-amber-400', Icon: Zap };
      case 'gemini-3.5-flash':
        return { label: 'Gemini 3.5 Flash', badgeClass: 'bg-purple-500/10 text-purple-300 border-purple-500/20', avatarClass: 'bg-purple-600/15 border-purple-500/30 text-purple-400', Icon: Sparkles };
      case 'gemini-3.5-flash-lite':
        return { label: 'Gemini 3.5 Flash-Lite', badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20', avatarClass: 'bg-emerald-600/15 border-emerald-500/30 text-emerald-400', Icon: Zap };
      case 'gemini-3.1-flash-lite':
        return { label: 'Gemini 3.1 Flash-Lite', badgeClass: 'bg-sky-500/10 text-sky-300 border-sky-500/20', avatarClass: 'bg-sky-600/15 border-sky-500/30 text-sky-400', Icon: Zap };
      case 'gemini-3.1-pro':
        return { label: 'Gemini 3.1 Pro (Preview)', badgeClass: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20', avatarClass: 'bg-indigo-600/15 border-indigo-500/30 text-indigo-400', Icon: Sparkles };
      case 'gemini-3-flash':
        return { label: 'Gemini 3 Flash (Preview)', badgeClass: 'bg-blue-500/10 text-blue-300 border-blue-500/20', avatarClass: 'bg-blue-600/15 border-blue-500/30 text-blue-400', Icon: Zap };
      case 'gemini-2.5-pro':
        return { label: 'Gemini 2.5 Pro', badgeClass: 'bg-purple-500/10 text-purple-300 border-purple-500/20', avatarClass: 'bg-purple-600/15 border-purple-500/30 text-purple-400', Icon: Sparkles };
      case 'gemini-2.5-flash':
        return { label: 'Gemini 2.5 Flash', badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/20', avatarClass: 'bg-amber-600/15 border-amber-500/30 text-amber-400', Icon: Zap };
      case 'gemini-2.5-flash-lite':
        return { label: 'Gemini 2.5 Flash-Lite', badgeClass: 'bg-sky-500/10 text-sky-300 border-sky-500/20', avatarClass: 'bg-sky-600/15 border-sky-500/30 text-sky-400', Icon: Zap };
      default:
        // Dynamic fallback for any unhandled model string
        const cleanName = modelId ? modelId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'Gemini 3.6 Flash';
        const isPro = modelId?.includes('pro');
        return {
          label: cleanName,
          badgeClass: isPro ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' : 'bg-amber-500/10 text-amber-300 border-amber-500/20',
          avatarClass: isPro ? 'bg-purple-600/15 border-purple-500/30 text-purple-400' : 'bg-amber-600/15 border-amber-500/30 text-amber-400',
          Icon: isPro ? Sparkles : Zap,
        };
    }
  };

  const modelInfo = getModelInfo(message.model);
  const ModelIcon = modelInfo.Icon;

  return (
    <div className={`flex gap-3 px-4 py-3 md:px-6 transition-colors ${isUser ? 'flex-row-reverse' : 'flex-row'} ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}>
      {/* Avatar */}
      {isUser ? (
        <Avatar src={user?.profile_image_url} name={user?.name} email={user?.email} size="sm" />
      ) : (
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${modelInfo.avatarClass}`}
          title={modelInfo.label}
        >
          <ModelIcon className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Bubble Container */}
      <div className={`group relative max-w-[85%] md:max-w-[70%] flex flex-col min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`glass-bubble px-4 py-3 rounded-2xl text-sm leading-relaxed border transition-all w-fit max-w-full ${
            isUser
              ? 'bg-[var(--user-bubble-bg)] text-[var(--user-bubble-text)] border-white/20 rounded-tr-xs'
              : 'bg-[#1e293b]/70 text-slate-100 border-white/10 rounded-tl-xs'
          }`}
        >
          {/* Attachments rendering */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {message.attachments.map((att: any, idx: number) => (
                <div key={idx} className="rounded-xl overflow-hidden border border-white/20 bg-black/20 p-1">
                  {att.previewUrl || (att.base64 && att.mime_type?.startsWith('image/')) ? (
                    <img
                      src={getFileUrl(att.previewUrl || att.url || att.base64)}
                      alt={att.filename || 'Attachment'}
                      className="max-h-48 max-w-xs rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 text-xs text-white">
                      <FileText className="w-4 h-4 text-blue-300" />
                      <span className="truncate max-w-[140px] font-medium">{att.filename || 'Document'}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {isUser ? (
            <div className="whitespace-pre-wrap break-words overflow-wrap-anywhere max-w-full text-sm leading-relaxed">
              {message.content}
            </div>
          ) : (
            <div className="markdown-body prose prose-invert max-w-none text-slate-100 text-sm leading-relaxed break-words overflow-wrap-anywhere">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeText = String(children).replace(/\n$/, '');
                    if (!inline && match) {
                      return <CodeBlock language={match[1]} value={codeText} />;
                    }
                    if (!inline && codeText.includes('\n')) {
                      return <CodeBlock language="code" value={codeText} />;
                    }
                    return (
                      <code className="bg-[#0f172a]/80 px-1.5 py-0.5 rounded text-xs font-mono text-blue-300 border border-white/10" {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content ? (message.isStreaming ? `${message.content} ▍` : message.content) : '...'}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Message Actions, Model Badge & Timestamp */}
        <div className={`flex items-center gap-2 mt-1 text-[11px] text-slate-400 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {showTimestamps && <span>{formattedTime}</span>}

          {!isUser && (
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${modelInfo.badgeClass}`}>
              <ModelIcon className="w-2.5 h-2.5" />
              <span>{modelInfo.label}</span>
            </span>
          )}

          {/* Action Toolbar */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopyMessage}
              title="Copy message text"
              className="p-1 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {!isUser && onRegenerate && (
              <button
                onClick={onRegenerate}
                title="Regenerate response"
                className="p-1 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={handleDeleteMessage}
              title="Delete message"
              className="p-1 hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
