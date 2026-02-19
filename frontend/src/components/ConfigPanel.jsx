
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDetectionConfig, getPresetConfig } from '../services/api';
import { ChevronDownIcon, ChevronUpIcon, CheckIcon } from '@heroicons/react/24/outline';

/**
 * DetectionConfigPanel - Advanced configuration panel for detection settings
 * Shows available presets and allows customization
 */
export default function ConfigPanel({ onConfigChange }) {
  const [selectedPreset, setSelectedPreset] = useState('balanced');
  const [minScore, setMinScore] = useState(0.3);
  const [enableValidation, setEnableValidation] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [presetDetails, setPresetDetails] = useState(null);

  // Load preset details when selection changes
  useEffect(() => {
    loadPresetDetails(selectedPreset);
  }, [selectedPreset]);

  // Notify parent component of config changes
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange({
        preset: selectedPreset,
        min_score: minScore,
        enable_validation: enableValidation
      });
    }
  }, [selectedPreset, minScore, enableValidation, onConfigChange]);

  const loadPresetDetails = async (presetName) => {
    try {
      const details = await getPresetConfig(presetName);
      if (details) {
        setPresetDetails(details);
      }
    } catch (error) {
      // Silently fail - use default values
      console.warn('Could not load preset details, using defaults:', error.message);
      setPresetDetails(null);
    }
  };

  const presetDescriptions = {
    aggressive: {
      title: 'Aggressive',
      color: 'text-red',
      border: 'border-red/50',
      bg: 'bg-red/10',
      description: 'Maximum sensitivity. Best for high-risk datasets.',
      features: ['Lower thresholds', 'Strict cycle detection']
    },
    balanced: {
      title: 'Balanced',
      color: 'text-blue',
      border: 'border-blue/50',
      bg: 'bg-blue/10',
      description: 'Optimal balance between detection and false positives.',
      features: ['Moderate thresholds', 'Standard detection']
    },
    conservative: {
      title: 'Conservative',
      color: 'text-green',
      border: 'border-green/50',
      bg: 'bg-green/10',
      description: 'Higher confidence required. Minimizes noise.',
      features: ['Higher thresholds', 'Relaxed rules']
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-navy-light/50 backdrop-blur-md rounded-2xl border border-white/5 p-6 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Detection Settings</h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-blue hover:text-blue-dark font-medium flex items-center gap-1 transition-colors"
        >
          {showAdvanced ? (
            <>Hide <ChevronUpIcon className="w-3 h-3" /></>
          ) : (
            <>Advanced <ChevronDownIcon className="w-3 h-3" /></>
          )}
        </button>
      </div>

      {/* Preset Selection */}
      <div className="space-y-3 mb-6">
        <label className="block text-xs font-medium text-gray-medium mb-2 uppercase tracking-wider">
          Detection Preset
        </label>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(presetDescriptions).map(([key, preset]) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedPreset(key)}
              className={`
                p-3 rounded-lg border text-left transition-all relative overflow-hidden group
                ${selectedPreset === key
                  ? `${preset.border} ${preset.bg}`
                  : 'border-white/10 hover:border-white/20 bg-white/5'
                }
              `}
            >
              <div className={`font-semibold text-sm mb-1 ${selectedPreset === key ? 'text-white' : 'text-gray-soft group-hover:text-white'}`}>
                {preset.title}
              </div>
              <div className="text-[10px] text-gray-medium leading-tight">{preset.description}</div>

              {selectedPreset === key && (
                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${preset.color.replace('text-', 'bg-')}`} />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Quick Toggles */}
      <div className="flex items-center space-x-6 py-3 border-t border-white/5">
        <label className="flex items-center space-x-2 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={enableValidation}
              onChange={(e) => setEnableValidation(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${enableValidation ? 'bg-blue border-blue' : 'bg-transparent border-gray-medium group-hover:border-white'}`}>
              {enableValidation && <CheckIcon className="w-3.5 h-3.5 text-white" />}
            </div>
          </div>
          <span className="text-sm text-gray-soft group-hover:text-white transition-colors">Enable Data Validation</span>
        </label>
      </div>

      {/* Advanced Settings */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-6 mt-2 border-t border-white/5 space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="block text-xs font-medium text-gray-medium uppercase tracking-wider">
                    Minimum Suspicion Score
                  </label>
                  <span className="text-sm font-mono text-blue">{minScore.toFixed(2)}</span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={minScore}
                  onChange={(e) => setMinScore(parseFloat(e.target.value))}
                  className="w-full h-2 bg-navy rounded-lg appearance-none cursor-pointer accent-blue"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                  <span>More Results</span>
                  <span>Higher Confidence</span>
                </div>
              </div>

              {/* Preset Details */}
              {presetDetails && (
                <div className="bg-navy rounded-lg p-3 mt-4 border border-white/5">
                  <h4 className="text-xs font-semibold text-gray-soft mb-2 uppercase tracking-wider">Configuration Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-medium">Cycle Threshold:</span>
                      <span className="ml-2 font-mono text-white">{presetDetails.config?.cycle_min_score || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-medium">Smurfing Threshold:</span>
                      <span className="ml-2 font-mono text-white">{presetDetails.config?.smurfing_threshold || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
