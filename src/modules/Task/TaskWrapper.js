import React from 'react';
import { SettingsProvider } from '../../contexts/SingleTaskSettingsContext';
import Task from './Task';

const TaskWrapper = ({ taskId }) => {
  if (!taskId) {
    return <p className="text-gray-500">No task selected.</p>;
  }

  return (
    <SettingsProvider taskId={taskId}>
      <Task />
    </SettingsProvider>
  );
};

export default TaskWrapper;
