import React from 'react';
import { motion } from 'framer-motion';
import { UserGroupIcon, ServerStackIcon, CodeBracketIcon, LinkIcon } from '@heroicons/react/24/outline';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function AboutPage() {
  return (
    <motion.div 
      className="w-full h-full max-w-[1200px] mx-auto flex flex-col gap-6 p-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants} className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">About Fin<span className="text-blue">Trace</span></h1>
        <p className="text-gray-medium">Advanced Network Analysis for Financial Forensics</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* TEAM SECTION */}
        <motion.div variants={itemVariants} className="card border-t-4 border-t-blue">
          <div className="flex items-center gap-3 mb-6">
            <UserGroupIcon className="w-6 h-6 text-blue" />
            <h2 className="text-xl font-bold text-gray-soft">The Team</h2>
          </div>
          <ul className="space-y-3">
            <li className="flex justify-between items-center p-3 bg-navy rounded-lg border border-white/5">
              <span className="text-white font-medium">Team Member 1</span>
              <span className="text-xs text-blue bg-blue/10 px-2 py-1 rounded-full">Frontend/UI</span>
            </li>
            <li className="flex justify-between items-center p-3 bg-navy rounded-lg border border-white/5">
              <span className="text-white font-medium">Team Member 2</span>
              <span className="text-xs text-green bg-green/10 px-2 py-1 rounded-full">Backend/API</span>
            </li>
            <li className="flex justify-between items-center p-3 bg-navy rounded-lg border border-white/5">
              <span className="text-white font-medium">Team Member 3</span>
              <span className="text-xs text-yellow bg-yellow/10 px-2 py-1 rounded-full">ML/Data Science</span>
            </li>
          </ul>
        </motion.div>

        {/* TECH STACK SECTION */}
        <motion.div variants={itemVariants} className="card border-t-4 border-t-green">
          <div className="flex items-center gap-3 mb-6">
            <CodeBracketIcon className="w-6 h-6 text-green" />
            <h2 className="text-xl font-bold text-gray-soft">Tech Stack</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {['React', 'Vite', 'Tailwind CSS', 'D3.js', 'Framer Motion', 'Python', 'FastAPI', 'Pandas', 'NetworkX'].map(tech => (
              <span key={tech} className="px-3 py-1.5 bg-navy border border-white/10 rounded-lg text-sm text-gray-medium font-medium hover:border-green/50 hover:text-white transition-colors cursor-default">
                {tech}
              </span>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-white/5">
             <a href="https://github.com/your-repo-link" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue hover:text-blue-light transition-colors">
                <LinkIcon className="w-4 h-4" /> View Source Code on GitHub
             </a>
          </div>
        </motion.div>

        {/* ARCHITECTURE DIAGRAM SECTION */}
        <motion.div variants={itemVariants} className="card md:col-span-2 border-t-4 border-t-yellow">
          <div className="flex items-center gap-3 mb-6">
            <ServerStackIcon className="w-6 h-6 text-yellow" />
            <h2 className="text-xl font-bold text-gray-soft">System Architecture</h2>
          </div>
          <div className="w-full bg-navy rounded-xl p-4 border border-white/5 flex items-center justify-center min-h-[300px]">
            {/* Replace this div with an actual <img> tag of your architecture diagram later */}
            <div className="text-center text-gray-medium/50 flex flex-col items-center">
               
               <p className="mt-4 text-sm font-medium">Insert your Architecture Diagram Image Here</p>
               <p className="text-xs mt-2 max-w-md">Client (React) ➔ API Gateway (FastAPI) ➔ Graph Processing (NetworkX/Python) ➔ Streaming Response (SSE)</p>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}