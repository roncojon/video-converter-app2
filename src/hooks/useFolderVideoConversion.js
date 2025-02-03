// src/hooks/useFolderVideoConversion.js
import { useContext } from 'react';
import { SingleTaskSettingsContext } from '../contexts/SingleTaskSettingsContext';
import { TasksQueueContext } from '../contexts/TasksQueueContext';

export const useFolderVideoConversion = () => {
  const { taskEventNames, generalSettings, folderSettings, setFolderSettings, taskId } =
    useContext(SingleTaskSettingsContext);
  const { tasks, addOrUpdateTask } = useContext(TasksQueueContext);

  // Destructure needed values from folderSettings
  const { selectedFolder, outputFolder, progress, converting } = folderSettings;
  // Derive outputTextArray from the global tasks object
  const outputTextArray = tasks[taskId]?.outputText;

  // Handler to select a folder with videos
  const handleSelectFolder = async () => {
    // Reset folder settings
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

  // Handler to select the output folder
  const handleSelectOutputFolder = async () => {
    const selectedOutputPath = await window.electronAPI.selectFolder();
    setFolderSettings((prevSettings) => ({
      ...prevSettings,
      outputFolder: selectedOutputPath,
    }));
  };

  // Handler to confirm the folder conversion task
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
  };

  return {
    selectedFolder,
    outputFolder,
    progress,
    converting,
    outputTextArray,
    handleSelectFolder,
    handleSelectOutputFolder,
    handleConfirmTask,
  };
};
