import React, { createContext, useState } from 'react';

export const TasksQueueContext = createContext();

export function TasksQueueContextProvider({ children }) {

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
