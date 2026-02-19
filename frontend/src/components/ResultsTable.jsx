import React from 'react';

export default function ResultsTable({ onSelect }) {
  // Mock data
  const accounts = Array.from({ length: 20 }, (_, i) => ({
    id: `ACC_${1000 + i}`,
    score: Math.floor(Math.random() * 100),
    flags: ['Cycle', 'Fan-out']
  }));

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/5 bg-navy-light">
        <h3 className="text-sm font-bold text-gray-soft uppercase tracking-wider">Detected Entities</h3>
      </div>
      <div className="flex-grow overflow-y-auto p-2 space-y-2">
        {accounts.map(acc => (
          <div 
            key={acc.id}
            onClick={() => onSelect(acc)}
            className="p-3 rounded-lg bg-navy hover:bg-white/5 cursor-pointer border border-transparent hover:border-blue/30 transition-all flex justify-between items-center group"
          >
            <div>
                <div className="text-sm font-medium text-white">{acc.id}</div>
                <div className="text-xs text-gray-medium">{acc.flags.join(', ')}</div>
            </div>
            <div className={`text-sm font-bold ${acc.score > 80 ? 'text-red' : 'text-yellow'}`}>
                {acc.score}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}