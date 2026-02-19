import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalysisContext } from '../context/AnalysisContext';
import { useSSEStream } from '../hooks/useSSEStream';
import { getResults } from '../services/api';
import { CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

const STAGES = [
  { threshold: 10, label: 'Parsing CSV Data' },
  { threshold: 25, label: 'Building Graph Network' },
  { threshold: 50, label: 'Detecting Cycles' },
  { threshold: 65, label: 'Identifying Smurfing Patterns' },
  { threshold: 80, label: 'Tracing Shell Chains' },
  { threshold: 95, label: 'Calculating Risk Scores' },
  { threshold: 100, label: 'Finalizing Results' },
];

export default function ProgressStream() {
  const { state, dispatch } = useContext(AnalysisContext);
  const navigate = useNavigate();
  const { progress, jobId } = state;

  // Handle SSE stream for real-time progress
  const handleProgress = async (event) => {
    console.log('Progress event:', event);
    
    // Update progress
    dispatch({ type: 'SET_PROGRESS', payload: event.progress });

    // When complete, fetch final results
    if (event.type === 'DONE') {
      try {
        const results = await getResults(jobId);
        dispatch({ type: 'SET_RESULTS', payload: results });
        setTimeout(() => navigate('/dashboard'), 1000);
      } catch (error) {
        console.error('Failed to fetch results:', error);
        dispatch({ type: 'SET_STATUS', payload: 'ERROR' });
      }
    }

    // Handle errors
    if (event.type === 'ERROR') {
      dispatch({ type: 'SET_STATUS', payload: 'ERROR' });
      dispatch({ type: 'SET_PROGRESS', payload: 0 });
    }
  };

  const handleError = (error) => {
    console.error('SSE error:', error);
    dispatch({ type: 'SET_STATUS', payload: 'ERROR' });
  };

  // Subscribe to stream if jobId exists
  useSSEStream(jobId, handleProgress, handleError);

  return (
    <div className="w-full max-w-2xl">
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-soft mb-2 text-center">Analyzing Network</h2>
        <p className="text-gray-medium text-sm text-center mb-8">
          Job ID: {state.jobId || 'demo-job-1234'}
        </p>

        {/* Animated Progress Bar */}
        <div className="w-full bg-navy rounded-full h-4 mb-8 shadow-inner overflow-hidden border border-white/5">
          <div 
            className="bg-blue h-4 rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            {/* Glossy highlight inside the progress bar */}
            <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/20 rounded-full"></div>
          </div>
        </div>
        <div className="text-right text-blue font-bold text-lg mb-8">
          {progress}%
        </div>

        {/* Progress Timeline List */}
        <div className="space-y-4">
          {STAGES.map((stage, index) => {
            const isCompleted = progress >= stage.threshold;
            const isActive = progress < stage.threshold && (index === 0 || progress >= STAGES[index - 1].threshold);

            return (
              <div 
                key={stage.label} 
                className={`flex items-center gap-4 p-3 rounded-xl transition-colors duration-300
                  ${isActive ? 'bg-blue/10 border border-blue/30' : 'border border-transparent'}
                `}
              >
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircleIcon className="w-6 h-6 text-green" />
                  ) : isActive ? (
                    <ArrowPathIcon className="w-6 h-6 text-blue animate-spin" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-medium/30" />
                  )}
                </div>
                <span className={`font-medium ${isCompleted ? 'text-gray-soft' : isActive ? 'text-blue' : 'text-gray-medium/50'}`}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}