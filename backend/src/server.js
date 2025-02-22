const express = require('express');
const cors = require('cors'); // Import the cors package
const capsuleRoutes = require('./routes/capsuleRoutes');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');
const CapsuleUnlockJob = require('./jobs/capsuleUnlockJob');
const env = require('./config/env');

const app = express();

// Enable CORS for your frontend (e.g., http://localhost:5173 for Vite)
app.use(cors({
  origin: '*', // Adjust this to match your frontend URL (e.g., Vite dev server)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: true, // Allow cookies/sessions if needed
}));

app.use(express.json());
app.use('/api/capsules', capsuleRoutes);
app.use('/api/auth', authRoutes);

app.use(errorHandler);

// Start the unlock job
CapsuleUnlockJob.start();

const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
