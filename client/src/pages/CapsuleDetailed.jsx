import { useEffect, useState } from 'react';
import api from '../services/api';

function CapsuleDetail({ user }) {
  const [capsule, setCapsule] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const capsuleId = window.location.pathname.split('/').pop();

  useEffect(() => {
    fetchCapsule();
  }, [capsuleId]);

  const fetchCapsule = async () => {
    try {
      const response = await api.get(`/capsules/retrieve/${capsuleId}`);
      setCapsule(response.data);
      setCollaborators(response.data.collaborations || []);
    } catch (err) {
      console.error('Error fetching capsule:', err);
    }
  };

  const inviteCollaborator = async () => {
    try {
      const userResponse = await api.get(`/auth/users?email=${collaboratorEmail}`);
      const collaboratorId = userResponse.data.id;
      await api.post('/capsules/invite', { capsuleId, collaboratorIds: [collaboratorId] });
      setCollaboratorEmail('');
      fetchCapsule();
    }

    catch (err) {
      console.error('Error inviting collaborator:', err);
    }
  };

  if (!capsule) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">{capsule.title}</h2>
      <p>{capsule.description}</p>
      <h3 className="text-lg font-semibold mt-4">Content:</h3>
      <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(capsule.content, null, 2)}</pre>
      <h3 className="text-lg font-semibold mt-4">Collaborators:</h3>
      <ul className="list-disc pl-5">
        {collaborators.map((collab) => (
          <li key={collab.id}>{collab.user.email} ({collab.role})</li>
        ))}
      </ul>
      <div className="mt-4">
        <input
          type="email"
          value={collaboratorEmail}
          onChange={(e) => setCollaboratorEmail(e.target.value)}
          placeholder="Enter collaborator email"
          className="p-2 border border-gray-300 rounded mr-2"
        />
        <button
          onClick={inviteCollaborator}
          className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Invite Collaborator
        </button>
      </div>
      {capsule.isReady && (
        <button
          onClick={() => window.alert('Download or share logic here')}
          className="mt-4 bg-green-600 text-white p-2 rounded hover:bg-green-700"
        >
          Share or Download
        </button>
      )}
    </div>
  );
}

export default CapsuleDetail;
