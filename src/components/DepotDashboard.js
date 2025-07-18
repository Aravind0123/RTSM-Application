import React, { useState } from 'react';
import RaiseConsignmentForm from './RaiseConsignmentForm';
import MedicalArrivalForm from './DepotMedicalArrivalForm';
import './DepotDashboard.css'; // Custom CSS for Depot Dashboard

const DepotDashboard = ({ username, role, onLogout }) => {
  // State to manage active content view: 'dashboard', 'raise-consignment', 'medical-arrival'
  const [activeView, setActiveView] = useState('dashboard');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Function to handle success messages from forms
  const handleSuccess = (msg) => {
    setMessage(msg);
    setMessageType('success');
    setTimeout(() => {
      setMessage(''); // Clear message after some time
      setActiveView('dashboard'); // Go back to dashboard view
    },10000);
  };

  // Function to handle error messages from forms
  const handleError = (msg) => {
    setMessage(msg);
    setMessageType('error');
    setTimeout(() => setMessage(''),10000); // Clear error message after some time
  };

  // Handle cancellation from any form
  const handleCancel = () => {
    setActiveView('dashboard');
    setMessage(''); // Clear any messages on cancel
  };

  return (
    <div className="depot-dashboard-container">
      {/* Top Navigation Bar */}
      <nav className="top-navbar">
        <div className="navbar-brand">RTSM Depot Dashboard</div>
        <div className="user-info">
          <span>Welcome, {username} ({role})</span>
          <button onClick={onLogout} className="logout-button-dashboard">Logout</button>
        </div>
      </nav>

      <div className="main-content-wrapper">
        {/* Left Navigation Bar */}
        <aside className="left-navbar">
          <ul className="left-nav-links">
            <li><a href="#raise-consignment" className="nav-item" onClick={() => setActiveView('raise-consignment')}>Raise Consignment</a></li>
            <li><a href="#medical-arrival" className="nav-item" onClick={() => setActiveView('medical-arrival')}>Medical Arrival</a></li>
            <li><a href="#view-dashboard" className="nav-item" onClick={() => setActiveView('dashboard')}>View Dashboard</a></li>
          </ul>
        </aside>

        {/* Dashboard Content Area - Conditionally rendered */}
        <div className="dashboard-content">
          {message && (
            <div className={`form-message ${messageType === 'success' ? 'success-message' : 'error-message'}`}>
              {message}
            </div>
          )}

          {activeView === 'dashboard' && (
            <>
              <h2 className="section-title">Depot Overview</h2>
              <p>Welcome to the Depot Dashboard. Use the navigation on the left to manage consignments and medical arrivals.</p>
              {/* You can add more summary information or recent activities here */}
            </>
          )}

          {activeView === 'raise-consignment' && (
            <RaiseConsignmentForm
              onSuccess={handleSuccess}
              onError={handleError}
              onCancel={handleCancel}
            />
          )}

          {activeView === 'medical-arrival' && (
            <MedicalArrivalForm
              onSuccess={handleSuccess}
              onError={handleError}
              onCancel={handleCancel}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DepotDashboard;
