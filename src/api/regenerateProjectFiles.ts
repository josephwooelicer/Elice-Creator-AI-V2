import { ai } from './client';
import { fileStructureSchema } from './schema';
import { API_MODELS, appConfig } from '../config';
// FIX: Corrected import path for simulateProgress
import { simulateProgress } from '../utils';
import { cleanAndParseJson } from './jsonUtils';
// FIX: Import ProjectFilesData from the shared types file to resolve export ambiguity.
import type { CapstoneProject, ProjectFilesData } from '../types';
import { buildProjectFileRegenerationPrompt } from './promptBuilder';

export const regenerateProjectFiles = async (
  project: CapstoneProject,
  instructions: string,
  onProgress: (progress: number) => void
): Promise<ProjectFilesData> => {
    
  const prompt = buildProjectFileRegenerationPrompt(project, instructions);
  
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
    console.error("Error regenerating project files:", error);
    throw error;
  }
};