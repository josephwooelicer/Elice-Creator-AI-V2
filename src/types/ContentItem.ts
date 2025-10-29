import type { GenerationOptions } from './GenerationOptions';

export interface ContentItem {
  id: number;
  name: string;
  lessonCount: number;
  lessonDuration: number; // hours
  difficulty: string;
  created: string;
  notes?: string;
  generationOptions: GenerationOptions;
  lessons: {
    title: string;
    content: string;
  }[];
}
