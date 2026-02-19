import React, { useContext, useState, useMemo, useEffect } from 'react';
import { AnalysisContext } from '../context/AnalysisContext';
import { getResults } from '../services/api'; // Import API service
import SummaryCard from './SummaryCard';
import GraphVisualization from './GraphVisualization';
import DataTables from './DataTables';
import MetadataPanel from './MetadataPanel';
import { motion } from 'framer-motion';
import { UserGroupIcon, ExclamationTriangleIcon, ShieldExclamationIcon, ClockIcon } from '@heroicons/react/24/outline';

const MOCK_SUMMARY = { totalAccounts: 12450, suspicious: 842, fraudRings: 12, processingTime: '1.2s' };

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Dashboard() {
  const { state, dispatch } = useContext(AnalysisContext);
  const [activeTab, setActiveTab] = useState('graph');

  // Fetch Results on Mount if Job ID exists but no results
  useEffect(() => {
    const fetchResults = async () => {
      if (state.jobId && !state.results) {
        try {
          const data = await getResults(state.jobId);
          dispatch({ type: 'SET_RESULTS', payload: data });
        } catch (err) {
          console.error("Failed to load dashboard results:", err);
          // Fallback to mock data is handled by components, but we could set an error state here
        }
      }
    };

    fetchResults();
  }, [state.jobId, state.results, dispatch]);

  // Extract summary data from real results or use mock data
  const summary = useMemo(() => {
    if (state.results?.summary) {
      const s = state.results.summary;
      return {
        totalAccounts: s.total_accounts_analyzed || 0,
        suspicious: s.suspicious_accounts_flagged || 0,
        fraudRings: s.fraud_rings_detected || 0,
        processingTime: s.processing_time_seconds ? `${s.processing_time_seconds.toFixed(1)}s` : '0.0s'
      };
    }
    return MOCK_SUMMARY;
  }, [state.results]);

  const handleThresholdChange = (e) => {
    dispatch({ type: 'SET_THRESHOLD', payload: Number(e.target.value) });
  };

  const handleExport = () => {
    // Prepare clean export data without graph_data to reduce file size
    const exportData = {
      suspicious_accounts: state.results?.suspicious_accounts || [],
      fraud_rings: state.results?.fraud_rings || [],
      summary: state.results?.summary || {},
      metadata: {
        job_id: state.jobId,
        export_timestamp: new Date().toISOString(),
        threshold_used: state.threshold
      }
    };

    // Convert to formatted JSON string
    const dataStr = JSON.stringify(exportData, null, 2);

    // Create Blob and download
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `fraud_detection_report_${state.jobId || 'demo'}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      className="w-full h-full flex flex-col gap-6 max-w-[1600px] mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >

      {/* SECTION A: HEADER & ACTIONS */}
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Investigation Results</h1>
          <p className="text-gray-medium text-sm">Job ID: <span className="font-mono text-blue">{state.jobId || 'DEMO-8821'}</span></p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="btn-secondary text-sm py-2 px-4 hover:bg-white/10">
            Export Report
          </button>
          <button className="btn-primary text-sm py-2 px-4">Save Case</button>
        </div>
      </motion.div>

      {/* SECTION B: SUMMARY CARDS */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants}><SummaryCard title="Total Accounts" value={(summary.totalAccounts || 0).toLocaleString()} subtitle="Processed successfully" icon={UserGroupIcon} color="blue" /></motion.div>
        <motion.div variants={itemVariants}><SummaryCard title="Suspicious Entities" value={summary.suspicious || 0} subtitle="High risk (>80%)" icon={ExclamationTriangleIcon} color="yellow" trend={12} /></motion.div>
        <motion.div variants={itemVariants}><SummaryCard title="Fraud Rings Detected" value={summary.fraudRings || 0} subtitle="requiring immediate action" icon={ShieldExclamationIcon} color="red" trend={5} /></motion.div>
        <motion.div variants={itemVariants}><SummaryCard title="Processing Time" value={summary.processingTime || '0.0s'} subtitle="Real-time analysis" icon={ClockIcon} color="green" /></motion.div>
      </motion.div>

      {/* SECTION C: MAIN CONTENT AREA */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">

        {/* LEFT: GRAPH & TABLE VIEW */}
        <div className="lg:col-span-2 card flex flex-col p-0 overflow-hidden relative border-white/10">
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <div className="bg-navy/80 backdrop-blur-md p-1 rounded-lg border border-white/10 flex gap-1">
              <button onClick={() => setActiveTab('graph')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'graph' ? 'bg-blue text-white shadow-sm' : 'text-gray-medium hover:text-white'}`}>Graph View</button>
              <button onClick={() => setActiveTab('list')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'list' ? 'bg-blue text-white shadow-sm' : 'text-gray-medium hover:text-white'}`}>Table View</button>
            </div>
          </div>

          {/* Render the D3 Graph OR Data Tables */}
          <div className="flex-grow w-full h-full pt-16 px-2 pb-2">
            {activeTab === 'graph' ? (
              <GraphVisualization />
            ) : (
              <DataTables />
            )}
          </div>
        </div>

        {/* RIGHT: EXPLAINABILITY PANEL & LISTS */}
        <div className="flex flex-col gap-4 h-full">
          {/* RISK SLIDER */}
          <div className="card py-4 px-5 flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-soft font-medium">Risk Threshold</span>
              <span className="text-blue font-bold">{state.threshold}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={state.threshold}
              onChange={handleThresholdChange}
              className="w-full h-2 bg-navy rounded-lg appearance-none cursor-pointer accent-blue"
            />
          </div>

          {/* SELECTED NODE EXPLAINER PANEL */}
          {state.selectedNode ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="card flex-grow flex flex-col p-5 border-blue/30 bg-blue/5"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{state.selectedNode.id}</h3>
                  <p className="text-sm text-gray-medium">Entity Analysis</p>
                  {state.selectedNode.ringId && (
                    <p className="text-xs text-red mt-1">Member of {state.selectedNode.ringId}</p>
                  )}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${state.selectedNode.riskScore > 80 ? 'bg-red/20 text-red' : state.selectedNode.riskScore > 50 ? 'bg-yellow/20 text-yellow' : 'bg-green/20 text-green'}`}>
                  Risk: {state.selectedNode.riskScore}%
                </div>
              </div>

              <div className="space-y-3 flex-grow overflow-y-auto custom-scrollbar">
                {/* Account Details */}
                {state.selectedNode.accountDetails && (
                  <div className="bg-navy p-3 rounded-lg border border-white/5">
                    <p className="text-xs text-gray-medium mb-2">Account Details</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-medium">Total Transactions:</span>
                        <span className="text-gray-soft font-mono">{state.selectedNode.accountDetails.total_transactions || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-medium">Total Sent:</span>
                        <span className="text-gray-soft font-mono">${(state.selectedNode.accountDetails.total_sent || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-medium">Total Received:</span>
                        <span className="text-gray-soft font-mono">${(state.selectedNode.accountDetails.total_received || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Detected Patterns */}
                <div className="bg-navy p-3 rounded-lg border border-white/5">
                  <p className="text-xs text-gray-medium mb-2">Detected Patterns</p>
                  {state.selectedNode.patterns && state.selectedNode.patterns.length > 0 ? (
                    <ul className="text-sm text-gray-soft space-y-1">
                      {state.selectedNode.patterns.map((pattern, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="text-red">⚠</span> {pattern}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-medium">No specific patterns detected</p>
                  )}
                </div>

                {/* AI Narrative */}
                <div className="bg-navy p-3 rounded-lg border border-white/5">
                  <p className="text-xs text-gray-medium mb-2">AI Narrative</p>
                  <p className="text-xs text-gray-soft leading-relaxed">
                    {state.selectedNode.riskScore > 80 ? (
                      <>This account exhibits high-risk behavior requiring immediate investigation. {state.selectedNode.ringId ? `Associated with fraud ring ${state.selectedNode.ringId}.` : ''} Multiple suspicious patterns detected indicating potential money laundering activity.</>
                    ) : state.selectedNode.riskScore > 50 ? (
                      <>This account shows moderate risk indicators. {state.selectedNode.patterns && state.selectedNode.patterns.length > 0 ? 'Detected patterns warrant further monitoring.' : 'Transaction patterns suggest elevated scrutiny may be appropriate.'}</>
                    ) : (
                      <>This account appears to have normal transaction patterns with low risk indicators. No immediate concerns identified.</>
                    )}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => dispatch({ type: 'SET_SELECTED_NODE', payload: null })}
                className="btn-secondary w-full text-sm py-2 mt-4 border-blue text-blue hover:bg-blue/10"
              >
                Close Details
              </button>
            </motion.div>
          ) : (
            <div className="card flex-grow flex items-center justify-center text-center p-6 border-dashed border-white/20">
              <div>
                <div className="w-12 h-12 rounded-full bg-navy border border-white/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-gray-medium text-xl">👆</span>
                </div>
                <p className="text-gray-medium text-sm">Click any node on the graph or table row to view AI explainability details.</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* SECTION E: METADATA PANEL (Enhanced Detection Info) */}
      {state.results?.metadata && (
        <MetadataPanel metadata={state.results.metadata} />
      )}
    </motion.div>
  );
}