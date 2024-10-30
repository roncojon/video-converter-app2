// src/App.js
import React, { useState } from 'react';
import SingleVideoConversion from './modules/SingleVideoConversion';
import FolderVideoConversion from './modules/FolderVideoConversion';

function App() {
  const [activeTab, setActiveTab] = useState("single");

  return (
    <div className="min-h-screen bg-base-200 flex justify-center">
      <div className="card w-full max-w-[452px] bg-base-100 shadow-xl m-6 min-w-[450px]">
        <div className="card-body">
          <h1 className="card-title text-3xl font-bold text-center mb-6">Video Converter</h1>

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
              <SingleVideoConversion />
            ) : (
              <FolderVideoConversion />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
