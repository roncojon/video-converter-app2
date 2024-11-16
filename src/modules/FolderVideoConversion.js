import React, { useEffect, useContext } from 'react';
import { SettingsContext } from '../context/SettingsContext';

function FolderVideoConversion({ disabled }) {
  const {
    generalSettings,
    folderSettings,
    setFolderSettings,
  } = useContext(SettingsContext);

  const { selectedFolder, outputFolder, outputTextArray, progress } = folderSettings;

  const handleSelectFolder = async () => {
    setFolderSettings({
      progress: {},
      selectedFolder: null,
      outputFolder: null,
      outputTextArray: null,
    });
    const selectedFolderPath = await window.electronAPI.selectFolder();
    setFolderSettings((prevSettings) => ({
      ...prevSettings,
      selectedFolder: selectedFolderPath,
      outputFolder: prevSettings.outputFolder || selectedFolderPath,
    }));
  };

  const handleSelectOutputFolder = async () => {
    const selectedOutputPath = await window.electronAPI.selectFolder();
    setFolderSettings((prevSettings) => ({
      ...prevSettings,
      outputFolder: selectedOutputPath,
    }));
  };

  const handleConvertFolderToHLS = async () => {
    if (!selectedFolder || !outputFolder) {
      setFolderSettings((prevSettings) => ({
        ...prevSettings,
        outputTextArray: "Please select both a folder with videos and an output folder.",
      }));
      return;
    }

    try {
      setFolderSettings((prevSettings) => ({
        ...prevSettings,
        converting: true
      }));
      const result = await window.electronAPI.generateHlsFolder(
        selectedFolder,
        outputFolder,
        generalSettings.cpuSelection.toString() || '0',
        generalSettings.priorityLevel || 'normal'
      );
      setFolderSettings((prevSettings) => ({
        ...prevSettings,
        outputTextArray: result,
        converting: false
        // progress: {},
      }));
    } catch (error) {
      setFolderSettings((prevSettings) => ({
        ...prevSettings,
        converting: false,
        outputTextArray: `Error: ${error.message}`,
      }));
    }
  };

  return (
    <div>
      <div className="form-control mb-4">
        <button
          onClick={handleSelectFolder}
          className="btn btn-primary w-full mb-2"
          disabled={disabled}
        >
          Choose Folder with Videos
        </button>
        <p className="text-sm text-gray-600 overflow-auto">
          <span className="font-semibold">Selected folder:</span> {selectedFolder || "None"}
        </p>
      </div>

      <div className="form-control mb-4">
        <button
          onClick={handleSelectOutputFolder}
          className="btn btn-secondary w-full mb-2"
          disabled={disabled}
        >
          Choose Output Folder
        </button>
        <p className="text-sm text-gray-600 overflow-auto">
          <span className="font-semibold">Output folder:</span> {outputFolder || "None"}
        </p>
      </div>

      <div className="form-control mb-4">
        <button
          onClick={handleConvertFolderToHLS}
          className="btn btn-accent w-full"
          disabled={disabled}
        >
          Convert All Videos to HLS
        </button>
      </div>

      {outputTextArray && (
        <div className="alert alert-info mt-4 overflow-auto">
          <span className="text-sm">{outputTextArray}</span>
        </div>
      )}

      {Object.keys(progress).length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Progress for Each Video:</h3>
          <ul className="space-y-6">
            {Object.entries(progress).map(([videoName, videoProgress]) => (
              <>{videoName && videoName!=="undefined" ?
                <li key={videoName} className="text-sm border-b pb-4">
                  <div className="mb-2">
                    <span className="font-bold">{videoName}:</span>
                    <span> {videoProgress?.percentage?.toFixed(2)}%</span>
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Current Resolution:</span>{" "}
                    <span>{videoProgress?.resolution || "Unknown"}</span>
                  </div>
                  <progress
                    className="progress progress-primary w-full"
                    value={videoProgress?.percentage}
                    max="100"
                  ></progress>
                </li>
                : null}
              </>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default FolderVideoConversion;
