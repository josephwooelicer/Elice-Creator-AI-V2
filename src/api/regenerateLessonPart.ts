import { ai } from './client';
import type { Curriculum, LessonPlan, GenerationOptions } from '../types';
import type { RegenerationPart } from '../types/Regeneration';
import { exerciseSchema, quizQuestionSchema, lessonOutlineSchema, lessonOutcomeSchema, projectSchema, lessonTitleSchema, curriculumTitleSchema } from './schema';
import { cleanAndParseJson } from './jsonUtils';
import { buildRegenerationPrompt } from './promptBuilder';

const getResponseSchemaForPart = (part: RegenerationPart) => {
    switch (part.type) {
        case 'outcome': return lessonOutcomeSchema;
        case 'outline': return lessonOutlineSchema;
        case 'exercise': return exerciseSchema;
        case 'quiz': return quizQuestionSchema;
        case 'project': return projectSchema;
        case 'title': return lessonTitleSchema;
        case 'curriculumTitle': return curriculumTitleSchema;
        default: throw new Error('Invalid regeneration part type');
    }
};

export const regenerateLessonPart = async (
  curriculum: Curriculum,
  lessonPlan: LessonPlan | null,
  lessonTitle: string | null,
  partToRegenerate: RegenerationPart,
  instructions: string,
  options: GenerationOptions,
): Promise<any> => {
    
  const schema = getResponseSchemaForPart(partToRegenerate);
  const prompt = buildRegenerationPrompt(curriculum, lessonPlan, lessonTitle, partToRegenerate, instructions, options);
  
  try {
      const response = await ai.models.generateContent({
        model: options.model,
        contents: [prompt],
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
        }
      });
      
      return cleanAndParseJson(response.text);

  } catch (error) {
    console.error(`Error regenerating lesson part (${partToRegenerate.type}):`, error);
    throw error;
  }
};