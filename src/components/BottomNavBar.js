// src/components/BottomNavBar.js
import React from 'react';
import './BottomNavBar.css'; // Import the CSS file
import { XCircle, Shuffle, CalendarCheck, CalendarX, CheckCircle, FlaskIcon } from '../icons';

const BottomNavBar = ({ selectedPatient, addPatientHistoryEvent }) => {
  const handleHistoryAction = (eventType, description = '', details = {}) => {
    if (selectedPatient) {
      addPatientHistoryEvent(selectedPatient.id, eventType, description, details);
    } else {
      console.warn("No patient selected for history action.");
    }
  };

  return (
    <footer className="bottom-nav">
      <nav>
        <ul>
          <li>
            <button
              onClick={() => handleHistoryAction('Screen Failure', 'Patient failed screening.')}
            >
              <XCircle size={20} />
              <span>Screen Failure</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => handleHistoryAction('Randomization', 'Patient randomized.')}
            >
              <Shuffle size={20} />
              <span>Randomization</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => handleHistoryAction('Scheduled Visit', 'Patient completed a scheduled visit.')}
            >
              <CalendarCheck size={20} />
              <span>Scheduled Visit</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => handleHistoryAction('Unscheduled Visit', 'Patient completed an unscheduled visit.')}
            >
              <CalendarX size={20} />
              <span>Unscheduled Visit</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => handleHistoryAction('Treatment Completion', 'Patient completed treatment.')}
            >
              <CheckCircle size={20} />
              <span>Treatment Completion</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => handleHistoryAction('Emergency Code Break', 'Emergency code break initiated.')}
            >
              <FlaskIcon size={20} />
              <span>Emergency Code Break</span>
            </button>
          </li>
        </ul>
      </nav>
    </footer>
  );
};

export default BottomNavBar;
