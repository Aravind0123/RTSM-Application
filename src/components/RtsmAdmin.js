import React, { useState } from 'react';
import './RtsmAdmin.css'; // Your new beautiful CSS

function RtsmAdmin() { // Renamed from App to RtsmAdmin
    // State for Secret Code Generation
    const [investigatorCount, setInvestigatorCount] = useState(0);
    const [depotCount, setDepotCount] = useState(0);
    const [monitorCount, setMonitorCount] = useState(0);
    const [generatedCodes, setGeneratedCodes] = useState([]);

    // State for Site Generation
    const [siteCode, setSiteCode] = useState('');
    const [siteName, setSiteName] = useState('');
    const [activationStatus, setActivationStatus] = useState('Active'); // Default status
    const [activationDate, setActivationDate] = useState('');

    // General UI State
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [currentView, setCurrentView] = useState('secretCode'); // 'secretCode' or 'siteGeneration'

    // --- Secret Code Generation Logic ---
    const generateSecretCode = () => {
        // Simple 12-character alphanumeric code
        return Math.random().toString(36).substring(2, 14).toUpperCase();
    };

    const handleGenerateAndSaveCodes = async () => {
        setGeneratedCodes([]);
        setMessage('');
        setError('');

        const codesToGenerate = [];

        for (let i = 0; i < investigatorCount; i++) {
            codesToGenerate.push({ role: 'Investigator', code: generateSecretCode() });
        }
        for (let i = 0; i < depotCount; i++) {
            codesToGenerate.push({ role: 'Depot', code: generateSecretCode() });
        }
        for (let i = 0; i < monitorCount; i++) {
            codesToGenerate.push({ role: 'Monitor', code: generateSecretCode() });
        }

        if (codesToGenerate.length === 0) {
            setError('Please enter a number of users for at least one role.');
            return;
        }

        setGeneratedCodes(codesToGenerate); // Display codes immediately

        try {
            const response = await fetch('http://localhost:5000/generate_and_save_codes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ codes: codesToGenerate }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                if (data.details) {
                    setError(data.details.join('\n'));
                }
            } else {
                setError(data.error || 'An unknown error occurred while saving codes.');
            }
        } catch (err) {
            console.error('Error saving codes to backend:', err);
            setError('Failed to connect to backend or process request for codes.');
        }
    };

    // --- Site Generation Logic ---
    const handleSaveSiteDetails = async () => {
        setMessage('');
        setError('');

        if (!siteCode || !siteName || !activationStatus || !activationDate) {
            setError('All site details fields are required.');
            return;
        }

        // Basic date format validation (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!activationDate.match(dateRegex)) {
            setError('Site Activation Date must be in YYYY-MM-DD format.');
            return;
        }

        const siteDetails = {
            siteCode,
            siteName,
            activationStatus,
            activationDate,
        };

        try {
            const response = await fetch('http://localhost:5000/save_site_details', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(siteDetails),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                // Clear form fields on success
                setSiteCode('');
                setSiteName('');
                setActivationStatus('Active');
                setActivationDate('');
            } else {
                setError(data.error || 'An unknown error occurred while saving site details.');
            }
        } catch (err) {
            console.error('Error saving site details to backend:', err);
            setError('Failed to connect to backend or process request for site details.');
        }
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <h1>RTSM Admin Panel</h1>
                <div className="view-switcher">
                    <button
                        className={currentView === 'secretCode' ? 'active-view-btn' : ''}
                        onClick={() => {
                            setCurrentView('secretCode');
                            setMessage('');
                            setError('');
                            setGeneratedCodes([]); // Clear generated codes when switching views
                        }}
                    >
                        Secret Code Generation
                    </button>
                    <button
                        className={currentView === 'siteGeneration' ? 'active-view-btn' : ''}
                        onClick={() => {
                            setCurrentView('siteGeneration');
                            setMessage('');
                            setError('');
                            // Clear site form when switching views
                            setSiteCode('');
                            setSiteName('');
                            setActivationStatus('Active');
                            setActivationDate('');
                        }}
                    >
                        Site Generation
                    </button>
                </div>
            </header>

            <main className="main-content">
                {message && <p className="status-message success-message">{message}</p>}
                {error && <p className="status-message error-message">{error}</p>}

                {currentView === 'secretCode' && (
                    <div className="card secret-code-section">
                        <h2>Generate Secret Codes</h2>
                        <div className="input-grid">
                            <div className="input-group">
                                <label htmlFor="investigator">Number of Investigators:</label>
                                <input
                                    type="number"
                                    id="investigator"
                                    min="0"
                                    value={investigatorCount}
                                    onChange={(e) => setInvestigatorCount(parseInt(e.target.value) || 0)}
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="depot">Number of Depots:</label>
                                <input
                                    type="number"
                                    id="depot"
                                    min="0"
                                    value={depotCount}
                                    onChange={(e) => setDepotCount(parseInt(e.target.value) || 0)}
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="monitor">Number of Monitors:</label>
                                <input
                                    type="number"
                                    id="monitor"
                                    min="0"
                                    value={monitorCount}
                                    onChange={(e) => setMonitorCount(parseInt(e.target.value) || 0)}
                                />
                            </div>
                        </div>
                        <button onClick={handleGenerateAndSaveCodes} className="primary-button">Generate & Save Codes</button>

                        {generatedCodes.length > 0 && (
                            <div className="generated-codes-display-section">
                                <h3>Recently Generated Codes:</h3>
                                <div className="code-list">
                                    {generatedCodes.map((item, index) => (
                                        <div key={index} className="code-item">
                                            <strong>{item.role}:</strong> {item.code}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {currentView === 'siteGeneration' && (
                    <div className="card site-generation-section">
                        <h2>Generate Site Details</h2>
                        <div className="input-grid">
                            <div className="input-group">
                                <label htmlFor="siteCode">Site Code:</label>
                                <input
                                    type="text"
                                    id="siteCode"
                                    value={siteCode}
                                    onChange={(e) => setSiteCode(e.target.value)}
                                    placeholder="Enter unique site code"
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="siteName">Site Name:</label>
                                <input
                                    type="text"
                                    id="siteName"
                                    value={siteName}
                                    onChange={(e) => setSiteName(e.target.value)}
                                    placeholder="Enter site name"
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="activationStatus">Activation Status:</label>
                                <select
                                    id="activationStatus"
                                    value={activationStatus}
                                    onChange={(e) => setActivationStatus(e.target.value)}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Pending">Pending</option>
                                </select>
                            </div>

                            <div className="input-group">
                                <label htmlFor="activationDate">Site Activation Date:</label>
                                <input
                                    type="date"
                                    id="activationDate"
                                    value={activationDate}
                                    onChange={(e) => setActivationDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <button onClick={handleSaveSiteDetails} className="primary-button">Save Site Details</button>
                    </div>
                )}
            </main>
        </div>
    );
}

export default RtsmAdmin; // Renamed export
