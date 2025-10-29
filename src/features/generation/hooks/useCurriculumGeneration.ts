

import { useState, MutableRefObject } from 'react';
import { generateLessonPlan, regenerateLessonPart, generateNewLessonPart } from '../../../api';
import type { Curriculum, LessonPlan, GenerationOptions, ManualInputs, ContentItem, CapstoneProject } from '../../../types';
import type { RegenerationPart } from '../../../types/Regeneration';
import { useAppLogic, useLocalStorage } from '../../../hooks';
import { useToast } from '../../../context/ToastContext';
import { lessonPlanToMarkdown, parseLessonPlanMarkdown } from '../../../utils';
import { isDifficultyTag } from '../../../utils';
import { useCurriculum } from '../../../context/CurriculumContext';
import { useContentLibrary } from '../../../context/ContentLibraryContext';

type ViewState = 'idle' | 'loading' | 'results';

const LAST_PLANS_KEY = 'eliceCreatorAILastLessonPlans';
const LAST_GEN_OPTIONS_KEY = 'eliceCreatorAILastGenOptions';
const LAST_GEN_DATE_KEY = 'eliceCreatorAILastGenDate';

interface UseCurriculumGenerationProps {
    isCancelledRef: MutableRefObject<boolean>;
    setGenerationMode: (mode: 'course') => void;
}

export const useCurriculumGeneration = ({ isCancelledRef, setGenerationMode }: UseCurriculumGenerationProps) => {
    const { 
        currentCurriculum,
        setCurrentCurriculum,
        generatedCurriculum,
        setGeneratedCurriculum,
        setSelectedCapstoneProject,
    } = useCurriculum();
    const { addContentItem } = useContentLibrary();
    const { viewContentItemInLibrary } = useAppLogic();
    const { addToast } = useToast();

    const [lessonPlans, setLessonPlans] = useLocalStorage<(LessonPlan | null)[] | null>(LAST_PLANS_KEY, null);
    const [lastGenOptions, setLastGenOptions] = useLocalStorage<GenerationOptions | null>(LAST_GEN_OPTIONS_KEY, null);
    const [generationDate, setGenerationDate] = useLocalStorage<string | null>(LAST_GEN_DATE_KEY, null);
    const [view, setView] = useState<ViewState>(() => (lessonPlans ? 'results' : 'idle'));
    const [progress, setProgress] = useState(0);
    const [regeneratingPart, setRegeneratingPart] = useState<string | null>(null);
    const [lastRegeneratedTitle, setLastRegeneratedTitle] = useState<{ lessonIndex: number; title: string; id: number } | null>(null);
    const [lastRegeneratedCurriculumTitle, setLastRegeneratedCurriculumTitle] = useState<{ title: string; id: number } | null>(null);
    const [showCapstoneModal, setShowCapstoneModal] = useState(false);
    const [savedContentItemForCapstone, setSavedContentItemForCapstone] = useState<ContentItem | null>(null);

    const closeCapstoneModal = () => {
        setShowCapstoneModal(false);
        setSavedContentItemForCapstone(null);
    };

    const confirmCapstoneGeneration = () => {
        if (!savedContentItemForCapstone) return;
        
        const capstoneLesson = savedContentItemForCapstone.lessons[savedContentItemForCapstone.lessons.length - 1];
        if (!capstoneLesson || !capstoneLesson.title.toLowerCase().startsWith('capstone project:')) {
            addToast("No capstone project found in the saved course.", { type: 'error' });
            closeCapstoneModal();
            return;
        }

        const lessonPlan = parseLessonPlanMarkdown(capstoneLesson.content) as LessonPlan;

        if (!lessonPlan.project?.description) {
            addToast("Capstone project details not found in the saved course.", { type: 'error' });
            closeCapstoneModal();
            return;
        }
        
        const capstoneProject: CapstoneProject = {
            id: Date.now(),
            title: capstoneLesson.title,
            description: lessonPlan.project.description,
            industry: 'All', // Not available here
            tags: [savedContentItemForCapstone.difficulty],
            recommended: false,
            learningOutcomes: [lessonPlan.lessonOutcome, lessonPlan.project.objective].filter(Boolean) as string[],
            techStack: [], // To be generated
            projectRequirements: [], // To be generated
            deliverables: lessonPlan.project.deliverables,
            detailedDescription: '', // To be generated
        };

        setSelectedCapstoneProject(capstoneProject);
        closeCapstoneModal();
    };

    const handleGenerate = async (generationOptions: GenerationOptions, manualInputs: ManualInputs) => {
        setGenerationMode('course');
        isCancelledRef.current = false;
        setLastGenOptions(generationOptions);
        setGenerationDate(new Date().toISOString().split('T')[0]);
        let curriculumToGenerate: Curriculum | null = currentCurriculum;

        if (!curriculumToGenerate) {
            const lessonTitles = manualInputs.lessonTitles.split('\n').map(t => t.trim()).filter(t => t);
            if (lessonTitles.length === 0 || !manualInputs.curriculumTitle.trim()) return;

            curriculumToGenerate = {
                title: manualInputs.curriculumTitle,
                description: '',
                tags: [manualInputs.difficulty],
                recommended: false,
                learningOutcomes: [],
                content: {
                    lessons: lessonTitles,
                },
            };
            setCurrentCurriculum(curriculumToGenerate);
        }

        if (!curriculumToGenerate || !curriculumToGenerate.content.lessons.length) return;
        
        setGeneratedCurriculum(curriculumToGenerate);
        setView('loading');
        setProgress(0);
        
        const lessons = curriculumToGenerate.content.lessons;
        const numLessons = lessons.length;
        const initialPlans: (LessonPlan | null)[] = Array(numLessons).fill(null);
        setLessonPlans(initialPlans);
        
        try {
            for (let i = 0; i < numLessons; i++) {
                if (isCancelledRef.current) throw new Error("Cancelled");
                
                const lessonTitle = lessons[i];
                const onLessonProgress = (p: number) => {
                    if (isCancelledRef.current) return;
                    const overallProgress = ((i * 100) + p) / numLessons;
                    setProgress(overallProgress);
                };

                const previousPlans = (lessonPlans || []).slice(0, i).filter(p => p !== null) as LessonPlan[];

                const newPlan = await generateLessonPlan(
                    curriculumToGenerate,
                    lessonTitle,
                    generationOptions,
                    previousPlans,
                    onLessonProgress
                );
                
                if (isCancelledRef.current) throw new Error("Cancelled");

                setLessonPlans(prevPlans => {
                    if (!prevPlans) return [newPlan];
                    const updatedPlans = [...prevPlans];
                    updatedPlans[i] = newPlan;
                    return updatedPlans;
                });
            }

            setTimeout(() => {
                if (!isCancelledRef.current) {
                    setView('results');
                }
            }, 500);
        } catch (error) {
            if (isCancelledRef.current || (error instanceof Error && error.message === "Cancelled")) {
                console.log("Generation was cancelled.");
                return;
            }
            console.error("Failed to generate lesson plans:", error);
            
            if (error instanceof Error && error.message.startsWith('JSON_PARSE_ERROR')) {
                addToast("The AI returned a response in an unexpected format. Please try again.", { type: 'error' });
            } else {
                 addToast("An unexpected error occurred while generating the lesson plan.", { type: 'error' });
            }

            setView('idle');
            setProgress(0);
            if (!currentCurriculum) { // only reset if it was a manual generation
                setCurrentCurriculum(null);
            }
        }
    };
    
    const handleRegeneratePart = async (
        lessonIndex: number,
        part: RegenerationPart,
        partId: string,
        instructions: string
    ) => {
        if (!generatedCurriculum || !lessonPlans || !lastGenOptions) return;

        setRegeneratingPart(partId);
        try {
            const isCurriculumPart = part.type === 'curriculumTitle';
            const lessonPlan = isCurriculumPart ? null : lessonPlans[lessonIndex];
            
            if (!isCurriculumPart && !lessonPlan) {
                addToast("Please wait for the lesson to be generated before regenerating parts.", { type: 'error' });
                setRegeneratingPart(null);
                return;
            }

            const lessonTitle = isCurriculumPart ? null : generatedCurriculum.content.lessons[lessonIndex];

            const result = await regenerateLessonPart(
                generatedCurriculum,
                lessonPlan,
                lessonTitle,
                part,
                instructions,
                lastGenOptions
            );

            if (isCurriculumPart) {
                setLastRegeneratedCurriculumTitle({ title: result.curriculumTitle, id: Date.now() });
                return;
            }

            const newPlans = [...lessonPlans];
            let lessonToUpdate = { ...newPlans[lessonIndex]! };

            switch (part.type) {
                case 'outcome': lessonToUpdate.lessonOutcome = result.lessonOutcome; break;
                case 'outline': lessonToUpdate.lessonOutline = result.lessonOutline; break;
                case 'project': lessonToUpdate.project = result; break;
                case 'exercise':
                    const newExercises = [...lessonToUpdate.exercises];
                    newExercises[part.index] = result;
                    lessonToUpdate.exercises = newExercises;
                    break;
                case 'quiz':
                    const newQuestions = [...lessonToUpdate.quiz.questions];
                    newQuestions[part.index] = result;
                    lessonToUpdate.quiz = { questions: newQuestions };
                    break;
                case 'title':
                    setLastRegeneratedTitle({ lessonIndex, title: result.lessonTitle, id: Date.now() });
                    break;
            }

            if (part.type !== 'title') {
                newPlans[lessonIndex] = lessonToUpdate;
                setLessonPlans(newPlans);
            }
        
        } catch (error) {
            console.error("Regeneration failed:", error);
            if (error instanceof Error && error.message.startsWith('JSON_PARSE_ERROR')) {
                addToast("The AI returned a response in an unexpected format. Please try again.", { type: 'error' });
            } else {
                addToast("Failed to regenerate content. Please try again.", { type: 'error' });
            }
        } finally {
            setRegeneratingPart(null);
        }
    };

    const handleGenerateNewPart = async (lessonIndex: number, partType: 'exercise' | 'quiz') => {
        if (!generatedCurriculum || !lessonPlans || !lastGenOptions) {
            throw new Error("Cannot generate new part: missing context.");
        }
        
        try {
            const lesson = generatedCurriculum.content.lessons[lessonIndex];
            const lessonPlan = lessonPlans[lessonIndex];

            if (!lessonPlan) {
                addToast("Please wait for the lesson to be generated first.", { type: 'error' });
                throw new Error("Lesson plan not generated yet.");
            }
            
            const result = await generateNewLessonPart(
                generatedCurriculum,
                lessonPlan,
                lesson,
                partType,
                lastGenOptions
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

    const handleSaveContent = (notes: string) => {
        if (!generatedCurriculum || !lessonPlans || !lastGenOptions || lessonPlans.some(lp => lp === null)) {
            addToast("Please wait for all lessons to finish generating before saving.", { type: 'error' });
            return;
        }

        const completeLessonPlans = lessonPlans as LessonPlan[];

        const newContentItem: ContentItem = {
            id: Date.now(),
            name: generatedCurriculum.title,
            lessonCount: completeLessonPlans.length,
            lessonDuration: parseFloat(lastGenOptions.lessonDuration),
            difficulty: generatedCurriculum.tags.find(isDifficultyTag) || 'Beginner',
            created: new Date().toISOString().split('T')[0],
            notes: notes.trim() ? notes.trim() : undefined,
            generationOptions: lastGenOptions,
            lessons: generatedCurriculum.content.lessons.map((title, index) => ({
                title,
                content: lessonPlanToMarkdown(completeLessonPlans[index])
            }))
        };
        addContentItem(newContentItem);
        addToast(`"${newContentItem.name}" has been saved.`, {
            action: {
                label: 'View',
                onClick: () => viewContentItemInLibrary(newContentItem)
            }
        });

        const capstoneLesson = generatedCurriculum.content.lessons[generatedCurriculum.content.lessons.length - 1];
        if (capstoneLesson && capstoneLesson.toLowerCase().startsWith('capstone project:')) {
            setSavedContentItemForCapstone(newContentItem);
            setShowCapstoneModal(true);
        }
    };

    const handleUpdateLessonPlan = (lessonIndex: number, updatedLessonPlan: LessonPlan) => {
        if (!lessonPlans) return;
        const newLessonPlans = [...lessonPlans];
        newLessonPlans[lessonIndex] = updatedLessonPlan;
        setLessonPlans(newLessonPlans);
    };

    const handleUpdateLessonTitle = (lessonIndex: number, newTitle: string) => {
        if (!generatedCurriculum) return;
        const newLessons = [...generatedCurriculum.content.lessons];
        newLessons[lessonIndex] = newTitle;
        const newCurriculum = {
            ...generatedCurriculum,
            content: {
                ...generatedCurriculum.content,
                lessons: newLessons,
            },
        };
        setGeneratedCurriculum(newCurriculum);

        if (currentCurriculum) {
            const newCurrentLessons = [...currentCurriculum.content.lessons];
            newCurrentLessons[lessonIndex] = newTitle;
            setCurrentCurriculum({
                ...currentCurriculum,
                content: {
                    ...currentCurriculum.content,
                    lessons: newCurrentLessons,
                },
            });
        }
    };

    const handleUpdateCurriculumTitle = (newTitle: string) => {
        if (!generatedCurriculum) return;
        const newCurriculum = {
            ...generatedCurriculum,
            title: newTitle,
        };
        setGeneratedCurriculum(newCurriculum);
    
        if (currentCurriculum) {
            setCurrentCurriculum({
                ...currentCurriculum,
                title: newTitle,
            });
        }
    };

    const resetState = () => {
        setView('idle');
        setLessonPlans(null);
        setLastGenOptions(null);
        setGeneratedCurriculum(null);
        setGenerationDate(null);
        setProgress(0);
    };

    return {
        view,
        setView,
        lessonPlans,
        progress,
        setProgress,
        currentCurriculum,
        generatedCurriculum,
        regeneratingPart,
        lastGenOptions,
        generationDate,
        lastRegeneratedTitle,
        lastRegeneratedCurriculumTitle,
        handleGenerate,
        handleRegeneratePart,
        handleGenerateNewPart,
        handleSaveContent,
        handleUpdateLessonPlan,
        handleUpdateLessonTitle,
        handleUpdateCurriculumTitle,
        resetState,
        showCapstoneModal,
        closeCapstoneModal,
        confirmCapstoneGeneration,
    };
};