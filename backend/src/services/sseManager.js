/**
 * Server-Sent Events (SSE) manager for real-time progress streaming
 */

const connections = new Map(); // jobId -> Set of response objects

export function addConnection(jobId, res) {
  if (!connections.has(jobId)) {
    connections.set(jobId, new Set());
  }
  connections.get(jobId).add(res);
  
  // Setup SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  
  // Send initial connection event
  sendEvent(res, {
    type: 'connected',
    message: 'Connected to job stream',
    jobId
  });
  
  // Handle client disconnect
  res.on('close', () => {
    removeConnection(jobId, res);
  });
}

export function removeConnection(jobId, res) {
  const jobConnections = connections.get(jobId);
  if (jobConnections) {
    jobConnections.delete(res);
    if (jobConnections.size === 0) {
      connections.delete(jobId);
    }
  }
}

export function broadcastToJob(jobId, event) {
  const jobConnections = connections.get(jobId);
  if (jobConnections) {
    for (const res of jobConnections) {
      sendEvent(res, event);
    }
  }
}

function sendEvent(res, data) {
  try {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch (error) {
    console.error('Error sending SSE event:', error);
  }
}

export function getConnectionCount(jobId) {
  const jobConnections = connections.get(jobId);
  return jobConnections ? jobConnections.size : 0;
}
