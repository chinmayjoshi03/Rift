/**
 * Custom React Hook for Server-Sent Events (SSE)
 * Handles streaming progress updates from the backend
 */

import { useEffect } from 'react';
import { subscribeToStream } from '../services/api';

/**
 * Hook to subscribe to SSE stream for job progress
 * @param {string} jobId - The job ID to stream
 * @param {Function} onProgress - Callback when progress update received
 * @param {Function} onError - Callback when error occurs
 */
export function useSSEStream(jobId, onProgress, onError) {
  useEffect(() => {
    if (!jobId) return;

    // Subscribe to stream
    const cleanup = subscribeToStream(jobId, onProgress, onError);

    // Cleanup on unmount or when jobId changes
    return cleanup;
  }, [jobId, onProgress, onError]);
}
