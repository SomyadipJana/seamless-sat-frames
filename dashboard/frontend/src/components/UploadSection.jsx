import React, { useState, useRef } from 'react';
import { UploadCloud, X, CheckCircle, Loader2, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LiquidCard } from './ui/LiquidCard';
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";

const chartConfig = {
  confidence: {
    label: "Interpolation Confidence",
    color: "#2563eb", // Primary blue from app theme
  },
};

const mockGraphData = [
  { frame: "01", confidence: 0.99 },
  { frame: "02", confidence: 0.95 },
  { frame: "03", confidence: 0.88 },
  { frame: "04", confidence: 0.82 },
  { frame: "05", confidence: 0.79 },
  { frame: "06", confidence: 0.85 },
  { frame: "07", confidence: 0.92 },
  { frame: "08", confidence: 0.98 },
  { frame: "09", confidence: 0.91 },
  { frame: "10", confidence: 0.86 },
  { frame: "11", confidence: 0.81 },
  { frame: "12", confidence: 0.84 },
  { frame: "13", confidence: 0.89 },
  { frame: "14", confidence: 0.94 },
  { frame: "15", confidence: 0.97 },
  { frame: "16", confidence: 0.99 },
];

const UploadSection = ({ onUploadComplete }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadState, setUploadState] = useState('idle'); // idle, uploading, complete
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
  };

  const handleFiles = (file) => {
    setFile(file);
    simulateUpload(file);
  };

  const simulateUpload = (uploadedFile) => {
    setUploadState('uploading');
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadState('complete');
          setTimeout(() => {
            if (onUploadComplete) {
              onUploadComplete({
                file: uploadedFile,
                processingTime: '2.4s',
                resolution: '1024x1024',
                framesGenerated: 16
              });
            }
          }, 800);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const resetUpload = () => {
    setFile(null);
    setUploadState('idle');
    setProgress(0);
    if (onUploadComplete) {
      onUploadComplete(null);
    }
  };

  return (
    <LiquidCard index={0} className="viewer-card" height="h-auto mb-6">
      <div className="viewer-header">
        <div>
          <h3 className="viewer-title">Data Ingestion</h3>
          <p className="viewer-subtitle">Upload satellite frames to generate intermediate data</p>
        </div>
        {file && uploadState === 'complete' && (
          <div className="viewer-actions">
            <button 
              onClick={resetUpload}
              className="viewer-icon-btn"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {uploadState === 'idle' && (
            <motion.div 
              key="dropzone"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl transition-all duration-300 ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50/50' 
                  : 'border-[var(--app-hairline)] bg-[var(--app-canvas)] hover:border-[var(--app-muted)]'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={handleChange}
                accept="image/*,.nc,.h5"
              />
              
              <div className="w-12 h-12 mb-3 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-500">
                <UploadCloud size={24} />
              </div>
              <p className="mb-2 text-sm text-[var(--app-ink)] font-medium">
                <span className="text-blue-600 hover:underline cursor-pointer">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-[var(--app-muted)]">
                Supported formats: JPEG, PNG, NetCDF, HDF5
              </p>
            </motion.div>
          )}

          {uploadState === 'uploading' && (
            <motion.div 
              key="uploading"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full h-48 flex flex-col items-center justify-center p-6 bg-[var(--app-canvas)] border border-[var(--app-hairline)] rounded-xl"
            >
              <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
              <p className="text-sm font-medium text-[var(--app-ink)] mb-4">Processing {file?.name}...</p>
              
              <div className="w-full max-w-xs h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "linear", duration: 0.1 }}
                />
              </div>
              <p className="text-xs text-[var(--app-muted)] mt-2">{progress}% complete</p>
            </motion.div>
          )}

          {uploadState === 'complete' && (
            <motion.div 
              key="complete"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex flex-col gap-4"
            >
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="text-green-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--app-ink)]">{file?.name}</p>
                    <p className="text-xs text-green-600 font-medium">Successfully processed</p>
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-[var(--app-muted)]">
                  <div className="flex flex-col items-end">
                    <span className="font-medium text-[var(--app-ink)]">{(file?.size / (1024 * 1024)).toFixed(2)} MB</span>
                    <span>Processed Size</span>
                  </div>
                </div>
              </div>

              {/* Professional Graph Area */}
              <div className="rounded-xl border border-[var(--app-hairline)] bg-white p-5 shadow-sm mt-2">
                <div className="flex items-center gap-2 mb-6">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <h4 className="text-[15px] font-semibold text-[var(--app-ink)]">Frame Interpolation Confidence</h4>
                </div>
                <div className="h-48 w-full">
                  <ChartContainer config={chartConfig} className="h-full w-full">
                    <AreaChart data={mockGraphData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-confidence)" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="var(--color-confidence)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-hairline)" />
                      <XAxis 
                        dataKey="frame" 
                        tickLine={false} 
                        axisLine={false} 
                        tickMargin={12}
                        tickFormatter={(value) => `F${value}`}
                        style={{ fontSize: '11px', fill: 'var(--app-muted)' }}
                      />
                      <YAxis 
                        tickLine={false} 
                        axisLine={false} 
                        tickMargin={12}
                        domain={[0.7, 1]}
                        style={{ fontSize: '11px', fill: 'var(--app-muted)' }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="confidence"
                        stroke="var(--color-confidence)"
                        fillOpacity={1}
                        fill="url(#colorConfidence)"
                        strokeWidth={2}
                        activeDot={{ r: 6, fill: "var(--color-confidence)", stroke: "#fff", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LiquidCard>
  );
};

export default UploadSection;
