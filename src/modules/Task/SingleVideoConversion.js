import React, { useEffect, useContext, useState } from 'react';
import { SingleTaskSettingsContext } from '../../contexts/SingleTaskSettingsContext';
import InfoIcon from '../../components/InfoIcon';
import { TasksQueueContext } from '../../contexts/TasksQueueContext';

function SingleVideoConversion({ disabled }) {
  const {
    taskId,
    taskEventNames,
    generalSettings,
    singleSettings,
    setSingleSettings,
  } = useContext(SingleTaskSettingsContext);

  const { tasks, addOrUpdateTask } = useContext(TasksQueueContext);
  const [isConfirmed, setIsConfirmed] = useState(false); // Track if the task is confirmed

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
        converting: true,
      }));
      const result = await window.electronAPI.generateHls(
        selectedFile,
        outputFolder,
        generalSettings.cpuSelection.toString() || '0',
        generalSettings.priorityLevel || 'normal',
        taskEventNames.eventNameSingleConversion
      );
      setSingleSettings((prevSettings) => ({
        ...prevSettings,
        outputText: result,
        converting: false,
      }));
      // Mark the task as completed in the queue
      addOrUpdateTask({ ...tasks[taskId], status: 'completed' });
    } catch (error) {
      setSingleSettings((prevSettings) => ({
        ...prevSettings,
        converting: false,
        outputText: `Error: ${error.message}`,
      }));
    }
  };

  const handleConfirmTask = () => {
    setIsConfirmed(true);

    // Add the task to the queue with detailed task data
    addOrUpdateTask({
      id: taskId,
      taskEventNames,
      generalSettings,
      singleSettings,
      folderSettings: {}, // Folder settings are irrelevant for single conversion
      status: 'confirmed',
    });
  };

  return (
    <>
      <div className="form-control mb-4 flex-row items-center gap-5 ">
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

      <div className="form-control mb-8 flex-row items-center gap-5 ">
        <button
          onClick={handleSelectFolder}
          className="btn btn-primary w-[240px]"
          disabled={disabled || isConfirmed}
        >
          Choose Output Folder
        </button>
        <p className="text-sm text-gray-500 overflow-auto whitespace-nowrap">
          <span className="font-semibold">Output folder:</span>{' '}
          {outputFolder || 'None'}
        </p>
      </div>

      <div className="form-control mb-6 flex-row gap-5 ">
        {!isConfirmed ? (
          <button
            onClick={handleConfirmTask}
            className="btn btn-accent w-[240px]"
            disabled={disabled || !selectedFile || !outputFolder} // Disable if file or folder is missing
          >
            Confirm Task
          </button>
        ) : (
          <p className="text-gray-500">Task Confirmed</p>
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
            <li key={progress.videoName} className="text-sm border-b pb-4 ">
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
}

export default SingleVideoConversion;
