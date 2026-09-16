import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Maximize2, Minimize2, SkipForward, SkipBack } from 'lucide-react';
import { LiquidCard } from './ui/LiquidCard';

const ComparisonViewer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(50);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoContainerRef = useRef(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (videoContainerRef.current) {
        videoContainerRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <LiquidCard index={0} className="viewer-card">
      <div className="viewer-header">
        <div>
          <h3 className="viewer-title">Model Output Comparison</h3>
          <p className="viewer-subtitle">Ground truth vs AI interpolation</p>
        </div>
        <div className="viewer-actions">
          <select className="viewer-select">
            <option>15-min Interval</option>
            <option>7.5-min Interval</option>
          </select>
          <button className="viewer-icon-btn" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      <div className="viewer-video-container" ref={videoContainerRef}>
        <div className="video-placeholder">
          <div className="comparison-slider">
            <div className="original-view">
              <span className="badge badge-gt">Ground Truth (GOES-19)</span>
              <div className="fake-img gt-img"></div>
            </div>
            <div className="generated-view" style={{ width: `${100 - progress}%` }}>
              <span className="badge badge-gen">AI Interpolated</span>
              <div className="fake-img gen-img absolute right-0"></div>
            </div>
            <div className="slider-handle" style={{ left: `${progress}%` }}>
              <div className="handle-knob">
                <div className="handle-lines">
                  <div className="handle-line"></div>
                  <div className="handle-line"></div>
                </div>
              </div>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              className="slider-input"
            />
          </div>
        </div>
      </div>

      <div className="viewer-controls">
        <button className="viewer-control-btn">
          <SkipBack size={18} />
        </button>
        <button className="viewer-play-btn" onClick={handlePlayPause}>
          {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
        </button>
        <button className="viewer-control-btn">
          <SkipForward size={18} />
        </button>
        <div className="viewer-progress-bar">
          <div className="viewer-progress-track">
            <div className="viewer-progress-fill" style={{ width: '45%' }}></div>
          </div>
          <span className="viewer-time">04:30 UTC</span>
        </div>
      </div>
    </LiquidCard>
  );
};

export default ComparisonViewer;
