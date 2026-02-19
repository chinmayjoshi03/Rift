import React from 'react';

export default function SummaryCard({ title, value, subtitle, icon: Icon, color, trend }) {
  const colorClasses = {
    blue: 'text-blue bg-blue/10 border-blue/20',
    red: 'text-red bg-red/10 border-red/20',
    green: 'text-green bg-green/10 border-green/20',
    yellow: 'text-yellow bg-yellow/10 border-yellow/20',
  };

  return (
    <div className="card relative overflow-hidden group hover:border-white/10 transition-colors duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-medium text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {trend && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${trend > 0 ? 'bg-red/20 text-red' : 'bg-green/20 text-green'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
        <p className="text-gray-medium text-xs">{subtitle}</p>
      </div>

      {/* Decorative background glow */}
      <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-20 ${colorClasses[color].split(' ')[1]}`}></div>
    </div>
  );
}