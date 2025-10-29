import { ai } from './client';
import { capstoneProjectsSchema } from './schema';
import { API_MODELS, appConfig } from '../config';
// FIX: Corrected import path for simulateProgress
import { simulateProgress } from '../utils';
import { cleanAndParseJson } from './jsonUtils';
import type { CapstoneProject } from '../types';

export interface GenerateCapstoneProjectsResponse {
  projects: Omit<CapstoneProject, 'id' | 'detailedDescription' | 'fileStructure' | 'industry'>[];
  agentThoughts: string[];
}

export const generateCapstoneProjects = async (
  topic: string,
  industry: string,
  onProgress: (progress: number) => void
): Promise<GenerateCapstoneProjectsResponse> => {
    
  const industryPrompt = industry === 'All'
    ? 'for the tech industry in general'
    : `specifically for the ${industry} industry`;

  const prompt = `You are an expert curriculum and project strategist for tech education. For the trending topic "${topic}", ${industryPrompt}, create 10 distinct capstone project outlines. Each outline should target a different angle or complexity. The first project must be the most balanced and comprehensive, and it must be marked as "recommended: true". All other outlines must be marked "recommended: false". For every project, you must provide: a concise title, a short one-sentence description, a list of 3-4 key learning outcomes, 3-4 relevant tags (the first tag MUST be the difficulty level: 'Beginner', 'Intermediate', or 'Advanced'), a list of 3-5 key technologies for the tech stack, a list of 3-4 high-level project requirements, and a list of 2-3 expected deliverables. CRITICAL for the tech stack: Be decisive and choose one specific technology for each purpose. Do not suggest alternatives (e.g., use "React" instead of "React or Vue"). CRITICAL for JSON format: Ensure all characters are properly escaped. For example, any backslashes (\\) must be escaped as (\\\\). Do not use special formatting like LaTeX; write out symbols as text (e.g., "beta" instead of "\\beta"). Finally, provide a list of your "agent thoughts" explaining the reasoning behind the different project variations you created.`;
  
  const progressInterval = simulateProgress(appConfig.SIMULATED_PROGRESS_DURATIONS.capstoneDiscovery, onProgress);

  try {
      const response = await ai.models.generateContent({
        model: API_MODELS.GENERATE_CAPSTONE_PROJECTS,
        contents: [prompt],
        config: {
          responseMimeType: 'application/json',
          responseSchema: capstoneProjectsSchema
        }
      });
      clearInterval(progressInterval);
      onProgress(100);

      const generatedData = cleanAndParseJson<GenerateCapstoneProjectsResponse>(response.text);
      return {
        projects: generatedData.projects || [],
        agentThoughts: generatedData.agentThoughts || []
      };
  } catch (error) {
    clearInterval(progressInterval);
    onProgress(0);
    console.error("Error generating capstone projects:", error);
    throw error;
  }
};