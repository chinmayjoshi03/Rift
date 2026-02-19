/**
 * API Service for communicating with the fraud detection backend
 * Handles file uploads, progress streaming, and result fetching
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * Upload CSV file and start analysis
 * @param {File} file - The CSV file to upload
 * @param {Object} options - Detection options { preset, min_score, enable_validation }
 * @returns {Promise<{jobId: string}>} Job ID for tracking
 */
export async function uploadAndAnalyze(file, options = {}) {
  const formData = new FormData();
  formData.append('file', file);
  
  // Add detection options to form data
  if (options.preset) {
    formData.append('preset', options.preset);
  }
  if (options.min_score !== undefined) {
    formData.append('min_score', options.min_score.toString());
  }
  if (options.enable_validation !== undefined) {
    formData.append('enable_validation', options.enable_validation.toString());
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

/**
 * Setup Server-Sent Events (SSE) stream for job progress
 * @param {string} jobId - The job ID to stream
 * @param {Function} onProgress - Callback for progress updates
 * @param {Function} onError - Callback for errors
 * @returns {Function} Cleanup function to close the stream
 */
export function subscribeToStream(jobId, onProgress, onError) {
  const eventSource = new EventSource(`${API_BASE_URL}/api/stream/${jobId}`);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onProgress(data);

      // Close stream when complete or failed
      if (data.type === 'DONE' || data.type === 'ERROR') {
        eventSource.close();
      }
    } catch (error) {
      console.error('Error parsing stream data:', error);
      if (onError) onError(error);
    }
  };

  eventSource.onerror = (error) => {
    console.error('Stream error:', error);
    eventSource.close();
    if (onError) onError(error);
  };

  // Return cleanup function
  return () => {
    eventSource.close();
  };
}

/**
 * Get analysis results for a completed job
 * @param {string} jobId - The job ID to fetch results for
 * @returns {Promise<Object>} Analysis results
 */
export async function getResults(jobId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/results/${jobId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch results');
    }

    return await response.json();
  } catch (error) {
    console.error('Results fetch error:', error);
    throw error;
  }
}

/**
 * Check backend health status
 * @returns {Promise<Object>} Health status
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return await response.json();
  } catch (error) {
    console.error('Health check error:', error);
    return { status: 'unhealthy', error: error.message };
  }
}

/**
 * Get detection configuration options
 * @returns {Promise<Object>} Available configurations and presets
 */
export async function getDetectionConfig() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/config`);
    if (!response.ok) throw new Error('Failed to fetch config');
    return await response.json();
  } catch (error) {
    console.error('Config fetch error:', error);
    return null;
  }
}

/**
 * Get specific preset configuration
 * @param {string} presetName - Name of preset (aggressive, conservative, balanced)
 * @returns {Promise<Object>} Preset configuration
 */
export async function getPresetConfig(presetName) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/config/presets/${presetName}`);
    if (!response.ok) throw new Error('Failed to fetch preset');
    return await response.json();
  } catch (error) {
    console.error('Preset fetch error:', error);
    return null;
  }
}

/**
 * Get performance metrics and trends
 * @returns {Promise<Object>} Performance metrics
 */
export async function getPerformanceMetrics() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/metrics`);
    if (!response.ok) throw new Error('Failed to fetch metrics');
    return await response.json();
  } catch (error) {
    console.error('Metrics fetch error:', error);
    return null;
  }
}
