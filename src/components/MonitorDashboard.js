import React, { useState, useEffect, useCallback } from 'react';
import './MonitorDashboard.css';
import EmergencyCodeBreakForm from './MonitorEmergencyCodeBreakForm';

const MonitorDashboard = ({ username, role, userSite: userSiteProp, onLogout }) => {
  const [patients, setPatients] = useState([]);
  const [codeBrokenPatients, setCodeBrokenPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingCodeBroken, setLoadingCodeBroken] = useState(true);
  const [patientsError, setPatientsError] = useState(null);
  const [codeBrokenError, setCodeBrokenError] = useState(null);
  const [localUserSite, setLocalUserSite] = useState(userSiteProp);
  const [activeView, setActiveView] = useState('dashboard');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const API_BASE_URL = 'http://127.0.0.1:5000'; // Your Flask backend URL

  const handleSuccess = (msg) => {
    setMessage(msg);
    setMessageType('success');
    setTimeout(() => {
      setMessage('');
      setActiveView('dashboard');
      fetchPatients();
      fetchCodeBrokenPatients();
    }, 5000);
  };

  const handleError = (msg) => {
    setMessage(msg);
    setMessageType('error');
    setTimeout(() => setMessage(''), 7000);
  };

  const handleCancel = () => {
    setActiveView('dashboard');
    setMessage('');
  };

  const fetchUserSite = useCallback(async () => {
    if (!username) {
      console.warn("MonitorDashboard: Cannot fetch user site: username is missing.");
      setPatientsError("Authentication error: Username missing. Please relogin.");
      setLocalUserSite(null);
      return;
    }

    try {
      console.log(`MonitorDashboard: userSiteProp not available or invalid, attempting to fetch user site for ${username}...`);
      const response = await fetch(`${API_BASE_URL}/monitor/get_user_site?username=${username}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("MonitorDashboard: Raw response for get_user_site:", errorText);
        let errorMsg = `Failed to fetch user site: status ${response.status}`;
        try {
            const errorData = JSON.parse(errorText);
            errorMsg = errorData.message || errorData.error || errorMsg;
        } catch (jsonParseError) {
            errorMsg = `Failed to fetch user site: Backend returned non-JSON response. Status: ${response.status}. ` +
                       `Content starts with: "${errorText.substring(0, 100)}..."`;
            console.error("MonitorDashboard: JSON parse error during fetchUserSite:", jsonParseError);
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      if (data.userSite) {
        console.log(`MonitorDashboard: Fetched user site: ${data.userSite} for ${username}`);
        setLocalUserSite(data.userSite);
        setPatientsError(null);
        setCodeBrokenError(null);
      } else {
        setLocalUserSite(null);
        setPatientsError(`No site found for user ${username}. Data cannot be displayed.`);
        setCodeBrokenError(`No site found for user ${username}. Data cannot be displayed.`);
        console.warn(`MonitorDashboard: No site found for user ${username} from backend. Data:`, data);
      }
    } catch (err) {
      console.error("MonitorDashboard: Error during fetchUserSite:", err);
      setPatientsError(`Failed to determine user site: ${err.message}. Data cannot be displayed.`);
      setLocalUserSite(null);
    }
  }, [username]);

  const fetchPatients = useCallback(async () => {
    if (localUserSite === undefined || localUserSite === null) {
      console.warn("MonitorDashboard: fetchPatients: userSite is null/undefined, skipping fetch.");
      setPatientsError("User site not assigned. Cannot fetch patient data.");
      setLoadingPatients(false); // Ensure loading is false if skipped
      setPatients([]);
      return;
    }

    try {
      setLoadingPatients(true);
      setPatientsError(null);
      console.log(`MonitorDashboard: Fetching all patients for site ${localUserSite} (user: ${username})...`);
      const response = await fetch(`${API_BASE_URL}/monitor/patients?username=${username}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPatients(data.patients || []);
      console.log(`MonitorDashboard: Fetched ${data.patients.length} all patients.`);
    } catch (err) {
      console.error("MonitorDashboard: Failed to fetch patient data:", err);
      setPatientsError(err.message || "Failed to load patient data. Please try again later.");
      setPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  }, [localUserSite, username]); // Dependencies for fetchPatients are correct

  const fetchCodeBrokenPatients = useCallback(async () => {
    if (localUserSite === undefined || localUserSite === null) {
      console.warn("MonitorDashboard: fetchCodeBrokenPatients: userSite is null/undefined, skipping fetch.");
      setCodeBrokenError("User site not assigned. Cannot fetch code broken patient data.");
      setLoadingCodeBroken(false); // Ensure loading is false if skipped
      setCodeBrokenPatients([]);
      return;
    }

    try {
      setLoadingCodeBroken(true);
      setCodeBrokenError(null);
      console.log(`MonitorDashboard: Fetching code-broken patients for site ${localUserSite} (user: ${username})...`);
      const response = await fetch(`${API_BASE_URL}/monitor/code_broken_by_site?username=${username}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCodeBrokenPatients(data.code_broken_patients || []);
      console.log(`MonitorDashboard: Fetched ${data.code_broken_patients.length} code-broken patients.`);
    } catch (err) {
      console.error("MonitorDashboard: Failed to fetch code broken patient data:", err);
      setCodeBrokenError(err.message || "Failed to load code broken patient data. Please try again later.");
      setCodeBrokenPatients([]);
    } finally {
      setLoadingCodeBroken(false);
    }
  }, [localUserSite, username]); // Dependencies for fetchCodeBrokenPatients are correct

  // Effect for determining and setting user site (runs once or when prop/username changes)
  useEffect(() => {
    if (userSiteProp !== undefined && userSiteProp !== null) {
      if (localUserSite !== userSiteProp) {
        console.log(`MonitorDashboard: Using userSite from prop: ${userSiteProp}`);
        setLocalUserSite(userSiteProp);
        setPatientsError(null);
        setCodeBrokenError(null);
      }
    } else if (username && (localUserSite === undefined || localUserSite === null)) {
      console.log(`MonitorDashboard: userSiteProp not available or invalid, attempting to fetch user site for ${username}...`);
      fetchUserSite();
    }
  }, [userSiteProp, username, localUserSite, fetchUserSite]);

  // Effect for fetching patients and code broken patients when dependencies change
  // Removed loadingPatients and loadingCodeBroken from dependencies to prevent infinite loop
  useEffect(() => {
    if (activeView === 'dashboard') {
      if (localUserSite !== undefined && localUserSite !== null) {
        fetchPatients();
        fetchCodeBrokenPatients();
      } else if (username) { // Only check username here, loading states are handled by fetch functions
        // If localUserSite is still null/undefined after fetchUserSite tried, show errors
        if (!loadingPatients && !loadingCodeBroken) { // Only set error if fetches have completed
            setPatientsError("User is not assigned to a site. Data cannot be displayed. (Failed to retrieve site information)");
            setCodeBrokenError("User is not assigned to a site. Data cannot be displayed. (Failed to retrieve site information)");
            setPatients([]);
            setCodeBrokenPatients([]);
        }
      } else if (!username) {
          setPatientsError("Authentication error: User information missing. Please log in.");
          setCodeBrokenError("Authentication error: User information missing. Please log in.");
          setPatients([]);
          setCodeBrokenPatients([]);
      }
    }
  }, [activeView, localUserSite, username, fetchPatients, fetchCodeBrokenPatients]); // FIXED: Removed loadingPatients, loadingCodeBroken

  const handleCodeBreakSuccess = (patientId) => {
    handleSuccess(`Emergency Code Break recorded successfully for Patient ID: ${patientId}`);
  };

  return (
    <div className="monitor-dashboard-container">
      <nav className="top-navbar">
        <div className="navbar-brand">RTSM Monitor Dashboard</div>
        <ul className="top-nav-links">
          <li>
            <a href="#emergency-code-break" className="nav-item" onClick={() => setActiveView('emergency-code-break')}>
              Emergency Code Break
            </a>
          </li>
          <li>
            <a href="#view-patients" className="nav-item" onClick={() => setActiveView('dashboard')}>
              View All Patients
            </a>
          </li>
        </ul>
        <div className="user-info">
          <span>Welcome, {username} ({role}) - Site: {localUserSite || 'N/A'}</span>
          <button onClick={onLogout} className="logout-button-dashboard">Logout</button>
        </div>
      </nav>

      <div className="main-content-wrapper">
        {message && (
          <div className={`form-message ${messageType === 'success' ? 'success-message' : 'error-message'}`}>
            {message}
          </div>
        )}

        {activeView === 'dashboard' && (
          <div className="dashboard-content">
            <h2>All Patients</h2>
            {loadingPatients ? (
              <p>Loading all patients...</p>
            ) : patientsError ? (
              <p className="error-message">{patientsError}</p>
            ) : patients.length === 0 ? (
              <p>No patients found for your site.</p>
            ) : (
              <div className="table-container">
                <table className="patients-table">
                  <thead>
                    <tr>
                      <th>Patient ID</th>
                      <th>Site ID</th>
                      <th>Status</th>
                      {/* Add more headers as needed */}
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map(patient => (
                      <tr key={patient.patient_id}>
                        <td>{patient.patient_id}</td>
                        <td>{patient.site_id}</td>
                        <td>{patient.status}</td>
                        {/* Add more data cells as needed */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h2 className="code-broken-header">Code Broken Patients</h2>
            {loadingCodeBroken ? (
              <p>Loading code broken patients...</p>
            ) : codeBrokenError ? (
              <p className="error-message">{codeBrokenError}</p>
            ) : codeBrokenPatients.length === 0 ? (
              <p>No code broken patients found for your site.</p>
            ) : (
              <div className="table-container">
                <table className="patients-table">
                  <thead>
                    <tr>
                      <th>Patient ID</th>
                      <th>Site ID</th>
                      <th>Date Broken</th>
                      {/* Add more headers as needed */}
                    </tr>
                  </thead>
                  <tbody>
                    {codeBrokenPatients.map(patient => (
                      <tr key={patient.patient_id}>
                        <td>{patient.patient_id}</td>
                        <td>{patient.status}</td>
                        <td>{patient.code_break|| 'N/A'}</td>
                        {/* Add more data cells as needed */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeView === 'emergency-code-break' && (
          <EmergencyCodeBreakForm
            username={username}
            userSite={localUserSite}
            onSuccess={handleCodeBreakSuccess}
            onError={handleError}
            onCancel={handleCancel}
            API_BASE_URL={API_BASE_URL}
          />
        )}
      </div>
    </div>
  );
};

export default MonitorDashboard;