import { ai } from './client';
import type { Curriculum, LessonPlan, GenerationOptions } from '../types';
import { lessonPlanSchema } from './schema';
// FIX: Corrected import path for simulateProgress
import { simulateProgress } from '../utils';
import { cleanAndParseJson } from './jsonUtils';
import { appConfig } from '../config';

export const generateLessonPlan = async (
  curriculum: Curriculum,
  lesson: string,
  options: GenerationOptions,
  previousLessons: LessonPlan[],
  onProgress: (progress: number) => void
): Promise<LessonPlan> => {
    
  const isCapstone = lesson.toLowerCase().includes('capstone');

  let previousLessonsContext = '';
  if (previousLessons && previousLessons.length > 0) {
      const previousLessonsJSON = JSON.stringify(
          previousLessons.map((plan, index) => ({
              lessonTitle: curriculum.content.lessons[index],
              lessonPlan: {
                  lessonOutcome: plan.lessonOutcome,
                  lessonOutline: plan.lessonOutline,
              }
          })), 
      null, 2);

      previousLessonsContext = `
**CONTEXT from Previous Lessons (in JSON format):**
You have already generated the following lesson plans for this curriculum. Use this information to ensure the new lesson plan builds upon them logically, avoids repetition, and maintains a consistent flow of difficulty and concepts.
\`\`\`json
${previousLessonsJSON}
\`\`\`

**CRITICAL:** Ensure the lesson plan for "${lesson}" follows logically from the previous lessons. Refer to concepts, examples, or code from earlier lessons where appropriate to create a cohesive learning experience.
`;
  }

  const standardInstructions = `Your output MUST be a single, valid JSON object that strictly adheres to the provided schema. Do not include any markdown formatting (like \`\`\`json) or explanatory text outside of the JSON object. Ensure that any special characters are properly escaped for JSON (e.g., double quotes as \\" and backslashes as \\\\).
The JSON object must contain these keys: "lessonOutcome", "lessonOutline", "exercises", "quiz", and "project".
- The value for "lessonOutcome" must be a concise learning outcome for this lesson.
- The value for "lessonOutline" must be a markdown-formatted lesson plan.
- The value for "exercises" must be a JSON array of exactly ${options.exercisesPerLesson} exercise object(s), enclosed in square brackets \`[]\`.
- The value for "quiz.questions" must be a JSON array of exactly ${options.quizQuestionsPerLesson} question object(s), enclosed in square brackets \`[]\`.
- The value for "project" must be an object with an empty "description", empty "objective", and an empty "deliverables" array \`[]\`.`;

  const capstoneInstructions = `This is a capstone project. Your output MUST be a single, valid JSON object that strictly adheres to the provided schema. Do not include any markdown formatting (like \`\`\`json) or explanatory text outside of the JSON object. Ensure that any special characters are properly escaped for JSON (e.g., double quotes as \\" and backslashes as \\\\).
The JSON object must contain these keys: "lessonOutcome", "lessonOutline", "exercises", "quiz", and "project".
- The value for "lessonOutcome" must be a concise, project-oriented learning outcome for this capstone.
- The value for "lessonOutline" MUST be an empty string ("").
- The value for "exercises" MUST be an empty JSON array (\`[]\`).
- The value for "quiz" MUST be an object with an empty "questions" JSON array (\`[]\`).
- The value for "project" must be fully populated with high-quality content:
  - "description": Provide a comprehensive project description framed within a real-world scenario. Act as a client or project manager outlining the project's goals and context. Include specific examples of features or pages to make the requirements clear. For instance, if it's a portfolio website, specify pages like 'Home', 'About', 'Projects', and what they should contain.
  - "objective": Write a clear objective that focuses on how the project allows students to synthesize and apply the skills learned throughout the entire curriculum.
  - "deliverables": Create a detailed, itemized list of professional-quality deliverables. This should be a JSON array of strings, enclosed in square brackets \`[]\`, with each string representing a concrete submission requirement (e.g., "A link to a live, hosted version of the web application", "Source code repository (e.g., GitHub) containing all project files").`;

  const prompt = `You are an expert instructional designer. Generate a detailed lesson plan for the lesson titled "${lesson}" from the curriculum "${curriculum.title}".
${previousLessonsContext}
Audience difficulty: "${curriculum.tags.find(t => ['Beginner', 'Intermediate', 'Advanced'].includes(t)) || 'Beginner'}".
Style: "${options.style}".
Duration: ~${options.lessonDuration} hour(s).
Additional instructions: "${options.instructions}".
CRITICAL: The "lessonOutline" field in your JSON response must NOT include the lesson title ("${lesson}"). The title is redundant as it is already known. Start the outline directly with the lesson content (e.g., introductions, key topics).
CRITICAL: Any programming code within the JSON response must be formatted using markdown code blocks inside the JSON strings. You MUST specify the programming language, for example: \`\`\`python ... \`\`\`. NEVER use plain \`\`\` without a language identifier. This is crucial for correct parsing.
CRITICAL: For quiz questions, if an option or answer contains an HTML tag or code snippet, it MUST be enclosed in backticks for correct rendering (e.g., format an option as "\`<p>\`", not "<p>").

${isCapstone ? capstoneInstructions : standardInstructions}
`;
  
  const progressInterval = simulateProgress(appConfig.SIMULATED_PROGRESS_DURATIONS.generation, onProgress);

  try {
      const response = await ai.models.generateContent({
        model: options.model,
        contents: [prompt],
        config: {
          responseMimeType: 'application/json',
          responseSchema: lessonPlanSchema,
        }
      });
      clearInterval(progressInterval);
      onProgress(100);

      return cleanAndParseJson<LessonPlan>(response.text);
  } catch (error) {
    clearInterval(progressInterval);
    onProgress(0);
    console.error("Error generating lesson plan:", error);
    throw error;
  }
};