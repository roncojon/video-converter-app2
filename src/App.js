import React from 'react';
import { TasksQueueContextProvider } from './contexts/TasksQueueContext';
import TasksQueue from './modules/TasksQueue/TasksQueue';
import ThemeSelector from './components/ThemeSelector';

const App = () => {
  return (
    <TasksQueueContextProvider>
      <div className="min-h-screen flex flex-col bg-base-200 p-4">
        {/* Header */}
        {/* <header className="mb-4">
          <h1 className="text-3xl font-bold text-center">Video Conversion App</h1>
        </header> */}

        <header className="flex justify-between items-center mb-4 pr-1">
          <div className=' w-1'></div>
          <h1 className="card-title text-2xl font-bold text-neutral mb-1">
            Mp4 to HLS Video Converter {/* - {taskId} */}
          </h1>
          <ThemeSelector />
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
