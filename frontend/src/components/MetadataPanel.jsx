import { motion } from 'framer-motion';
import {
  ClockIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

/**
 * MetadataPanel - Displays enhanced detection metadata and quality reports
 * Shows processing time, configuration used, validation results, and optimization stats
 */
export default function MetadataPanel({ metadata }) {
  if (!metadata) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6 mt-6"
    >
      <h3 className="text-lg font-semibold text-gray-soft mb-4 flex items-center gap-2">
        <ChartBarIcon className="w-5 h-5 text-blue" />
        Analysis Metadata
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Processing Time */}
        {metadata.processing_time && (
          <div className="bg-navy/50 rounded-lg p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <ClockIcon className="w-5 h-5 text-blue" />
              <p className="text-xs text-gray-medium">Processing Time</p>
            </div>
            <p className="text-2xl font-bold text-gray-soft">
              {metadata.processing_time.toFixed(2)}s
            </p>
          </div>
        )}

        {/* Configuration Preset */}
        {metadata.config_preset && (
          <div className="bg-navy/50 rounded-lg p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheckIcon className="w-5 h-5 text-green" />
              <p className="text-xs text-gray-medium">Detection Preset</p>
            </div>
            <p className="text-lg font-bold text-gray-soft capitalize">
              {metadata.config_preset}
            </p>
          </div>
        )}

        {/* Validation Status */}
        {metadata.validation_enabled !== undefined && (
          <div className="bg-navy/50 rounded-lg p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheckIcon className="w-5 h-5 text-purple" />
              <p className="text-xs text-gray-medium">Validation</p>
            </div>
            <p className={`text-lg font-bold ${metadata.validation_enabled ? 'text-green' : 'text-gray-medium'}`}>
              {metadata.validation_enabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        )}

        {/* Memory Optimization */}
        {metadata.memory_optimization && (
          <div className="bg-navy/50 rounded-lg p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <CpuChipIcon className="w-5 h-5 text-yellow" />
              <p className="text-xs text-gray-medium">Optimization</p>
            </div>
            <p className="text-lg font-bold text-gray-soft capitalize">
              {metadata.memory_optimization}
            </p>
          </div>
        )}
      </div>

      {/* Data Quality Report */}
      {metadata.data_quality_report && (
        <div className="bg-navy/50 rounded-lg p-4 border border-white/5 mt-4">
          <h4 className="text-sm font-semibold text-gray-soft mb-3">Data Quality Report</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(metadata.data_quality_report).map(([key, value]) => (
              <div key={key}>
                <p className="text-xs text-gray-medium mb-1 capitalize">
                  {key.replace(/_/g, ' ')}
                </p>
                <p className="text-lg font-bold text-gray-soft">
                  {typeof value === 'number' ? value.toLocaleString() : String(value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuration Details */}
      {metadata.config_used && (
        <div className="bg-navy/50 rounded-lg p-4 border border-white/5 mt-4">
          <h4 className="text-sm font-semibold text-gray-soft mb-3">Configuration Parameters</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {Object.entries(metadata.config_used).slice(0, 12).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-gray-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                <span className="font-mono text-gray-soft">
                  {typeof value === 'number' ? value.toFixed(3) : String(value)}
                </span>
              </div>
            ))}
          </div>
          {Object.keys(metadata.config_used).length > 12 && (
            <p className="text-xs text-gray-medium mt-2 text-center">
              + {Object.keys(metadata.config_used).length - 12} more parameters
            </p>
          )}
        </div>
      )}

      {/* Warnings */}
      {metadata.warnings && metadata.warnings.length > 0 && (
        <div className="bg-yellow/10 border border-yellow/20 rounded-lg p-4 mt-4">
          <h4 className="text-sm font-semibold text-yellow mb-2">⚠️ Warnings</h4>
          <ul className="space-y-1">
            {metadata.warnings.map((warning, idx) => (
              <li key={idx} className="text-xs text-gray-medium">
                • {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
