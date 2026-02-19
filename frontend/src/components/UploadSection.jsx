
import React, { useState, useCallback, useContext } from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowUpTrayIcon, DocumentTextIcon, CloudArrowUpIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { AnalysisContext } from '../context/AnalysisContext';
import { uploadAndAnalyze } from '../services/api';
import ConfigPanel from './ConfigPanel';
import { ShootingStars } from './ui/ShootingStars';
import { StarsBackground } from './ui/StarsBackground';
import { motion } from 'framer-motion';

export default function UploadSection() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [detectionConfig, setDetectionConfig] = useState({
    preset: 'balanced',
    min_score: 0.3,
    enable_validation: true
  });

  // Hooks for routing and global state
  const navigate = useNavigate();
  const { dispatch } = useContext(AnalysisContext);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError('');
    if (rejectedFiles.length > 0) {
      setError('Please upload a valid CSV file.');
      return;
    }
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  const handleStartAnalysis = async () => {
    if (!file) return;

    setIsLoading(true);
    setError('');

    try {
      // Call backend API with detection configuration
      const response = await uploadAndAnalyze(file, detectionConfig);
      const { jobId } = response;

      // Update global state with real job ID and config
      dispatch({ type: 'SET_JOB_ID', payload: jobId });
      dispatch({ type: 'SET_CONFIG', payload: detectionConfig });

      // Navigate to processing screen
      navigate('/processing');
    } catch (err) {
      setError(err.message || 'Failed to start analysis. Please try again.');
      console.error('Analysis error:', err);
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-100px)] flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Advanced Background Effects */}
      <div className="absolute inset-0 z-0 bg-navy pointer-events-none">
        <StarsBackground
          starDensity={0.0002}
          allStarsTwinkle={true}
          twinkleProbability={0.8}
        />
        <ShootingStars
          starColor="#1A73E8"
          trailColor="#2BC48A"
          minDelay={1000}
          maxDelay={3000}
          minSpeed={15}
          maxSpeed={35}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-5xl z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
      >

        {/* Left Column: Hero Text */}
        <div className="pt-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue/10 border border-blue/20 text-blue text-xs font-semibold mb-6"
          >
            <SparklesIcon className="w-4 h-4" />
            <span>Graph-Based Financial Intelligence</span>
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
            Uncover <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue via-cyan-400 to-green animate-gradient-x">
              Hidden Patterns
            </span>
          </h1>

          <p className="text-gray-soft text-lg mb-8 max-w-md leading-relaxed">
            Deploy advanced graph algorithms to detect money laundering rings and smurfing networks in milliseconds, not months.
          </p>

          <div className="flex flex-wrap gap-4 mb-8">
            {[
              { color: "bg-green", label: "Real-time Analysis" },
              { color: "bg-blue", label: "Graph Visualization" },
              { color: "bg-purple-500", label: "Pattern Recognition" }
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 backdrop-blur-sm">
                <div className={`w-2 h-2 rounded-full ${feature.color} shadow-[0_0_10px_currentColor]`}></div>
                <span className="text-xs text-gray-medium font-medium">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Interactive Upload Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="glass rounded-3xl p-8 relative overflow-hidden backdrop-blur-2xl border border-white/10 shadow-2xl shadow-blue/5"
        >
          {/* Decorative background blob inside card */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue/20 rounded-full blur-[80px] pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Upload Dataset</h2>
                <p className="text-gray-medium text-xs mt-1">Supported format: CSV (max 50MB)</p>
              </div>
              <CloudArrowUpIcon className="w-10 h-10 text-blue opacity-80" />
            </div>

            <ConfigPanel onConfigChange={setDetectionConfig} />

            <button
              {...getRootProps()}
              className={`
                 w-full border-2 border-dashed rounded-2xl p-8 mb-6 cursor-pointer transition-all duration-300 ease-in-out flex flex-col items-center justify-center min-h-[160px] group
                 ${isDragActive ? 'border-blue bg-blue/10 scale-[1.02]' : 'border-white/10 hover:border-blue/50 hover:bg-white/5'}
                 ${file ? 'border-solid border-green/50 bg-green/5' : ''}
               `}
            >
              <input {...getInputProps()} />

              {file ? (
                <div className="flex flex-col items-center animate-pulse">
                  <DocumentTextIcon className="w-12 h-12 text-green mb-3 drop-shadow-[0_0_15px_rgba(43,196,138,0.5)]" />
                  <p className="text-white font-medium truncate max-w-[200px]">{file.name}</p>
                  <p className="text-gray-medium text-xs mt-1 font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-navy/50 border border-white/10 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <ArrowUpTrayIcon className="w-7 h-7 text-blue group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <p className="text-gray-soft font-medium group-hover:text-white transition-colors">
                    {isDragActive ? "Drop the CSV here..." : "Click or drag file"}
                  </p>
                  <p className="text-gray-medium text-xs mt-2 opacity-60">
                    Automatic structural validation included
                  </p>
                </div>
              )}
            </button>

            {error && (
              <div className="p-3 bg-red/10 border border-red/20 rounded-lg mb-4 text-red text-sm text-center flex items-center justify-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              onClick={handleStartAnalysis}
              disabled={!file || isLoading}
              className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all duration-300 transform
                 ${!file || isLoading
                  ? 'bg-navy-light text-gray-medium border border-white/5 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue to-blue-dark text-white shadow-blue/20 hover:shadow-blue/40 hover:-translate-y-0.5 hover:scale-[1.01]'}
               `}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="tracking-wide">ANALYZING...</span>
                </div>
              ) : 'START ANALYSIS'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}