// src/App.js
import React, { useContext, useEffect } from 'react';
import SingleVideoConversion from './modules/SingleVideoConversion';
import FolderVideoConversion from './modules/FolderVideoConversion';
import PrioritySettings from './modules/PrioritySettings';
import CpuSettings from './modules/CpuSettings';
import { SettingsContext } from './context/SettingsContext';
import ThemeSelector from './components/ThemeSelector';

function App() {
  const {
    activeTab,
    setActiveTab,
    singleSettings,
    setSingleSettings,
    folderSettings,
    setFolderSettings,
  } = useContext(SettingsContext);

  // Handle progress updates from Electron
  useEffect(() => {
    const handleProgressSingle = (event, progressData) => {
      setSingleSettings((prevSettings) => ({
        ...prevSettings,
        progress: {
          videoName: progressData.videoName, // Save video name
          resolution: progressData.resolution, // Current resolution being converted
          percentage: progressData.percentage, // Overall percentage
        },
      }));
    };

    const handleProgressFolder = (event, progressData) => {
      const { videoName, percentage, resolution } = progressData;

      setFolderSettings((prevSettings) => {
        return {
          ...prevSettings,
          progress: {
            ...prevSettings.progress,
            [videoName]: {
              ...prevSettings.progress[videoName], // Keep existing progress for this video
              percentage, // Update overall percentage
              resolution, // Update current resolution
            },
          },
        };
      });
    };

    // Listen to progress updates
    window.electronAPI.onProgressSingle(handleProgressSingle);
    window.electronAPI.onProgressFolder(handleProgressFolder);

    // Cleanup listeners on unmount
    // return () => {
    //   window.electronAPI.removeListener('conversion-progress', handleProgressSingle);
    //   window.electronAPI.removeListener('conversion-progress-folder', handleProgressFolder);
    // };
  }, [setSingleSettings, setFolderSettings]);

  // Handle disable
  // const isConvertingSingleVideo = Object.keys(singleSettings.progress).length > 0;
  // const isConvertingFolder = Object.keys(folderSettings.progress).length > 0;
  const isConvertingSingleVideo = singleSettings?.converting;
  const isConvertingFolder = folderSettings?.converting;
  // Disable the tab switch if any conversion is in progress
  const disableTabs = isConvertingSingleVideo || isConvertingFolder;

  return (
    <div className="min-h-screen bg-base-200 flex justify-center">
      <div className="card w-full max-w-[452px] bg-base-100 shadow-xl m-6 min-w-[450px]">
        <div className="card-body">
          <div className=' flex justify-between items-center mb-4'>
            <h1 className="card-title text-3xl font-bold text-center mb-1">Video Converter</h1>
            <ThemeSelector />
          </div>
          {/* CPU and Priority Settings */}
          <CpuSettings disabled={disableTabs} />
          <PrioritySettings disabled={disableTabs} />

          {/* Tabs */}
          <div role="tablist" className="tabs tabs-lifted">
            <a
              role="tab"
              className={`tab ${activeTab === "single" ? "tab-active" : ""} ${disableTabs && activeTab !== "single" ? "tab-disabled" : ""
                }`}
              onClick={() => !disableTabs && setActiveTab("single")}
              style={{ pointerEvents: disableTabs && activeTab !== "single" ? "none" : "auto" }}
            >
              Convert Single Video
            </a>
            <a
              role="tab"
              className={`tab ${activeTab === "folder" ? "tab-active" : ""} ${disableTabs && activeTab !== "folder" ? "tab-disabled" : ""
                }`}
              onClick={() => !disableTabs && setActiveTab("folder")}
              style={{ pointerEvents: disableTabs && activeTab !== "folder" ? "none" : "auto" }}
            >
              Convert All Videos from Folder
            </a>
          </div>

          {/* Tab Content */}
          <div className="mt-4">
            {activeTab === "single" ? (
              <SingleVideoConversion disabled={disableTabs} />
            ) : (
              <FolderVideoConversion disabled={disableTabs} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
