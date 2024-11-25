import React from 'react';
import { TasksQueueContextProvider } from './contexts/TasksQueueContext';
import TasksQueue from './modules/TasksQueue/TasksQueue';

const App = () => {
  return (
    <TasksQueueContextProvider>
      <div className="min-h-screen flex flex-col bg-base-200 p-4">
        {/* Header */}
        <header className="mb-4">
          <h1 className="text-3xl font-bold text-center">Video Conversion App</h1>
        </header>

        {/* Task Queue */}
        <TasksQueue />

        {/* Add Task Button */}
        {/* <div className="flex justify-center mt-6">
          <button
            className="btn btn-primary"
            onClick={() =>
              document.dispatchEvent(new Event('add-task'))
            }
          >
            Add Task
          </button>
        </div> */}
      </div>
    </TasksQueueContextProvider>
  );
};

export default App;
