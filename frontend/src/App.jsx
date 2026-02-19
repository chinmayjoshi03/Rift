import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnalysisProvider } from './context/AnalysisContext';
import HomePage from './components/HomePage';
import Dashboard from './components/Dashboard';
import ProgressStream from './components/ProgressStream';
import MetricsDashboard from './components/MetricsDashboard';
import Layout from './components/layout/Layout';

function App() {
  return (
    <AnalysisProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/processing" element={
            <Layout>
              <ProgressStream />
            </Layout>
          } />
          <Route path="/dashboard" element={
            <Layout>
              <Dashboard />
            </Layout>
          } />
          <Route path="/metrics" element={
            <Layout>
              <MetricsDashboard />
            </Layout>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AnalysisProvider>
  );
}

export default App;
