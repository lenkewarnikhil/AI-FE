import React, { useState, useRef, useEffect } from 'react';
import {
  User as UserIcon, Palette, Shield, Upload, Trash2, Check, ArrowLeft, Sliders
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useToastStore } from '../../store/useToastStore';
import { api } from '../../services/api';

interface SettingsViewProps {
  onBack: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'account' | 'appearance' | 'security'>('account');
  const { user, updateUser } = useAuthStore();
  const { settings, updateSettings } = useSettingsStore();
  const addToast = useToastStore((state) => state.addToast);

  const [nameInput, setNameInput] = useState(user?.name || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for smooth slider dragging (0 = Solid, 100 = Fully Transparent)
  const [transparencyVal, setTransparencyVal] = useState<number>(settings.transparency_pct ?? 25);

  useEffect(() => {
    if (settings.transparency_pct !== undefined) {
      setTransparencyVal(settings.transparency_pct);
    }
  }, [settings.transparency_pct]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    try {
      const res = await api.patch('/users/me', { name: nameInput.trim() });
      updateUser(res.data);
      addToast('Profile name updated successfully', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.detail || 'Failed to update name', 'error');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploadingAvatar(true);
    try {
      const res = await api.post('/users/me/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(res.data);
      addToast('Profile photo updated', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.detail || 'Failed to upload photo', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const res = await api.delete('/users/me/profile-image');
      updateUser(res.data);
      addToast('Profile photo removed', 'info');
    } catch (err: any) {
      addToast('Failed to remove photo', 'error');
    }
  };

  const handleSliderChange = (val: number) => {
    setTransparencyVal(val);
    document.documentElement.style.setProperty('--transparency-pct', String(val));
    updateSettings({ transparency_pct: val });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f121a] text-slate-100 overflow-hidden">
      {/* Header Bar */}
      <div className="h-14 border-b border-white/10 px-6 flex items-center gap-3 shrink-0 bg-black/40 backdrop-blur-md">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Chat</span>
        </button>
        <h2 className="text-base font-semibold text-white">Settings</h2>
      </div>

      {/* Main Settings Canvas */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sub-Navigation (3 merged tabs) */}
          <div className="flex md:flex-col gap-1 border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:pr-6 md:w-56 shrink-0">
            {[
              { id: 'account', label: 'Account', icon: UserIcon },
              { id: 'appearance', label: 'Appearance & Preferences', icon: Palette },
              { id: 'security', label: 'Security', icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-white/10 text-white font-semibold border border-white/10 shadow-sm'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Panels */}
          <div className="flex-1 space-y-6">
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Profile Photo</h3>
                  <div className="flex items-center gap-4 mt-3">
                    <Avatar src={user?.profile_image_url} name={user?.name} email={user?.email} size="xl" />
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="glass"
                          isLoading={isUploadingAvatar}
                          onClick={() => fileInputRef.current?.click()}
                          icon={<Upload className="w-3.5 h-3.5" />}
                        >
                          Upload Photo
                        </Button>
                        {user?.profile_image_url && (
                          <Button size="sm" variant="danger" onClick={handleRemoveAvatar} icon={<Trash2 className="w-3.5 h-3.5" />}>
                            Remove
                          </Button>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">JPEG, PNG, WebP up to 5MB</span>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </div>
                  </div>
                </div>

                <form onSubmit={handleUpdateName} className="space-y-4 pt-6 border-t border-white/10">
                  <Input
                    label="Display Name"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Your Name"
                  />
                  <Input label="Email Address" value={user?.email || ''} disabled className="opacity-60 cursor-not-allowed" />
                  <Button type="submit" variant="primary" size="sm">
                    Save Changes
                  </Button>
                </form>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                {/* Accent Color Selection */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Button & UI Accent Color</h3>
                  <p className="text-xs text-slate-400 mb-4">Choose your preferred solid accent color for primary buttons and highlights.</p>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { id: 'blue', label: 'Indigo Blue', color: 'bg-blue-600' },
                      { id: 'emerald', label: 'Emerald Green', color: 'bg-emerald-600' },
                      { id: 'rose', label: 'Rose Pink', color: 'bg-rose-600' },
                      { id: 'amber', label: 'Warm Amber', color: 'bg-amber-600' },
                      { id: 'slate', label: 'Dark Slate', color: 'bg-slate-600' },
                    ].map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => updateSettings({ accent_color: acc.id as any })}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                          settings.accent_color === acc.id
                            ? 'border-white bg-white/15 text-white font-semibold'
                            : 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${acc.color}`} />
                        <span>{acc.label}</span>
                        {settings.accent_color === acc.id && <Check className="w-3.5 h-3.5 ml-1 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Glass Translucency Opacity Slider (0 = Solid, 100 = Fully Transparent) */}
                <div className="pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-blue-400" />
                      <span>Glass Translucency & Opacity</span>
                    </h3>
                    <span className="text-xs font-mono font-medium text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-xl border border-blue-500/20">
                      {transparencyVal}% Translucency
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    Set transparency level across workspace panels and bubbles (0% = Solid, 100% = Fully Transparent).
                  </p>

                  <div className="relative flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="90"
                      value={transparencyVal}
                      onChange={(e) => handleSliderChange(Number(e.target.value))}
                      className="custom-slider flex-1"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-medium">
                    <span>0% (Solid Matte)</span>
                    <span>90% (Fully Transparent Glass)</span>
                  </div>
                </div>

                {/* Merged Chat Preferences */}
                <div className="pt-6 border-t border-white/10 space-y-3">
                  <h3 className="text-sm font-semibold text-white mb-3">Chat Preferences</h3>
                  <label className="flex items-center justify-between text-xs text-slate-200 cursor-pointer p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <span>Send message with Enter key</span>
                    <input
                      type="checkbox"
                      checked={settings.enter_to_send ?? true}
                      onChange={(e) => updateSettings({ enter_to_send: e.target.checked })}
                      className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-slate-200 cursor-pointer p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <span>Show message timestamps</span>
                    <input
                      type="checkbox"
                      checked={settings.show_timestamps ?? true}
                      onChange={(e) => updateSettings({ show_timestamps: e.target.checked })}
                      className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Clear Conversation Data</h3>
                  <p className="text-xs text-slate-400 mb-4">Permanently remove all your conversation history from your workspace.</p>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowDeleteAllModal(true)}
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Delete Conversation History
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete All Confirmation Modal */}
      <Modal
        isOpen={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        title="Clear All History"
        maxWidth="sm"
        showCloseButton={false}
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Are you sure you want to delete all conversations? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="glass" onClick={() => setShowDeleteAllModal(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                setShowDeleteAllModal(false);
                addToast('All conversation history cleared', 'info');
              }}
            >
              Confirm Clear All
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
