import React from 'react';
import { motion } from 'framer-motion';

export default function ExplainPanel({ node, onClose }) {
  if (!node) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="card flex-grow flex flex-col p-5 border-blue/30 bg-blue/5"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">{node.id}</h3>
          <p className="text-sm text-gray-medium">Entity Analysis</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          node.riskScore > 80 ? 'bg-red/20 text-red' : 'bg-yellow/20 text-yellow'
        }`}>
          Risk: {node.riskScore}%
        </div>
      </div>

      <div className="space-y-3 flex-grow">
        <div className="bg-navy p-3 rounded-lg border border-white/5">
          <p className="text-xs text-gray-medium mb-1">Detected Patterns</p>
          <ul className="text-sm text-gray-soft space-y-1">
            {node.patterns?.map((pattern, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="text-red">⚠</span> {pattern}
              </li>
            ))}
            {(!node.patterns || node.patterns.length === 0) && (
              <li className="text-gray-medium/50">No specific patterns detected</li>
            )}
          </ul>
        </div>

        <div className="bg-navy p-3 rounded-lg border border-white/5">
          <p className="text-xs text-gray-medium mb-1">AI Narrative</p>
          <p className="text-xs text-gray-soft leading-relaxed">
            This account exhibits characteristics that warrant investigation. 
            {node.riskScore > 80 && ' High-risk patterns detected requiring immediate attention.'}
            {node.ringId && ` Associated with fraud ring ${node.ringId}.`}
          </p>
        </div>
      </div>

      <button 
        onClick={onClose}
        className="btn-secondary w-full text-sm py-2 mt-4 border-blue text-blue hover:bg-blue/10"
      >
        Close Details
      </button>
    </motion.div>
  );
}
