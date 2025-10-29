import { ai } from './client';
import { fileStructureSchema } from './schema';
import { API_MODELS, appConfig } from '../config';
// FIX: Corrected import path for simulateProgress
import { simulateProgress } from '../utils';
import { cleanAndParseJson } from './jsonUtils';
// FIX: Import ProjectFilesData from the shared types file to resolve export ambiguity.
import type { CapstoneProject, ProjectFilesData } from '../types';

export const generateProjectFiles = async (
  project: CapstoneProject,
  onProgress: (progress: number) => void
): Promise<ProjectFilesData> => {
    
  const prompt = `You are an expert software architect. Based on the following detailed capstone project specification, generate a complete and runnable file structure with boilerplate code.

**Project Specification:**
- **Title:** ${project.title}
- **Description:** ${project.detailedDescription}
- **Industry:** ${project.industry}
- **Tech Stack:** ${project.techStack.join(', ')}
- **Learning Outcomes:**\n${project.learningOutcomes.map(o => `- ${o}`).join('\n')}
- **Project Requirements:**\n${project.projectRequirements.map(r => `- ${r}`).join('\n')}
- **Deliverables:**\n${project.deliverables.map(d => `- ${d}`).join('\n')}

**Your Task:**
Generate a complete file and folder structure. For key files (e.g., \`package.json\`, \`app.py\`, \`index.html\`, \`Dockerfile\`, \`docker-compose.yml\`), provide realistic boilerplate code. The goal is to give the student a runnable starting point. Ensure the file content is well-formatted and properly escaped within the JSON string. For non-essential files, you can leave the content empty.

**CRITICAL REQUIREMENT: README.md**
You MUST include a comprehensive \`README.md\` file at the root of the project structure. This file is crucial. Its content must be well-structured markdown and include the following sections:
1.  **Project Title:** An \`h1\` with the project title.
2.  **Overview:** A detailed overview from the project specification.
3.  **Learning Outcomes:** A bulleted list of learning outcomes.
4.  **Tech Stack:** A bulleted list of the technologies used.
5.  **Requirements:** A bulleted list of project requirements.
6.  **Deliverables:** A bulleted list of deliverables.
7.  **Running the Project:** A section with commands to run the application in a development environment.
8.  **Building for Production (if applicable):** A section with commands for creating a production build.
9.  **Deployment (if applicable):** A section providing guidance on how to deploy the application.

**CRITICAL REQUIREMENT: SETUP.md**
You MUST also include a separate \`SETUP.md\` file at the root. This file must contain clear, step-by-step instructions that allow a student to get the project running. It MUST include sections for:
1.  **Prerequisites:** List all required software and tools with specific versions (e.g., Node.js v18+, Python 3.10).
2.  **Installation:** Provide the exact commands to install all project dependencies (e.g., \`npm install\`, \`pip install -r requirements.txt\`).
3.  **Configuration/Initialization:** Detail any one-time setup steps, like creating a \`.env\` file from an example or running database migrations.

Your output MUST be a single, valid JSON object that strictly adheres to the provided schema. Do not include any markdown or explanatory text outside the JSON object. Ensure all special characters are properly escaped for JSON, especially backslashes (\\\\) and double quotes (\\").
`;
  
  const progressInterval = simulateProgress(appConfig.SIMULATED_PROGRESS_DURATIONS.capstoneDetails, onProgress);

  try {
      const response = await ai.models.generateContent({
        model: API_MODELS.GENERATE_DETAILED_PROJECT, // Use the powerful model for code generation
        contents: [prompt],
        config: {
          responseMimeType: 'application/json',
          responseSchema: fileStructureSchema
        }
      });
      clearInterval(progressInterval);
      onProgress(100);

      const generatedData = cleanAndParseJson<ProjectFilesData>(response.text);
      return generatedData;
  } catch (error) {
    clearInterval(progressInterval);
    onProgress(0);
    console.error("Error generating project files:", error);
    throw error;
  }
};