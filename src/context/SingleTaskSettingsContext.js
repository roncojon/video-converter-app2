// src/contexts/SingleTaskSettingsContext.js
import React, { createContext, useState } from 'react';

export const SingleTaskSettingsContext = createContext();

export function SettingsProvider({ children }) {
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
    converting:false
  });

  const [folderSettings, setFolderSettings] = useState({
    // cpuSelection: 0,
    // priorityLevel: 'normal',
    progress: {},
    selectedFolder: null,
    outputFolder: null,
    outputTextArray: null,
    converting:false
  });

  return (
    <SingleTaskSettingsContext.Provider
      value={{
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
