import { ai } from './client';
import { fileStructureSchema } from './schema';
import { API_MODELS, appConfig } from '../config';
import { simulateProgress } from '../utils';
import { cleanAndParseJson } from './jsonUtils';
import type { CapstoneProject, ProjectFilesData } from '../types';

export const generateProjectFileStructure = async (
  project: CapstoneProject,
  onProgress: (progress: number) => void
): Promise<ProjectFilesData> => {
    
  const prompt = `You are an expert software architect. Based on the following detailed capstone project specification, generate a complete and runnable file structure.

**Project Specification:**
- **Title:** ${project.title}
- **Description:** ${project.detailedDescription}
- **Industry:** ${project.industry}
- **Tech Stack:** ${project.techStack.join(', ')}

**Your Task:**
Generate a complete file and folder structure for this project.
CRITICAL: For every file you define, its "content" property in the JSON MUST be an empty string (""). You are only generating the architecture, not the code content.
You MUST include a \`README.md\` and a \`SETUP.md\` file at the root.

Your output MUST be a single, valid JSON object that strictly adheres to the provided schema, with all file "content" properties set to an empty string. Do not include any markdown or explanatory text outside the JSON object.
`;
  
  const progressInterval = simulateProgress(appConfig.SIMULATED_PROGRESS_DURATIONS.capstoneDetails / 3, onProgress);

  try {
      const response = await ai.models.generateContent({
        model: API_MODELS.GENERATE_DETAILED_PROJECT,
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
    console.error("Error generating project file structure:", error);
    throw error;
  }
};
