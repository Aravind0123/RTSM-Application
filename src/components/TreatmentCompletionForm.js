import React, { useState, useEffect } from 'react';

const TreatmentCompletionForm = ({ username, onSuccess, onError, onCancel }) => {
  const [eligiblePatients, setEligiblePatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [patientsError, setPatientsError] = useState(null);

  const API_BASE_URL = 'http://127.0.0.1:5000';

  // Fetch eligible patients on component mount or when username changes
  useEffect(() => {
    const fetchEligiblePatients = async () => {
      if (!username) {
        setPatientsError("Username not available to fetch patients.");
        setLoadingPatients(false);
        return;
      }
      try {
        setLoadingPatients(true);
        const response = await fetch(`${API_BASE_URL}/patients/randomized_for_completion?username=${username}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setEligiblePatients(data.eligible_patients || []);
      } catch (err) {
        console.error("Failed to fetch eligible patient data:", err);
        setPatientsError("Failed to load eligible patients. Please try again later.");
      } finally {
        setLoadingPatients(false);
      }
    };

    fetchEligiblePatients();
  }, [username]); // Dependency on username

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPatientId || !completionDate) {
      onError('Please select a patient and enter the completion date.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/complete_treatment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ patientId: selectedPatientId, completionDate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
        onError(`Error recording treatment completion: ${errorMessage}`);
        return;
      }

      const result = await response.json();
      // CORRECTED: Pass only the patient_id to onSuccess
      onSuccess(result.patient_id);
      setSelectedPatientId(''); // Clear selection
      setCompletionDate(''); // Clear date
    } catch (err) {
      console.error("Failed to record treatment completion:", err);
      onError(`Error recording treatment completion: ${err.message}`);
    }
  };

  return (
    <div className="form-container">
      <h2 className="section-title">Record Treatment Completion</h2>
      {patientsError && <div className="form-message error-message">{patientsError}</div>}
      {loadingPatients ? (
        <p className="loading-message">Loading eligible patients...</p>
      ) : eligiblePatients.length === 0 ? (
        <p className="no-data-message">No patients eligible for treatment completion.</p>
      ) : (
        <form onSubmit={handleSubmit} className="app-form">
          <div className="form-group">
            <label htmlFor="patientSelect">Select Patient:</label>
            <select
              id="patientSelect"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              required
              className="form-input"
            >
              <option value="">-- Select Patient --</option>
              {eligiblePatients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.id} - {patient.patient_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="completionDate">Completion Date:</label>
            <input
              type="date"
              id="completionDate"
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-button">Complete Treatment</button>
            <button type="button" onClick={onCancel} className="cancel-button">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TreatmentCompletionForm;
