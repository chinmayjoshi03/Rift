/**
 * API routes for fraud detection analysis
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { upload, cleanupFile } from '../services/fileHandler.js';
import { callPythonDetection } from '../services/pythonClient.js';
import {
  createJob,
  getJob,
  setJobResult,
  setJobError,
  addJobEvent,
  JobStatus
} from '../services/jobStore.js';
import { addConnection, broadcastToJob } from '../services/sseManager.js';

const router = express.Router();

/**
 * POST /api/analyze
 * Upload CSV and start analysis
 */
router.post('/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Create job
    const jobId = uuidv4();
    createJob(jobId);
    
    // Respond immediately with jobId
    res.json({ jobId });
    
    // Process asynchronously
    processAnalysis(jobId, req.file.path);
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/stream/:jobId
 * SSE stream for job progress
 */
router.get('/stream/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = getJob(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  // Add SSE connection
  addConnection(jobId, res);
  
  // Replay buffered events
  const events = job.events || [];
  for (const event of events) {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }
  
  // If job is already completed, send final event
  if (job.status === JobStatus.COMPLETED) {
    res.write(`data: ${JSON.stringify({
      type: 'DONE',
      stage: 'complete',
      message: 'Analysis complete',
      progress: 100
    })}\n\n`);
  } else if (job.status === JobStatus.FAILED) {
    res.write(`data: ${JSON.stringify({
      type: 'ERROR',
      stage: 'failed',
      message: job.error || 'Analysis failed',
      progress: 0
    })}\n\n`);
  }
});

/**
 * GET /api/results/:jobId
 * Get analysis results
 */
router.get('/results/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = getJob(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  if (job.status === JobStatus.COMPLETED) {
    return res.json(job.result);
  } else if (job.status === JobStatus.FAILED) {
    return res.status(500).json({ error: job.error || 'Analysis failed' });
  } else {
    return res.status(202).json({
      status: job.status,
      progress: job.progress,
      message: 'Analysis in progress'
    });
  }
});

/**
 * Async processing function
 */
async function processAnalysis(jobId, filePath) {
  try {
    // PARSING
    broadcastEvent(jobId, 'PARSING', 'Parsing CSV file', 10);
    await sleep(500);
    
    // GRAPH_BUILT
    broadcastEvent(jobId, 'GRAPH_BUILT', 'Building transaction graph', 25);
    
    // Call Python service
    const result = await callPythonDetection(filePath);
    
    // Simulate progress events (in production, Python would send these)
    broadcastEvent(jobId, 'CYCLES_DONE', 'Cycle detection complete', 50);
    await sleep(200);
    
    broadcastEvent(jobId, 'SMURFING_DONE', 'Smurfing detection complete', 65);
    await sleep(200);
    
    broadcastEvent(jobId, 'SHELLS_DONE', 'Shell account detection complete', 80);
    await sleep(200);
    
    broadcastEvent(jobId, 'SCORING_DONE', 'Scoring complete', 95);
    await sleep(200);
    
    // Store result
    setJobResult(jobId, result);
    
    // DONE
    broadcastEvent(jobId, 'DONE', 'Analysis complete', 100);
    
    // Cleanup
    cleanupFile(filePath);
    
  } catch (error) {
    console.error('Analysis error:', error);
    setJobError(jobId, error.message);
    broadcastEvent(jobId, 'ERROR', error.message, 0);
    cleanupFile(filePath);
  }
}

function broadcastEvent(jobId, type, message, progress) {
  const event = { type, stage: type.toLowerCase(), message, progress };
  addJobEvent(jobId, event);
  broadcastToJob(jobId, event);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default router;
