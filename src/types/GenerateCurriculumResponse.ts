import type { Curriculum } from './Curriculum';

export interface GenerateCurriculumResponse {
  curriculums: Curriculum[];
  agentThoughts: string[];
}
