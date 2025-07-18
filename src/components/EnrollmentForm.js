import React, { useState } from 'react';
import './EnrollmentForm.css';

// EnrollmentForm component for new patient registration
const EnrollmentForm = ({ onRegisterPatient, onCancel, username, onSuccess, onError }) => { // Added onSuccess, onError props
  // State variables to store form input values
  const [informedConsentDate, setInformedConsentDate] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [message, setMessage] = useState(''); // To display local success or error messages
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  // Handles the form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    // Basic validation
    if (!informedConsentDate || !enrollmentDate || !dateOfBirth || !gender) {
      setMessage('Please fill in all fields.');
      setMessageType('error');
      return;
    }

    // Prepare data to be sent to the backend
    const patientData = {
      informedConsentDate,
      enrollmentDate,
      dateOfBirth,
      gender,
      username, // Pass the username to the backend
    };

    try {
      // API endpoint for registering a new patient
      const API_BASE_URL = 'http://127.0.0.1:5000';
      const response = await fetch(`${API_BASE_URL}/register_patient`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      });

      if (!response.ok) {
        // If response is NOT OK, handle it as an error
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
        setMessage(`Error: ${errorMessage}`); // Set local message for display
        setMessageType('error');
        if (onError) { // Call parent's onError if provided
          onError(`Error registering patient: ${errorMessage}`);
        }
        return; // Stop execution here if there's an error
      }

      // If response IS OK, handle it as a success
      const result = await response.json();
      const successMsg = `Patient registered successfully! New Patient ID: ${result.patient_id}`;
      setMessage(successMsg); // Set local message for display
      setMessageType('success');
      if (onSuccess) { // Call parent's onSuccess if provided
        onSuccess(successMsg);
      }

      // Clear the form fields after successful registration
      setInformedConsentDate('');
      setEnrollmentDate('');
      setDateOfBirth('');
      setGender('');

      // Optionally, call a parent function to update patient list or navigate
      if (onRegisterPatient) {
        onRegisterPatient(result.patient_id);
      }

    } catch (err) {
      // This catch block will now only handle network errors or unexpected issues
      console.error("Failed to register patient (network/unexpected error):", err);
      setMessage(`Network error or unexpected issue: ${err.message}`);
      setMessageType('error');
      if (onError) {
        onError(`Network error: ${err.message}`);
      }
    }
  };

  return (
    <div className="enrollment-form-container">
      <h2 className="section-title">New Patient Enrollment</h2>
      {/* Message display area */}
      {message && (
        <div className={`message ${messageType === 'success' ? 'success-message' : 'error-message'}`}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="enrollment-form">
        <div className="form-group">
          <label htmlFor="informedConsentDate">Date of Informed Consent:</label>
          <input
            type="date"
            id="informedConsentDate"
            value={informedConsentDate}
            onChange={(e) => setInformedConsentDate(e.target.value)}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="enrollmentDate">Date of Enrollment:</label>
          <input
            type="date"
            id="enrollmentDate"
            value={enrollmentDate}
            onChange={(e) => setEnrollmentDate(e.target.value)}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="dateOfBirth">Date of Birth:</label>
          <input
            type="date"
            id="dateOfBirth"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="gender">Gender:</label>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
            className="form-input"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="register-button">Register Patient</button>
          <button type="button" onClick={onCancel} className="cancel-button">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default EnrollmentForm;
