// src/modules/Task/SingleVideoConversion.js
import React from 'react';
import InfoIcon from '../../components/InfoIcon';
import { useSingleVideoConversion } from '../../hooks/useSingleVideoConversion';

const SingleVideoConversion = ({ disabled }) => {
  const {
    isConfirmed,
    selectedFile,
    outputFolder,
    progress,
    outputText,
    handleSelectFile,
    handleSelectFolder,
    handleConfirmTask,
  } = useSingleVideoConversion();

  return (
    <>
      <div className="form-control mb-4 flex-row items-center gap-5">
        <button
          onClick={handleSelectFile}
          className="btn btn-primary w-[240px]"
          disabled={disabled || isConfirmed}
        >
          Choose File
        </button>
        <p className="text-sm text-gray-500 overflow-auto whitespace-nowrap">
          <span className="font-semibold">Selected file:</span>{' '}
          {selectedFile || 'None'}
        </p>
      </div>

      <div className="form-control mb-8 flex-row items-center gap-5">
        <button
          onClick={handleSelectFolder}
          className="btn btn-primary w-[240px] shadow-md"
          disabled={disabled || isConfirmed}
        >
          Choose Output Folder
        </button>
        <p className="text-sm text-gray-500 overflow-auto whitespace-nowrap">
          <span className="font-semibold">Output folder:</span>{' '}
          {outputFolder || 'None'}
        </p>
      </div>

      <div className="form-control mb-6 flex-row gap-5">
        {!isConfirmed ? (
          <button
            onClick={handleConfirmTask}
            className="btn btn-accent w-[240px] shadow-md"
            disabled={disabled || !selectedFile || !outputFolder}
          >
            Confirm Task
          </button>
        ) : (
          <p
            className="text-gray-500 overflow-auto whitespace-nowrap w-[240px] min-w-[240px] flex-grow-0 flex justify-center font-bold p-3 rounded-md"
            disabled
          >
            Task Confirmed
          </p>
        )}

        {outputText && (
          <div role="alert" className="alert overflow-auto mt-[-4px]">
            <InfoIcon />
            <span className="text-sm">{outputText}</span>
          </div>
        )}
      </div>

      {progress?.percentage !== undefined && (
        <div className="w-full">
          <ul className="space-y-6">
            <li key={progress.videoName} className="text-sm border-b pb-4">
              <div className="text-sm mb-2 overflow-auto">
                <span className="font-bold">{progress.videoName}:</span>
                <span> {progress?.percentage?.toFixed(2)}%</span>
              </div>
              <div className="text-sm mb-2">
                <span className="font-semibold">Current Resolution:</span>{' '}
                <span>{progress?.resolution || 'Unknown'}</span>
              </div>
              <progress
                className="progress progress-accent w-full"
                value={progress?.percentage}
                max="100"
              ></progress>
            </li>
          </ul>
        </div>
      )}
    </>
  );
};

export default SingleVideoConversion;
