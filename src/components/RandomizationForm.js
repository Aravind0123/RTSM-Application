import React, { useState, useEffect } from 'react';

const RandomizationForm = ({ username, onSuccess, onError, onCancel }) => {
  const [enrolledPatients, setEnrolledPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [patientsError, setPatientsError] = useState(null);

  const API_BASE_URL = 'http://127.0.0.1:5000';

  // Fetch enrolled patients on component mount or when username changes
  useEffect(() => {
    const fetchEnrolledPatients = async () => {
      if (!username) {
        setPatientsError("Username not available to fetch patients.");
        setLoadingPatients(false);
        return;
      }
      try {
        setLoadingPatients(true);
        // Fetch only enrolled patients that are not yet randomized
        const response = await fetch(`${API_BASE_URL}/patients/enrolled?username=${username}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setEnrolledPatients(data.enrolled_patients || []);
      } catch (err) {
        console.error("Failed to fetch enrolled patient data:", err);
        setPatientsError("Failed to load enrolled patients. Please try again later.");
      } finally {
        setLoadingPatients(false);
      }
    };

    fetchEnrolledPatients();
  }, [username]); // Dependency on username

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPatientId) {
      onError('Please select a patient to randomize.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/randomize_patient`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ patientId: selectedPatientId ,"username" : username,}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      // CORRECTED: Pass patient_id and assigned_pack_id as separate arguments
      onSuccess(result.patient_id, result.assigned_pack_id);
      setSelectedPatientId(''); // Clear selection after successful randomization
      // Optionally, re-fetch enrolled patients to update the dropdown
      // fetchEnrolledPatients(); // This would require moving fetchEnrolledPatients outside or making it accessible
    } catch (err) {
      console.error("Failed to randomize patient:", err);
      onError(`Error randomizing patient: ${err.message}`);
    }
  };

  return (
    <div className="form-container">
      <h2 className="section-title">Patient Randomization</h2>
      {patientsError && <div className="form-message error-message">{patientsError}</div>}
      {loadingPatients ? (
        <p className="loading-message">Loading enrolled patients...</p>
      ) : enrolledPatients.length === 0 ? (
        <p className="no-data-message">No enrolled patients available for randomization.</p>
      ) : (
        <form onSubmit={handleSubmit} className="app-form">
          <div className="form-group">
            <label htmlFor="patientSelect">Select Enrolled Patient:</label>
            <select
              id="patientSelect"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              required
              className="form-input"
            >
              <option value="">-- Select Patient --</option>
              {enrolledPatients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.id} - {patient.patient_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-button">Randomize Patient</button>
            <button type="button" onClick={onCancel} className="cancel-button">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default RandomizationForm;
