// src/App.js
import React, { useState } from 'react';
import SingleVideoConversion from './modules/SingleVideoConversion';
import FolderVideoConversion from './modules/FolderVideoConversion';
import PrioritySettings from './modules/PrioritySettings';
import CpuSettings from './modules/CpuSettings';

function App() {
  const [activeTab, setActiveTab] = useState("single");
  const [cpuSelection, setCpuSelection] = useState(0);
  const [priorityLevel, setPriorityLevel] = useState("normal");

  const handleCpuSelection = (count) => {
    setCpuSelection(count);
    console.log('AppcpuSelection',count)
  };

  const handlePriorityChange = (priority) => {
    setPriorityLevel(priority);
    console.log('ApppriorityLevel',priority)
  };

  return (
    <div className="min-h-screen bg-base-200 flex justify-center">
      <div className="card w-full max-w-[452px] bg-base-100 shadow-xl m-6 min-w-[450px]">
        <div className="card-body">
          <h1 className="card-title text-3xl font-bold text-center mb-6">Video Converter</h1>

          {/* CPU and Priority Settings */}
          <CpuSettings onCpuSelection={handleCpuSelection} />
          <PrioritySettings onPriorityChange={handlePriorityChange} />

          {/* Tabs */}
          <div role="tablist" className="tabs tabs-lifted">
            <a
              role="tab"
              className={`tab ${activeTab === "single" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("single")}
            >
              Convert Single Video
            </a>
            <a
              role="tab"
              className={`tab ${activeTab === "folder" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("folder")}
            >
              Convert All Videos from Folder
            </a>
          </div>

          {/* Tab Content */}
          <div className="mt-4">
            {activeTab === "single" ? (
              <SingleVideoConversion cpuSelection={cpuSelection} priorityLevel={priorityLevel} />
            ) : (
              <FolderVideoConversion cpuSelection={cpuSelection} priorityLevel={priorityLevel} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
