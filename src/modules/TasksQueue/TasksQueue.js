import React, { useContext, useState } from 'react';
import { TasksQueueContext } from '../../contexts/TasksQueueContext';
import TaskWrapper from '../Task/TaskWrapper';
import { v4 as uuidv4 } from 'uuid';

const TasksQueue = () => {
  const { tasks, addOrUpdateTask, removeTask } = useContext(TasksQueueContext);
  const taskIds = Object.keys(tasks);
  const [expandedTaskId, setExpandedTaskId] = useState(null); // Track expanded task
  const [isProcessing, setIsProcessing] = useState(false); // Track processing state

  const toggleAccordion = (taskId) => {
    setExpandedTaskId((prev) => (prev === taskId ? null : taskId)); // Toggle expanded task
  };

  const handleAddTask = () => {
    const newTaskId = uuidv4();

    const newTask = {
      id: newTaskId,
      taskEventNames: {
        eventNameSingleConversion: `conversion-progress-${newTaskId}`,
        eventNameFolderConversion: `conversion-progress-folder-${newTaskId}`,
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
      status: 'queued',
    };

    addOrUpdateTask(newTask); // Add the new task to the queue
    setExpandedTaskId(newTaskId); // Automatically expand the new task
  };

  const handleStartConversion = async () => {
    setIsProcessing(true);

    for (const taskId of taskIds) {
      const task = tasks[taskId];
      if (task.status === 'confirmed') {
        addOrUpdateTask({ ...task, status: 'in-progress' }); // Mark task as in-progress

        try {
          let result = null;
          if (task.activeTab === 'folder') {
            console.log('task.taskEventNames.eventNameFolderConversion', task.taskEventNames.eventNameFolderConversion)
            result = await window.electronAPI.generateHlsFolder(
              task.folderSettings.selectedFolder,
              task.folderSettings.outputFolder,
              task.generalSettings.cpuSelection.toString() || '0',
              task.generalSettings.priorityLevel || 'normal',
              task.taskEventNames.eventNameFolderConversion
            );
          }
          else {
            // Simulate task processing
            result = await window.electronAPI.generateHls(
              task.singleSettings.selectedFile,
              task.singleSettings.outputFolder,
              task.generalSettings.cpuSelection.toString() || '0',
              task.generalSettings.priorityLevel || 'normal',
              task.taskEventNames.eventNameSingleConversion
            );
          }
          console.log('resultresultresult', result)
          addOrUpdateTask({ ...task, outputText: result, status: 'completed' }); // Mark task as completed
        } catch (error) {
          addOrUpdateTask({
            ...task,
            status: 'error',
            errorMessage: error.message,
          });
        }
      }
    }

    setIsProcessing(false);
  };

  return (
    <div className="container mx-auto p-4 bg-base-100 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Tasks Queue</h2>
      <div className="flex justify-between mb-4">
        <button className="btn btn-primary" onClick={handleAddTask}>
          Add Task
        </button>
        <button
          className="btn btn-success"
          onClick={handleStartConversion}
          disabled={
            isProcessing || !taskIds.some((id) => tasks[id]?.status === 'confirmed')
          }
        >
          {isProcessing ? 'Processing...' : 'Start Conversion'}
        </button>
      </div>
      <ul className="space-y-4">
        {taskIds.length === 0 && (
          <p className="text-gray-500">No tasks in the queue.</p>
        )}
        {taskIds.map((taskId) => (
          <li key={taskId} className="bg-base-200 rounded shadow">
            {/* Task Header */}
            <div
              className="p-4 flex justify-between items-center cursor-pointer hover:bg-base-300"
              onClick={() => toggleAccordion(taskId)}
            >
              <div>
                <p className="font-medium">{`Task: ${taskId}`}</p>
                <p
                  className={`badge ${tasks[taskId]?.status === 'completed'
                    ? 'badge-success'
                    : tasks[taskId]?.status === 'in-progress'
                      ? 'badge-warning'
                      : tasks[taskId]?.status === 'confirmed'
                        ? 'badge-info'
                        : 'badge-error'
                    }`}
                >
                  {tasks[taskId]?.status || 'pending'}
                </p>
              </div>
              <button
                className="btn btn-sm btn-error"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent accordion toggle when clicking remove
                  removeTask(taskId);
                }}
              >
                Remove
              </button>
            </div>

            {/* Task Content (Always Mounted, Visibility Controlled) */}
            <div
              className={`transition-all duration-300 ${expandedTaskId === taskId ? 'block' : 'hidden'
                }`}
            >
              <div className="p-4 bg-base-100">
                <TaskWrapper taskId={taskId} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TasksQueue;
