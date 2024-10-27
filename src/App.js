import React, { useState } from 'react';

function App() {
  const [filePath, setFilePath] = useState(null);
  const [outputPath, setOutputPath] = useState(null);
  const [output, setOutput] = useState('');

  // Handler to select input file
  const handleSelectFile = async () => {
    const selectedFilePath = await window.electronAPI.selectFile();
    setFilePath(selectedFilePath);
  };

  // Handler to select output folder
  const handleSelectFolder = async () => {
    const selectedFolderPath = await window.electronAPI.selectFolder();
    setOutputPath(selectedFolderPath);
  };

  // Handler to convert video to HLS format
  const handleConvertToHLS = async () => {
    if (!filePath || !outputPath) {
      setOutput("Please select a file and output folder.");
      return;
    }

    try {
      // Call generateHls with the selected file and output paths
      const result = await window.electronAPI.generateHls(filePath, outputPath);
      setOutput(result);  // Display result or success message
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
    </div>
  );
}

export default App;
