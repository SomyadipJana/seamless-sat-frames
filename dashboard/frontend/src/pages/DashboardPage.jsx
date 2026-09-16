import React from 'react';
import ComparisonViewer from '../components/ComparisonViewer';
import MetricsPanel from '../components/MetricsPanel';

const DashboardPage = () => {
  return (
    <div className="dashboard-grid">
      {/* Left Side: Video Viewer */}
      <div className="dashboard-viewer-section">
        <ComparisonViewer />
      </div>

      {/* Right Side: Metrics */}
      <div className="dashboard-metrics-section">
        <MetricsPanel />
      </div>
    </div>
  );
};

export default DashboardPage;
