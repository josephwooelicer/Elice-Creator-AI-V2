import { Type } from '@google/genai';

// Define schema for level 2 nodes (files or empty folders inside a folder)
const fileNodeSchemaLevel2 = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: 'The name of the file or folder.' },
    type: { type: Type.STRING, description: "Either 'file' or 'folder'." },
    content: { type: Type.STRING, description: 'The boilerplate content of the file. Empty for folders.' },
    // No 'children' property here to stop recursion
  },
  required: ['name', 'type']
};

// Define schema for level 1 nodes (can contain level 2 nodes)
const fileNodeSchemaLevel1 = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: 'The name of the file or folder.' },
    type: { type: Type.STRING, description: "Either 'file' or 'folder'." },
    content: { type: Type.STRING, description: 'The boilerplate content of the file. Empty for folders.' },
    children: {
      type: Type.ARRAY,
      description: 'An array of nested file or folder nodes. Empty for files.',
      items: fileNodeSchemaLevel2
    }
  },
  required: ['name', 'type']
};

export const fileStructureSchema = {
    type: Type.OBJECT,
    properties: {
        fileStructure: {
            type: Type.ARRAY,
            description: 'A complete file and folder structure for the project, including boilerplate code for key files. The schema enforces up to 2 levels of nesting, but deeper structures are possible.',
            items: fileNodeSchemaLevel1,
        }
    },
    required: ['fileStructure']
};