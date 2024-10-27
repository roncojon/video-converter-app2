import React, { useState } from 'react';

function App() {
  const [filePath, setFilePath] = useState(null);
  const [outputPath, setOutputPath] = useState(null);
  const [output, setOutput] = useState('');

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
      const result = await window.electronAPI.runFFmpeg(filePath, outputPath);
      setOutput(result);  // Output location or status
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

      <button onClick={handleConvertToHLS}>Convert to TS</button>
      <pre>{output}</pre>
    </div>
  );
}

export default App;
