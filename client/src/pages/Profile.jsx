import React, { useState, useRef } from 'react';
import { User, Building, UtensilsCrossed, Camera, Save, Shield } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../utils/api';

export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    restaurantName: user?.restaurantName || '',
    cuisineType: user?.cuisineType || '',
    role: user?.role || 'LINE_COOK',
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isUploading, setIsUploading] = useState(false);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/users/profile/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser(res.data);
      setMessage({ type: 'success', text: 'Profile image updated!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to upload image.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.put('/users/profile', formData);
      updateUser(res.data);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Profile Settings</h2>
        <p className="text-gray-500">Manage your account and restaurant details.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div 
              onClick={handleImageClick}
              className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center cursor-pointer relative"
            >
              {user?.profileImage ? (
                <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-gray-400" />
              )}
              
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white mb-1" />
                <span className="text-white text-xs font-medium">Change</span>
              </div>
              
              {isUploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
          
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold text-gray-900">{user?.name || 'Chef'}</h3>
            <p className="text-gray-500">{user?.email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm font-medium">
              <Shield className="w-4 h-4" />
              {user?.role?.replace('_', ' ')}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="pl-10 w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="pl-10 w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                >
                  <option value="EXECUTIVE_CHEF">Executive Chef</option>
                  <option value="SOUS_CHEF">Sous Chef</option>
                  <option value="LINE_COOK">Line Cook</option>
                </select>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. The Rustic Spoon"
                  value={formData.restaurantName}
                  onChange={(e) => setFormData({...formData, restaurantName: e.target.value})}
                  className="pl-10 w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine Type</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UtensilsCrossed className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Italian, Modern Asian"
                  value={formData.cuisineType}
                  onChange={(e) => setFormData({...formData, cuisineType: e.target.value})}
                  className="pl-10 w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={isSaving}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
