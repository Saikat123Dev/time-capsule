import { useState, useEffect } from 'react';
import { Upload, Copy, File, Image, Video, X, Link, Loader, Download } from 'lucide-react';
import api from '../services/api';

const MediaUpload = () => {
  const [files, setFiles] = useState([]);
  const [sharedLink, setSharedLink] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [capsuleId, setCapsuleId] = useState(null);
  const [viewMode, setViewMode] = useState(false);

  // Check URL for capsule ID on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('capsule');
    if (id) {
      setCapsuleId(id);
      setViewMode(true);
      fetchCapsuleContent(id);
    }
  }, []);

  const fetchCapsuleContent = async (id) => {
    try {
      const response = await api.get(`/capsules/${id}`);
      setFiles(response.data.files);
    } catch (err) {
      setError('Failed to load capsule content');
    }
  };

  const handleFileUpload = (e) => {
    const newFiles = Array.from(e.target.files);
    if (files.length + newFiles.length > 20) {
      setError('Maximum 20 files per capsule');
      return;
    }
    setFiles(prev => [...prev, ...newFiles]);
    setError('');
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleShareCapsule = async () => {
    if (!capsuleId) {
      const newCapsuleId = Math.random().toString(36).substr(2, 9);
      setCapsuleId(newCapsuleId);
      setSharedLink(`${window.location.origin}/upload?capsule=${newCapsuleId}`);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sharedLink);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('capsuleId', capsuleId);
      files.forEach(file => formData.append('files', file));

      await api.post('/capsules/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setError('');
      if (!capsuleId) handleShareCapsule();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <Image size={20} />;
    if (type.startsWith('video/')) return <Video size={20} />;
    return <File size={20} />;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {viewMode ? 'Capsule Contents' : 'Media Capsule'}
          </h1>
          <p className="text-gray-600">
            {viewMode ? 
              'View and manage shared content' : 
              'Upload files and share with others'}
          </p>
        </div>

        {!viewMode && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
            {error && (
              <div className="mb-6 p-4 bg-red-50 rounded-xl flex items-center gap-3 text-red-700 border border-red-100">
                <X size={20} />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Upload Files (Max 20 files, 100MB each)
                </label>
                
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                  <label className="cursor-pointer">
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="text-gray-400 w-12 h-12 mb-4" />
                      <p className="text-gray-600 text-lg">
                        Drag & drop files or <span className="text-blue-600 hover:text-blue-700">browse</span>
                      </p>
                      <p className="text-sm text-gray-400">
                        Supports all file types • Max 100MB per file
                      </p>
                    </div>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="*"
                    />
                  </label>
                </div>

                {files.length > 0 && (
                  <div className="mt-6 space-y-3">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-150">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.type)}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                            <p className="text-xs text-gray-400">
                              {formatFileSize(file.size)} • {file.type}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                          aria-label="Remove file"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-medium
                           hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <Loader className="animate-spin w-5 h-5" />
                      Uploading...
                    </>
                  ) : (
                    'Upload Files'
                  )}
                </button>

                {sharedLink && (
                  <div className="flex-1 bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center gap-3">
                    <Link className="text-gray-400" size={20} />
                    <input
                      value={sharedLink}
                      readOnly
                      className="flex-1 bg-transparent text-sm truncate"
                    />
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        )}

        {(viewMode || files.length > 0) && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {viewMode ? 'Shared Content' : 'Uploaded Files'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {files.map((file, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-lg">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <a
                      href={URL.createObjectURL(file)}
                      download={file.name}
                      className="text-gray-400 hover:text-blue-600 transition-colors p-2"
                    >
                      <Download size={18} />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {viewMode && (
              <div className="mt-8 border-t border-gray-200 pt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add More Files</h3>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500
                           file:mr-4 file:py-2 file:px-4
                           file:rounded-full file:border-0
                           file:text-sm file:font-medium
                           file:bg-blue-50 file:text-blue-700
                           hover:file:bg-blue-100"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaUpload;