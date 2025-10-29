import { ai } from './client';
import { detailedCapstoneProjectSchema } from './schema';
import { API_MODELS, appConfig } from '../config';
// FIX: Corrected import path for simulateProgress
import { simulateProgress } from '../utils';
import { cleanAndParseJson } from './jsonUtils';
import type { CapstoneProject } from '../types';

export type DetailedProjectData = Pick<CapstoneProject, 
    'detailedDescription' | 
    'learningOutcomes' | 
    'projectRequirements' | 
    'techStack' | 
    'deliverables'
>;


export const generateDetailedProject = async (
  project: CapstoneProject,
  onProgress: (progress: number) => void
): Promise<DetailedProjectData> => {
    
  const prompt = `You are an expert software architect and instructional designer. Based on the following high-level capstone project brief, expand it into a detailed project specification suitable for a student.

**Project Brief:**
- **Title:** ${project.title}
- **Description:** ${project.description}
- **Industry:** ${project.industry}
- **Difficulty:** ${project.tags.find(t => ['Beginner', 'Intermediate', 'Advanced'].includes(t)) || 'Beginner'}
- **Initial Tech Stack:** ${project.techStack.join(', ')}
- **Initial Requirements:** ${project.projectRequirements.join('; ')}
- **Initial Deliverables:** ${project.deliverables.join('; ')}
- **Initial Learning Outcomes:** ${project.learningOutcomes.join('; ')}

**Your Task:**
Generate a comprehensive project specification. Your output MUST be a single, valid JSON object that strictly adheres to the provided schema. Ensure all special characters are properly escaped for JSON, especially backslashes (\\\\) and double quotes (\\").

**Generation Guidelines:**
1.  **detailedDescription:** Write a comprehensive description in markdown format, structured with clear sections for readability. It MUST include the following structure:
    - Start with a level-2 heading \`## Project Overview\` providing a brief summary.
    - Follow with a level-2 heading \`## Scenario\`. Use a markdown blockquote (\`>\`) to frame a real-world brief (e.g., from a client or product manager).
    - Then, a level-2 heading \`## Core Features\` with a detailed, nested bulleted list of functionalities.
    - Conclude with an optional level-2 heading \`## Key Technical Considerations\` to highlight important architectural decisions or challenges.
    - Use bold text for emphasis on key terms throughout the description.
2.  **learningOutcomes:** Refine and expand the initial list into 4-6 specific, measurable learning outcomes.
3.  **projectRequirements:** Create a detailed, itemized list of both functional and non-functional requirements. Be specific.
4.  **techStack:** Confirm the tech stack. You may add specific libraries or versions if it adds clarity (e.g., "React 18", "Flask-SQLAlchemy"). The list MUST be decisive; do not suggest alternatives (e.g., use "PostgreSQL" instead of "PostgreSQL or MySQL").
5.  **deliverables:** Create a detailed, itemized list of professional-quality deliverables (e.g., "Link to a live, hosted application", "Source code repository with a detailed README.md").
`;
  
  const progressInterval = simulateProgress(appConfig.SIMULATED_PROGRESS_DURATIONS.capstoneDetails, onProgress);

  try {
      const response = await ai.models.generateContent({
        model: API_MODELS.GENERATE_DETAILED_PROJECT,
        contents: [prompt],
        config: {
          responseMimeType: 'application/json',
          responseSchema: detailedCapstoneProjectSchema
        }
      });
      clearInterval(progressInterval);
      onProgress(100);

      const generatedData = cleanAndParseJson<DetailedProjectData>(response.text);
      return generatedData;
  } catch (error) {
    clearInterval(progressInterval);
    onProgress(0);
    console.error("Error generating detailed capstone project:", error);
    throw error;
  }
};