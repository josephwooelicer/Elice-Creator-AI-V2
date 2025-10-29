

import React, { useEffect, useState } from 'react';
import { ContentList } from './components/ContentList';
import { ContentViewer } from './components/content-viewer';
import type { ContentItem, LessonPlan, RegenerationPart, Curriculum } from '../../types';
import { getRegenerationPartId } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useContentLibrary } from '../../context/ContentLibraryContext';
import { fuzzySearch, lessonPlanToMarkdown, parseLessonPlanMarkdown } from '../../utils';
import { regenerateLessonPart, generateNewLessonPart } from '../../api';
import { generationModels, generationStyles, exercisesPerLessonOptions, quizQuestionsPerLessonOptions, lessonDurationOptions } from '../../config';


const ContentLibraryFeature: React.FC = () => {
  const { 
    contentLibrary, 
    updateContentItem, 
    deleteContentItem, 
    addContentItem,
    activeContentItem,
    setActiveContentItem,
  } = useContentLibrary();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [regeneratingPart, setRegeneratingPart] = useState<string | null>(null);
  const [lastRegeneratedCurriculumTitle, setLastRegeneratedCurriculumTitle] = useState<{ title: string; id: number } | null>(null);
  const [lastRegeneratedLessonTitle, setLastRegeneratedLessonTitle] = useState<{ lessonIndex: number; title: string; id: number } | null>(null);

  useEffect(() => {
    // If no content is selected and the library is not empty, select the first item.
    if (!activeContentItem && contentLibrary.length > 0) {
      setActiveContentItem(contentLibrary[0]);
    }
    // If the selected content is no longer in the list (e.g., deleted), select the first available item.
    if (activeContentItem && !contentLibrary.find(item => item.id === activeContentItem.id)) {
      setActiveContentItem(contentLibrary[0] || null);
    }
  }, [contentLibrary, activeContentItem, setActiveContentItem]);

  const handleSelectContent = (item: ContentItem) => {
    setActiveContentItem(item);
  };
  
  const handleUpdateNotes = (notes: string) => {
    if (!activeContentItem) return;
    const updatedItem = { ...activeContentItem, notes: notes.trim() ? notes.trim() : undefined };
    updateContentItem(updatedItem);
    setActiveContentItem(updatedItem);
  };
  
  const handleUpdateLessonPlan = (lessonIndex: number, updatedPlan: LessonPlan) => {
    if (!activeContentItem) return;
    const updatedLessons = [...activeContentItem.lessons];
    updatedLessons[lessonIndex] = { ...updatedLessons[lessonIndex], content: lessonPlanToMarkdown(updatedPlan) };
    const updatedItem = { ...activeContentItem, lessons: updatedLessons };
    updateContentItem(updatedItem);
    setActiveContentItem(updatedItem);
  };
  
  const handleUpdateLessonTitle = (lessonIndex: number, newTitle: string) => {
    if (!activeContentItem) return;
    const updatedLessons = [...activeContentItem.lessons];
    updatedLessons[lessonIndex] = { ...updatedLessons[lessonIndex], title: newTitle };
    const updatedItem = { ...activeContentItem, lessons: updatedLessons };
    updateContentItem(updatedItem);
    setActiveContentItem(updatedItem);
  };

  const handleUpdateCurriculumTitle = (newTitle: string) => {
    if (!activeContentItem) return;
    const updatedItem = { ...activeContentItem, name: newTitle };
    updateContentItem(updatedItem);
    setActiveContentItem(updatedItem);
  };

  const handleDeleteItem = () => {
    if (activeContentItem) {
        const item = { ...activeContentItem };
        deleteContentItem(item.id);

        addToast(`"${item.name}" has been deleted.`, {
            action: {
                label: 'Undo',
                onClick: () => addContentItem(item),
            }
        });
    }
  };

  const handleRegeneratePart = async (
    lessonIndex: number,
    part: RegenerationPart,
    instructions: string,
  ) => {
    if (!activeContentItem) return;

    const partId = getRegenerationPartId(part);
    setRegeneratingPart(partId);

    try {
        const lesson = activeContentItem.lessons[lessonIndex];
        const lessonPlan = parseLessonPlanMarkdown(lesson.content) as LessonPlan;
        const isCurriculumPart = part.type === 'curriculumTitle';

        const curriculumForApi: Curriculum = {
            title: activeContentItem.name,
            description: '',
            tags: [activeContentItem.difficulty],
            recommended: false,
            learningOutcomes: [], // FIX: Add missing 'learningOutcomes' property
            content: {
                lessons: activeContentItem.lessons.map(l => l.title),
            }
        };

        const findDefault = (options: {value: string, default?: boolean}[], fallbackIndex = 0) => {
            const defaultOption = options.find(o => o.default);
            return defaultOption ? defaultOption.value : (options[fallbackIndex]?.value || '');
        };

        const defaultOptions = { 
            model: findDefault(generationModels),
            style: findDefault(generationStyles),
            exercisesPerLesson: findDefault(exercisesPerLessonOptions),
            quizQuestionsPerLesson: findDefault(quizQuestionsPerLessonOptions),
            lessonDuration: findDefault(lessonDurationOptions),
            codeExamples: true,
            visualElements: true,
            instructions: "",
        };
        const genOptions = activeContentItem.generationOptions || defaultOptions;

        const result = await regenerateLessonPart(
            curriculumForApi,
            isCurriculumPart ? null : lessonPlan,
            isCurriculumPart ? null : lesson.title,
            part,
            instructions,
            genOptions
        );
        
        if (part.type === 'curriculumTitle') {
            setLastRegeneratedCurriculumTitle({ title: result.curriculumTitle, id: Date.now() });
            return;
        }
        
        if (part.type === 'title') {
            setLastRegeneratedLessonTitle({ lessonIndex, title: result.lessonTitle, id: Date.now() });
            return;
        }

        let updatedLessonPlan: LessonPlan = { ...lessonPlan };

        switch (part.type) {
            case 'outcome':
                updatedLessonPlan.lessonOutcome = result.lessonOutcome;
                break;
            case 'outline':
                updatedLessonPlan.lessonOutline = result.lessonOutline;
                break;
            case 'project':
                updatedLessonPlan.project = result;
                break;
            case 'exercise':
                const newExercises = [...(updatedLessonPlan.exercises || [])];
                newExercises[part.index] = result;
                updatedLessonPlan.exercises = newExercises;
                break;
            case 'quiz':
                const newQuestions = [...(updatedLessonPlan.quiz?.questions || [])];
                newQuestions[part.index] = result;
                updatedLessonPlan.quiz = { questions: newQuestions };
                break;
        }
       
        const updatedContentItem = { ...activeContentItem };
        const updatedLessons = [...updatedContentItem.lessons];
        updatedLessons[lessonIndex] = {
            title: lesson.title,
            content: lessonPlanToMarkdown(updatedLessonPlan)
        };
        updatedContentItem.lessons = updatedLessons;
        
        updateContentItem(updatedContentItem);
        setActiveContentItem(updatedContentItem);
        addToast("Content successfully regenerated.", { type: 'default' });

    } catch (error) {
        console.error("Failed to generate content in library:", error);
        if (error instanceof Error && error.message.startsWith('JSON_PARSE_ERROR')) {
            addToast("The AI returned a response in an unexpected format. Please try again.", { type: 'error' });
        } else {
            addToast("Failed to generate content. Please try again.", { type: 'error' });
        }
    } finally {
        setRegeneratingPart(null);
    }
  };

  const handleGenerateNewPart = async (lessonIndex: number, partType: 'exercise' | 'quiz') => {
    if (!activeContentItem) {
        throw new Error("No active content item selected.");
    }

    try {
        const lesson = activeContentItem.lessons[lessonIndex];
        const lessonPlan = parseLessonPlanMarkdown(lesson.content) as LessonPlan;

        const curriculumForApi: Curriculum = {
            title: activeContentItem.name,
            description: '',
            tags: [activeContentItem.difficulty],
            recommended: false,
            learningOutcomes: [],
            content: {
                lessons: activeContentItem.lessons.map(l => l.title),
            }
        };

        const findDefault = (options: {value: string, default?: boolean}[], fallbackIndex = 0) => {
            const defaultOption = options.find(o => o.default);
            return defaultOption ? defaultOption.value : (options[fallbackIndex]?.value || '');
        };

        const defaultOptions = { 
            model: findDefault(generationModels),
            style: findDefault(generationStyles),
            exercisesPerLesson: findDefault(exercisesPerLessonOptions),
            quizQuestionsPerLesson: findDefault(quizQuestionsPerLessonOptions),
            lessonDuration: findDefault(lessonDurationOptions),
            codeExamples: true,
            visualElements: true,
            instructions: "",
        };
        const genOptions = activeContentItem.generationOptions || defaultOptions;

        const result = await generateNewLessonPart(
            curriculumForApi,
            lessonPlan,
            lesson.title,
            partType,
            genOptions
        );

        addToast(`New ${partType} generated.`, { type: 'default' });
        return result;
        
    } catch (error) {
        console.error(`Failed to generate new ${partType}:`, error);
        if (error instanceof Error && error.message.startsWith('JSON_PARSE_ERROR')) {
            addToast("The AI returned a response in an unexpected format. Please try again.", { type: 'error' });
        } else {
            addToast(`Failed to generate new ${partType}. Please try again.`, { type: 'error' });
        }
        throw error;
    }
  };

  const filteredContent = contentLibrary.filter(item =>
    fuzzySearch(searchTerm, item.name)
  );

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <ContentList
          contentItems={filteredContent}
          selectedContent={activeContentItem}
          onSelectContent={handleSelectContent}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
        />
        <ContentViewer
          selectedContent={activeContentItem}
          onDeleteRequest={handleDeleteItem}
          onRegenerate={handleRegeneratePart}
          onGenerateNewPart={handleGenerateNewPart}
          regeneratingPart={regeneratingPart}
          onUpdateNotes={handleUpdateNotes}
          onUpdateLessonPlan={handleUpdateLessonPlan}
          onUpdateLessonTitle={handleUpdateLessonTitle}
          onUpdateCurriculumTitle={handleUpdateCurriculumTitle}
          lastRegeneratedCurriculumTitle={lastRegeneratedCurriculumTitle}
          lastRegeneratedLessonTitle={lastRegeneratedLessonTitle}
        />
      </div>
    </div>
  );
};

export default ContentLibraryFeature;