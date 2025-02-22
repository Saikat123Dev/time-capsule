const express = require('express');
const cors = require('cors');
const multer = require('multer');
const capsuleRoutes = require('./routes/capsuleRoutes');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');
const CapsuleUnlockJob = require('./jobs/capsuleUnlockJob');
const env = require('./config/env');
const captionRoutes = require('./routes/captionRoutes');
const app = express();

// Enable CORS
app.use(cors({
  origin: '*', // Adjust this to match your frontend URL (e.g., Vite dev server)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: true, // Allow cookies/sessions if needed
}));

app.use(express.json());
app.use('/api/capsules', capsuleRoutes);
app.use('/api/auth', authRoutes);

// Apply multer middleware for file uploads in capsule routes
app.use('/api/capsules', upload.array('files')); // Handles multiple files under the 'files' field
app.use('/api/captions', upload.single('audioFile'), captionRoutes); // New: Add multer for audio file upload
app.use(errorHandler);

// Start the unlock job
CapsuleUnlockJob.start();

const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
