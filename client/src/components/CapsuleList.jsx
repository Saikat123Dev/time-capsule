function CapsuleList({ capsules, userId, onUpdate }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {capsules.map((capsule) => (
        <div key={capsule.id} className="bg-white p-4 rounded shadow-md">
          <h3 className="text-lg font-semibold">{capsule.title}</h3>
          <p>Unlock Date: {new Date(capsule.memory.unlockDate).toLocaleString()}</p>
          <p>Status: {capsule.isReady ? 'Ready' : 'Locked'}</p>
          <button
            onClick={() => window.location.href = `/capsule/${capsule.id}`}
            className="mt-2 bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            View Details
          </button>
        </div>
      ))}
    </div>
  );
}

export default CapsuleList;
