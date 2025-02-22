function Notification({ notifications, onClear }) {
  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}`, { isRead: true });
      onClear();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Notifications</h3>
      {notifications.filter(n => !n.isRead).length === 0 ? (
        <p>No new notifications</p>
      ) : (
        <ul className="list-disc pl-5">
          {notifications.filter(n => !n.isRead).map((notification) => (
            <li key={notification.id} className="mb-2">
              {notification.content.message}
              <button
                onClick={() => markAsRead(notification.id)}
                className="ml-2 bg-green-600 text-white p-1 rounded hover:bg-green-700"
              >
                Mark as Read
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Notification;
