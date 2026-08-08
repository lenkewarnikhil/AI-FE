import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const iconMap = {
          success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
          error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
          info: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
        };

        const bgMap = {
          success: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-emerald-950/50',
          error: 'bg-rose-950/90 border-rose-500/40 text-rose-100 shadow-rose-950/50',
          info: 'bg-[#182032]/95 border-blue-500/30 text-slate-100 shadow-black/60',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-2xl border text-xs shadow-2xl backdrop-blur-xl transition-all ${bgMap[toast.type]}`}
          >
            <div className="flex items-center gap-2.5">
              {iconMap[toast.type]}
              <span className="font-medium leading-normal">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:opacity-80 transition-opacity ml-2 shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
