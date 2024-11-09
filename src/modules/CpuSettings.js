// src/modules/CpuSettings.js
import React, { useState, useEffect } from 'react';

function CpuSettings({ onCpuSelection }) {
    const [cpuCount, setCpuCount] = useState(0);
    const [selectedCpus, setSelectedCpus] = useState(0);

    useEffect(() => {
        // Fetch the number of available CPUs from the Electron backend
        const fetchCpuCount = async () => {
            try {
                const count = await window.electronAPI.getCpuCount();
                console.log('CpuSettingsCount:', count);
                setCpuCount(count);
                setSelectedCpus(count); // Default to all CPUs
                onCpuSelection(count); // Notify parent of the initial selection
            } catch (error) {
                console.log('CpuSettingsError:', error)
            }

        };

        fetchCpuCount();
    }, []);

    const handleCpuChange = (event) => {
        const value = parseInt(event.target.value, 10);
        setSelectedCpus(value);
        onCpuSelection(value); // Notify parent of the selection change
    };

    return (
        <div className="form-control mb-4">
            <label className="label">
                <span className="label-text">Select Number of CPUs to Use:</span>
            </label>
            <select value={selectedCpus} onChange={handleCpuChange} className="select select-bordered w-full">
                {[...Array(cpuCount).keys()].map(i => (
                    <option key={i + 1} value={i + 1}>
                        {i + 1} CPU{i + 1 > 1 ? 's' : ''}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default CpuSettings;
