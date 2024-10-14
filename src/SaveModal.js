import React from 'react';
import './ModuleConfiguration.css';

const SaveModal = ({ isOpen, onClose, onDownload, filename, setFilename, queryResult, isCsv }) => {
  if (!isOpen) return null; // Do not render if modal is not open

  return (
    <div className="savemodal-overlay">
      <div className="savemodal-content">
        <button className="savemodal-close" onClick={onClose}>✕</button>
        
        {isCsv ? (
          <>
            <h3 style={{ color: 'white' }}>Anonymized Output Generated</h3>
            <div className="label-input">
            <label style={{ color: 'white' , display: 'flex', alignItems: 'center'}}>
              Filename: 
              <input 
                type="text" class="input-field"
                value={filename} 
                onChange={(e) => setFilename(e.target.value)}
                style={{ marginLeft: '10px' }}
              />
            </label>
            </div>
            <center><button type="button" className="save-button" onClick={() => onDownload('csv')}><svg
                stroke-linejoin="round"
                stroke-linecap="round"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                viewBox="0 0 24 24"
                height="20"
                width="20"
                class="button__icon"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path fill="none" d="M0 0h24v24H0z" stroke="none"></path>
                <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"></path>
                <path d="M7 11l5 5l5 -5"></path>
                <path d="M12 4l0 12"></path>
            </svg>
            <span class="button__text">Download CSV</span></button></center>
          </>
        ) : (
          <>
            <h3 style={{ color: 'white' }}>Query Results Generated</h3>
            <div className="query-result">
              <pre>{JSON.stringify(queryResult, null, 2)}</pre>
            </div>
            <div className="label-input">
            <label style={{ color: 'white' , display: 'flex', alignItems: 'center'}}>
              Filename: 
              <input 
                type="text" class="input-field"
                value={filename} 
                onChange={(e) => setFilename(e.target.value)}
                style={{ marginLeft: '10px' }}
              />
            </label>
            </div>
            <center><button type="button" className="save-button" onClick={() => onDownload('json')}><svg
                stroke-linejoin="round"
                stroke-linecap="round"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                viewBox="0 0 24 24"
                height="20"
                width="20"
                class="button__icon"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path fill="none" d="M0 0h24v24H0z" stroke="none"></path>
                <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"></path>
                <path d="M7 11l5 5l5 -5"></path>
                <path d="M12 4l0 12"></path>
            </svg>
            <span class="button__text">Download JSON</span></button></center>
          </>
        )}
      </div>
    </div>
  );
};

export default SaveModal;
