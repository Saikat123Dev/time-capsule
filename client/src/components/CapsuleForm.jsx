import { useState } from 'react';
import { Upload, X, Image, Loader } from 'lucide-react';
import api from '../services/api';

function CapsuleForm({ userId, onCapsuleCreated }) {
  const [title, setTitle] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setCoverImage(file);
      setError('');
    }
  };

  const removeImage = () => {
    setCoverImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (!coverImage) {
        setError('Please select a cover image');
        return;
      }

      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('title', title);
      formData.append('unlockDate', unlockDate);
      formData.append('coverImage', coverImage);

      const response = await api.post('/capsules/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setTitle('');
      setUnlockDate('');
      setCoverImage(null);
      onCapsuleCreated();
      
      // Redirect to media upload page with new capsule ID
      window.location.href = `/mediaUpload?capsule=${response.data.id}`;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create capsule');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 transition-all duration-300 hover:shadow-2xl max-w-2xl mx-auto">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Create Memory Capsule
      </h3>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 rounded-xl flex items-center gap-3 text-red-700 border border-red-100">
          <X size={20} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Capsule Title</label>
          <div className="relative group">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full pl-4 pr-4 py-3.5 text-gray-700 border border-gray-200 rounded-xl 
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400
                       transition-all duration-200 hover:border-gray-300"
              placeholder="Enter capsule title"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Unlock Date</label>
          <div className="relative group">
            <input
              type="datetime-local"
              value={unlockDate}
              onChange={(e) => setUnlockDate(e.target.value)}
              className="w-full pl-4 pr-4 py-3.5 text-gray-700 border border-gray-200 rounded-xl 
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400
                       transition-all duration-200 hover:border-gray-300"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
            <label className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <Upload className="text-gray-400 w-8 h-8 mb-2" />
                <p className="text-gray-600">Click to upload a cover image</p>
                <p className="text-sm text-gray-400">Supports JPG, PNG (max 5MB)</p>
              </div>
              <input
                type="file"
                onChange={handleImageUpload}
                className="hidden"
                accept="image/*"
              />
            </label>
          </div>

          {coverImage && (
            <div className="mt-4 relative group">
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <img 
                  src={URL.createObjectURL(coverImage)} 
                  alt="Cover preview" 
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                  <button
                    type="button"
                    onClick={removeImage}
                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-red-500 rounded-full hover:bg-red-600"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2 truncate">{coverImage.name}</p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-medium
                   hover:from-blue-700 hover:to-purple-700 transform transition-all duration-300 flex items-center 
                   justify-center gap-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <Loader className="animate-spin w-5 h-5" />
              Creating Capsule...
            </>
          ) : (
            'Create Time Capsule'
          )}
        </button>
      </form>
    </div>
  );
}

export default CapsuleForm;