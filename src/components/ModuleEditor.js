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
            const { structure, sha } = await getStructure();
            setStructure(structure); // Save structure to state
        };

        fetchStructure(); // Call the async function
    }, []);

    // Extract the algorithm types (top-level keys)
    const algorithmTypes = structure ? Object.keys(structure) : [];

    // Extract the modules only if structure is defined
    const moduleNames = structure ? Object.values(structure).map(obj => Object.keys(obj)) : [];

    // Extract the subModules only if structure is defined
    const subModules = structure
        ? Object.keys(structure).reduce((acc, algorithm) => {
            const algorithmModules = structure[algorithm];
            Object.keys(algorithmModules).forEach(module => {
                acc[module] = algorithmModules[module];
            });
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
                console.log(modulesData);
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
            const codeData = await getModuleCode(module);
            setCode(codeData);
            setSelectedModule(module);
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

    const handleCreateModule = async ({ moduleName, algorithmType, moduleCategory, filesContent }) => {
        try {
            await createModule(moduleName, algorithmType, moduleCategory, filesContent);
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
        <div className='content'>
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
                                                    {subModules[module].map((subModule) => (
                                                        <li
                                                            key={subModule}
                                                            className={selectedModule === subModule ? 'selected' : ''}
                                                            onClick={() => handleModuleClick(subModule)}
                                                        >
                                                            {subModule}
                                                        </li>
                                                    ))}
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
                            <button class="add-module">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" class="svg-icon">
                                    <g stroke-width="1.5" stroke-linecap="round" stroke="#ffffff">
                                        <circle r="2.5" cy="10" cx="10"></circle>
                                        <path fill-rule="evenodd" d="m8.39079 2.80235c.53842-1.51424 2.67991-1.51424 3.21831-.00001.3392.95358 1.4284 1.40477 2.3425.97027 1.4514-.68995 2.9657.82427 2.2758 2.27575-.4345.91407.0166 2.00334.9702 2.34248 1.5143.53842 1.5143 2.67996 0 3.21836-.9536.3391-1.4047 1.4284-.9702 2.3425.6899 1.4514-.8244 2.9656-2.2758 2.2757-.9141-.4345-2.0033.0167-2.3425.9703-.5384 1.5142-2.67989 1.5142-3.21831 0-.33914-.9536-1.4284-1.4048-2.34247-.9703-1.45148.6899-2.96571-.8243-2.27575-2.2757.43449-.9141-.01669-2.0034-.97028-2.3425-1.51422-.5384-1.51422-2.67994.00001-3.21836.95358-.33914 1.40476-1.42841.97027-2.34248-.68996-1.45148.82427-2.9657 2.27575-2.27575.91407.4345 2.00333-.01669 2.34247-.97026z" clip-rule="evenodd"></path>
                                    </g>
                                </svg>
                                <span class="label">Add New Module</span>
                                {/* Add Module Modal */}

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
                        />
                        <button onClick={handleSaveChanges}>
                            Save Changes
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
