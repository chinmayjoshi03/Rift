
import React, { useContext, useMemo } from 'react';
import { AnalysisContext } from '../context/AnalysisContext';
import { motion } from 'framer-motion';

// Mock Data (To be replaced by real API data)
const MOCK_ACCOUNTS = [
  { id: 'ACC_0123', score: 94, patterns: ['Smurfing', 'Cycle'], ring: 'Ring_A' },
  { id: 'ACC_8821', score: 88, patterns: ['High Velocity', 'Shell'], ring: 'Ring_A' },
  { id: 'ACC_4432', score: 82, patterns: ['Smurfing'], ring: 'None' },
  { id: 'ACC_9910', score: 76, patterns: ['Fan-out'], ring: 'Ring_B' },
  { id: 'ACC_3321', score: 65, patterns: ['Cycle'], ring: 'None' },
];

const MOCK_RINGS = [
  { id: 'Ring_A', members: 12, pattern: 'Offshore Layering', risk: 'Critical' },
  { id: 'Ring_B', members: 8, pattern: 'Domestic Smurfing', risk: 'High' },
  { id: 'Ring_C', members: 4, pattern: 'Micro-Structuring', risk: 'Medium' },
];

export default function DataTables() {
  const { state, dispatch } = useContext(AnalysisContext);

  // Derive real data from state.results if available
  const accountsData = useMemo(() => {
    if (state.results?.suspicious_accounts) {
      return state.results.suspicious_accounts.map(acc => ({
        id: acc.account_id,
        score: acc.suspicion_score,
        riskScore: acc.suspicion_score,
        patterns: acc.detected_patterns || [],
        ring: acc.ring_id || 'None'
      }));
    }
    return MOCK_ACCOUNTS;
  }, [state.results]);

  const ringsData = useMemo(() => {
    if (state.results?.fraud_rings) {
      return state.results.fraud_rings.map(ring => ({
        id: ring.ring_id,
        members: ring.member_accounts,
        pattern: ring.pattern_type || 'Cycle',
        risk: ring.risk_score > 90 ? 'Critical' : ring.risk_score > 70 ? 'High' : 'Medium',
        riskScore: ring.risk_score
      }));
    }
    return MOCK_RINGS;
  }, [state.results]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar p-2"
    >
      {/* SUSPICIOUS ACCOUNTS TABLE */}
      <div className="card p-0 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/5 bg-navy-light/50">
          <h3 className="font-bold text-gray-soft text-lg">Suspicious Accounts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-medium">
            <thead className="text-xs uppercase bg-navy/50 text-gray-soft border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Account ID</th>
                <th className="px-6 py-4">Risk Score</th>
                <th className="px-6 py-4">Detected Patterns</th>
                <th className="px-6 py-4">Fraud Ring</th>
              </tr>
            </thead>
            <tbody>
              {accountsData.filter(acc => (acc.score || acc.riskScore) >= state.threshold).map((acc) => (
                <tr
                  key={acc.id}
                  className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => {
                    // Find full account details
                    const fullDetails = state.results?.suspicious_accounts?.find(
                      a => a.account_id === acc.id
                    );
                    
                    dispatch({ 
                      type: 'SET_SELECTED_NODE', 
                      payload: { 
                        id: acc.id,
                        riskScore: acc.score || acc.riskScore, 
                        patterns: acc.patterns || [],
                        ringId: acc.ring !== 'None' ? acc.ring : null,
                        isShell: (acc.patterns || []).includes('Shell'),
                        accountDetails: fullDetails ? {
                          total_transactions: fullDetails.total_transactions,
                          total_sent: fullDetails.total_sent,
                          total_received: fullDetails.total_received,
                          detected_patterns: fullDetails.detected_patterns,
                          suspicion_score: fullDetails.suspicion_score
                        } : null
                      } 
                    });
                  }}
                >
                  <td className="px-6 py-4 font-medium text-white">{acc.id}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${(acc.score || acc.riskScore) > 80 ? 'bg-red/20 text-red' : 'bg-yellow/20 text-yellow'}`}>
                      {acc.score || acc.riskScore}%
                    </span>
                  </td>
                  <td className="px-6 py-4">{(acc.patterns || []).join(', ')}</td>
                  <td className="px-6 py-4">
                    {acc.ring && acc.ring !== 'None' ? <span className="text-blue">{acc.ring}</span> : <span className="text-gray-medium/50">-</span>}
                  </td>
                </tr>
              ))}
              {accountsData.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-medium">No suspicious accounts found above threshold.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FRAUD RINGS TABLE */}
      <div className="card p-0 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/5 bg-navy-light/50">
          <h3 className="font-bold text-gray-soft text-lg">Detected Fraud Rings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-medium">
            <thead className="text-xs uppercase bg-navy/50 text-gray-soft border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Ring ID</th>
                <th className="px-6 py-4">Primary Pattern</th>
                <th className="px-6 py-4">Members</th>
                <th className="px-6 py-4">Overall Risk</th>
              </tr>
            </thead>
            <tbody>
              {ringsData.map((ring) => (
                <tr key={ring.id} className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{ring.id}</td>
                  <td className="px-6 py-4">{ring.pattern || 'Cycle'}</td>
                  <td className="px-6 py-4 text-white">{ring.members?.length || ring.members} Accounts</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${(ring.risk || 'High') === 'Critical' ? 'bg-red/20 text-red' :
                        (ring.risk || 'High') === 'High' ? 'bg-yellow/20 text-yellow' : 'bg-blue/20 text-blue'
                      }`}>
                      {ring.risk || 'High'}
                    </span>
                  </td>
                </tr>
              ))}
              {ringsData.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-medium">No fraud rings detected.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}