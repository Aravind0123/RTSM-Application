import React, { useState, useEffect, useCallback } from 'react';
import './InvestigatorDashboard.css';
import EnrollmentForm from './EnrollmentForm';
// import BottomNavBar from './BottomNavBar'; // REMOVED
import ScreenFailureForm from './ScreenFailureForm';
import MedicalArrivalForm from './MedicalArrivalForm';
import RandomizationForm from './RandomizationForm';
import TreatmentCompletionForm from './TreatmentCompletionForm';
import EmergencyCodeBreakForm from './EmergencyCodeBreakForm';

const InvestigatorDashboard = ({ username, role, userSite, onLogout }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const API_BASE_URL = 'http://127.0.0.1:5000';

  const handleSuccess = (msg) => {
    setMessage(msg);
    setMessageType('success');
    setTimeout(() => {
      setMessage('');
      if (activeView === 'dashboard') {
        fetchPatients();
      } else {
        setActiveView('dashboard');
      }
    }, 3000);
  };

  const handleError = (msg) => {
    setMessage(msg);
    setMessageType('error');
    setTimeout(() => setMessage(''), 5000);
  };

  const handleCancel = () => {
    setActiveView('dashboard');
    setMessage('');
  };

  const fetchPatients = useCallback(async () => {
    if (!username) {
      setError("Username is not available to fetch patient data.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/patients?username=${username}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'No error message from server' }));
        throw new Error(`Failed to fetch patient data: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      if (data && Array.isArray(data.patients)) {
        setPatients(data.patients);
      } else {
        throw new Error("Received data is not in the expected format (missing 'patients' array).");
      }
    } catch (err) {
      console.error("Failed to fetch patient data:", err);
      setError(`Failed to load patient data: ${err.message}. Please check server and network connection.`);
    } finally {
      setLoading(false);
    }
  }, [username, API_BASE_URL]);

  useEffect(() => {
    if (activeView === 'dashboard' && username) {
      fetchPatients();
    }
  }, [activeView, username, fetchPatients]);

  const addPatientHistoryEvent = (patientId, eventType, description, details = {}) => {
    console.log(`Added history for Patient ${patientId}: ${eventType} - ${description}`, details);
    handleSuccess(`Event "${eventType}" added for Patient ${patientId}`);
  };

  const handlePatientRegistered = (newPatientId) => {
    console.log(`New patient registered with ID: ${newPatientId}`);
    handleSuccess(`Patient ${newPatientId} enrolled successfully!`);
  };

  const handleScreenFailureRecorded = (patientId) => {
    console.log(`Screen failure recorded for Patient ID: ${patientId}`);
    handleSuccess(`Screen failure recorded for Patient ID: ${patientId}.`);
  };

  const handleRandomizationSuccess = (patientId, assignedPackId) => {
    console.log(`Patient ${patientId} randomized to ${assignedPackId}`);
    handleSuccess(`Patient ${patientId} randomized successfully to Pack ID: ${assignedPackId}`);
  };

  const handleTreatmentCompletionSuccess = (patientId) => {
    console.log(`Treatment completed for Patient ID: ${patientId}`);
    handleSuccess(`Treatment completed successfully for Patient ID: ${patientId}`);
  };

  const handleCodeBreakSuccess = (patientId) => {
    console.log(`Emergency code break recorded for Patient ID: ${patientId}`);
    handleSuccess(`Emergency Code Break recorded successfully for Patient ID: ${patientId}`);
  };

  return (
    <div className="dashboard-container">
      <nav className="top-navbar">
        <div className="navbar-brand">RTSM Investigator Dashboard</div>
        <ul className="top-nav-links">
          <li><a href="#medical-arrival" className="nav-item" onClick={() => setActiveView('medical-arrival')}>Medical Arrival</a></li>
        </ul>
        <div className="user-info">
          <span>Welcome, {username} ({role})</span>
          <button onClick={onLogout} className="logout-button-dashboard">Logout</button>
        </div>
      </nav>

      <div className="main-content-wrapper">
        <aside className="left-navbar">
          <ul className="left-nav-links">
            <li><a href="#enrollment" className="nav-item" onClick={() => setActiveView('enrollment')}>Enrollment</a></li>
            <li><a href="#screen-failure" className="nav-item" onClick={() => setActiveView('screen-failure')}>Screen Failure</a></li>
            <li><a href="#randomization" className="nav-item" onClick={() => setActiveView('randomization')}>Randomization</a></li>
            <li><a href="#treatment-completion" className="nav-item" onClick={() => setActiveView('treatment-completion')}>Treatment Completion</a></li>
            <li><a href="#emergency-code-break" className="nav-item" onClick={() => setActiveView('emergency-code-break')}>Emergency Code Break</a></li>
            <li><a href="#view-patients" className="nav-item" onClick={() => setActiveView('dashboard')}>View All Patients</a></li>
          </ul>
        </aside>

        <div className="dashboard-content">
          {message && (
            <div className={`form-message ${messageType === 'success' ? 'success-message' : 'error-message'}`}>
              {message}
            </div>
          )}

          {activeView === 'dashboard' && (
            <>
              <h2 className="section-title">All Patients Information</h2>
              {loading && <p className="loading-message">Loading patient data...</p>}
              {error && <p className="error-message">{error}</p>}
              {!loading && !error && patients.length === 0 && (
                <p className="no-data-message">No patient data available.</p>
              )}
              {!loading && !error && patients.length > 0 && (
                <>
                  <div className="patient-table-container">
                    <table className="patient-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Patient Name</th>
                          <th>Status</th>
                          <th>Enrollment Date</th>
                          <th>Treatment</th>
                          <th>Screen Failure Date</th>
                          <th>Completion Date</th>
                          <th>Code Break Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patients.map((patient) => (
                          <tr
                            key={patient.id}
                            className={selectedPatient?.id === patient.id ? 'selected-row' : ''}
                            onClick={() => setSelectedPatient(patient)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td>{patient.id}</td>
                            <td>{patient.patient_name}</td>
                            <td>{patient.status}</td>
                            <td>{patient.enrollment_date}</td>
                            <td>{patient.treatment}</td>
                            <td>{patient.screen_failure_date || 'N/A'}</td>
                            <td>{patient.TRT_Completion_Date || 'N/A'}</td>
                            <td>{patient.code_break || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Removed BottomNavBar */}
                  {/* {selectedPatient && (
                    <BottomNavBar
                      selectedPatient={selectedPatient}
                      addPatientHistoryEvent={addPatientHistoryEvent}
                    />
                  )} */}
                </>
              )}
            </>
          )}

          {activeView === 'enrollment' && (
            <EnrollmentForm
              onRegisterPatient={handlePatientRegistered}
              onCancel={handleCancel}
              username={username}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          )}

          {activeView === 'screen-failure' && (
            <ScreenFailureForm
              onRecordScreenFailure={handleScreenFailureRecorded}
              onCancel={handleCancel}
              username={username}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          )}

          {activeView === 'randomization' && (
            <RandomizationForm
              username={username}
              onSuccess={handleRandomizationSuccess}
              onError={handleError}
              onCancel={handleCancel}
            />
          )}

          {activeView === 'treatment-completion' && (
            <TreatmentCompletionForm
              username={username}
              onSuccess={handleTreatmentCompletionSuccess}
              onError={handleError}
              onCancel={handleCancel}
            />
          )}

          {activeView === 'emergency-code-break' && (
            <EmergencyCodeBreakForm
              username={username}
              onSuccess={handleCodeBreakSuccess}
              onError={handleError}
              onCancel={handleCancel}
            />
          )}

          {activeView === 'medical-arrival' && (
            <MedicalArrivalForm
              onSuccess={handleSuccess}
              onError={handleError}
              onCancel={handleCancel}
              username={username}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestigatorDashboard;