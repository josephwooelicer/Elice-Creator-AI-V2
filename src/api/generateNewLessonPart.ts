import { ai } from './client';
import type { Curriculum, LessonPlan, GenerationOptions } from '../types';
import { exerciseSchema, quizQuestionSchema } from './schema';
import { cleanAndParseJson } from './jsonUtils';
import { buildNewPartPrompt } from './promptBuilder';

type PartToGenerate = 'exercise' | 'quiz';

const getResponseSchemaForPart = (part: PartToGenerate) => {
    switch (part) {
        case 'exercise': return exerciseSchema;
        case 'quiz': return quizQuestionSchema;
        default: throw new Error('Invalid part type');
    }
};

export const generateNewLessonPart = async (
  curriculum: Curriculum,
  lessonPlan: LessonPlan,
  lessonTitle: string,
  partToGenerate: PartToGenerate,
  options: GenerationOptions,
): Promise<any> => {
    
  const schema = getResponseSchemaForPart(partToGenerate);
  const prompt = buildNewPartPrompt(curriculum, lessonPlan, lessonTitle, partToGenerate, options);
  
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
    console.error(`Error generating new lesson part (${partToGenerate}):`, error);
    throw error;
  }
};