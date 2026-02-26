import React, { useState } from 'react';
import { X, Upload, Loader } from 'lucide-react';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProfileFormData) => void;
}

interface ProfileFormData {
  name: string;
  bio: string;
  website: string;
  avatar: File | null;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    bio: '',
    website: '',
    avatar: null
  });
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (formData.name.length > 50) newErrors.name = 'Name must be less than 50 characters';
    if (formData.bio.length > 200) newErrors.bio = 'Bio must be less than 200 characters';
    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) newErrors.website = 'Invalid URL format';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, avatar: 'File size must be less than 5MB' });
        return;
      }
      setFormData({ ...formData, avatar: file });
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsUploading(true);
    setTimeout(() => {
      onSave(formData);
      setIsUploading(false);
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-surface rounded-2xl max-w-lg w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-subtext hover:text-white">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">Edit Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-subtext mb-2">Avatar</label>
            <div className="flex items-center gap-4">
              {avatarPreview && <img src={avatarPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover" />}
              <label className="flex items-center gap-2 px-4 py-2 bg-dark-bg hover:bg-primary-blue text-white rounded-lg cursor-pointer transition-colors">
                <Upload size={18} />
                <span>Upload Image</span>
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>
            {errors.avatar && <p className="text-red-500 text-sm mt-1">{errors.avatar}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-subtext mb-2">Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-dark-bg text-white px-4 py-2 rounded-lg border border-dark-border focus:border-primary-blue outline-none" />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-subtext mb-2">Bio</label>
            <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows={3} className="w-full bg-dark-bg text-white px-4 py-2 rounded-lg border border-dark-border focus:border-primary-blue outline-none resize-none" />
            {errors.bio && <p className="text-red-500 text-sm mt-1">{errors.bio}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-subtext mb-2">Website</label>
            <input type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className="w-full bg-dark-bg text-white px-4 py-2 rounded-lg border border-dark-border focus:border-primary-blue outline-none" />
            {errors.website && <p className="text-red-500 text-sm mt-1">{errors.website}</p>}
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-dark-bg hover:bg-gray-700 text-white rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={isUploading} className="flex-1 px-4 py-2 bg-primary-blue hover:bg-primary-teal text-white rounded-lg transition-colors flex items-center justify-center gap-2">
              {isUploading && <Loader size={18} className="animate-spin" />}
              <span>{isUploading ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
