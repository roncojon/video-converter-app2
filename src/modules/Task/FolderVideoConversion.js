// src/modules/Task/FolderVideoConversion.js
import React, { useEffect, useContext } from 'react';
import { SingleTaskSettingsContext } from '../../contexts/SingleTaskSettingsContext';
import InfoIcon from '../../components/InfoIcon';

function FolderVideoConversion({ disabled }) {
  const {
    taskEventNames,
    generalSettings,
    folderSettings,
    setFolderSettings,
  } = useContext(SingleTaskSettingsContext);

  const { selectedFolder, outputFolder, outputTextArray, progress } = folderSettings;

  const handleSelectFolder = async () => {
    setFolderSettings({
      progress: {},
      selectedFolder: null,
      outputFolder: null,
      outputTextArray: null,
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
      setFolderSettings((prevSettings) => ({
        ...prevSettings,
        converting: true
      }));
      const result = await window.electronAPI.generateHlsFolder(
        selectedFolder,
        outputFolder,
        generalSettings.cpuSelection.toString() || '0',
        generalSettings.priorityLevel || 'normal',
        taskEventNames.eventNameFolderConversion
      );
      setFolderSettings((prevSettings) => ({
        ...prevSettings,
        outputTextArray: result,
        converting: false
        // progress: {},
      }));
    } catch (error) {
      setFolderSettings((prevSettings) => ({
        ...prevSettings,
        converting: false,
        outputTextArray: `Error: ${error.message}`,
      }));
    }
  };

  return (
    <>
      <div className="form-control mb-4 flex-row items-center gap-5 ">
        <button
          onClick={handleSelectFolder}
          className="btn btn-primary   w-[240px] "
          disabled={disabled}
        >
          Choose Folder with Videos
        </button>
        {/* <div className="alert overflow-auto"> */}
          <p className="text-sm text-gray-500 overflow-auto whitespace-nowrap">
            <span className="font-semibold">Selected folder:</span> {selectedFolder || "None"}
          </p>
        {/* </div> */}
      </div>

      <div className="form-control mb-8 flex-row items-center gap-5 ">
        <button
          onClick={handleSelectOutputFolder}
          className="btn btn-primary   w-[240px] "
          disabled={disabled}
        >
          Choose Output Folder
        </button>
        {/* <div className="alert overflow-auto"> */}
          <p className="text-sm text-gray-500 overflow-auto whitespace-nowrap">
            <span className="font-semibold">Output folder:</span> {outputFolder || "None"}
          </p>
        {/* </div> */}

      </div>

      <div className="form-control mb-6 flex-row  gap-5 "> {/* items-center */}
        <button
          onClick={handleConvertFolderToHLS}
          className="btn btn-accent  w-[240px] " /* text-white */
          disabled={disabled}
        >
          Convert All Videos to HLS
        </button>

        {outputTextArray && (
          <div className="alert  overflow-auto mt-[-4px]"> {/* whitespace-nowrap */}
            <InfoIcon />
            <span className="text-sm">{outputTextArray}</span>
          </div>
        )}
      </div>

      {Object.keys(progress).length > 0 && (
        <div className=" w-full">
          {/* <h3 className="text-lg font-semibold mb-4">Progress for Each Video:</h3> */}
          <ul className="space-y-6">
            {Object.entries(progress).map(([videoName, videoProgress]) => (
              <>{videoName && videoName !== "undefined" ?
                <li key={videoName} className="text-sm border-b pb-4">  {/*  */}
                  <div className="mb-2 overflow-auto">
                    <span className="font-bold">{videoName}:</span>
                    <span> {videoProgress?.percentage?.toFixed(2)}%</span>
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Current Resolution:</span>{" "}
                    <span>{videoProgress?.resolution || "Unknown"}</span>
                  </div>
                  <progress
                    className="progress progress-accent w-full"
                    value={videoProgress?.percentage}
                    max="100"
                  ></progress>
                  {/* <div className="divider"></div> */}
                </li>
                : null}
              </>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

export default FolderVideoConversion;
