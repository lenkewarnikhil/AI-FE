import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Zap, Sparkles, Image } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

export const CustomModelSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { settings, updateSettings } = useSettingsStore();

  const currentModel = settings.default_model || 'gemini-2.5-flash';

  const models = [
    {
      id: 'gemini-2.5-flash',
      label: 'Gemini 2.5 Flash',
      desc: 'Fastest • Multimodal (Images, Files)',
      icon: Zap,
      iconColor: 'text-amber-400',
    },
    {
      id: 'gemini-2.5-pro',
      label: 'Gemini 2.5 Pro',
      desc: 'Advanced Reasoning • Multimodal Docs',
      icon: Sparkles,
      iconColor: 'text-purple-400',
    },
    {
      id: 'gemini-1.5-pro',
      label: 'Gemini 1.5 Pro',
      desc: 'Complex Documents & Analysis',
      icon: Image,
      iconColor: 'text-indigo-400',
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedModel = models.find((m) => m.id === currentModel) || models[0];
  const IconComp = selectedModel.icon;

  return (
    <div ref={dropdownRef} className="relative inline-block text-left select-none">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
      >
        <IconComp className={`w-3.5 h-3.5 ${selectedModel.iconColor}`} />
        <span>{selectedModel.label}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 glass-card p-1.5 rounded-2xl shadow-2xl border border-white/15 z-50 animate-in fade-in slide-in-from-bottom-2 bg-[#161d2e]/95 backdrop-blur-2xl">
          {models.map((model) => {
            const isSelected = model.id === currentModel;
            const MIcon = model.icon;
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => {
                  updateSettings({ default_model: model.id });
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/20 text-white font-semibold border border-blue-500/30'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MIcon className={`w-4 h-4 shrink-0 ${model.iconColor}`} />
                  <div className="flex flex-col">
                    <span className="font-medium text-white">{model.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal mt-0.5">{model.desc}</span>
                  </div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
