import { useState } from 'react';
import api from '../services/api';

function CapsuleForm({ userId, onCapsuleCreated }) {
  const [title, setTitle] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/capsules/create', { userId, memoryId: null, unlockDate, title });
      setTitle('');
      setUnlockDate('');
      onCapsuleCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create capsule');
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow-md mb-6">
      <h3 className="text-lg font-semibold mb-4">Create New Capsule</h3>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Unlock Date</label>
          <input
            type="datetime-local"
            value={unlockDate}
            onChange={(e) => setUnlockDate(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Create Capsule
        </button>
      </form>
    </div>
  );
}

export default CapsuleForm;
