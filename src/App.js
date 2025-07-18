import React, { useState, useEffect } from 'react';
import './App.css';
import InvestigatorDashboard from './components/InvestigatorDashboard';
import DepotDashboard from './components/DepotDashboard';
import MonitorDashboard from './components/MonitorDashboard';
import RtsmAdmin from './components/RtsmAdmin'; // Import the RtsmAdmin component

const App = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [secretCode, setSecretCode] = useState('');
    const [registrationSite, setRegistrationSite] = useState('');
    const [userRole, setUserRole] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUsername, setCurrentUsername] = useState('');
    const [userSite, setUserSite] = useState(null);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [isLoginView, setIsLoginView] = useState(true);
    const [availableSites, setAvailableSites] = useState([]);
    const API_BASE_URL = 'http://127.0.0.1:5000';

    const showMessage = (msg, type) => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
            setMessageType('');
        }, 5000);
    };

    useEffect(() => {
        const fetchSites = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/sites`);
                if (!response.ok) throw new Error(await response.text());
                const data = await response.json();
                setAvailableSites(Array.isArray(data.sites) ? data.sites : []);
            } catch (err) {
                showMessage("Failed to load site data for registration.", "error");
            }
        };
        if (!isLoginView) fetchSites();
        else {
            setAvailableSites([]);
            setRegistrationSite('');
        }
    }, [isLoginView]);

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!username || !password || !secretCode || !registrationSite) {
            showMessage('Please fill in all fields.', 'error');
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, secret_code: secretCode, site: registrationSite }),
            });
            const data = await response.json();
            if (response.ok) {
                showMessage(data.message, 'success');
                setUsername(''); setPassword(''); setSecretCode(''); setRegistrationSite(''); setIsLoginView(true);
            } else showMessage(data.message || 'Registration failed', 'error');
        } catch (error) {
            showMessage(`Registration failed: ${error.message}`, 'error');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!username || !password) {
            showMessage('Please enter username and password.', 'error');
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (response.ok) {
                showMessage(data.message, 'success');
                setIsLoggedIn(true);
                setCurrentUsername(data.username);
                // Ensure role is trimmed and lowercased for consistent comparison
                setUserRole(data.role ? data.role.toLowerCase().trim() : null);
                setUserSite(data.sites);
                setUsername(''); setPassword('');
            } else showMessage(data.message || 'Login failed', 'error');
        } catch (error) {
            showMessage(`Login failed: ${error.message}`, 'error');
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setCurrentUsername('');
        setUserRole(null);
        setUserSite(null);
        showMessage('Logged out successfully.', 'success');
    };

    const handleUserSiteUpdate = async (site) => {
        setUserSite(site);
        try {
            const response = await fetch(`${API_BASE_URL}/update_user_site`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUsername, site }),
            });
            const data = await response.json();
            if (!response.ok) showMessage(`Failed to save site: ${data.message}`, 'error');
            else showMessage(`Site '${site}' saved successfully!`, 'success');
        } catch (error) {
            showMessage(`Error saving site: ${error.message}`, 'error');
        }
    };

    return (
        <div className="app-container">
            <div className="main-content-area">
                {isLoggedIn && userRole === 'admin' ? ( // Check if the user role is 'admin'
                    <RtsmAdmin /> // Render RtsmAdmin component for admin users
                ) : isLoggedIn && userRole === 'investigator' ? (
                    <InvestigatorDashboard {...{ username: currentUsername, role: userRole, userSite, onLogout: handleLogout, onUpdateUserSite: handleUserSiteUpdate }} />
                ) : isLoggedIn && userRole === 'depot' ? (
                    <DepotDashboard {...{ username: currentUsername, role: userRole, onLogout: handleLogout }} />
                ) : isLoggedIn && userRole === 'monitor' ? (
                    <MonitorDashboard {...{ username: currentUsername, role: userRole, userSite, onLogout: handleLogout, onUpdateUserSite: handleUserSiteUpdate }} />
                ) : isLoggedIn ? (
                    <div className="card card-animation">
                        <h1 className="card-title">RTSM Dashboard</h1>
                        {message && <div className={`message ${messageType}`}>{message}</div>}
                        <div className="welcome-text">
                            <p>Welcome, {currentUsername}!</p>
                            <p>Your role is: <span>{userRole}</span></p>
                            <button onClick={handleLogout} className="submit-button logout">Logout</button>
                        </div>
                    </div>
                ) : (
                    <div className="card card-animation">
                        <h1 className="card-title">RTSM {isLoginView ? 'Login' : 'Registration'}</h1>
                        {message && <div className={`message ${messageType}`}>{message}</div>}
                        {isLoginView ? (
                            <form onSubmit={handleLogin} className="form-container">
                                <label>Username<input type="text" className="form-input" value={username} onChange={e => setUsername(e.target.value)} required /></label>
                                <label>Password<input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required /></label>
                                <button type="submit" className="submit-button">Login</button>
                                <p className="toggle-view">Don't have an account? <button type="button" onClick={() => { setIsLoginView(false); setMessage(''); setUsername(''); setPassword(''); setSecretCode(''); setRegistrationSite(''); }} className="toggle-button">Register here</button></p>
                            </form>
                        ) : (
                            <form onSubmit={handleRegister} className="form-container">
                                <label>Username<input type="text" className="form-input" value={username} onChange={e => setUsername(e.target.value)} required /></label>
                                <label>Password<input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required /></label>
                                <label>Secret Code<input type="text" className="form-input" value={secretCode} onChange={e => setSecretCode(e.target.value)} required /></label>
                                <label>Site<select className="form-input" value={registrationSite} onChange={e => setRegistrationSite(e.target.value)} required>
                                    <option value="">-- Select a Site --</option>
                                    {availableSites.length > 0 ? (
                                        availableSites.map((site, index) => {
                                            const value = typeof site === 'string' ? site : site.sites || site.id || site.value || site.name;
                                            const label = typeof site === 'string' ? site : site.site_name || site.name || site.label || site.sites;
                                            return value && label ? <option key={index} value={value}>{label}</option> : null;
                                        })
                                    ) : <option value="" disabled>Loading sites...</option>}
                                </select></label>
                                <button type="submit" className="submit-button">Register</button>
                                <p className="toggle-view">Already have an account? <button type="button" onClick={() => { setIsLoginView(true); setMessage(''); setUsername(''); setPassword(''); setSecretCode(''); setRegistrationSite(''); }} className="toggle-button">Login here</button></p>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
