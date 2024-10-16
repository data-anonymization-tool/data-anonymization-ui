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

    const initialParameters = {
        param1: {
            label: "Columns to be anonymized",
            optional: false
        },
        param2: {
            label: "Direct Identifier Columns",
            optional: false
        }
    };

    const [inputParameters, setInputParameters] = useState(JSON.stringify(initialParameters, null, 2));
    const [isLoading, setIsLoading] = useState(false);
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

    // useEffect(() => {
    //     if (moduleName.trim()) {
    //         setInputParameters(
    //             JSON.stringify(
    //                 {
    //                     [moduleName]: {
    //                         "param1": {
    //                             label: "Columns to be anonymized",
    //                             optional: false
    //                         },
    //                         "param2": {
    //                             label: "Direct Identifier Columns",
    //                             optional: false
    //                         }
    //                     }
    //                 },
    //                 null, 4 // Indentation for better readability
    //             )
    //         );
    //     } else {
    //         setInputParameters(''); // Reset if no module name is entered
    //     }
    // }, [moduleName]);

    const handleNext = () => {
        if (step < 6) {
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
        onRequestClose();
        setIsLoading(true); // Set loading to true 
        try {
            // Call the createModule function from the githubService.js
            await createModule(moduleName, algorithmType, moduleCategory, inputParameters, {
                [`${moduleName}.py`]: pythonCode,
                [`${moduleName}.json`]: jsonContent,
                'Dockerfile': dockerfileContent,
                'requirements.txt': requirementsContent,
            });

            // Call the callback function to update the module list in the parent component
            if (onModuleCreated) {
                onModuleCreated();
            }
            setIsLoading(false);
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
        } finally {
            setIsLoading(false); // Set loading to false
        }
    };

    // Generate the required route string for the Python file
    const requiredRoute = `@app.route('/${moduleName}', methods=['POST'])`;

    // Function to create the additional code block with dynamic module name
    const createAdditionalCode = (moduleName) => {
        return `
def anonymize():
# Add your anonymization logic here

@app.route('/${moduleName}/metadata', methods=['GET']) 
def get_metadata():
    return send_file('${moduleName}.json', as_attachment=False)

if __name__ == '__main__':
    app.run(debug=True)
        `;
    };

    // Prefill the pythonCode with the required route and additional code when moving to step 2
    useEffect(() => {
        if (step === 2 && moduleName) {
            // Combine the required route and additional code
            const additionalCode = createAdditionalCode(moduleName);
            setPythonCode(`${requiredRoute}\n${additionalCode}`); // Prefill the textarea with the complete code
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
        <>
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            contentLabel="Add New Module"
            style={customStyles}
        >
            <h2>Add a New Module</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
                {step === 1 && (
                    <div style={styles.formGroup}>
                        Enter the name of the module you want to create, select the algorithm type and specify the module category. Ensure that all fields are filled out before proceeding to the next step.
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
                        Please enter the Python code for your anonymization modules using Flask APIs.
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
                        Please enter the input parameters of your anonymization module API. There is prefilled text as an example, you may add/update below text.
                        <textarea
                            value={inputParameters}
                            onChange={(e) => setInputParameters(e.target.value)}
                            required
                            style={styles.textarea}
                        />
                        <div style={styles.buttonGroup}>
                            <button type="button" onClick={handlePrevious} style={styles.previousButton}>Previous</button>
                            <button type="button" onClick={handleNextWithValidation} style={styles.nextButton}>Next</button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div style={styles.formGroup}>
                        Please fill in the metadata information explaining the following details regarding your anonymization module inside the double quotes provided.
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

                {step === 5 && (
                    <div style={styles.formGroup}>
                        Provide the contents of the Dockerfile for your module. This file is essential for containerizing your application. Ensure that it is correctly set up to run your module properly.
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

                {step === 6 && (
                    <div style={styles.formGroup}>
                        Enter the Python dependencies for your module in the requirements.txt format. This list is crucial for the installation of necessary packages when deploying the module.
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
        {/* Loader Section */}
        {isLoading && (
            <div style={styles.loader}>
                <div className="honeycomb">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
            </div>
        )}

        {/* CSS for loader */}
        <style>
            {`
                @-webkit-keyframes honeycomb {
                    0%, 20%, 80%, 100% { opacity: 0; -webkit-transform: scale(0); transform: scale(0); }
                    30%, 70% { opacity: 1; -webkit-transform: scale(1); transform: scale(1); }
                }
                @keyframes honeycomb {
                    0%, 20%, 80%, 100% { opacity: 0; -webkit-transform: scale(0); transform: scale(0); }
                    30%, 70% { opacity: 1; -webkit-transform: scale(1); transform: scale(1); }
                }
                .honeycomb {
                    height: 24px;
                    position: relative;
                    width: 24px;
                }
                .honeycomb div {
                    -webkit-animation: honeycomb 2.1s infinite backwards;
                    animation: honeycomb 2.1s infinite backwards;
                    background: #f3f3f3;
                    height: 12px;
                    margin-top: 6px;
                    position: absolute;
                    width: 24px;
                }
                .honeycomb div:after,
                .honeycomb div:before {
                    content: '';
                    border-left: 12px solid transparent;
                    border-right: 12px solid transparent;
                    position: absolute;
                    left: 0;
                    right: 0;
                }
                .honeycomb div:after {
                    top: -6px;
                    border-bottom: 6px solid #f3f3f3;
                }
                .honeycomb div:before {
                    bottom: -6px;
                    border-top: 6px solid #f3f3f3;
                }
                .honeycomb div:nth-child(1) { -webkit-animation-delay: 0s; animation-delay: 0s; left: -28px; top: 0; }
                .honeycomb div:nth-child(2) { -webkit-animation-delay: 0.1s; animation-delay: 0.1s; left: -14px; top: 22px; }
                .honeycomb div:nth-child(3) { -webkit-animation-delay: 0.2s; animation-delay: 0.2s; left: 14px; top: 22px; }
                .honeycomb div:nth-child(4) { -webkit-animation-delay: 0.3s; animation-delay: 0.3s; left: 28px; top: 0; }
                .honeycomb div:nth-child(5) { -webkit-animation-delay: 0.4s; animation-delay: 0.4s; left: 14px; top: -22px; }
                .honeycomb div:nth-child(6) { -webkit-animation-delay: 0.5s; animation-delay: 0.5s; left: -14px; top: -22px; }
                .honeycomb div:nth-child(7) { -webkit-animation-delay: 0.6s; animation-delay: 0.6s; left: 0; top: 0; }
            `}
        </style>
    </>
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
        backgroundColor: '#2c2c2c',
        zIndex: '1001',
        overflowY: 'auto',
        scrollbarWidth: 'thin', // For Firefox: make scrollbar thin
        scrollbarColor: '#555 #1c1c1c', // For Firefox: scrollbar color
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',  // Dark overlay
        zIndex: '1000',
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
        border: '1px solid #555',
        borderradius: '4px',
        backgroundColor: '#333',
        color: '#e0e0e0',
    },
    textarea: {
        flexGrow: 1,
        padding: '10px',
        fontSize: '16px',
        width: '100%',
        boxSizing: 'border-box',
        height: '100%',
        border: '1px solid #555',
        borderradius: '4px',
        backgroundColor: '#333',
        color: '#e0e0e0',
        overflowY: 'auto', // Enable vertical scrolling if needed
        scrollbarWidth: 'thin', // For Firefox: make scrollbar thin
        scrollbarColor: '#555 #1c1c1c', // For Firefox: scrollbar color
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
    loader: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh', // Make loader full screen height
        flexDirection: 'column', // Center loader in column
        position: 'fixed', // Fix loader position
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark overlay behind loader
        zIndex: 1000, // Higher z-index to appear above other elements
    },
};

const customScrollbarStyles = `
    ::-webkit-scrollbar {
        width: 8px; /* Width of the scrollbar */
    }
    ::-webkit-scrollbar-track {
        background: #1c1c1c; /* Background of the scrollbar track */
    }
    ::-webkit-scrollbar-thumb {
        background-color: #555; /* Color of the scrollbar handle */
        border-radius: 10px; /* Rounded edges for the scrollbar handle */
    }
    ::-webkit-scrollbar-thumb:hover {
        background-color: #777; /* Color of the scrollbar handle on hover */
    }
`;

export default AddModuleModal;
