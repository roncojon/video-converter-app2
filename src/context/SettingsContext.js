// src/contexts/SettingsContext.js
import React, { createContext, useState } from 'react';

export const SettingsContext = createContext();

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
  });

  const [folderSettings, setFolderSettings] = useState({
    // cpuSelection: 0,
    // priorityLevel: 'normal',
    progress: {},
    selectedFolder: null,
    outputFolder: null,
    outputTextArray: null,
  });

  return (
    <SettingsContext.Provider
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
    </SettingsContext.Provider>
  );
}
