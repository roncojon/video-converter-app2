// src/components/SingleVideoConversion.js
import React, { useState, useEffect } from 'react';

// type SingleVideoConversionProps = {
//   cpuSelection: number;
//   priorityLevel: string;
// };

function SingleVideoConversion({ cpuSelection, priorityLevel }) {
  console.log('SingleVideoConversioncpuSelection',cpuSelection)
  console.log('SingleVideoConversionpriorityLevel', priorityLevel)
  const [filePath, setFilePath] = useState(null);
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

  const handleSelectFile = async () => {
    const selectedFilePath = await window.electronAPI.selectFile();
    setFilePath(selectedFilePath);

    // Extract the directory path from the selected file path
    if (selectedFilePath) {
      const directoryPath = selectedFilePath.substring(0, selectedFilePath.lastIndexOf('/')) || selectedFilePath.substring(0, selectedFilePath.lastIndexOf('\\'));
      setOutputPath(directoryPath);
    }
  };

  const handleSelectFolder = async () => {
    const selectedFolderPath = await window.electronAPI.selectFolder();
    setOutputPath(selectedFolderPath);
  };

  const handleConvertToHLS = async () => {
    if (!filePath || !outputPath) {
      setOutput("Please select a file and output folder.");
      return;
    }

    try {
      // Pass cpuSelection and priorityLevel to the Electron API
      console.log('cpuSelectioncpuSelectioncpuSelection',cpuSelection)
      const result = await window.electronAPI.generateHls(filePath, outputPath, cpuSelection.toString() || '0', priorityLevel || 0);
      setOutput(result);
      setProgress({});
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      <div className="form-control mb-4">
        <button onClick={handleSelectFile} className="btn btn-primary w-full mb-2">
          Choose File
        </button>
        <p className="text-sm text-gray-600 overflow-auto">
          <span className="font-semibold">Selected file:</span> {filePath || "None"}
        </p>
      </div>

      <div className="form-control mb-4">
        <button onClick={handleSelectFolder} className="btn btn-secondary w-full mb-2">
          Choose Output Folder
        </button>
        <p className="text-sm text-gray-600 overflow-auto">
          <span className="font-semibold">Output folder:</span> {outputPath || "None"}
        </p>
      </div>

      <div className="form-control mb-4">
        <button onClick={handleConvertToHLS} className="btn btn-accent w-full">
          Convert to HLS
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

export default SingleVideoConversion;
