// src/contexts/SingleTaskSettingsContext.js
import React, { createContext, useState } from 'react';
// import { v4 as uuidv4 } from 'uuid';

export const SingleTaskSettingsContext = createContext();

export function SettingsProvider({ children, taskId}) {
  // const uniqueId = uuidv4(); // Generate the UUID once

  // const [taskId, setTaskId] = useState(taskId);
  const [taskEventNames, setTaskEventNames] = useState({
    eventNameSingleConversion: 'conversion-progress-' + taskId,
    eventNameFolderConversion: 'conversion-progress-folder-' + taskId
  });

  const [activeTab, setActiveTab] = useState("single");

  const [generalSettings, setGeneralSettings] = useState({
    cpuSelection: 0,
    priorityLevel: 'normal',
  });

  const [singleSettings, setSingleSettings] = useState({
    // cpuSelection: 0,
    // priorityLevel: 'normal',
    progress: {},
    selectedFile: null,
    outputFolder: null,
    outputText: null,
    converting: false
  });

  const [folderSettings, setFolderSettings] = useState({
    // cpuSelection: 0,
    // priorityLevel: 'normal',
    progress: {},
    selectedFolder: null,
    outputFolder: null,
    outputTextArray: null,
    converting: false
  });

  return (
    <SingleTaskSettingsContext.Provider
      value={{
        taskId,
        taskEventNames,
        activeTab,
        setActiveTab,
        generalSettings,
        setGeneralSettings,
        singleSettings,
        setSingleSettings,
        folderSettings,
        setFolderSettings,
      }}
    >
      {children}
    </SingleTaskSettingsContext.Provider>
  );
}
