import React, { useState } from 'react';

function App() {
  const [filePath, setFilePath] = useState(null);
  const [output, setOutput] = useState('');

  const handleSelectFile = async () => {
    const selectedFilePath = await window.electronAPI.selectFile();
    setFilePath(selectedFilePath);
  };

  const handleConvert = async () => {
    if (!filePath) return;

    const args = ['-i', filePath, '-c', 'copy', '-f', 'mpegts', 'output.ts'];
    try {
      const result = await window.electronAPI.runFFmpeg(args);
      setOutput(result);
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  return (
    <div className="App">
      <h1>Video Converter</h1>
      <button onClick={handleSelectFile}>Choose File</button>
      <p>Selected file: {filePath}</p>
      <button onClick={handleConvert}>Convert to TS</button>
      <pre>{output}</pre>
    </div>
  );
}

export default App;
