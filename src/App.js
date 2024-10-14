import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import './ModuleConfiguration.css';
import Navbar from './NavBar';
import SaveModal from './SaveModal';
import { moduleConfig } from './moduleConfig';
import ModuleEditor from './components/ModuleEditor';
import { getStructure } from './components/services/githubService';

const App = () => {
  const [selectedModule, setSelectedModule] = useState(null);
  const [expandedIndexes, setExpandedIndexes] = useState([]);
  const [selectedView, setSelectedView] = useState('build');
  const [structure, setStructure] = useState(null);

  useEffect(() => {
    const fetchStructure = async () => {
      const { structure, sha } = await getStructure();
      setStructure(structure); // Save structure to state
    };

    fetchStructure(); // Call the async function
  }, []);

  // Extract the algorithm types (top-level keys)
  const algorithmTypes = structure ? Object.keys(structure) : [];

  // Extract the modules only if structure is defined
  const modules = structure
    ? Object.values(structure).map(obj => Object.keys(obj || {}))
    : [];

  // Extract the subModules only if structure is defined
  const subModules = structure
    ? Object.entries(structure).reduce((acc, [category, modules]) => {
      acc[category] = Object.entries(modules).reduce((subAcc, [moduleName, subModuleData]) => {
        subAcc[moduleName] = Object.keys(subModuleData);
        return subAcc;
      }, {});
      return acc;
    }, {})
    : {};

  const toggleAccordion = (index) => {
    if (expandedIndexes.includes(index)) {
      setExpandedIndexes(expandedIndexes.filter(i => i !== index));
    } else {
      setExpandedIndexes([...expandedIndexes, index]);
    }
  };



  return (
    <div className="App" class="container">
      <Navbar setSelectedView={setSelectedView} />
      <div className='page-title'>
        <h1><t />Data Anonymization Toolbox</h1>
      </div>
      <div className='content'>
        {selectedView === 'build' && (
          <>
            <div className="module-list">
              <h2>Toolbox</h2>
              <ul>
                {algorithmTypes.map((type, index) => (
                  <li key={type}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <strong onClick={() => toggleAccordion(index)} style={{ cursor: 'pointer', marginRight: '0.5rem' }}>
                        {type}
                      </strong>
                      <button className={`swallow__icon ${expandedIndexes.includes(index) ? 'rotate' : ''}`} onClick={() => toggleAccordion(index)}>
                        <span></span>
                      </button>
                    </div>
                    {expandedIndexes.includes(index) && (
                      <ul>
                        {modules[index].map((module) => (
                          <li key={module}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <strong onClick={() => toggleAccordion(module)} style={{ cursor: 'pointer', marginRight: '0.5rem' }}>
                                {module}
                              </strong>
                              <button className={`swallow__icon ${expandedIndexes.includes(module) ? 'rotate' : ''}`} onClick={() => toggleAccordion(module)}>
                                <span></span>
                              </button>
                            </div>
                            {expandedIndexes.includes(module) && (
                              <ul>
                                {subModules[type] && subModules[type][module] ? (
                                  Array.isArray(subModules[type][module]) ? (
                                    subModules[type][module].map((subModule) => (
                                      <li
                                        key={subModule}
                                        className={selectedModule === subModule ? 'selected' : ''}
                                        onClick={() => setSelectedModule(subModule)}
                                      >
                                        {subModule}
                                      </li>
                                    ))
                                  ) : (
                                    // If it's not an array, you can display a message or log an error
                                    <li>No submodules available or format is incorrect</li>
                                  )
                                ) : (
                                  <li>Module does not exist</li> // Fallback if the module itself doesn't exist
                                )}

                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className={`module-configuration ${selectedModule ? '' : 'disabled'}`}>
              <h2>
                Configuration {selectedModule ? ` for ${selectedModule}` : ''}
              </h2>
              {selectedModule ? (
                <ModuleConfiguration module={selectedModule} structure={structure} />
              ) : (
                <p>Select a module to configure.</p>
              )}
            </div>

            <div className={`module-metadata ${selectedModule ? '' : 'disabled'}`}>
              <h2>Module Metadata</h2>
              {selectedModule ? (
                <ModuleMetadata module={selectedModule} />
              ) : (
                <p>Select a module to see its metadata.</p>
              )}
            </div>
          </>
        )}

        {selectedView === 'code' && (
          <div className='module-editor'>
            <ModuleEditor />
          </div>
        )}


      </div>
    </div>
  );
};

const FileUploader = ({ handleFile }) => {
  const hiddenFileInput = useRef(null);

  const handleClick = event => {
    hiddenFileInput.current.click();
  };

  const handleChange = event => {
    const fileUploaded = event.target.files[0];
    handleFile(fileUploaded);
  };

  return (
    <>
      <button className="button-upload" onClick={handleClick}>
        Upload a file
      </button>
      <input
        type="file"
        onChange={handleChange}
        ref={hiddenFileInput}
        style={{ display: 'none' }} // Make the file input element invisible
      />
    </>
  );
}

const useStructureData = (structure) => {
  const [parameterLabels, setParameterLabels] = useState({});
  const [queryOptions, setQueryOptions] = useState({});

  useEffect(() => {
    // Fetch the structure.json file from GitHub
    const fetchStructure = async () => {
      try {
        const paramLabels = {};
        const queryOpts = {};

        // Function to traverse the structure and populate paramLabels and queryOpts
        const traverseStructure = (obj) => {
          for (const key in obj) {
            if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
              if (obj[key].param1) {
                // Populate parameterLabels
                paramLabels[key] = { ...obj[key] };
              }
              if (obj[key].queryOptions) {
                // Populate queryOptions
                queryOpts[key] = [...obj[key].queryOptions];
              }
              traverseStructure(obj[key]); // Recursive call to traverse further
            }
          }
        };

        // Start traversal from the root of the structure
        traverseStructure(structure);

        // Update the state
        setParameterLabels(paramLabels);
        setQueryOptions(queryOpts);
      } catch (error) {
        console.error('Error fetching structure.json:', error);
      }
    };

    fetchStructure();
  }, []);

  return { parameterLabels, queryOptions };
};


// const parameterLabels = {
//   'l-diversity': {
//     param1: { label: 'Column to be anonymized', optional: false },
//     param2: { label: 'Direct Identifier Columns', optional: false },
//     param3: { label: 'l', optional: false },
//     param4: { label: 'k', optional: false },
//   },
//   'k-anonymity': {
//     param1: { label: 'Column to be anonymized', optional: false },
//     param2: { label: 'Direct Identifier Columns', optional: false },
//     param3: { label: 'k', optional: false },
//   },
//   't-closeness': {
//     param1: { label: 'Column to be anonymized', optional: false },
//     param2: { label: 'Direct Identifier Columns', optional: false },
//     param3: { label: 't', optional: false },
//     param4: { label: 'k', optional: false },
//   },
//   'Laplace Mechanism': {
//     param1: { label: 'Column to be anonymized', optional: false },
//     param2: { label: 'Direct Identifier Columns', optional: false },
//     param3: { label: 'Sensitivity', optional: false },
//     param4: { label: 'Epsilon', optional: false }
//   },
//   'Exponential Mechanism': {
//     param1: { label: 'Column to be anonymized', optional: false },
//     param2: { label: 'Direct Identifier Columns', optional: false },
//     param3: { label: 'Sensitivity', optional: false },
//     param4: { label: 'Epsilon', optional: false }
//   },
//   'Gaussian Mechanism': {
//     param1: { label: 'Column to be anonymized', optional: false },
//     param2: { label: 'Direct Identifier Columns', optional: false },
//     param3: { label: 'Sensitivity', optional: false },
//     param4: { label: 'Epsilon', optional: false },
//     param5: { label: 'Delta', optional: false }
//   },
//   'Differentially Private Queries using Laplace': {
//     param1: { label: 'Column to be anonymized', optional: false },
//     param2: { label: 'Condition Value', optional: false },
//     param3: { label: 'Epsilon', optional: false }
//   },
//   'Differentially Private Queries using Exponential': {
//     param1: { label: 'Column to be anonymized', optional: false },
//     param2: { label: 'Epsilon', optional: false },
//     param3: { label: 'k', optional: true }, // Optional
//     param4: { label: 'Column 2', optional: true } // Optional
//   },
//   'CTGAN Synthesis': {
//     param1: { label: 'Columns to be anonymized', optional: false },
//     param2: { label: 'Direct Identifier Columns', optional: false }
//   },
//   'Gaussian Copula': {
//     param1: { label: 'Columns to be anonymized', optional: false },
//     param2: { label: 'Direct Identifier Columns', optional: false }
//   },
//   'TVAE Synthesis': {
//     param1: { label: 'Columns to be anonymized', optional: false },
//     param2: { label: 'Direct Identifier Columns', optional: false }
//   }
// };

// const queryOptions = {
//   'Differentially Private Queries using Laplace': ['sum', 'count', 'mean', 'median', 'mode', 'variance', 'std_dev', 'All Queries'],
//   'Differentially Private Queries using Exponential': ['frequency', 'mode', 'entropy', 'contingency', 'top-k', 'All Queries'],
// };

const ModuleConfiguration = ({ module, structure }) => {
  const [files, setFiles] = useState({});
  const [selectedQueryType, setSelectedQueryType] = useState('');
  const [error, setError] = useState(null);
  const [formValues, setFormValues] = useState({}); // Bind input fields to state
  const fileInputRef = useRef(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [filename, setFilename] = useState('');
  const [fileContent, setFileContent] = useState(null);
  const [queryResult, setQueryResult] = useState(null);
  const [isCsv, setIsCsv] = useState(false);

  const { parameterLabels, queryOptions } = useStructureData(structure);

  function removeQueryOptions(obj) {
    // Check if the input is an object
    if (typeof obj === 'object' && obj !== null) {
      // Loop through the keys of the object
      Object.keys(obj).forEach((key) => {
        // If the key is 'queryOptions', delete it
        if (key === 'queryOptions') {
          delete obj[key];
        } else {
          // Recursively call the function for nested objects
          removeQueryOptions(obj[key]);
        }
      });
    }
  }

  removeQueryOptions(parameterLabels);

  console.log('parameterLabels:', parameterLabels);
  console.log('queryOptions:', queryOptions);

  // Effect to reset form on module change
  useEffect(() => {
    console.log("Resetting form for new module:", module);
    resetForm();
  }, [module]);

  const resetForm = () => {
    setFiles({});
    setSelectedQueryType('');
    setError(null);
    setFormValues({}); // Clear form values
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear file input
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) {
      setError('No file selected');  // Handle no file case
      return;
    }
    // Validate if the file is a CSV
    if (selectedFile && selectedFile.type !== 'text/csv') {
      setError('Please upload a valid CSV file'); // Set error message
      setFiles((prevFiles) => ({
        ...prevFiles,
        [module]: null, // Clear the file if invalid
      }));
    } else {
      setFiles((prevFiles) => ({
        ...prevFiles,
        [module]: selectedFile,
      }));
      setError(null); // Clear error if valid CSV is uploaded
    }
    const originalFilename = selectedFile.name;
    setFormValues((prevValues) => ({
      ...prevValues,
      filename: originalFilename,  // Store the original filename
    }));
  };

  const handleFileUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleQueryTypeChange = (e) => {
    setSelectedQueryType(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const file = files[module]; // Get the uploaded file
    if (!file) {
      alert('Please select a file first.');
      return;
    }

    const baseUrl = moduleConfig[module];
    if (!baseUrl) {
      alert(`No API URL found for module: ${module}`);
      return;
    }

    const labels = parameterLabels[module];
    const missingParams = [];
    Object.keys(labels).forEach((key) => {
      const { label: paramLabel, optional } = labels[key];
      const inputValue = formValues[key]; // Get the user input for this parameter

      // Only check for missing parameters if they are not optional
      if (!optional && !inputValue) {
        missingParams.push(paramLabel); // Add to the list of missing parameters
      }
    });

    if (queryTypeOptions.length > 0 && !selectedQueryType) {
      missingParams.push("Query Type");
    }

    // If there are missing parameters, alert the user and prevent form submission
    if (missingParams.length > 0) {
      alert(`Please provide values for the following required parameters: ${missingParams.join(', ')}`);
      return; // Stop form submission
    }
    const formData = new FormData();
    formData.append('file', file);  // Append the file

    // Dynamically append the parameters based on the module and formValues
    Object.keys(labels).forEach((key) => {
      if (formValues[key]) {
        formData.append(labels[key].label, formValues[key]); // Use the label as the key
      }
    });

    if (queryTypeOptions.length > 0 && selectedQueryType) {
      formData.append('query', selectedQueryType); // Append the selected query type
    }

    console.log('FormData entries:');
    for (let pair of formData.entries()) {
      console.log(`${pair[0]}: ${pair[1]}`);
    }

    try {
      if (module.startsWith('Differentially Private Queries')) {
        let url = '';
        if (selectedQueryType === 'All Queries') {
          url = `${baseUrl}/`;
        } else {
          url = `${baseUrl}/${selectedQueryType.toLowerCase()}`;
        }
        const response = await axios.post(url, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        // alert(`Query Result: ${JSON.stringify(response.data)}`);\
        setQueryResult(response.data);
        const timestamp = new Date().toLocaleString('sv').replace(/[-: ]/g, '');
        setFilename(`queryresult_${timestamp}_${formValues.filename.replace(/\.csv$/, '')}`)
        setIsCsv(false);
        setModalOpen(true);
      } else {
        // Handle file response for other mechanisms
        const response = await axios.post(baseUrl, formData, {
          responseType: 'blob', // Expecting a file response
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        // Store the file content for download and set the filename
        setFileContent(response.data);
        const timestamp = new Date().toLocaleString('sv').replace(/[-: ]/g, '');
        setFilename(`anonymized_${timestamp}_${formValues.filename.replace(/\.csv$/, '')}`);
        setIsCsv(true);
        setModalOpen(true);

        // const url = window.URL.createObjectURL(new Blob([response.data]));
        // const link = document.createElement('a');
        // link.href = url;
        // link.setAttribute('download', filename); // Download filename
        // document.body.appendChild(link);
        // link.click();
        // link.remove();
        // window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        alert(`Error: ${error.response.data.error}`); // Show the specific error from Flask
      } else {
        alert(`Error: ${error.message}`); // Fallback for other errors
      }
    }
  };

  const handleDownload = (fileType) => {
    if (fileType === 'csv') {
      // Download the CSV file
      const url = window.URL.createObjectURL(new Blob([fileContent], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);  // Use the edited filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else if (fileType === 'json') {
      // Download the JSON result
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(queryResult));
      const link = document.createElement('a');
      link.setAttribute('href', dataStr);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // Close the modal after downloading
    setModalOpen(false);
  };

  const labels = parameterLabels[module] || {};
  const queryTypeOptions = queryOptions[module] || [];

  return (
    <div className="module-configuration-container">
      <form onSubmit={handleSubmit} className="form-content">
        <div className="file-upload">
          <div className="center">
            <button type="button" onClick={handleFileUploadClick} className="import-button">
              <svg
                fill="#fff"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 50 50"
              >
                <path
                  d="M28.8125 .03125L.8125 5.34375C.339844 
                  5.433594 0 5.863281 0 6.34375L0 43.65625C0 
                  44.136719 .339844 44.566406 .8125 44.65625L28.8125 
                  49.96875C28.875 49.980469 28.9375 50 29 50C29.230469 
                  50 29.445313 49.929688 29.625 49.78125C29.855469 49.589844 
                  30 49.296875 30 49L30 1C30 .703125 29.855469 .410156 29.625 
                  .21875C29.394531 .0273438 29.105469 -.0234375 28.8125 .03125ZM32 
                  6L32 13L34 13L34 15L32 15L32 20L34 20L34 22L32 22L32 27L34 27L34 
                  29L32 29L32 35L34 35L34 37L32 37L32 44L47 44C48.101563 44 49 
                  43.101563 49 42L49 8C49 6.898438 48.101563 6 47 6ZM36 13L44 
                  13L44 15L36 15ZM6.6875 15.6875L11.8125 15.6875L14.5 21.28125C14.710938 
                  21.722656 14.898438 22.265625 15.0625 22.875L15.09375 22.875C15.199219 
                  22.511719 15.402344 21.941406 15.6875 21.21875L18.65625 15.6875L23.34375 
                  15.6875L17.75 24.9375L23.5 34.375L18.53125 34.375L15.28125 
                  28.28125C15.160156 28.054688 15.035156 27.636719 14.90625 
                  27.03125L14.875 27.03125C14.8125 27.316406 14.664063 27.761719 
                  14.4375 28.34375L11.1875 34.375L6.1875 34.375L12.15625 25.03125ZM36 
                  20L44 20L44 22L36 22ZM36 27L44 27L44 29L36 29ZM36 35L44 35L44 37L36 37Z"
                ></path>
              </svg>
              Import File
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          {files[module] && <p>Selected file: {files[module].name}</p>}
        </div>

        {/* Render error message */}
        {error && <div className="error">
          <div class="error__icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" viewBox="0 0 24 24" height="24" fill="none"><path fill="#393a37" d="m13 13h-2v-6h2zm0 4h-2v-2h2zm-1-15c-1.3132 0-2.61358.25866-3.82683.7612-1.21326.50255-2.31565 1.23915-3.24424 2.16773-1.87536 1.87537-2.92893 4.41891-2.92893 7.07107 0 2.6522 1.05357 5.1957 2.92893 7.0711.92859.9286 2.03098 1.6651 3.24424 2.1677 1.21325.5025 2.51363.7612 3.82683.7612 2.6522 0 5.1957-1.0536 7.0711-2.9289 1.8753-1.8754 2.9289-4.4189 2.9289-7.0711 0-1.3132-.2587-2.61358-.7612-3.82683-.5026-1.21326-1.2391-2.31565-2.1677-3.24424-.9286-.92858-2.031-1.66518-3.2443-2.16773-1.2132-.50254-2.5136-.7612-3.8268-.7612z"></path></svg>
          </div>
          <div class="error__title">Please upload a valid CSV file.</div>
          <div class="error__close" onClick={() => setError(null)}><svg xmlns="http://www.w3.org/2000/svg" width="20" viewBox="0 0 20 20" height="20"><path fill="#393a37" d="m15.8333 5.34166-1.175-1.175-4.6583 4.65834-4.65833-4.65834-1.175 1.175 4.65833 4.65834-4.65833 4.6583 1.175 1.175 4.65833-4.6583 4.6583 4.6583 1.175-1.175-4.6583-4.6583z"></path></svg>
          </div>
        </div>}
        <table>
          {Object.keys(labels).map((key) => {
            const { label, optional } = labels[key];
            return (
              <tr key={key}>
                <td align="left">{label}</td>
                <td align="right">
                  <input
                    type="text"
                    name={key}
                    className="input-field"
                    value={formValues[key] || ''} // Bind to formValues dynamically
                    onChange={handleInputChange}
                    placeholder={optional ? '(Optional)' : ''}
                  />
                </td>
              </tr>
            );
          })}
          {queryTypeOptions.length > 0 && (
            <tr>
              <td align="left">
                <label htmlFor="queryType" className="normal-weight-label">Query</label>
              </td>
              <td align="right">
                <select
                  id="queryType"
                  value={selectedQueryType}
                  onChange={handleQueryTypeChange}
                  className="custom-dropdown"
                >
                  <option value="">Select query type</option>
                  {queryTypeOptions.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              </td>
            </tr>
          )}
        </table>
        <button class="save-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" class="svg-icon">
            <g stroke-width="1.5" stroke-linecap="round" stroke="#ffffff">
              <circle r="2.5" cy="10" cx="10"></circle>
              <path fill-rule="evenodd" d="m8.39079 2.80235c.53842-1.51424 2.67991-1.51424 3.21831-.00001.3392.95358 1.4284 1.40477 2.3425.97027 1.4514-.68995 2.9657.82427 2.2758 2.27575-.4345.91407.0166 2.00334.9702 2.34248 1.5143.53842 1.5143 2.67996 0 3.21836-.9536.3391-1.4047 1.4284-.9702 2.3425.6899 1.4514-.8244 2.9656-2.2758 2.2757-.9141-.4345-2.0033.0167-2.3425.9703-.5384 1.5142-2.67989 1.5142-3.21831 0-.33914-.9536-1.4284-1.4048-2.34247-.9703-1.45148.6899-2.96571-.8243-2.27575-2.2757.43449-.9141-.01669-2.0034-.97028-2.3425-1.51422-.5384-1.51422-2.67994.00001-3.21836.95358-.33914 1.40476-1.42841.97027-2.34248-.68996-1.45148.82427-2.9657 2.27575-2.27575.91407.4345 2.00333-.01669 2.34247-.97026z" clip-rule="evenodd"></path>
            </g>
          </svg>
          <span class="label">Run Anonymization</span>
        </button>
      </form>
      <SaveModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onDownload={handleDownload}
        fileContent={fileContent}
        filename={filename}
        setFilename={setFilename}
        queryResult={queryResult}
        isCsv={isCsv}
      />
    </div>
  );
};

const ModuleMetadata = ({ module }) => {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      setLoading(true); // Reset loading state
      setMetadata(null); // Reset metadata
      setError(null); // Reset error

      const baseURL = moduleConfig[module]; // Get base URL for the selected module

      if (!baseURL) {
        setError(`No base URL found for module: ${module}`);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${baseURL}/metadata`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Fetched Metadata:', data); // Log for debugging

        const selectedMetadata = data[module]; // Access metadata by module name
        console.log('Selected Metadata:', selectedMetadata); // Log selected metadata

        if (selectedMetadata) {
          setMetadata(selectedMetadata); // Set metadata for the selected module
        } else {
          setError(`No metadata found for module: ${module}`);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [module]);

  if (loading) return <p>Loading metadata...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="metadata-container">
      <h3 className="metadata-title">Metadata for {module}</h3>
      {metadata ? (
        <div className="metadata-content">
          <p className="metadata-section"><strong>Conceptual Explanation:</strong> {metadata.conceptual_Explanation}</p>
          <p className="metadata-section"><strong>Technical Explanation:</strong> {metadata.technical_Explanation}</p>
          <p className="metadata-section"><strong>Inputs:</strong></p>
          {metadata.inputs && Object.entries(metadata.inputs).map(([paramName, param]) => (
            <p key={paramName} className="metadata-section">
              <strong>{paramName}:</strong> {param.description || 'No description available'} <br />
              <strong>Type:</strong> {param.type || 'Unknown'}<br />
              {param.options ? (
                <>
                  <strong>Options:</strong>
                  <ul>
                    {param.options.map(option => (
                      <li key={option.value}>
                        <strong>{option.value}</strong>: {option.explanation}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </p>
          ))}
          <p className="metadata-section"><strong>Application Platform:</strong> {metadata.application_Platform}</p>
          <p className="metadata-section"><strong>Deployable Module:</strong>{metadata.deployable_Module}</p>
          <p className="metadata-section"><strong>Incremental Updates:</strong> {metadata.incremental_Updates}</p>
        </div>
      ) : (
        <p>No metadata available.</p>
      )}
    </div>
  );
};

export default App;
