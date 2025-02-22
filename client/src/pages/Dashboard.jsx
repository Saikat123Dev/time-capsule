import { useEffect, useState } from 'react';
import CapsuleForm from '../components/CapsuleForm';
import CapsuleList from '../components/CapsuleList';
import Notification from '../components/Notification';
import api from '../services/api';

function Dashboard({ user }) {
  const [capsules, setCapsules] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchCapsules();
    fetchNotifications();
  }, []);

  const fetchCapsules = async () => {
    try {
      const response = await api.get('/capsules');
      setCapsules(response.data);
    } catch (err) {
      console.error('Error fetching capsules:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Welcome, {user.name}</h2>
      <CapsuleForm userId={user.id} onCapsuleCreated={fetchCapsules} />
      <CapsuleList capsules={capsules} userId={user.id} onUpdate={fetchCapsules} />
      <Notification notifications={notifications} onClear={fetchNotifications} />
    </div>
  );
}

export default Dashboard;
