// src/modules/Task/PrioritySettings.js
import React, { useContext, useState } from 'react';
import { SingleTaskSettingsContext } from '../../contexts/SingleTaskSettingsContext';

function PrioritySettings({disabled}) {
  const {
    generalSettings, 
    setGeneralSettings,
  } = useContext(SingleTaskSettingsContext);

  const handlePriorityChange = (event) => {
    const priority = event.target.value;
    setGeneralSettings({ ...generalSettings, priorityLevel: priority });
  };

  const selectedPriority = generalSettings.priorityLevel;

  return (
    <div className="form-control mb-4">
      <label className="label">
        <span className="label-text">Select Process Priority:</span>
      </label>
      <select value={selectedPriority} onChange={handlePriorityChange} className="select select-bordered w-full" disabled={disabled}>
        <option value="low">Low</option>
        <option value="normal">Normal</option>
        <option value="high">High</option>
      </select>
    </div>
  );
}

export default PrioritySettings;
