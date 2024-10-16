// components/ModuleEditor.js
import React, { useEffect, useState } from 'react';
import { getModulesList, getModuleCode, updateModuleCode, createModule, getFileSHA, getStructure } from './services/githubService';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-python';
import AddModuleModal from './AddModuleModal';

import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-github';
import './ModuleEditor.css'

const ModuleEditor = () => {

    const [modules, setModules] = useState([]);
    const [selectedModule, setSelectedModule] = useState(null);
    const [code, setCode] = useState('');
    const [sha, setSha] = useState(''); // To track the file version on GitHub
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedIndexes, setExpandedIndexes] = useState([]);

    const [structure, setStructure] = useState(null);

    useEffect(() => {
        const fetchStructure = async () => {
            const { structure, sha } = await getStructure('structure.json');
            setStructure(structure); // Save structure to state
        };

        fetchStructure(); // Call the async function
    }, []);

    // Extract the algorithm types (top-level keys)
    const algorithmTypes = structure ? Object.keys(structure) : [];

    // Extract the modules only if structure is defined
    const moduleNames = structure
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

    useEffect(() => {
        // Fetch the list of modules when the component loads
        const fetchModules = async () => {
            try {
                const modulesData = await getModulesList();
                // Filter out the unwanted items based on the name property
                const filteredModules = modulesData.filter(module =>
                    module.name !== '.github' &&
                    module.name !== 'nginx' &&
                    module.name !== 'docker-compose.yml'
                );

                setModules(filteredModules); // Set the filtered list of modules

            } catch (error) {
                console.error('Error fetching modules:', error);
            }
        };
        fetchModules();
    }, []);

    const handleModuleClick = async (module) => {
        try {
            const mapping = {
                "Laplace Mechanism": "dp-laplace",
                "Exponential Mechanism": "dp-exponential",
                "Gaussian Mechanism": "dp-gaussian",
                "Differentially Private Queries using Laplace": "dp-queries-lp",
                "Differentially Private Queries using Exponential": "dp-queries-ep",
                "CTGAN Synthesis": "ctgan-synthesis",
                "Gaussian Copula": "gaussian-copula",
                "TVAE Synthesis": "tvae-synthesis",
            }
            const mappedModule = mapping[module] || module;
            const codeData = await getModuleCode(mappedModule);
            setCode(codeData);
            setSelectedModule(mappedModule);
        } catch (error) {
            console.error('Error fetching module code:', error);
        }
    };

    const handleSaveChanges = async () => {
        if (selectedModule) {
            try {
                // First, get the latest SHA of the file
                const latestSHA = await getFileSHA(selectedModule);

                // Now update the module code with the correct SHA
                await updateModuleCode(selectedModule, code, latestSHA);
                alert('Changes saved!');
            } catch (error) {
                console.error('Error saving changes:', error);
                alert('Failed to save changes.');
            }
        }
    };

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const handleCreateModule = async ({ moduleName, algorithmType, moduleCategory, inputParameters, filesContent }) => {
        try {
            await createModule(moduleName, algorithmType, moduleCategory, inputParameters, filesContent);
            alert(`Module "${moduleName}" created successfully!`);
            closeModal();
            // Refresh the modules list
            const modulesData = await getModulesList();
            setModules(modulesData);
        } catch (error) {
            console.error('Error creating module:', error);
            alert('Failed to create module. Ensure the module name is unique and try again.');
        }
    };

    return (
        <div className='editor-content'>
            <div className="toolbox-list">
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
                                    {moduleNames[index].map((module) => (
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
                                                                    onClick={() => handleModuleClick(subModule)}
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
                    <li onClick={openModal}>
                        <div className="add-module-container">
                            <button className="add-button">
                                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" className="plusIcon" viewBox="0 0 30 30">
                                    <g strokeWidth="1.5" strokeLinecap="round" stroke="#ffffff">
                                        <path d="M13.75 23.75V16.25H6.25V13.75H13.75V6.25H16.25V13.75H23.75V16.25H16.25V23.75H13.75Z"></path>
                                    </g>
                                </svg>
                                <span className="label">Add New Module</span>
                            </button>
                        </div>
                    </li>

                </ul>

            </div>

            {/* Code Editor */}
            <div className={`editor ${selectedModule ? '' : 'disabled'}`}>
                <h3>{selectedModule ? `Editing: ${selectedModule}.py` : 'Select a module'}</h3>
                {selectedModule && (
                    <>
                        <AceEditor
                            mode="python" // Adjust mode based on file type if needed
                            theme="github"
                            name="code-editor"
                            value={code || ""}
                            onChange={(newCode) => setCode(newCode)}
                            editorProps={{ $blockScrolling: true }}
                            setOptions={{
                                useWorker: false, // Disable syntax checking
                            }}
                            className="custom-ace-editor"
                            data-ace-show-print-margin="false"
                            style={{
                                width: '100%',   // Or any custom width like '500px'
                                height: '480px', // Or any custom height
                            }}
                        />
                        <button class="button" onClick={handleSaveChanges}>
                            <svg viewBox="0 0 384 512" height="1em" xmlns="http://www.w3.org/2000/svg">
                                <g strokeWidth="1.5" stroke="white" fill="white">
                                    <path d="M0 48C0 21.5 21.5 0 48 0l0 48V441.4l130.1-92.9c8.3-6 19.6-6 27.9 0L336 441.4V48H48V0H336c26.5 0 48 21.5 48 48V488c0 9-5 17.2-13 21.3s-17.6 3.4-24.9-1.8L192 397.5 37.9 507.5c-7.3 5.2-16.9 5.9-24.9 1.8S0 497 0 488V48z"></path>
                                </g>
                            </svg>
                            <span>Save Changes</span>
                        </button>
                    </>
                )}
            </div>





            <AddModuleModal
                isOpen={isModalOpen}
                onRequestClose={closeModal}
                onCreate={handleCreateModule}
            />

        </div>
    );
};

export default ModuleEditor;
