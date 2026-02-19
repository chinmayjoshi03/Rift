import React, { useState, useCallback, useContext } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowUpTrayIcon, 
  DocumentTextIcon, 
  CloudArrowUpIcon,
  CodeBracketIcon,
  UserGroupIcon,
  CpuChipIcon,
  ServerStackIcon,
  GlobeAltIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { AnalysisContext } from '../context/AnalysisContext';
import { uploadAndAnalyze } from '../services/api';
import ConfigPanel from './ConfigPanel';
import { ShootingStars } from './ui/ShootingStars';
import { StarsBackground } from './ui/StarsBackground';

export default function HomePage() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [detectionConfig, setDetectionConfig] = useState({
    preset: 'balanced',
    min_score: 0.3,
    enable_validation: true
  });

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
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1
  });

  const handleStartAnalysis = async () => {
    if (!file) return;
    setIsLoading(true);
    setError('');

    try {
      const response = await uploadAndAnalyze(file, detectionConfig);
      const { jobId } = response;
      dispatch({ type: 'SET_JOB_ID', payload: jobId });
      dispatch({ type: 'SET_CONFIG', payload: detectionConfig });
      navigate('/processing');
    } catch (err) {
      setError(err.message || 'Failed to start analysis. Please try again.');
      console.error('Analysis error:', err);
      setIsLoading(false);
    }
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const techStack = [
    { category: 'Frontend', items: ['React 18', 'Vite', 'Tailwind CSS', 'D3.js', 'Framer Motion'] },
    { category: 'Backend', items: ['Node.js', 'Express', 'FastAPI', 'Python 3.11'] },
    { category: 'Analysis', items: ['NetworkX', 'Pandas', 'NumPy'] },
    { category: 'Infrastructure', items: ['Docker', 'Railway', 'Render'] }
  ];

  const teamMembers = [
    { name: 'Sarvesh', role: 'Frontend/UI', icon: GlobeAltIcon },
    { name: 'Vivek', role: 'Frontend/UI', icon: GlobeAltIcon },
    { name: 'Prathmesh', role: 'Backend', icon: ServerStackIcon },
    { name: 'Chinmay', role: 'Python Model', icon: CpuChipIcon }
  ];

  return (
    <div className="min-h-screen bg-navy text-white overflow-x-hidden">
      {/* Fixed Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-navy/80 backdrop-blur-xl border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue to-cyan-400 flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-navy" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue to-cyan-400 bg-clip-text text-transparent">
                FinTrace
              </h1>
              <p className="text-[10px] text-gray-medium">Financial Crime Detection</p>
            </div>
          </div>
          <div className="flex gap-6">
            <button onClick={() => scrollToSection('home')} className="text-gray-medium hover:text-white transition-colors text-sm">
              Home
            </button>
            <button onClick={() => scrollToSection('about')} className="text-gray-medium hover:text-white transition-colors text-sm">
              About
            </button>
            <a 
              href="https://github.com/chinmayjoshi03/Rift" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-medium hover:text-white transition-colors text-sm flex items-center gap-1"
            >
              <CodeBracketIcon className="w-4 h-4" />
              Source
            </a>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section id="home" className="min-h-screen relative flex items-center justify-center pt-20">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0 bg-navy pointer-events-none">
          <StarsBackground starDensity={0.0002} allStarsTwinkle={true} twinkleProbability={0.8} />
          <ShootingStars starColor="#1A73E8" trailColor="#2BC48A" minDelay={1000} maxDelay={3000} />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Hero Text */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue/10 border border-blue/20 text-blue text-sm font-semibold mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue"></span>
              </span>
              Graph-Based Financial Intelligence
            </motion.div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Uncover <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue via-cyan-400 to-green animate-gradient-x">
                Hidden Patterns
              </span>
            </h1>

            <p className="text-gray-soft text-lg md:text-xl mb-8 leading-relaxed max-w-xl">
              Deploy advanced graph algorithms to detect money laundering rings and smurfing networks in milliseconds, not months.
            </p>

            <div className="flex flex-wrap gap-4 mb-8">
              {[
                { label: 'Real-time Analysis', color: 'bg-green' },
                { label: 'Graph Visualization', color: 'bg-blue' },
                { label: 'Pattern Recognition', color: 'bg-purple-500' }
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/5 backdrop-blur-sm"
                >
                  <div className={`w-2 h-2 rounded-full ${feature.color} shadow-[0_0_10px_currentColor]`}></div>
                  <span className="text-sm text-gray-medium font-medium">{feature.label}</span>
                </motion.div>
              ))}
            </div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={() => scrollToSection('upload')}
              className="btn-primary text-lg px-8 py-4"
            >
              Get Started
            </motion.button>
          </motion.div>

          {/* Right: Upload Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            id="upload"
            className="glass rounded-3xl p-8 relative overflow-hidden backdrop-blur-2xl border border-white/10 shadow-2xl"
          >
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
                      {isDragActive ? 'Drop the CSV here...' : 'Click or drag file'}
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
                    : 'bg-gradient-to-r from-blue to-cyan-400 text-white shadow-blue/20 hover:shadow-blue/40 hover:-translate-y-0.5 hover:scale-[1.01]'}
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
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="min-h-screen relative py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              About <span className="text-blue">FinTrace</span>
            </h2>
            <p className="text-gray-medium text-lg max-w-2xl mx-auto">
              Advanced Network Analysis for Financial Forensics
            </p>
          </motion.div>

          {/* Tech Stack */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-16"
          >
            <h3 className="text-2xl font-bold text-white mb-8 text-center">Tech Stack</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {techStack.map((stack, idx) => (
                <motion.div
                  key={stack.category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="card border-t-4 border-t-blue"
                >
                  <h4 className="text-lg font-bold text-blue mb-4">{stack.category}</h4>
                  <div className="space-y-2">
                    {stack.items.map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue"></div>
                        <span className="text-sm text-gray-soft">{item}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Team Members */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-16"
          >
            <h3 className="text-2xl font-bold text-white mb-8 text-center">Team Members</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {teamMembers.map((member, idx) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="card text-center hover:border-blue/30 transition-all duration-300 hover:scale-105"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue to-cyan-400 flex items-center justify-center mx-auto mb-4">
                    <member.icon className="w-8 h-8 text-navy" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-1">{member.name}</h4>
                  <p className="text-sm text-blue">{member.role}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Source Code */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center"
          >
            <a
              href="https://github.com/chinmayjoshi03/Rift"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue/50 rounded-xl transition-all duration-300 group"
            >
              <CodeBracketIcon className="w-6 h-6 text-blue group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="text-white font-semibold">View Source Code</p>
                <p className="text-xs text-gray-medium">github.com/chinmayjoshi03/Rift</p>
              </div>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-medium text-sm">
            Built with ❤️ by the FinTrace Team
          </p>
          <p className="text-gray-medium text-xs mt-2">
            © 2024 FinTrace. Graph-Based Financial Crime Detection.
          </p>
        </div>
      </footer>
    </div>
  );
}
