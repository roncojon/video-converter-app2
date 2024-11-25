import React, { createContext, useState } from 'react';

export const TasksQueueContext = createContext();

export function TasksQueueContextProvider({ children }) {
  // Initial mock tasks for testing
  const initialTasks = {
    'task-1': {
      taskId: 'task-1',
      taskEventNames: {
        eventNameSingleConversion: 'conversion-progress-task-1',
        eventNameFolderConversion: 'conversion-progress-folder-task-1',
      },
      activeTab: 'single',
      generalSettings: {
        cpuSelection: 1,
        priorityLevel: 'high',
      },
      singleSettings: {
        progress: {},
        selectedFile: '/path/to/video1.mp4',
        outputFolder: '/output/folder1',
        outputText: null,
        converting: false,
      },
      folderSettings: {
        progress: {},
        selectedFolder: null,
        outputFolder: null,
        outputTextArray: null,
        converting: false,
      },
      status: 'queued',
    },
    'task-2': {
      taskId: 'task-2',
      taskEventNames: {
        eventNameSingleConversion: 'conversion-progress-task-2',
        eventNameFolderConversion: 'conversion-progress-folder-task-2',
      },
      activeTab: 'folder',
      generalSettings: {
        cpuSelection: 0,
        priorityLevel: 'normal',
      },
      singleSettings: {
        progress: {},
        selectedFile: '/path/to/video2.mp4',
        outputFolder: '/output/folder2',
        outputText: null,
        converting: true,
      },
      folderSettings: {
        progress: {},
        selectedFolder: '/input/folder2',
        outputFolder: '/output/folder2',
        outputTextArray: null,
        converting: true,
      },
      status: 'converting',
    },
    'task-3': {
      taskId: 'task-3',
      taskEventNames: {
        eventNameSingleConversion: 'conversion-progress-task-3',
        eventNameFolderConversion: 'conversion-progress-folder-task-3',
      },
      activeTab: 'single',
      generalSettings: {
        cpuSelection: 2,
        priorityLevel: 'low',
      },
      singleSettings: {
        progress: {},
        selectedFile: '/path/to/video3.mp4',
        outputFolder: '/output/folder3',
        outputText: null,
        converting: false,
      },
      folderSettings: {
        progress: {},
        selectedFolder: null,
        outputFolder: null,
        outputTextArray: null,
        converting: false,
      },
      status: 'queued',
    },
  };

  const [tasks, setTasks] = useState({});

  const addOrUpdateTask = (task) => {
    const { id } = task;
  
    if (!id) {
      console.error('Task ID is required to add or update a task.', task); // Log the task for debugging
      return;
    }
  
    setTasks((prevTasks) => ({
      ...prevTasks,
      [id]: task,
    }));
  };
  

  const removeTask = (taskId) => {
    setTasks((prevTasks) => {
      const updatedTasks = { ...prevTasks };
      delete updatedTasks[taskId];
      return updatedTasks;
    });
  };

  return (
    <TasksQueueContext.Provider
      value={{
        tasks,
        addOrUpdateTask,
        removeTask,
      }}
    >
      {children}
    </TasksQueueContext.Provider>
  );
}
