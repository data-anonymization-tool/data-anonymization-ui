import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { createModule } from './services/githubService'; // Import the createModule function

Modal.setAppElement('#root'); // Bind modal to your appElement (http://reactcommunity.org/react-modal/accessibility/)

const AddModuleModal = ({ isOpen, onRequestClose, onModuleCreated }) => {
    const [moduleName, setModuleName] = useState('');
    const [pythonCode, setPythonCode] = useState('');
    const [jsonContent, setJsonContent] = useState('');
    const [dockerfileContent, setDockerfileContent] = useState('');
    const [requirementsContent, setRequirementsContent] = useState('');
    const [algorithmType, setAlgorithmType] = useState('');
    const [moduleCategory, setModuleCategory] = useState('');

    const [step, setStep] = useState(1);

    // Update JSON content dynamically when moduleName changes
    useEffect(() => {
        if (moduleName.trim()) {
            setJsonContent(
                JSON.stringify(
                    {
                        [moduleName]: {
                            "conceptual_Explanation": "",
                            "technical_Explanation": "",
                            "inputs": {
                                "File": {
                                    "description": "",
                                    "type": "CSV file"
                                },
                                "Column to be anonymized": {
                                    "description": "The name of the column with numerical data that requires anonymization.",
                                    "type": "String"
                                },
                                "Direct identifier columns": {
                                    "description": "A list of columns that serve as direct identifiers.",
                                    "type": "Array of Strings"
                                }
                                /** 
                                 * Define your module specific parameters here by following below structure
                                 * For example if the parameter name was t,
                                 * "t": {
                                 *      "description": "",
                                 *      "type": ""}
                                 * 
                                */
                            },
                            "application_Platform": "",
                            "deployable_Module": "",
                            "incremental_Updates": ""
                        }
                    },
                    null, 4 // Indentation for better readability
                )
            );
        } else {
            setJsonContent(''); // Reset if no module name is entered
        }
    }, [moduleName]);

    const handleNext = () => {
        if (step < 5) {
            setStep(step + 1);
        }
    };

    const handlePrevious = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!moduleName.trim()) {
            alert('Module name cannot be empty.');
            return;
        }

        try {
            // Call the createModule function from the githubService.js
            await createModule(moduleName, algorithmType, moduleCategory, {
                [`${moduleName}.py`]: pythonCode,
                [`${moduleName}.json`]: jsonContent,
                'Dockerfile': dockerfileContent,
                'requirements.txt': requirementsContent,
            });

            // Call the callback function to update the module list in the parent component
            if (onModuleCreated) {
                onModuleCreated();
            }

            alert(`Module "${moduleName}" created successfully!`);

            // Reset form fields
            setModuleName('');
            setPythonCode('');
            setJsonContent('');
            setDockerfileContent('');
            setRequirementsContent('');
            setStep(1); // Reset to step 1
            onRequestClose(); // Close the modal
        } catch (error) {
            console.error('Error creating module:', error);
            alert('Failed to create module. Ensure the module name is unique and try again.');
        }
    };

    // Generate the required route string for the Python file
    const requiredRoute = `@app.route('/${moduleName}', methods=['POST'])`;

    // Prefill the pythonCode with the required route when moving to step 2
    useEffect(() => {
        if (step === 2 && moduleName) {
            setPythonCode(requiredRoute); // Prefill the textarea with the required route
        }
    }, [step, moduleName]);

    // Validate Python code for required route string
    const validatePythonCode = () => {
        if (!pythonCode.includes(requiredRoute)) {
            alert(`The Python code must include: \n${requiredRoute}`);
            return false;
        }
        return true;
    };

    const handleNextWithValidation = () => {
        if (step === 2 && !validatePythonCode()) {
            return; // Prevent moving to the next step if validation fails
        }
        handleNext(); // Move to the next step
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            contentLabel="Add New Module"
            style={customStyles}
        >
            <h2>Add New Module</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
                {step === 1 && (
                    <div style={styles.formGroup}>
                        <label>Module Name:</label>
                        <input
                            type="text"
                            value={moduleName}
                            onChange={(e) => setModuleName(e.target.value)}
                            required
                            style={styles.input}
                        />
                        <label>Algorithm Type:</label>
                        <input
                            type="text"
                            value={algorithmType}
                            onChange={(e) => setAlgorithmType(e.target.value)}
                            required
                            style={styles.input}
                        />
                        <label>Module Category:</label>
                        <input
                            type="text"
                            value={moduleCategory}
                            onChange={(e) => setModuleCategory(e.target.value)}
                            required
                            style={styles.input}
                        />
                        <button type="button" onClick={handleNext} style={styles.nextButton}>Next</button>
                    </div>
                )}

                {step === 2 && (
                    <div style={styles.formGroup}>
                        <label>{moduleName ? `${moduleName}.py` : 'module-name.py'}:</label>
                        <textarea
                            value={pythonCode}
                            onChange={(e) => setPythonCode(e.target.value)}
                            required
                            style={styles.textarea}
                        />
                        <div style={styles.buttonGroup}>
                            <button type="button" onClick={handlePrevious} style={styles.previousButton}>Previous</button>
                            <button type="button" onClick={handleNextWithValidation} style={styles.nextButton}>Next</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div style={styles.formGroup}>
                        <label>{moduleName ? `${moduleName}.json` : 'module-name.json'}:</label>
                        <textarea
                            value={jsonContent}
                            onChange={(e) => setJsonContent(e.target.value)}
                            required
                            style={styles.textarea}
                        />
                        <div style={styles.buttonGroup}>
                            <button type="button" onClick={handlePrevious} style={styles.previousButton}>Previous</button>
                            <button type="button" onClick={handleNext} style={styles.nextButton}>Next</button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div style={styles.formGroup}>
                        <label>Dockerfile:</label>
                        <textarea
                            value={dockerfileContent}
                            onChange={(e) => setDockerfileContent(e.target.value)}
                            required
                            style={styles.textarea}
                        />
                        <div style={styles.buttonGroup}>
                            <button type="button" onClick={handlePrevious} style={styles.previousButton}>Previous</button>
                            <button type="button" onClick={handleNext} style={styles.nextButton}>Next</button>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div style={styles.formGroup}>
                        <label>requirements.txt:</label>
                        <textarea
                            value={requirementsContent}
                            onChange={(e) => setRequirementsContent(e.target.value)}
                            required
                            style={styles.textarea}
                        />
                        <div style={styles.buttonGroup}>
                            <button type="button" onClick={handlePrevious} style={styles.previousButton}>Previous</button>
                            <button type="submit" style={styles.submitButton}>Create Module</button>
                        </div>
                    </div>
                )}
            </form>
        </Modal>
    );
};

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        height: '500px',
        backgroundColor: '#2c2c2c'
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',  // Dark overlay
      }
};

const styles = {
    form: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
    },
    input: {
        padding: '10px',
        fontSize: '16px',
        marginBottom: '20px',
        width: '100%',
        boxSizing: 'border-box',
    },
    textarea: {
        flexGrow: 1,
        padding: '10px',
        fontSize: '16px',
        width: '100%',
        boxSizing: 'border-box',
        height: '100%',
    },
    buttonGroup: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '20px',
    },
    previousButton: {
        backgroundColor: 'gray',
        color: 'white',
        padding: '10px 20px',
        border: 'none',
        cursor: 'pointer',
        borderRadius: '5px',
    },
    nextButton: {
        backgroundColor: '#4CAF50',
        color: 'white',
        padding: '10px 20px',
        border: 'none',
        cursor: 'pointer',
        borderRadius: '5px',
    },
    submitButton: {
        backgroundColor: '#4CAF50',
        color: 'white',
        padding: '10px 20px',
        border: 'none',
        cursor: 'pointer',
        borderRadius: '5px',
    },
};

export default AddModuleModal;
