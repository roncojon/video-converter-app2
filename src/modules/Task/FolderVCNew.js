// src/modules/Task/FolderVideoConversion.js
import React, { useContext, useEffect } from 'react';
import { SingleTaskSettingsContext } from '../../contexts/SingleTaskSettingsContext';
import { TasksQueueContext } from '../../contexts/TasksQueueContext';
import InfoIcon from '../../components/InfoIcon';

function FolderVideoConversion({ disabled }) {
  const {
    taskEventNames,
    generalSettings,
    folderSettings,
    setFolderSettings,
    taskId
  } = useContext(SingleTaskSettingsContext);

  const { addOrUpdateTask } = useContext(TasksQueueContext);

  const { selectedFolder, outputFolder, outputTextArray, progress, converting } = folderSettings;

  const handleSelectFolder = async () => {
    setFolderSettings({
      progress: {},
      selectedFolder: null,
      outputFolder: null,
      outputTextArray: null,
      converting: false,
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

  // Confirm the folder conversion task so the queue processor starts it when it's its turn.
  const handleConfirmTask = () => {
    if (!selectedFolder || !outputFolder) {
      setFolderSettings((prevSettings) => ({
        ...prevSettings,
        outputTextArray: "Please select both a folder with videos and an output folder.",
      }));
      return;
    }

    // Indicate that confirmation is in progress.
    setFolderSettings((prevSettings) => ({
      ...prevSettings,
      converting: true,
    }));

    // Build the updated task using the existing taskId.
    const updatedTask = {
      id: taskId,
      taskEventNames,
      activeTab: 'folder',
      generalSettings,
      folderSettings,
      status: 'confirmed',
    };

    // Update the task in the global queue.
    addOrUpdateTask(updatedTask);

    // Update local state to show confirmation and disable the Confirm button.
    // setFolderSettings((prevSettings) => ({
    //   ...prevSettings,
    //   converting: false,
    //   outputTextArray: "Task confirmed and added to the queue.",
    // }));
  };

  // Listen for task completion events to update the outputTextArray with the conversion result.
  useEffect(() => {
    const handleTaskComplete = (event, data) => {
      if (data.taskId === taskId) {
        setFolderSettings((prevSettings) => ({
          ...prevSettings,
          outputTextArray: data.outputText || "Conversion complete.",
        }));
      }
    };

    if (window.electronAPI && typeof window.electronAPI.receive === 'function') {
      window.electronAPI.receive('task-complete', handleTaskComplete);
    }

    return () => {
      if (window.electronAPI && typeof window.electronAPI.removeListener === 'function') {
        window.electronAPI.removeListener('task-complete', handleTaskComplete);
      }
    };
  }, [taskId, setFolderSettings]);

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
          disabled={disabled || converting || (outputTextArray === "Task confirmed and added to the queue.")}
        >
          Confirm Task
        </button>

        {outputTextArray && (
          <div className="alert overflow-auto mt-[-4px]">
            <InfoIcon />
            <span className="text-sm">{converting ? "Task confirmed and added to the queue." : outputTextArray}</span>
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
