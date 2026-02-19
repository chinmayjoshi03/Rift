import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AnalysisProvider } from './context/AnalysisContext';
import UploadSection from './components/UploadSection';
import ProgressStream from './components/ProgressStream';
import Dashboard from './components/Dashboard';
import AboutPage from './components/AboutPage';
import MetricsDashboard from './components/MetricsDashboard';

// Imported Layout handles the structure/sidebar
import Layout from './components/layout/Layout';

function App() {
  return (
    <AnalysisProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<UploadSection />} />
            <Route path="/analysis" element={<UploadSection />} />
            <Route path="/processing" element={<ProgressStream />} />
            <Route path="/metrics" element={<MetricsDashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AnalysisProvider>
  );
}

export default App;