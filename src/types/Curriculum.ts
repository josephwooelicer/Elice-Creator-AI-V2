export interface Curriculum {
  title: string;
  description: string;
  tags: string[];
  recommended: boolean;
  learningOutcomes: string[];
  content: {
    lessons: string[];
  };
}