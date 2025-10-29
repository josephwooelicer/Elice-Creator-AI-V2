import { ai } from './client';
import type { GenerateCurriculumResponse } from '../types';
import { curriculumSchema } from './schema';
import { discoveryFilters, API_MODELS, appConfig } from '../config';
// FIX: Corrected import path for simulateProgress
import { simulateProgress } from '../utils';
import { cleanAndParseJson } from './jsonUtils';

interface FilterOptions {
  [key: string]: string;
}

export const generateCurriculum = async (
  topic: string,
  filters: FilterOptions,
  onProgress: (progress: number) => void
): Promise<GenerateCurriculumResponse> => {
  let filterInstructions = '';

  for (const filterConfig of discoveryFilters) {
    const filterId = filterConfig.id;
    const selectedValue = filters[filterId];

    if (selectedValue && selectedValue !== 'any') {
      const selectedOption = filterConfig.options.find(opt => opt.value === selectedValue);
      if (selectedOption) {
        const valueForPrompt = selectedOption.promptValue ?? selectedValue;
        const instruction = filterConfig.promptTemplate.replace('{value}', valueForPrompt);
        filterInstructions += ` ${instruction}`;
      }
    } else if (filterId === 'difficulty' && selectedValue === 'any') {
      filterInstructions += ` For each curriculum, randomly assign a difficulty level from "Beginner", "Intermediate", or "Advanced".`;
    }
  }

  let contentBreakdownInstruction: string;
  if (filters.numLessons && filters.numLessons !== 'any') {
    // If a lesson count is specified, instruct the AI to adhere to it.
    contentBreakdownInstruction = `For the content breakdown, provide a list of lesson titles that strictly adheres to the lesson count specified in the filter.`;
  } else {
    // If no filter is applied, provide a more flexible default.
    contentBreakdownInstruction = `For the content breakdown, provide a list of lesson titles, with a varying number of titles (typically 5-7) for each outline.`;
  }
  contentBreakdownInstruction += ` The final lesson in the list must ALWAYS be a capstone project that allows learners to apply everything they've learned. Its title MUST start with "Capstone Project:". For example: "Capstone Project: Build a Portfolio Website".`;

  const prompt = `You are an expert instructional designer. For the topic "${topic}", create 6 distinct curriculum outlines. Each outline must be tailored for a different learning objective or audience (e.g., beginner-focused, project-based, for advanced developers, etc.).${filterInstructions} The first outline must be the most comprehensive and balanced, and it must be marked as "recommended: true". All other outlines must be marked "recommended: false". For every curriculum, you must provide: a concise title, a short description (2-3 sentences), 3-4 relevant tags, and a list of 4-5 key learning outcomes. The first tag must always be the difficulty level ('Beginner', 'Intermediate', or 'Advanced') and appropriately assigned based on actual difficulty. ${contentBreakdownInstruction} CRITICAL for JSON format: Ensure all characters are properly escaped. For example, any backslashes (\\) must be escaped as (\\\\). Do not use special formatting like LaTeX; write out symbols as text (e.g., "beta" instead of "\\beta"). Finally, provide a list of your "agent thoughts" explaining the reasoning behind the different curriculum variations you created.`;
  
  const progressInterval = simulateProgress(appConfig.SIMULATED_PROGRESS_DURATIONS.discovery, onProgress);

  try {
      const response = await ai.models.generateContent({
        model: API_MODELS.GENERATE_CURRICULUM,
        contents: [prompt],
        config: {
          responseMimeType: 'application/json',
          responseSchema: curriculumSchema
        }
      });
      clearInterval(progressInterval);
      onProgress(100);

      const generatedData = cleanAndParseJson<GenerateCurriculumResponse>(response.text);
      return {
        curriculums: generatedData.curriculums || [],
        agentThoughts: generatedData.agentThoughts || []
      };
  } catch (error) {
    clearInterval(progressInterval);
    onProgress(0);
    console.error("Error generating curriculum data:", error);
    throw error;
  }
};