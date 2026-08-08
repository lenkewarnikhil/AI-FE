import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  value: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language = 'code', value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-white/15 bg-slate-950/90 shadow-xl font-mono text-xs text-slate-100">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-white/10 text-slate-400 select-none">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-sans hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-4 overflow-x-auto leading-relaxed">
        <pre className="m-0 bg-transparent text-slate-200">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
};
