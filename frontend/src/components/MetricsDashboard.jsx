import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getPerformanceMetrics } from '../services/api';
import {
  ChartBarIcon,
  ClockIcon,
  DocumentCheckIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

/**
 * MetricsDashboard - Displays performance metrics and system health
 * Shows recent analysis history, processing times, and detection statistics
 */
export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMetrics();
    // Refresh metrics every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const data = await getPerformanceMetrics();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError('Failed to load metrics');
      console.error('Metrics error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue mx-auto mb-4"></div>
        <p className="text-gray-medium">Loading metrics...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red mb-4">{error || 'No metrics available'}</p>
        <button onClick={loadMetrics} className="btn-secondary">
          Retry
        </button>
      </div>
    );
  }

  const statCards = [
    {
      icon: DocumentCheckIcon,
      label: 'Total Analyses',
      value: metrics.total_analyses || 0,
      color: 'blue'
    },
    {
      icon: ClockIcon,
      label: 'Avg Processing Time',
      value: metrics.avg_processing_time ? `${metrics.avg_processing_time.toFixed(2)}s` : 'N/A',
      color: 'green'
    },
    {
      icon: ChartBarIcon,
      label: 'Detections Made',
      value: metrics.total_detections || 0,
      color: 'red'
    },
    {
      icon: CpuChipIcon,
      label: 'System Uptime',
      value: metrics.uptime_hours ? `${metrics.uptime_hours.toFixed(1)}h` : 'N/A',
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-full bg-${stat.color}/10 flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}`} />
              </div>
            </div>
            <p className="text-gray-medium text-sm mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-soft">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Analyses */}
      {metrics.recent_analyses && metrics.recent_analyses.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-soft mb-4">Recent Analyses</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-sm text-gray-medium pb-3 px-2">Timestamp</th>
                  <th className="text-left text-sm text-gray-medium pb-3 px-2">Preset</th>
                  <th className="text-left text-sm text-gray-medium pb-3 px-2">Transactions</th>
                  <th className="text-left text-sm text-gray-medium pb-3 px-2">Suspects</th>
                  <th className="text-left text-sm text-gray-medium pb-3 px-2">Duration</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recent_analyses.map((analysis, idx) => (
                  <motion.tr
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="py-3 px-2 text-sm text-gray-soft">
                      {new Date(analysis.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium
                        ${analysis.preset === 'aggressive' ? 'bg-red/20 text-red' : 
                          analysis.preset === 'conservative' ? 'bg-green/20 text-green' : 
                          'bg-blue/20 text-blue'}`}>
                        {analysis.preset || 'balanced'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-soft">
                      {analysis.transaction_count || 0}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-soft">
                      {analysis.suspects_found || 0}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-medium">
                      {analysis.duration ? `${analysis.duration.toFixed(2)}s` : 'N/A'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detection Effectiveness */}
      {metrics.detection_stats && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-soft mb-4">Detection Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-medium mb-1">Cycle Detections</p>
              <p className="text-xl font-bold text-gray-soft">{metrics.detection_stats.cycles || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-medium mb-1">Smurfing Cases</p>
              <p className="text-xl font-bold text-gray-soft">{metrics.detection_stats.smurfing || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-medium mb-1">Shell Accounts</p>
              <p className="text-xl font-bold text-gray-soft">{metrics.detection_stats.shells || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-medium mb-1">High Risk</p>
              <p className="text-xl font-bold text-red">{metrics.detection_stats.high_risk || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={loadMetrics}
          className="btn-secondary text-sm"
        >
          Refresh Metrics
        </button>
      </div>
    </div>
  );
}
