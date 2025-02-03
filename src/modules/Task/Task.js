// src/modules/Task/Task.js
import React, { useContext, useEffect } from 'react';
import SingleVideoConversion from './SingleVideoConversion';
import FolderVideoConversion from './FolderVideoConversion';
import PrioritySettings from './PrioritySettings';
import CpuSettings from './CpuSettings';
import { SingleTaskSettingsContext } from '../../contexts/SingleTaskSettingsContext';
import ThemeSelector from '../../components/ThemeSelector';

function Task() {
  const {
    taskId, // Access taskId from context
    taskEventNames,
    activeTab,
    setActiveTab,
    singleSettings,
    setSingleSettings,
    folderSettings,
    setFolderSettings,
  } = useContext(SingleTaskSettingsContext);

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

      setFolderSettings((prevSettings) => ({
        ...prevSettings,
        progress: {
          ...prevSettings.progress,
          [videoName]: {
            ...prevSettings.progress[videoName], // Keep existing progress for this video
            percentage, // Update overall percentage
            resolution, // Update current resolution
          },
        },
      }));
    };

    // Listen to progress updates for this specific task
    window.electronAPI.onProgress(taskEventNames.eventNameSingleConversion, handleProgressSingle);
    window.electronAPI.onProgress(taskEventNames.eventNameFolderConversion, handleProgressFolder);

    // Cleanup listeners on unmount
    return () => {
      window.electronAPI.offProgress(taskEventNames.eventNameSingleConversion, handleProgressSingle);
      window.electronAPI.offProgress(taskEventNames.eventNameFolderConversion, handleProgressFolder);
    };
  }, [taskId]); // Include taskId to ensure updates are tied to this specific task

  const isConvertingSingleVideo = singleSettings?.converting;
  const isConvertingFolder = folderSettings?.converting;
  const disableTabs = isConvertingSingleVideo || isConvertingFolder;

  return (
    <div className="  flex justify-center"> {/* min-h-screen */} {/* bg-base-200 */}
      <div className="card w-full bg-base-100  m-2"> {/* shadow-xl */}
        <div className="card-body pt-0">
          <CpuSettings disabled={disableTabs} />
          <PrioritySettings disabled={disableTabs} />
          {/* Tabs */}
          <div
            role="tablist"
            className="tabs tabs-lifted w-full"
            style={{
              boxSizing: 'border-box',
              '--tab-border': '2px',
            }}
          >
            <a
              role="tab"
              className={`tab ${activeTab === 'single' ? 'tab-active' : ''} ${disableTabs && activeTab !== 'single' ? 'tab-disabled' : ''
                }`}
              onClick={() => !disableTabs && setActiveTab('single')}
              style={{
                pointerEvents: disableTabs && activeTab !== 'single' ? 'none' : 'auto',
              }}
            >
              Convert Single Video
            </a>
            <a
              role="tab"
              className={`tab ${activeTab === 'folder' ? 'tab-active' : ''} ${disableTabs && activeTab !== 'folder' ? 'tab-disabled' : ''
                }`}
              onClick={() => !disableTabs && setActiveTab('folder')}
              style={{
                pointerEvents: disableTabs && activeTab !== 'folder' ? 'none' : 'auto',
              }}
            >
              Convert All Videos from Folder
            </a>
          </div>

          {/* Tab Content */}
          <div className="mt-4">
            {activeTab === 'single' ? (
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

export default Task;
