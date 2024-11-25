// src/modules/Task/CpuSettings.js
import React, { useState, useEffect, useContext } from 'react';
import { SingleTaskSettingsContext } from '../../contexts/SingleTaskSettingsContext';

function CpuSettings({disabled}) {
    const {
        generalSettings, 
        setGeneralSettings,
      } = useContext(SingleTaskSettingsContext);

    const [cpuCount, setCpuCount] = useState(0);

    useEffect(() => {
        // Fetch the number of available CPUs from the Electron backend
        const fetchCpuCount = async () => {
            try {
                const count = await window.electronAPI.getCpuCount();
                console.log('CpuSettingsCount:', count);
                setCpuCount(count);
                setGeneralSettings({ ...generalSettings, cpuSelection: count });
            } catch (error) {
                console.log('CpuSettingsError:', error)
            }

        };
        fetchCpuCount();
    }, []);

    const handleCpuChange = (event) => {
        const value = parseInt(event.target.value, 10);
        // setSelectedCpus(value);
        setGeneralSettings({ ...generalSettings, cpuSelection: value });
    };

    const selectedCpus = generalSettings.cpuSelection;

    return (
        <div className="form-control mb-4">
            <label className="label">
                <span className="label-text">Select Number of CPUs to Use:</span>
            </label>
            <select value={selectedCpus} onChange={handleCpuChange} className="select select-bordered w-full" disabled={disabled}>
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
