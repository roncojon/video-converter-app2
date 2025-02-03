// src/modules/Task/FolderVideoConversion.js
import React from 'react';
import InfoIcon from '../../components/InfoIcon';
import { useFolderVideoConversion } from '../../hooks/useFolderVideoConversion';

function FolderVideoConversion({ disabled }) {
  const {
    selectedFolder,
    outputFolder,
    progress,
    converting,
    outputTextArray,
    handleSelectFolder,
    handleSelectOutputFolder,
    handleConfirmTask,
  } = useFolderVideoConversion();

  return (
    <>
      <div className="form-control mb-4 flex-row items-center gap-5">
        <button
          onClick={handleSelectFolder}
          className="btn btn-primary w-[240px]"
          disabled={disabled}
        >
          Choose Folder with Videos
        </button>
        <p className="text-sm text-gray-500 overflow-auto whitespace-nowrap">
          <span className="font-semibold">Selected folder:</span> {selectedFolder || "None"}
        </p>
      </div>

      <div className="form-control mb-8 flex-row items-center gap-5">
        <button
          onClick={handleSelectOutputFolder}
          className="btn btn-primary w-[240px]"
          disabled={disabled}
        >
          Choose Output Folder
        </button>
        <p className="text-sm text-gray-500 overflow-auto whitespace-nowrap">
          <span className="font-semibold">Output folder:</span> {outputFolder || "None"}
        </p>
      </div>

      <div className="form-control mb-6 flex-row gap-5">
        <button
          onClick={handleConfirmTask}
          className="btn btn-accent w-[240px]"
          disabled={disabled || converting}
        >
          Confirm Task
        </button>

        {outputTextArray && (
          <div className="alert overflow-auto mt-[-4px]">
            <InfoIcon />
            <span className="text-sm">{outputTextArray}</span>
          </div>
        )}
      </div>

      {Object.keys(progress).length > 0 && (
        <div className="w-full">
          <ul className="space-y-6">
            {Object.entries(progress).map(([videoName, videoProgress]) => (
              <>
                {videoName && videoName !== "undefined" ? (
                  <li key={videoName} className="text-sm border-b pb-4">
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
                  </li>
                ) : null}
              </>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

export default FolderVideoConversion;
