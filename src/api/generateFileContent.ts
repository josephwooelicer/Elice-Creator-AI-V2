import { ai } from './client';
import { API_MODELS } from '../config';
import type { CapstoneProject, FileNode } from '../types';

export const generateFileContent = async (
  project: CapstoneProject,
  fileStructure: FileNode[],
  filePath: string,
): Promise<string> => {
    
  const prompt = `You are an expert software developer. Your task is to generate the code for a single file within a larger project.

**Project Context:**
- **Title:** ${project.title}
- **Description:** ${project.detailedDescription}
- **Tech Stack:** ${project.techStack.join(', ')}

**Full Project File Structure (for context):**
\`\`\`json
${JSON.stringify(fileStructure, null, 2)}
\`\`\`

**File to Generate:**
Generate the complete code content for the file at this path: \`${filePath}\`.

**Instructions:**
- Write production-quality, clean, and well-commented code.
- Adhere to the project's tech stack and overall architecture.
- For \`README.md\` and \`SETUP.md\`, provide comprehensive, well-structured markdown content as previously specified for these files.
- The response should be ONLY the raw code/text content for the file. Do not wrap it in JSON, markdown, or any other formatting.
`;
  
  try {
      const response = await ai.models.generateContent({
        model: API_MODELS.GENERATE_DETAILED_PROJECT,
        contents: [prompt],
      });
      
      return response.text;

  } catch (error) {
    console.error(`Error generating content for file ${filePath}:`, error);
    throw error;
  }
};
