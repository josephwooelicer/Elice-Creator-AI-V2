import type { Exercise } from './Exercise';

export interface LessonPlan {
  lessonOutcome: string;
  lessonOutline: string;
  exercises: Exercise[];
  quiz: {
    questions: {
      question: string;
      options: string[];
      answer: string;
      explanation: string;
    }[];
  };
  project: {
    description: string;
    objective: string;
    deliverables: string[];
  };
}