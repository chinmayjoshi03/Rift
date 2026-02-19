/**
 * In-memory job state tracker
 */

const jobs = new Map();

export const JobStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

export function createJob(jobId) {
  jobs.set(jobId, {
    id: jobId,
    status: JobStatus.PENDING,
    progress: 0,
    events: [],
    result: null,
    error: null,
    createdAt: new Date()
  });
  return jobs.get(jobId);
}

export function getJob(jobId) {
  return jobs.get(jobId);
}

export function updateJobStatus(jobId, status, progress = null) {
  const job = jobs.get(jobId);
  if (job) {
    job.status = status;
    if (progress !== null) {
      job.progress = progress;
    }
    job.updatedAt = new Date();
  }
}

export function setJobResult(jobId, result) {
  const job = jobs.get(jobId);
  if (job) {
    job.result = result;
    job.status = JobStatus.COMPLETED;
    job.progress = 100;
    job.completedAt = new Date();
  }
}

export function setJobError(jobId, error) {
  const job = jobs.get(jobId);
  if (job) {
    job.error = error;
    job.status = JobStatus.FAILED;
    job.failedAt = new Date();
  }
}

export function addJobEvent(jobId, event) {
  const job = jobs.get(jobId);
  if (job) {
    job.events.push({
      ...event,
      timestamp: new Date()
    });
  }
}

export function getJobEvents(jobId) {
  const job = jobs.get(jobId);
  return job ? job.events : [];
}

// Cleanup old jobs (optional, for production)
export function cleanupOldJobs(maxAgeMs = 3600000) { // 1 hour default
  const now = Date.now();
  for (const [jobId, job] of jobs.entries()) {
    const age = now - job.createdAt.getTime();
    if (age > maxAgeMs && (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED)) {
      jobs.delete(jobId);
    }
  }
}
