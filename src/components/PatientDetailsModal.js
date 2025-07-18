// src/components/PatientDetailsModal.js
import React from 'react';

const PatientDetailsModal = ({
  selectedPatient,
  patientHistory,
  editPatientData,
  handleEditPatientChange,
  handleUpdatePatient,
  closePatientDetails,
}) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto transform scale-95 animate-scale-in">
        <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
          Patient Details: {selectedPatient.patientId}
        </h3>

        {/* Patient Data Modification Form */}
        <form onSubmit={handleUpdatePatient} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-blue-50 p-4 rounded-lg">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1">Consent Date:</label>
            <input type="date" name="informedConsentDate" value={editPatientData.informedConsentDate || ''} onChange={handleEditPatientChange} className="form-input w-full rounded-md border-gray-300 shadow-sm"/>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1">Enrollment Date:</label>
            <input type="date" name="enrollmentDate" value={editPatientData.enrollmentDate || ''} onChange={handleEditPatientChange} className="form-input w-full rounded-md border-gray-300 shadow-sm"/>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1">Date of Birth:</label>
            <input type="date" name="dateOfBirth" value={editPatientData.dateOfBirth || ''} onChange={handleEditPatientChange} className="form-input w-full rounded-md border-gray-300 shadow-sm"/>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1">Gender:</label>
            <select name="gender" value={editPatientData.gender || ''} onChange={handleEditPatientChange} className="form-select w-full rounded-md border-gray-300 shadow-sm">
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1">Status:</label>
            <input type="text" name="status" value={editPatientData.status || ''} onChange={handleEditPatientChange} className="form-input w-full rounded-md border-gray-300 shadow-sm"/>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1">Current Visit:</label>
            <input type="text" name="currentVisit" value={editPatientData.currentVisit || ''} onChange={handleEditPatientChange} className="form-input w-full rounded-md border-gray-300 shadow-sm"/>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1">Site ID:</label>
            <input type="text" name="siteId" value={editPatientData.siteId || ''} onChange={handleEditPatientChange} className="form-input w-full rounded-md border-gray-300 shadow-sm"/>
          </div>
          <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
            <button
              type="button"
              onClick={closePatientDetails}
              className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Save Changes
            </button>
          </div>
        </form>

        {/* Patient History */}
        <h4 className="text-xl font-bold text-gray-800 mb-3 border-b pb-2 mt-6">Patient History</h4>
        {patientHistory.length === 0 ? (
          <p className="text-gray-600">No history records for this patient.</p>
        ) : (
          <div className="space-y-4">
            {patientHistory.map((record) => (
              <div key={record.id} className="bg-gray-100 p-3 rounded-lg shadow-sm">
                <p className="font-semibold text-gray-800">{record.eventType} - <span className="text-sm text-gray-600">{record.eventDate}</span></p>
                {record.description && <p className="text-gray-700 text-sm mt-1">{record.description}</p>}
                {record.details && Object.keys(record.details).length > 0 && (
                  <div className="text-xs text-gray-500 mt-2">
                    <span className="font-medium">Details:</span> {JSON.stringify(record.details)}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Recorded by: {record.recordedBy} on {new Date(record.recordedAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetailsModal;
