// import React, { useContext } from 'react';
// import { TasksQueueContextProvider } from './contexts/TasksQueueContext';
// import TaskWrapper from './modules/Task/TaskWrapper';
// import TasksQueue from './modules/TasksQueue/TasksQueue';

// const App = () => {
//   return (
//       <div className="min-h-screen flex flex-col bg-base-200 p-4">
//         {/* Header */}
//         <header className="mb-4">
//           <h1 className="text-3xl font-bold text-center">Video Conversion App</h1>
//         </header>

//         {/* Task Addition */}
//         <div className="mb-6 bg-base-100 rounded-lg shadow p-4">
//           <h2 className="text-xl font-semibold mb-4">Add a New Task</h2>
//           <TaskWrapper />
//         </div>

//         {/* Task Queue */}
//         <div className="bg-base-100 rounded-lg shadow p-4">
//           <h2 className="text-xl font-semibold mb-4">Tasks Queue</h2>
//           <TasksQueue />
//         </div>
//       </div>
//   );
// };

// export default App;

import React, { useContext } from 'react';
import { TasksQueueContextProvider } from './contexts/TasksQueueContext';
import TaskWrapper from './modules/Task/TaskWrapper';
import TasksQueue from './modules/TasksQueue/TasksQueue';

const App = () => {
  return (
    <TaskWrapper />
  );
};

export default App;
