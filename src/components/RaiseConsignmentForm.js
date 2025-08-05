import React, { useState, useEffect } from 'react'; // Import useEffect

const RaiseConsignmentForm = ({ onSuccess, onError, onCancel }) => {
  const [packId, setPackId] = useState('');
  const [selectedSite, setSelectedSite] = useState(''); // Changed from centerId to selectedSite for dropdown
  const [raiseDate, setRaiseDate] = useState(''); // New field for raise date
  const [availableSites, setAvailableSites] = useState([]); // State to store fetched sites
  const [loadingSites, setLoadingSites] = useState(true); // State to manage loading status of sites

  const API_BASE_URL = 'http://127.0.0.1:5000';

  // Effect to fetch sites when the component mounts
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/depot_sites`);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        if (data && Array.isArray(data.sites)) {
          setAvailableSites(data.sites);
        } else {
          console.warn("Backend response for sites is not an array or is missing 'sites' key:", data);
          setAvailableSites([]);
        }
      } catch (err) {
        console.error("Failed to fetch sites for consignment form:", err);
        onError("Failed to load site data. Please try again.");
      } finally {
        setLoadingSites(false); // Set loading to false regardless of success or failure
      }
    };

    fetchSites();
  }, [onError]); // Re-run if onError function reference changes (though it's usually stable)

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Use selectedSite instead of centerId
    if (!packId || !selectedSite || !raiseDate) {
      onError('Please fill in all fields, including selecting a site.');
      return;
    }

    const consignmentData = {
      packId,
      centerId: selectedSite, // Send selectedSite as centerId to the backend
      raiseDate,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/raise_consignment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(consignmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.status === 'Failed') { // Use strict equality
        onSuccess(`Consignment ${result.status} to raise, Pack is Not Available in the DEPOT`);
      } else {
        onSuccess(`Consignment ${result.consignment_id} raised successfully!`);
      }
      // Clear form
      setPackId('');
      setSelectedSite(''); // Clear selected site
      setRaiseDate('');
    } catch (err) {
      console.error("Failed to raise consignment:", err);
      onError(`Error raising consignment: ${err.message}`);
    }
  };

  return (
    <div className="form-container">
      <h2 className="section-title">Raise New Consignment</h2>
      <form onSubmit={handleSubmit} className="app-form">
        <div className="form-group">
          <label htmlFor="packId">Pack ID:</label>
          <input
            type="text"
            id="packId"
            value={packId}
            onChange={(e) => setPackId(e.target.value)}
            required
            className="form-input"
            placeholder="e.g., PK12345"
          />
        </div>

        <div className="form-group">
          <label htmlFor="selectedSite">Destination Site:</label> {/* Changed label */}
          <select
            id="selectedSite"
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            required
            className="form-input"
            disabled={loadingSites} // Disable dropdown while loading
          >
            <option value="">
              {loadingSites ? 'Loading sites...' : '-- Select a Destination Site --'}
            </option>
            {availableSites.map((site, index) => {
              let optionValue = '';
              let optionLabel = '';

              if (typeof site === 'string') {
                optionValue = site;
                optionLabel = site;
              } else if (typeof site === 'object' && site !== null) {
                // Prioritize 'site_name' or 'sites', then common alternatives
                optionValue = site.site_name || site.sites || site.id || site.value || site.name;
                optionLabel = site.site_name || site.name || site.label || site.sites;
              }

              if (optionValue && optionLabel) {
                return (
                  <option key={optionValue} value={optionValue}>
                    {optionLabel}
                  </option>
                );
              }
              return null; // Skip rendering if invalid site data
            })}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="raiseDate">Raise Date:</label>
          <input
            type="date"
            id="raiseDate"
            value={raiseDate}
            onChange={(e) => setRaiseDate(e.target.value)}
            required
            className="form-input"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-button">Raise Consignment</button>
          <button type="button" onClick={onCancel} className="cancel-button">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default RaiseConsignmentForm;
