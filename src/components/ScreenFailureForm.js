import React, { useState } from 'react';
import './ScreenFailureForm.css';

// ScreenFailureForm component for recording patient screen failure
const ScreenFailureForm = ({ onRecordScreenFailure, onCancel, username, onSuccess, onError }) => { // Added onSuccess, onError props
  // State variables to store form input values
  const [patientId, setPatientId] = useState('');
  const [screenFailureDate, setScreenFailureDate] = useState('');
  const [message, setMessage] = useState(''); // To display success or error messages
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  // Handles the form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    // Basic validation
    if (!patientId || !screenFailureDate) {
      setMessage('Please fill in all fields.');
      setMessageType('error');
      return;
    }

    // Prepare data to be sent to the backend
    const screenFailureData = {
      patientId,
      screenFailureDate,
      username, // Pass the username to the backend
    };

    try {
      // API endpoint for recording screen failure
      const API_BASE_URL = 'http://127.0.0.1:5000';
      const response = await fetch(`${API_BASE_URL}/record_screen_failure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(screenFailureData),
      });

      if (!response.ok) {
        // If response is NOT OK, handle it as an error
        const errorData = await response.json();
        const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
        setMessage(`Error: ${errorMessage}`); // Set local message for display
        setMessageType('error');
        if (onError) { // Call parent's onError if provided
          onError(`Error recording screen failure: ${errorMessage}`);
        }
        return; // Stop execution here if there's an error
      }

      // If response IS OK, handle it as a success
      const result = await response.json();
      const successMsg = `Screen failure recorded successfully for Patient ID: ${result.patient_id}`;
      setMessage(successMsg); // Set local message for display
      setMessageType('success');
      if (onSuccess) { // Call parent's onSuccess if provided
        onSuccess(successMsg);
      }

      // Clear the form fields after successful registration
      setPatientId('');
      setScreenFailureDate('');

      // Optionally, call a parent function to update patient list or navigate
      if (onRecordScreenFailure) {
        onRecordScreenFailure(result.patient_id);
      }

    } catch (err) {
      // This catch block will now only handle network errors or unexpected issues
      console.error("Failed to record screen failure (network/unexpected error):", err);
      setMessage(`Network error or unexpected issue: ${err.message}`);
      setMessageType('error');
      if (onError) {
        onError(`Network error: ${err.message}`);
      }
    }
  };

  return (
    <div className="screen-failure-form-container">
      <h2 className="section-title">Record Patient Screen Failure</h2>
      {/* Message display area */}
      {message && (
        <div className={`message ${messageType === 'success' ? 'success-message' : 'error-message'}`}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="screen-failure-form">
        <div className="form-group">
          <label htmlFor="patientId">Patient ID:</label>
          <input
            type="text"
            id="patientId"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            required
            className="form-input"
            placeholder="PATXXX"
          />
        </div>

        <div className="form-group">
          <label htmlFor="screenFailureDate">Screen Failure Date:</label>
          <input
            type="date"
            id="screenFailureDate"
            value={screenFailureDate}
            onChange={(e) => setScreenFailureDate(e.target.value)}
            required
            className="form-input"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="record-button">Record Screen Failure</button>
          <button type="button" onClick={onCancel} className="cancel-button">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default ScreenFailureForm;
