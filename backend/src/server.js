/**
 * Express server entry point
 */

import express from 'express';
import cors from 'cors';
import analyzeRouter from './routes/analyze.js';
import { checkPythonHealth } from './services/pythonClient.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', analyzeRouter);

// Health check
app.get('/api/health', async (req, res) => {
  const pythonHealth = await checkPythonHealth();
  res.json({
    status: 'healthy',
    service: 'fraud-detection-backend',
    pythonService: pythonHealth
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
