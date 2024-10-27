import React, { useState, useEffect } from 'react';

function App() {
  const [filePath, setFilePath] = useState(null);
  const [outputPath, setOutputPath] = useState(null);
  const [output, setOutput] = useState('');
  const [progress, setProgress] = useState({});
  const [activeTab, setActiveTab] = useState("single");

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
      setProgress({});
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex  justify-center"> {/* items-center */}
      <div className="card w-full max-w-md bg-base-100 shadow-xl m-6">
        <div className="card-body">
          <h1 className="card-title text-3xl font-bold text-center mb-6">Video Converter</h1>

          {/* Tabs */}
          <div role="tablist" className="tabs tabs-lifted">
            <a
              role="tab"
              className={`tab ${activeTab === "single" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("single")}
            >
              Convert Single Video
            </a>
            <a
              role="tab"
              className={`tab ${activeTab === "folder" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("folder")}
            >
              Convert All Videos from Folder
            </a>
          </div>

          {/* Tab Content */}
          <div className="mt-4">
            {activeTab === "single" ? (
              <div>
                <div className="form-control mb-4">
                  <button onClick={handleSelectFile} className="btn btn-primary w-full mb-2">
                    Choose File
                  </button>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Selected file:</span> {filePath || "None"}
                  </p>
                </div>

                <div className="form-control mb-4">
                  <button onClick={handleSelectFolder} className="btn btn-secondary w-full mb-2">
                    Choose Output Folder
                  </button>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Output folder:</span> {outputPath || "None"}
                  </p>
                </div>

                <div className="form-control mb-4">
                  <button onClick={handleConvertToHLS} className="btn btn-accent w-full">
                    Convert to HLS
                  </button>
                </div>

                {output && (
                  <div className="alert alert-info mt-4">
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
            ) : (
              <div>
                {/* Content for "Convert Videos in Folder" tab */}
                <h1 className="text-xl font-bold">Convert All Videos from Folder</h1>
                <p>This feature is under development.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
