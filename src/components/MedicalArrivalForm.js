import React, { useState, useEffect } from 'react';

const MedicalArrivalForm = ({ onSuccess, onError, onCancel, username }) => {
  const [selectedShipmentId, setSelectedShipmentId] = useState('');
  const [status, setStatus] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [notes, setNotes] = useState('');
  const [pendingShipments, setPendingShipments] = useState([]);
  const [loadingShipments, setLoadingShipments] = useState(true);
  const [internalUserSite, setInternalUserSite] = useState(null); // New state to store user's site fetched internally
  const [loadingUserSite, setLoadingUserSite] = useState(true); // New state for loading user site

  const API_BASE_URL = 'http://127.0.0.1:5000';

  // Effect to fetch the user's site based on username
  useEffect(() => {
    const fetchUserSite = async () => {
      if (!username) {
        setLoadingUserSite(false);
        return; // Don't fetch if username is not available
      }

      setLoadingUserSite(true);
      try {
        const response = await fetch(`${API_BASE_URL}/get_user_site?username=${username}`);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        if (data && data.site) {
          setInternalUserSite(data.site);
        } else {
          console.warn("Backend response for user site is missing 'site' key:", data);
          setInternalUserSite(null);
        }
      } catch (err) {
        console.error("Failed to fetch user site:", err);
        onError("Failed to load user site. Please try again.");
      } finally {
        setLoadingUserSite(false);
      }
    };

    fetchUserSite();
  }, [username, onError]); // Re-run when username changes

  // Effect to fetch pending shipments when internalUserSite is available
  useEffect(() => {
    const fetchPendingShipments = async () => {
      if (!internalUserSite) { // Use internalUserSite here
        setLoadingShipments(false);
        return; // Don't fetch if internalUserSite is not available yet
      }

      setLoadingShipments(true);
      try {
        const response = await fetch(`${API_BASE_URL}/pending_shipments?site=${internalUserSite}`);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        if (data && Array.isArray(data.shipments)) {
          setPendingShipments(data.shipments);
        } else {
          console.warn("Backend response for pending shipments is not an array or is missing 'shipments' key:", data);
          setPendingShipments([]);
        }
      } catch (err) {
        console.error("Failed to fetch pending shipments:", err);
        onError("Failed to load pending shipments. Please try again.");
      } finally {
        setLoadingShipments(false);
      }
    };

    fetchPendingShipments();
  }, [internalUserSite, onError]); // Re-run when internalUserSite changes

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedShipmentId || !status || !arrivalDate) {
      onError('Please fill in all required fields, including selecting a shipment.');
      return;
    }

    const arrivalData = {
      shipmentId: selectedShipmentId,
      status,
      arrivalDate,
      notes,
      username
    };

    try {
      const response = await fetch(`${API_BASE_URL}/record_medical_arrival`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(arrivalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.status === 'Duplicate') {
        onSuccess(`Shipment is Already Arrived`);
      } else if (result.status === 'Invalid') {
        onSuccess(`Shipment ${result.shipment_id} is ${result.status}!`);
      } else {
        onSuccess(`Shipment ${result.shipment_id} is ${result.status} Successfully!`);
      }
      // Clear form
      setSelectedShipmentId('');
      setStatus('');
      setArrivalDate('');
      setNotes('');
      // Re-fetch pending shipments to update the list
      setLoadingShipments(true);
      const pendingShipmentsResponse = await fetch(`${API_BASE_URL}/pending_shipments?site=${internalUserSite}`); // Use internalUserSite here
      const data = await pendingShipmentsResponse.json();
      if (data && Array.isArray(data.shipments)) {
        setPendingShipments(data.shipments);
      } else {
        setPendingShipments([]);
      }
      setLoadingShipments(false);
    } catch (err) {
      console.error("Failed to record medical arrival:", err);
      onError(`Error recording medical arrival: ${err.message}`);
    }
  };

  return (
    <div className="form-container">
      <h2 className="section-title">Record Medical Shipment Arrival</h2>
      <form onSubmit={handleSubmit} className="app-form">
        <div className="form-group">
          <label htmlFor="shipmentId">Shipment ID:</label>
          <select
            id="shipmentId"
            value={selectedShipmentId}
            onChange={(e) => setSelectedShipmentId(e.target.value)}
            required
            className="form-input"
            disabled={loadingShipments || loadingUserSite || !internalUserSite || pendingShipments.length === 0}
          >
            <option value="">
              {loadingUserSite ? 'Fetching user site...' :
               !internalUserSite ? 'User site not found. Cannot fetch shipments.' :
               loadingShipments ? 'Loading shipments...' :
               pendingShipments.length === 0 ? 'No pending shipments' : '-- Select a Shipment ID --'}
            </option>
            {pendingShipments.map((shipment) => (
              <option key={shipment.id || shipment} value={shipment.id || shipment}>
                {shipment.id || shipment}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="status">Arrival Status:</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
            className="form-input"
          >
            <option value="">Select Status</option>
            <option value="Arrived">Arrived</option>
            <option value="Damaged">Damaged</option>
            <option value="Quarantined">Quarantined</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="arrivalDate">Arrival Date:</label>
          <input
            type="date"
            id="arrivalDate"
            value={arrivalDate}
            onChange={(e) => setArrivalDate(e.target.value)}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes (Optional):</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="form-input"
            rows="3"
            placeholder="Any additional notes about the arrival..."
          ></textarea>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-button">Record Arrival</button>
          <button type="button" onClick={onCancel} className="cancel-button">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default MedicalArrivalForm;
