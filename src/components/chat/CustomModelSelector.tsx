import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Zap, Sparkles, Image, Cpu } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { api } from '../../services/api';

export interface ModelOption {
  id: string;
  label: string;
  desc: string;
  tag?: string;
  icon?: string;
  iconColor?: string;
}

const FALLBACK_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.6-flash',
    label: 'Gemini 3.6 Flash',
    desc: 'Coding, agents, reasoning, multimodal',
    tag: '⭐ Best general choice',
    iconColor: 'text-amber-400',
  },
  {
    id: 'gemini-3.5-flash',
    label: 'Gemini 3.5 Flash',
    desc: 'Agentic tasks, coding, reasoning',
    tag: '⭐ Excellent',
    iconColor: 'text-purple-400',
  },
  {
    id: 'gemini-3.5-flash-lite',
    label: 'Gemini 3.5 Flash-Lite',
    desc: 'High-volume, cheaper tasks, sub-agents',
    tag: '⚡ Best budget/throughput',
    iconColor: 'text-emerald-400',
  },
  {
    id: 'gemini-3.1-flash-lite',
    label: 'Gemini 3.1 Flash-Lite',
    desc: 'Lightweight/high-frequency tasks',
    tag: '💰 Very cheap',
    iconColor: 'text-sky-400',
  },
  {
    id: 'gemini-3.1-pro',
    label: 'Gemini 3.1 Pro (Preview)',
    desc: 'Complex reasoning, coding, agents',
    tag: '🧠 Maximum intelligence',
    iconColor: 'text-indigo-400',
  },
  {
    id: 'gemini-3-flash',
    label: 'Gemini 3 Flash (Preview)',
    desc: 'Frontier performance at lower cost',
    tag: '🚀 Strong',
    iconColor: 'text-blue-400',
  },
  {
    id: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    desc: 'Complex reasoning, coding, huge codebases',
    tag: '🧠 Excellent',
    iconColor: 'text-purple-500',
  },
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    desc: 'Reasoning + speed',
    tag: '⚖️ Great price/performance',
    iconColor: 'text-amber-500',
  },
  {
    id: 'gemini-2.5-flash-lite',
    label: 'Gemini 2.5 Flash-Lite',
    desc: 'Fast, inexpensive workloads',
    tag: '💰 Cheapest 2.5 option',
    iconColor: 'text-sky-500',
  },
];

export const CustomModelSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [modelList, setModelList] = useState<ModelOption[]>(FALLBACK_MODELS);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { settings, updateSettings } = useSettingsStore();

  const currentModel = settings.default_model || 'gemini-3.6-flash';

  useEffect(() => {
    let isMounted = true;
    api
      .get<ModelOption[]>('/settings/models')
      .then((res) => {
        if (isMounted && res.data && res.data.length > 0) {
          setModelList(res.data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

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

  const getIconComponent = (m: ModelOption) => {
    if (m.icon === 'Sparkles' || m.id.includes('pro')) return Sparkles;
    if (m.icon === 'Cpu' || m.id.includes('lite')) return Cpu;
    if (m.icon === 'Image' || m.id.includes('1.5')) return Image;
    return Zap;
  };

  const selectedModel = modelList.find((m) => m.id === currentModel) || modelList[0];
  const SelectedIcon = getIconComponent(selectedModel);

  return (
    <div ref={dropdownRef} className="relative inline-block text-left select-none">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-200 transition-colors cursor-pointer border border-white/10"
      >
        <SelectedIcon className={`w-3.5 h-3.5 ${selectedModel.iconColor || 'text-amber-400'}`} />
        <span>{selectedModel.label}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-72 glass-card p-1.5 rounded-2xl shadow-2xl border border-white/15 z-50 animate-in fade-in slide-in-from-bottom-2 bg-[#161d2e]/95 backdrop-blur-2xl max-h-80 overflow-y-auto">
          {modelList.map((model) => {
            const isSelected = model.id === currentModel;
            const MIcon = getIconComponent(model);
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => {
                  updateSettings({ default_model: model.id });
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer mb-1 last:mb-0 ${
                  isSelected
                    ? 'bg-blue-600/20 text-white font-semibold border border-blue-500/30'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <MIcon className={`w-4 h-4 shrink-0 mt-0.5 ${model.iconColor || 'text-slate-400'}`} />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-white">{model.label}</span>
                      {model.tag && (
                        <span className="text-[9px] font-semibold font-mono px-1.5 py-0.2 rounded bg-white/10 text-slate-300 border border-white/10">
                          {model.tag}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal mt-0.5 leading-tight">{model.desc}</span>
                  </div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 ml-2 mt-0.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
