import React, { useEffect, useContext } from 'react';
import { SettingsContext } from '../context/SettingsContext';
import InfoIcon from '../components/InfoIcon';

function SingleVideoConversion({ disabled }) {
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
      outputText: null,
    });
    const selectedFilePath = await window.electronAPI.selectFile();
    setSingleSettings((prevSettings) => ({
      ...prevSettings,
      selectedFile: selectedFilePath,
      outputFolder:
        prevSettings.outputFolder ||
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
        outputText: 'Please select a file and output folder.',
      }));
      return;
    }

    try {
      setSingleSettings((prevSettings) => ({
        ...prevSettings,
        converting: true
      }));
      const result = await window.electronAPI.generateHls(
        selectedFile,
        outputFolder,
        generalSettings.cpuSelection.toString() || '0',
        generalSettings.priorityLevel || 'normal'
      );
      setSingleSettings((prevSettings) => ({
        ...prevSettings,
        outputText: result,
        converting: false
        // progress: {}, // Reset progress after conversion completes
      }));
    } catch (error) {
      setSingleSettings((prevSettings) => ({
        ...prevSettings,
        converting: false,
        outputText: `Error: ${error.message}`,
      }));
    }
  };

  console.log('progressssss', progress)
  console.log('progressssssString', JSON.stringify(progress))
  // // Extract the file name with extension
  // const fileName = selectedFile?.split(/[/\\]/).pop();
  // // Extract the file name without the extension
  // const fileNameWithoutExt = fileName?.slice(0, fileName?.lastIndexOf('.'));

  return (
    <div>
      <div className="form-control mb-4">
        <button
          onClick={handleSelectFile}
          className="btn btn-primary w-full mb-2 " /* btn-outline */
          disabled={disabled}
        >
          Choose File
        </button>
        <p className="text-sm text-gray-600 overflow-auto">
          <span className="font-semibold">Selected file:</span>{' '}
          {selectedFile || 'None'}
        </p>
      </div>

      <div className="form-control mb-4">
        <button
          onClick={handleSelectFolder}
          className="btn btn-secondary w-full mb-2 " /* btn-outline */
          disabled={disabled}
        >
          Choose Output Folder
        </button>
        <p className="text-sm text-gray-600 overflow-auto">
          <span className="font-semibold">Output folder:</span>{' '}
          {outputFolder || 'None'}
        </p>
      </div>

      <div className="form-control mb-4">
        <button
          onClick={handleConvertToHLS}
          className="btn btn-accent w-full " /* btn-outline */
          disabled={disabled}
        >
          Convert to HLS
        </button>
      </div>

      {/* <h3 className="mt-6 text-base font-semibold">{fileNameWithoutExt ? (fileNameWithoutExt + ":") : ""}</h3> */}

      {outputText && (
        <div role="alert" className="alert mt-4 overflow-auto">
          <InfoIcon />
          <span className="text-sm">{outputText}</span>
        </div>
      )}

      {progress?.percentage !== undefined && (
        <div className="mt-4 ">
          <ul className="space-y-6">
            <li key={progress.videoName} className="text-sm border-b pb-4 ">
              <div className="text-sm mb-2 overflow-auto">
                <span className="font-bold ">{progress.videoName}:</span>
                <span> {progress?.percentage?.toFixed(2)}%</span>
              </div>
              <div className="text-sm mb-2">
                <span className="font-semibold">Current Resolution:</span>{" "}
                <span>{progress?.resolution || "Unknown"}</span>
              </div>
              <progress
                className="progress progress-primary w-full"
                value={progress?.percentage}
                max="100"
              ></progress>
              {/* <div className="divider"></div> */}

            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default SingleVideoConversion;
