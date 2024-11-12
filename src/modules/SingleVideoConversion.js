// src/modules/SingleVideoConversion.js
import React, { useEffect, useContext } from 'react';
import { SettingsContext } from '../context/SettingsContext';

function SingleVideoConversion() {
  const {
    generalSettings,
    singleSettings,
    setSingleSettings,
  } = useContext(SettingsContext);

  const { selectedFile, outputFolder, outputText, progress } = singleSettings;

  const handleSelectFile = async () => {
    setSingleSettings({
      progress: {},
      selectedFile: null,
      outputFolder: null,
      outputText: null
    });
    const selectedFilePath = await window.electronAPI.selectFile();
    setSingleSettings((prevSettings) => ({
      ...prevSettings,
      selectedFile: selectedFilePath,
      outputFolder: prevSettings.outputFolder ||
        selectedFilePath?.substring(0, selectedFilePath?.lastIndexOf('/')) ||
        selectedFilePath?.substring(0, selectedFilePath?.lastIndexOf('\\')),
    }));
  };

  const handleSelectFolder = async () => {
    const selectedFolderPath = await window.electronAPI.selectFolder();
    setSingleSettings((prevSettings) => ({
      ...prevSettings,
      outputFolder: selectedFolderPath,
    }));
  };

  const handleConvertToHLS = async () => {
    if (!selectedFile || !outputFolder) {
      setSingleSettings((prevSettings) => ({
        ...prevSettings,
        outputText: "Please select a file and output folder.",
      }));
      return;
    }

    try {
      const result = await window.electronAPI.generateHls(
        selectedFile,
        outputFolder,
        generalSettings.cpuSelection.toString() || '0',
        generalSettings.priorityLevel || 'normal'
      );
      setSingleSettings((prevSettings) => ({
        ...prevSettings,
        outputText: result,
        progress: {}, // Reset progress after conversion completes
      }));
    } catch (error) {
      setSingleSettings((prevSettings) => ({
        ...prevSettings,
        outputText: `Error: ${error.message}`,
      }));
    }
  };

  return (
    <div>
      <div className="form-control mb-4">
        <button onClick={handleSelectFile} className="btn btn-primary w-full mb-2">
          Choose File
        </button>
        <p className="text-sm text-gray-600 overflow-auto">
          <span className="font-semibold">Selected file:</span> {selectedFile || "None"}
        </p>
      </div>

      <div className="form-control mb-4">
        <button onClick={handleSelectFolder} className="btn btn-secondary w-full mb-2">
          Choose Output Folder
        </button>
        <p className="text-sm text-gray-600 overflow-auto">
          <span className="font-semibold">Output folder:</span> {outputFolder || "None"}
        </p>
      </div>

      <div className="form-control mb-4">
        <button onClick={handleConvertToHLS} className="btn btn-accent w-full">
          Convert to HLS
        </button>
      </div>

      {outputText && (
        <div className="alert alert-info mt-4 overflow-auto">
          <span className="text-sm">{outputText}</span>
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

export default SingleVideoConversion;
