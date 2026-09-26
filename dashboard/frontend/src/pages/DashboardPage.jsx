import React, { useState } from 'react';
import ComparisonViewer from '../components/ComparisonViewer';
import MetricsPanel from '../components/MetricsPanel';
import UploadSection from '../components/UploadSection';

const DashboardPage = () => {
  const [uploadData, setUploadData] = useState(null);

  return (
    <div className="dashboard-grid">
      {/* Left Side: Viewer & Upload */}
      <div className="dashboard-viewer-section flex flex-col gap-6">
        <UploadSection onUploadComplete={(data) => setUploadData(data)} />
        
        {/* Render ComparisonViewer regardless or only after upload based on preference. 
            For now, showing it below UploadSection. */}
        <div className={`transition-all duration-500 ${uploadData ? 'opacity-100' : 'opacity-80'}`}>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-lg font-semibold text-[var(--app-ink)]">Visual Analysis</h3>
            {uploadData && (
              <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md">
                Generated 16 frames in 2.4s
              </span>
            )}
          </div>
          <ComparisonViewer uploadData={uploadData} />
        </div>
      </div>

      {/* Right Side: Metrics */}
      <div className="dashboard-metrics-section">
        <MetricsPanel uploadData={uploadData} />
      </div>
    </div>
  );
};

export default DashboardPage;
