import React, { useState, useEffect } from 'react';

function App() {
  const [filePath, setFilePath] = useState(null);
  const [outputPath, setOutputPath] = useState(null);
  const [output, setOutput] = useState('');
  const [progress, setProgress] = useState({});

  useEffect(() => {
    // Listen for progress updates from Electron
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
      const result = await window.electronAPI.generateHls(filePath, outputPath);
      setOutput(result);
      setProgress({}); // Reset progress after completion
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  return (
    <div className="App">
      <h1>Video Converter</h1>
      
      <button onClick={handleSelectFile}>Choose File</button>
      <p>Selected file: {filePath}</p>

      <button onClick={handleSelectFolder}>Choose Output Folder</button>
      <p>Output folder: {outputPath}</p>

      <button onClick={handleConvertToHLS}>Convert to HLS</button>
      
      <pre>{output}</pre>

      {/* Display progress */}
      {Object.keys(progress).length > 0 && (
        <div>
          <h3>Progress:</h3>
          {Object.entries(progress).map(([resolution, frameCount]) => (
            <p key={resolution}>{resolution}: {frameCount} frames processed</p>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
