// src/modules/Task/TaskWrapper.js

import React, { useState } from 'react'
import { SettingsProvider } from '../../contexts/SingleTaskSettingsContext';
import Task from './Task';
import { v4 as uuidv4 } from 'uuid';


const TaskWrapper = () => {
  const [taskId, setTaskId] = useState(uuidv4())
  return (
    <SettingsProvider taskId={taskId}>
      <Task />
    </SettingsProvider>
  )
}

export default TaskWrapper
