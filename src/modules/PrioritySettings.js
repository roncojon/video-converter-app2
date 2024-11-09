// src/modules/PrioritySettings.js
import React, { useState } from 'react';

function PrioritySettings({ onPriorityChange }) {
  const [selectedPriority, setSelectedPriority] = useState('normal');

  const handlePriorityChange = (event) => {
    const priority = event.target.value;
    setSelectedPriority(priority);
    onPriorityChange(priority); // Notify parent component of the priority selection
  };

  return (
    <div className="form-control mb-4">
      <label className="label">
        <span className="label-text">Select Process Priority:</span>
      </label>
      <select value={selectedPriority} onChange={handlePriorityChange} className="select select-bordered w-full">
        <option value="low">Low</option>
        <option value="normal">Normal</option>
        <option value="high">High</option>
      </select>
    </div>
  );
}

export default PrioritySettings;
