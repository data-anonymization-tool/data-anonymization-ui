// services/githubService.js
import axios, { HttpStatusCode } from 'axios';

const GITHUB_API_BASE_URL = 'https://api.github.com';
const OWNER = 'data-anonymization-tool';
const REPO = 'data-anonymization-modules';
const BRANCH = 'ui-test'; // Or your desired branch
const TOKEN = process.env.REACT_APP_GITHUB_TOKEN; // Ensure this is stored securely
const branchS = 'master';

const getModulesList = async () => {
    const response = await axios.get(`${GITHUB_API_BASE_URL}/repos/${OWNER}/${REPO}/contents/?ref=${BRANCH}`, {
        headers: { Authorization: `token ${TOKEN}` }
    });
    return response.data;
};

const getModuleCode = async (modulePath) => {
    const api_path = `${GITHUB_API_BASE_URL}/repos/${OWNER}/${REPO}/contents/${modulePath}/${modulePath}.py?ref=${BRANCH}`;

    const response = await axios.get(api_path, {
        headers: { Authorization: `token ${TOKEN}` }
    });
    return atob(response.data.content); // Base64 decode content
};

const getFileSHA = async (modulePath) => {
    try {
        const response = await axios.get(`${GITHUB_API_BASE_URL}/repos/${OWNER}/${REPO}/contents/${modulePath}/${modulePath}.py?ref=${BRANCH}`, {
            headers: { Authorization: `token ${TOKEN}` }
        });
        return response.data.sha; // Return the latest SHA
    } catch (error) {
        console.error('Error fetching file SHA:', error.response.data);
        throw error;
    }
};

const updateModuleCode = async (modulePath, newCode, sha) => {
    try {
        const response = await axios.put(`${GITHUB_API_BASE_URL}/repos/${OWNER}/${REPO}/contents/${modulePath}/${modulePath}.py?ref=${BRANCH}`, {
            message: `Update ${modulePath}`,
            content: btoa(newCode), // Base64 encode content
            sha: sha, // SHA of the file being updated
            branch: BRANCH // Optional branch to commit to
        }, {
            headers: { Authorization: `token ${TOKEN}`, 'Content-Type': 'application/json' }
        });
        return response.data;
    } catch (error) {
        console.error('Error updating file:', error.response.data);
        throw error;
    }
};

const createOrUpdateFile = async (moduleName, fileName, content) => {
    const filePath = `${moduleName}/${fileName}`;
    const encodedContent = btoa(content); // Base64 encode content

    try {
        // Check if file already exists by getting the file's SHA
        const { data: existingFile } = await axios.get(`${GITHUB_API_BASE_URL}/repos/${OWNER}/${REPO}/contents/${filePath}`, {
            headers: { Authorization: `token ${TOKEN}` }
        });

        // If file exists, update it
        const response = await axios.put(`${GITHUB_API_BASE_URL}/repos/${OWNER}/${REPO}/contents/${filePath}`, {
            message: `Update ${fileName} in ${moduleName}`,
            content: encodedContent,
            sha: existingFile.sha, // Provide SHA to update existing file
            branch: BRANCH,
            committer: {
                name: "data-anonymization-tool",
                email: "dataanonymizationtool@gmail.com"
            },
        }, {
            headers: { Authorization: `token ${TOKEN}`, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        if (error.response && error.response.status === 404) {
            // File doesn't exist, create it
            const response = await axios.put(`${GITHUB_API_BASE_URL}/repos/${OWNER}/${REPO}/contents/${filePath}`, {
                message: `Create ${fileName} in ${moduleName}`,
                content: encodedContent,
                branch: BRANCH,
                committer: {
                    name: "data-anonymization-tool",
                    email: "dataanonymizationtool@gmail.com"
                },
            }, {
                headers: { Authorization: `token ${TOKEN}`, 'Content-Type': 'application/json' }
            });

            console.log(`Created file: ${fileName}`, response);
        } else {
            console.error(`Error with ${fileName}:`, error);
            throw error;
        }
    }
};

// Function to create or update files in the module
const createModule = async (moduleName, algorithmType, moduleCategory, filesContent) => {
    for (const [fileName, content] of Object.entries(filesContent)) {
        await createOrUpdateFile(moduleName, fileName, content);
    }

    await updateStructureJson(algorithmType, moduleCategory, moduleName);

};

const getStructure = async () => {
    // Step 1: Get the current contents of the file
    const response = await axios.get(`${GITHUB_API_BASE_URL}/repos/${OWNER}/${REPO}/contents/structure.json?ref=${branchS}`, {
        headers: {
            Authorization: `token ${TOKEN}`,
        },
    });

    const fileData = response.data;
    const content = atob(fileData.content); // Decode base64
    const structure = JSON.parse(content); // Parse the JSON

    return { structure, sha: fileData.sha };
}

const updateStructureJson = async (algorithmType, moduleCategory, moduleName) => {
    try {

        const { structure, sha } = await getStructure();

        // Step 2: Update the structure as needed
        if (!structure[algorithmType]) {
            structure[algorithmType] = {};
        }

        if (!structure[algorithmType][moduleCategory]) {
            structure[algorithmType][moduleCategory] = [];
        }

        if (!structure[algorithmType][moduleCategory].includes(moduleName)) {
            structure[algorithmType][moduleCategory].push(moduleName);
        }

        // Step 3: Create a new commit to update the file
        const updatedContent = btoa(JSON.stringify(structure, null, 4));
        await axios.put(`${GITHUB_API_BASE_URL}/repos/${OWNER}/${REPO}/contents/structure.json?ref=${branchS}`, {
            message: 'Update structure.json',
            content: updatedContent,
            sha: sha, // Include the SHA to update the existing file
            branch: branchS
        }, {
            headers: {
                Authorization: `token ${TOKEN}`,
            },
        });

        console.log('Module structure updated')

        return { success: true, message: 'File updated successfully' };
    } catch (error) {
        console.error('Error updating file:', error.response?.data || error.message);
        return { success: false, message: 'Failed to update file on GitHub' };
    }
};







export { getModulesList, getModuleCode, updateModuleCode, createModule, getFileSHA, updateStructureJson, getStructure };
