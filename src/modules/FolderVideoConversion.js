// src/modules/FolderVideoConversion.js
import React, { useEffect, useContext } from 'react';
import { SettingsContext } from '../context/SettingsContext';

function FolderVideoConversion({disabled}) {
  const {
    generalSettings,
    folderSettings,
    setFolderSettings,
  } = useContext(SettingsContext);

  console.log('HEREEEEEEEE')

  const { selectedFolder, outputFolder, outputTextArray, progress } = folderSettings;

  const handleSelectFolder = async () => {
    setFolderSettings({
      progress: {},
      selectedFolder: null,
      outputFolder: null,
      outputTextArray: null
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
      const result = await window.electronAPI.generateHlsFolder(
        selectedFolder,
        outputFolder,
        generalSettings.cpuSelection.toString() || '0',
        generalSettings.priorityLevel || 'normal'
      );
      setFolderSettings((prevSettings) => ({
        ...prevSettings,
        outputTextArray: result,
        progress: {},
      }));
    } catch (error) {
      setFolderSettings((prevSettings) => ({
        ...prevSettings,
        outputTextArray: `Error: ${error.message}`,
      }));
    }
  };

  return (
    <div>
      <div className="form-control mb-4">
        <button onClick={handleSelectFolder} className="btn btn-primary w-full mb-2" disabled={disabled}>
          Choose Folder with Videos
        </button>
        <p className="text-sm text-gray-600 overflow-auto">
          <span className="font-semibold">Selected folder:</span> {selectedFolder || "None"}
        </p>
      </div>

      <div className="form-control mb-4">
        <button onClick={handleSelectOutputFolder} className="btn btn-secondary w-full mb-2" disabled={disabled}>
          Choose Output Folder
        </button>
        <p className="text-sm text-gray-600 overflow-auto">
          <span className="font-semibold">Output folder:</span> {outputFolder || "None"}
        </p>
      </div>

      <div className="form-control mb-4">
        <button onClick={handleConvertFolderToHLS} className="btn btn-accent w-full" disabled={disabled}>
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
          <h3 className="text-lg font-semibold mb-2">Progress:</h3>
          <ul className="space-y-2">
            {Object.entries(progress).map(([resolution, frameCount]) => (
              <li key={resolution} className="text-sm">
                <div className="flex justify-between">
                  <span className="font-bold">{resolution}:</span>
                  <span>{frameCount} frames processed</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default FolderVideoConversion;
