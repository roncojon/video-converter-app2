// src/context/TasksQueueContext.js

import React, { createContext, useState } from 'react';

export const TasksQueueContext = createContext();

export function TasksQueueContextProvider({ children }) {
  // State to manage multiple tasks
  const [tasks, setTasks] = useState({});

  /**
   * Add a new task with default settings.
   * @param {string} taskId - Unique identifier for the task.
   */
  const addTask = (taskId) => {
    setTasks((prevTasks) => ({
      ...prevTasks,
      [taskId]: {
        taskEventNames: {
          eventNameSingleConversion: `conversion-progress-${taskId}`,
          eventNameFolderConversion: `conversion-progress-folder-${taskId}`,
        },
        activeTab: 'single',
        generalSettings: {
          cpuSelection: 0,
          priorityLevel: 'normal',
        },
        singleSettings: {
          progress: {},
          selectedFile: null,
          outputFolder: null,
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
      },
    }));
  };

  /**
   * Update an existing task's settings.
   * @param {string} taskId - Unique identifier for the task.
   * @param {object} updatedSettings - Object with updated properties.
   */
  const updateTask = (taskId, updatedSettings) => {
    setTasks((prevTasks) => ({
      ...prevTasks,
      [taskId]: {
        ...prevTasks[taskId],
        ...updatedSettings,
      },
    }));
  };

  /**
   * Remove a task by its ID.
   * @param {string} taskId - Unique identifier for the task to remove.
   */
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
        addTask,
        updateTask,
        removeTask,
      }}
    >
      {children}
    </TasksQueueContext.Provider>
  );
}
