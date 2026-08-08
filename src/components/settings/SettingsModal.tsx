import React, { useState, useRef } from 'react';
import {
  User as UserIcon, Palette, MessageSquare, Shield, Upload, Trash2, Check
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Avatar } from '../ui/Avatar';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useToastStore } from '../../store/useToastStore';
import { api } from '../../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'account' | 'appearance' | 'chat' | 'security'>('account');
  const { user, updateUser } = useAuthStore();
  const { settings, updateSettings } = useSettingsStore();
  const addToast = useToastStore((state) => state.addToast);

  const [nameInput, setNameInput] = useState(user?.name || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg" title="Settings">
      <div className="flex flex-col md:flex-row gap-6 min-h-[380px]">
        {/* Navigation Tabs */}
        <div className="flex md:flex-col gap-1 border-b md:border-b-0 md:border-r border-white/10 pb-3 md:pb-0 md:pr-4 md:w-44 shrink-0">
          {[
            { id: 'account', label: 'Account', icon: UserIcon },
            { id: 'appearance', label: 'Accent Color', icon: Palette },
            { id: 'chat', label: 'Preferences', icon: MessageSquare },
            { id: 'security', label: 'Security', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-white/10 text-white font-semibold border border-white/10'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto max-h-[460px] pr-1">
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Profile Photo</h4>
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

              <form onSubmit={handleUpdateName} className="space-y-4 pt-4 border-t border-white/10">
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
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Button & UI Accent Color</h4>
                <p className="text-xs text-slate-400 mb-4">Choose your preferred solid accent color for buttons and highlights.</p>
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
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
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
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="flex items-center justify-between text-xs text-slate-200 cursor-pointer">
                  <span>Send message with Enter key</span>
                  <input
                    type="checkbox"
                    checked={settings.enter_to_send ?? true}
                    onChange={(e) => updateSettings({ enter_to_send: e.target.checked })}
                    className="w-4 h-4 rounded accent-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-200 cursor-pointer">
                  <span>Show message timestamps</span>
                  <input
                    type="checkbox"
                    checked={settings.show_timestamps ?? true}
                    onChange={(e) => updateSettings({ show_timestamps: e.target.checked })}
                    className="w-4 h-4 rounded accent-blue-500"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Clear Conversation Data</h4>
                <p className="text-xs text-slate-400 mb-3">Permanently remove all your conversation history.</p>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete all conversations?')) {
                      addToast('Conversation history cleared', 'info');
                    }
                  }}
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Delete History
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
