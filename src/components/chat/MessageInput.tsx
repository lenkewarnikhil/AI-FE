import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Square, Paperclip, X, FileText } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { CustomModelSelector } from './CustomModelSelector';

export interface FileAttachment {
  filename: string;
  mime_type: string;
  base64: string;
  previewUrl?: string;
  size?: number;
}

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: FileAttachment[]) => void;
  isGenerating?: boolean;
  onStopGeneration?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isGenerating = false,
  onStopGeneration,
}) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { settings } = useSettingsStore();

  const enterToSend = settings.enter_to_send ?? true;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [content]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Str = event.target?.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            filename: file.name,
            mime_type: file.type || 'application/octet-stream',
            base64: base64Str,
            previewUrl: file.type.startsWith('image/') ? base64Str : undefined,
            size: file.size,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!content.trim() && attachments.length === 0) || isGenerating) return;
    onSendMessage(content.trim(), attachments);
    setContent('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && enterToSend) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 p-3 md:p-4 pb-5 bg-gradient-to-t from-[#0f121a] via-[#0f121a]/95 to-transparent pointer-events-none z-20">
      <form
        onSubmit={handleSubmit}
        className="pointer-events-auto w-full max-w-3xl mx-auto flex flex-col gap-1.5 rounded-full focus-within:rounded-3xl border border-white/20 hover:border-white/35 focus-within:border-blue-500/60 bg-[#161d2c]/95 backdrop-blur-2xl p-1.5 transition-all duration-200 shadow-[0_20px_50px_rgba(0,0,0,0.7)]"
      >
        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pt-1.5 pb-1">
            {attachments.map((file, idx) => (
              <div
                key={idx}
                className="relative group flex items-center gap-2 p-1.5 pr-3 bg-white/10 border border-white/15 rounded-2xl text-xs text-slate-200 shadow-sm"
              >
                {file.previewUrl ? (
                  <img src={file.previewUrl} alt={file.filename} className="w-7 h-7 rounded-xl object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="flex flex-col max-w-[120px] truncate">
                  <span className="font-medium truncate text-[11px]">{file.filename}</span>
                  <span className="text-[9px] text-slate-400 font-mono">{file.mime_type.split('/')[1]}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="p-1 hover:bg-rose-500/20 hover:text-rose-300 rounded-full transition-colors cursor-pointer ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Floating Pill Controls Row */}
        <div className="flex items-center gap-2 px-1">
          {/* Model Selector Pill */}
          <div className="shrink-0">
            <CustomModelSelector />
          </div>

          {/* Textarea Input */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything or attach files/images..."
            rows={1}
            disabled={isGenerating}
            className="w-full bg-transparent px-2 py-1 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none border-none resize-none max-h-36 leading-relaxed"
          />

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.py,.js,.ts,.json,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Attachment Paperclip Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-8 h-8 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0 flex items-center justify-center"
            title="Attach Images & Files"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Send / Stop Button */}
          {isGenerating ? (
            <button
              type="button"
              onClick={onStopGeneration}
              className="w-9 h-9 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg flex items-center justify-center transition-all cursor-pointer shrink-0"
              title="Stop generating"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!content.trim() && attachments.length === 0}
              className="w-9 h-9 rounded-full btn-primary disabled:opacity-30 disabled:cursor-not-allowed shrink-0 flex items-center justify-center cursor-pointer shadow-lg transition-transform active:scale-95"
              title="Send message"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
