import { useState, useEffect, useRef } from 'react';
import { useCancellableAction } from '../../../hooks';
import { useCurriculum } from '../../../context/CurriculumContext';
import { useCurriculumGeneration } from './useCurriculumGeneration';
import { useProjectGeneration } from './useProjectGeneration';
import { getDefaultGenerationOptions } from '../../../config';
import { isDifficultyTag } from '../../../utils';

type GenerationMode = 'idle' | 'course' | 'capstone';

export const useGeneration = () => {
    const { 
        selectedCurriculum, 
        setSelectedCurriculum, 
        setCurrentCurriculum,
        selectedCapstoneProject,
        setSelectedCapstoneProject,
        startGenerationImmediately,
        setStartGenerationImmediately,
    } = useCurriculum();
    
    const [generationMode, setGenerationMode] = useState<GenerationMode>('idle');
    const isCancelledRef = useRef(false);

    const curriculumHook = useCurriculumGeneration({ isCancelledRef, setGenerationMode });
    const projectHook = useProjectGeneration({ isCancelledRef, setGenerationMode });
    
    useEffect(() => {
        if (selectedCurriculum) {
            setGenerationMode('course');
            setCurrentCurriculum(selectedCurriculum);
            curriculumHook.resetState();
            projectHook.resetState();
            curriculumHook.setView('idle');
            
            if (startGenerationImmediately) {
                const generationOptions = getDefaultGenerationOptions();
                const manualInputs = {
                    curriculumTitle: selectedCurriculum.title,
                    lessonTitles: selectedCurriculum.content.lessons.join('\n'),
                    difficulty: selectedCurriculum.tags.find(isDifficultyTag) || 'Beginner',
                };
                curriculumHook.handleGenerate(generationOptions, manualInputs);
                setStartGenerationImmediately(false); // Reset the flag
            }

            setSelectedCurriculum(null); // Clear after processing
        } else if (selectedCapstoneProject) {
            setGenerationMode('capstone');
            curriculumHook.resetState();
            projectHook.resetState();
            projectHook.handleGoToConfiguration(selectedCapstoneProject);
            setSelectedCapstoneProject(null);
        }
    }, [selectedCurriculum, selectedCapstoneProject, startGenerationImmediately]);

    const handleStartOver = () => {
        isCancelledRef.current = true;
        setCurrentCurriculum(null);
        setSelectedCurriculum(null);
        curriculumHook.resetState();
        projectHook.resetState();
        setGenerationMode('idle');
    };

    const confirmCancelAction = () => {
        isCancelledRef.current = true;
        if (generationMode === 'course') {
            curriculumHook.setView('idle');
            curriculumHook.setProgress(0);
            if (!selectedCurriculum) setCurrentCurriculum(null);
        } else if (generationMode === 'capstone') {
            projectHook.setCapstoneView('idle');
            projectHook.setCapstoneProgress(0);
            projectHook.resetState();
            setGenerationMode('idle');
        }
    };
    
    const {
        isModalOpen: isCancelModalOpen,
        open: openCancelModal,
        close: closeCancelModal,
    } = useCancellableAction(confirmCancelAction);

    useEffect(() => {
        const isCourseLoading = curriculumHook.view === 'loading';
        const isCapstoneLoading = projectHook.isCapstoneLoading;
        if (!isCourseLoading && !isCapstoneLoading && isCancelModalOpen) {
          closeCancelModal();
        }
    }, [curriculumHook.view, projectHook.isCapstoneLoading, isCancelModalOpen, closeCancelModal]);

    return {
        // Shared
        generationMode,
        isCancelModalOpen,
        openCancelModal,
        closeCancelModal,
        confirmCancelAction,
        handleStartOver,
        handleNewGeneration: handleStartOver,
        // From curriculum hook
        ...curriculumHook,
        // From project hook
        ...projectHook,
    };
};
