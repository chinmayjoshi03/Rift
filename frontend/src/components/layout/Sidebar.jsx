
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HomeIcon, 
  CloudArrowUpIcon, 
  ChartBarIcon, 
  InformationCircleIcon 
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Home', path: '/', icon: HomeIcon },
  { name: 'Analyze', path: '/upload', icon: CloudArrowUpIcon },
  { name: 'Dashboard', path: '/dashboard', icon: ChartBarIcon },
  { name: 'About', path: '/about', icon: InformationCircleIcon },
];

export default function Sidebar() {
  return (
    <motion.div 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-0 top-0 h-screen w-64 bg-navy/90 backdrop-blur-xl border-r border-white/5 flex flex-col z-50"
    >
      <div className="p-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue to-cyan-400 bg-clip-text text-transparent">
          FinTrace
        </h1>
        <p className="text-xs text-gray-medium mt-1">Graph-Based Fraud Detection</p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
              ${isActive 
                ? 'bg-blue/20 text-blue border border-blue/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                : 'text-gray-medium hover:text-white hover:bg-white/5'}
            `}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="bg-navy-light p-4 rounded-xl border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-green animate-pulse" />
            <span className="text-xs text-gray-medium">System Online</span>
          </div>
          <p className="text-[10px] text-gray-dark">v2.0.0 (Enhanced)</p>
        </div>
      </div>
    </motion.div>
  );
}
