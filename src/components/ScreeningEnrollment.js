// src/components/ScreeningEnrollment.js
import React, { useState } from 'react';

const ScreeningEnrollment = ({ userId, API_BASE_URL, setLoading, setError, fetchPatients, setActiveTab, addPatientHistoryEvent }) => {
  const [informedConsentDate, setInformedConsentDate] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [patientIdCounter, setPatientIdCounter] = useState(parseInt(localStorage.getItem('lastPatientId') || '0'));
  const [generatedPatientId, setGeneratedPatientId] = useState('');
  const [patientSiteId, setPatientSiteId] = useState('');

  // Handle generating Patient ID
  const generatePatientId = () => {
    const newCounter = patientIdCounter + 1;
    const newPatientId = `PID-${String(newCounter).padStart(3, '0')}`;
    setGeneratedPatientId(newPatientId);
    setPatientIdCounter(newCounter);
    localStorage.setItem('lastPatientId', String(newCounter));
  };

  // Handle adding a new patient
  const handleAddPatient = async (e) => {
    e.preventDefault();
    if (!userId) {
      setError("User not authenticated. Cannot add patient.");
      return;
    }
    if (!generatedPatientId || !informedConsentDate || !enrollmentDate || !dateOfBirth || !gender || !patientSiteId) {
      setError("Please fill all patient screening fields and generate Patient ID.");
      return;
    }

    setLoading(true);
    try {
      const newPatient = {
        patientId: generatedPatientId,
        informedConsentDate,
        enrollmentDate,
        dateOfBirth,
        gender,
        status: 'Screened', // Initial status
        currentVisit: 'Screening', // Initial visit
        siteId: patientSiteId,
      };

      const response = await fetch(`${API_BASE_URL}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      // Add screening/enrollment history
      await addPatientHistoryEvent(result.id, 'Screening', 'Patient screened and enrolled.', {
        patientId: generatedPatientId,
        informedConsentDate,
        enrollmentDate,
        dateOfBirth,
        gender,
        siteId: patientSiteId,
      });

      setInformedConsentDate('');
      setEnrollmentDate('');
      setDateOfBirth('');
      setGender('');
      setGeneratedPatientId('');
      setPatientSiteId('');
      setError(null);
      fetchPatients(); // Refresh patient list on dashboard
      setActiveTab('investigatorDashboard'); // Go to dashboard after adding
      console.log("Patient added successfully:", result);
    } catch (err) {
      console.error("Error adding patient:", err);
      setError(`Failed to add patient: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Screening & Enrollment</h2>
      <p className="text-gray-700 leading-relaxed mb-6">
        Enter participant details to screen and enroll them into the study.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Informed Consent Date */}
        <div>
          <label htmlFor="consentDate" className="block text-gray-700 text-sm font-semibold mb-2">
            Date of Informed Consent:
          </label>
          <input
            type="date"
            id="consentDate"
            className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            value={informedConsentDate}
            onChange={(e) => setInformedConsentDate(e.target.value)}
            required
          />
        </div>

        {/* Enrollment Date */}
        <div>
          <label htmlFor="enrollmentDate" className="block text-gray-700 text-sm font-semibold mb-2">
            Date of Enrollment:
          </label>
          <input
            type="date"
            id="enrollmentDate"
            className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            value={enrollmentDate}
            onChange={(e) => setEnrollmentDate(e.target.value)}
            required
          />
        </div>

        {/* Date of Birth */}
        <div>
          <label htmlFor="dob" className="block text-gray-700 text-sm font-semibold mb-2">
            Date of Birth:
          </label>
          <input
            type="date"
            id="dob"
            className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
          />
        </div>

        {/* Gender */}
        <div>
          <label htmlFor="gender" className="block text-gray-700 text-sm font-semibold mb-2">
            Gender:
          </label>
          <select
            id="gender"
            className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Site ID for Patient */}
        <div>
          <label htmlFor="patientSiteId" className="block text-gray-700 text-sm font-semibold mb-2">
            Patient's Site ID:
          </label>
          <input
            type="text"
            id="patientSiteId"
            className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            value={patientSiteId}
            onChange={(e) => setPatientSiteId(e.target.value)}
            placeholder="e.g., Site001"
            required
          />
        </div>
      </div>

      {/* Patient ID Generation */}
      <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg shadow-inner mb-6">
        <button
          onClick={generatePatientId}
          type="button" // Important: prevent form submission
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
        >
          Generate Patient ID
        </button>
        {generatedPatientId && (
          <p className="text-xl font-semibold text-blue-800">
            Patient ID: <span className="text-blue-600">{generatedPatientId}</span>
          </p>
        )}
      </div>

      <button
        onClick={handleAddPatient}
        type="submit"
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
      >
        Enroll Patient
      </button>

      <p className="mt-4 text-gray-600 text-sm">
        Last updated: July 11, 2025
      </p>
    </div>
  );
};

export default ScreeningEnrollment;
