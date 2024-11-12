// src/modules/FolderVideoConversion.js
import React, { useState, useEffect } from 'react';

function FolderVideoConversion({ cpuSelection, priorityLevel }) {
  const [folderPath, setFolderPath] = useState(null);
  const [outputPath, setOutputPath] = useState(null);
  const [output, setOutput] = useState('');
  const [progress, setProgress] = useState({});

  useEffect(() => {
    window.electronAPI.onProgress((event, progressData) => {
      setProgress((prevProgress) => ({
        ...prevProgress,
        [progressData.resolution]: progressData.frameCount,
      }));
    });
  }, []);

  const handleSelectFolder = async () => {
    const selectedFolderPath = await window.electronAPI.selectFolder();
    setFolderPath(selectedFolderPath);

    // Set the output folder to the selected folder by default if not already set
    if (!outputPath) {
      setOutputPath(selectedFolderPath);
    }
  };

  const handleSelectOutputFolder = async () => {
    const selectedOutputPath = await window.electronAPI.selectFolder();
    setOutputPath(selectedOutputPath);
  };

  const handleConvertFolderToHLS = async () => {
    if (!folderPath || !outputPath) {
      setOutput("Please select both a folder with videos and an output folder.");
      return;
    }

    try {
      // const result = await window.electronAPI.generateHlsFolder(folderPath, outputPath);
      const result = await window.electronAPI.generateHlsFolder(folderPath, outputPath, cpuSelection.toString() || '0', priorityLevel || 0);
      setOutput(result);
      setProgress({});
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      <div className="form-control mb-4">
        <button onClick={handleSelectFolder} className="btn btn-primary w-full mb-2">
          Choose Folder with Videos
        </button>
        <p className="text-sm text-gray-600 overflow-auto">
          <span className="font-semibold">Selected folder:</span> {folderPath || "None"}
        </p>
      </div>

      <div className="form-control mb-4">
        <button onClick={handleSelectOutputFolder} className="btn btn-secondary w-full mb-2">
          Choose Output Folder
        </button>
        <p className="text-sm text-gray-600 overflow-auto">
          <span className="font-semibold">Output folder:</span> {outputPath || "None"}
        </p>
      </div>

      <div className="form-control mb-4">
        <button onClick={handleConvertFolderToHLS} className="btn btn-accent w-full">
          Convert All Videos to HLS
        </button>
      </div>

      {output && (
        <div className="alert alert-info mt-4 overflow-auto">
          <span className="text-sm">{output}</span>
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
