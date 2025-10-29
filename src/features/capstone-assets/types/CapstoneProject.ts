export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
}

export interface ProjectFilesData {
  fileStructure: FileNode[];
}

export interface CapstoneProject {
  id: number;
  title: string;
  description: string;
  industry: string;
  tags: string[];
  recommended: boolean;
  learningOutcomes: string[];
  techStack: string[];
  projectRequirements: string[];
  deliverables: string[];
  detailedDescription: string;
  fileStructure?: FileNode[];
}
