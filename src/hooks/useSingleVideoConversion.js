// src/hooks/useSingleVideoConversion.js
import { useContext, useState } from 'react';
import { SingleTaskSettingsContext } from '../contexts/SingleTaskSettingsContext';
import { TasksQueueContext } from '../contexts/TasksQueueContext';

export const useSingleVideoConversion = () => {
  const { taskId, taskEventNames, generalSettings, singleSettings, setSingleSettings } =
    useContext(SingleTaskSettingsContext);
  const { tasks, addOrUpdateTask } = useContext(TasksQueueContext);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Destructure values from singleSettings
  const { selectedFile, outputFolder, progress } = singleSettings;
  const outputText = tasks[taskId]?.outputText;

  // Logic to handle file selection
  const handleSelectFile = async () => {
    // Reset settings
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
        selectedFilePath?.substring(0, selectedFilePath.lastIndexOf('/')) ||
        selectedFilePath?.substring(0, selectedFilePath.lastIndexOf('\\')),
    }));
  };

  // Logic to handle output folder selection
  const handleSelectFolder = async () => {
    const selectedFolderPath = await window.electronAPI.selectFolder();
    setSingleSettings((prevSettings) => ({
      ...prevSettings,
      outputFolder: selectedFolderPath,
    }));
  };

  // Logic to confirm the task and add it to the queue
  const handleConfirmTask = () => {
    setIsConfirmed(true);
    addOrUpdateTask({
      id: taskId,
      taskEventNames,
      generalSettings,
      singleSettings,
      folderSettings: {}, // Not used for single conversion
      status: 'confirmed',
    });
  };

  return {
    isConfirmed,
    selectedFile,
    outputFolder,
    progress,
    outputText,
    handleSelectFile,
    handleSelectFolder,
    handleConfirmTask,
  };
};
