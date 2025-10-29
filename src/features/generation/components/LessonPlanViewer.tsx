import React, { useState, useEffect, useRef } from 'react';
import type { Curriculum, LessonPlan, GenerationOptions } from '../../../types';
import type { RegenerationPart } from '../../../types/Regeneration';
import { getRegenerationPartId } from '../../../types';
import { LessonNavigator, RegeneratePopover, Button } from '../../../components/ui';
import { SaveContentPopover } from './SaveContentPopover';
import { PreviewHeader } from '../../../components/content';
import { LessonPlanPreview } from './LessonPlanPreview';
import { Modification, Sparkles } from '../../../components/icons';

interface LessonPlanViewerProps {
    view: 'idle' | 'loading' | 'results';
    progress: number;
    lessonPlans: (LessonPlan | null)[] | null;
    currentCurriculum: Curriculum | null;
    generationOptions: GenerationOptions | null;
    generationDate: string | null;
    regeneratingPart: string | null;
    onSaveContent: (notes: string) => void;
    onRegenerate: (lessonIndex: number, part: RegenerationPart, partId: string, instructions: string) => void;
    onGenerateNewPart: (lessonIndex: number, partType: 'exercise' | 'quiz') => Promise<any>;
    onUpdateLessonPlan: (lessonIndex: number, updatedPlan: LessonPlan) => void;
    onUpdateLessonTitle: (lessonIndex: number, newTitle: string) => void;
    onUpdateCurriculumTitle: (newTitle: string) => void;
    onCancel?: () => void;
    lastRegeneratedTitle?: { lessonIndex: number; title: string; id: number } | null;
    lastRegeneratedCurriculumTitle?: { title: string; id: number } | null;
}

export const LessonPlanViewer: React.FC<LessonPlanViewerProps> = ({
    view,
    progress,
    lessonPlans,
    currentCurriculum,
    generationOptions,
    generationDate,
    regeneratingPart,
    onSaveContent,
    onRegenerate,
    onGenerateNewPart,
    onUpdateLessonPlan,
    onUpdateLessonTitle,
    onUpdateCurriculumTitle,
    onCancel,
    lastRegeneratedTitle,
    lastRegeneratedCurriculumTitle,
}) => {
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
    const [animationDirection, setAnimationDirection] = useState<'right' | 'left' | null>(null);
    const [isSavePopoverOpen, setIsSavePopoverOpen] = useState(false);
    const saveButtonRef = useRef<HTMLButtonElement>(null);
    const [regenPopover, setRegenPopover] = useState<{ open: boolean; part: RegenerationPart | null; partId: string | null; ref: React.RefObject<HTMLButtonElement> | null }>({ open: false, part: null, partId: null, ref: null });
    const viewerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Reset index when curriculum changes
        setCurrentLessonIndex(0);
    }, [currentCurriculum?.title]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 's') {
                if (view === 'results' && lessonPlans) {
                    event.preventDefault();
                    setIsSavePopoverOpen(prev => !prev);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [view, lessonPlans]);

    const handleSaveWithNotes = (notes: string) => {
        onSaveContent(notes);
        setIsSavePopoverOpen(false);
    };

    const handleRegenerate = (instructions: string) => {
        if (regenPopover.part && regenPopover.partId) {
            onRegenerate(currentLessonIndex, regenPopover.part, regenPopover.partId, instructions);
            setRegenPopover({ open: false, part: null, partId: null, ref: null });
        }
    };

    const openRegenPopover = (part: RegenerationPart, ref: React.RefObject<HTMLButtonElement>) => {
        setRegenPopover({ open: true, part, partId: getRegenerationPartId(part), ref });
    };

    const lessonTitle = currentCurriculum?.content.lessons[currentLessonIndex] ?? '';
    
    const handleLessonPlanUpdate = (updatedPlan: LessonPlan) => {
        onUpdateLessonPlan(currentLessonIndex, updatedPlan);
    }
    const handleLessonTitleUpdate = (newTitle: string) => {
        onUpdateLessonTitle(currentLessonIndex, newTitle);
    }

    const handleGenerateNewPartForCurrentLesson = (partType: 'exercise' | 'quiz') => {
        return onGenerateNewPart(currentLessonIndex, partType);
    };

    const handleIndexChange = (newIndex: number) => {
        if (newIndex > currentLessonIndex) {
            setAnimationDirection('right');
        } else if (newIndex < currentLessonIndex) {
            setAnimationDirection('left');
        }
        setCurrentLessonIndex(newIndex);
    };

    const numLessons = currentCurriculum?.content.lessons.length ?? 0;
    const currentGeneratingLessonIndex = numLessons > 0 ? Math.min(numLessons - 1, Math.floor(progress * numLessons / 100)) : 0;
    const currentLessonTitleWhileLoading = currentCurriculum?.content.lessons[currentGeneratingLessonIndex] ?? '';

    return (
        <div className="w-full lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[556px] relative" ref={viewerRef}>
            {(view === 'idle' && !lessonPlans) && (
                 <div className="w-full h-full flex flex-col items-center justify-center text-center">
                    <Modification className="w-14 h-14 text-slate-300 mb-5" />
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Generate Content</h3>
                    <p className="text-sm text-slate-500">Your generated content will appear here.</p>
                </div>
            )}
            {(view !== 'idle' || lessonPlans) && currentCurriculum && (
                <div className="w-full">
                    <PreviewHeader
                        curriculum={currentCurriculum}
                        generationOptions={generationOptions}
                        generationDate={generationDate}
                        onRegenerateRequest={openRegenPopover}
                        openPopoverPartId={regenPopover.partId}
                        onSaveClick={() => setIsSavePopoverOpen(prev => !prev)}
                        saveButtonRef={saveButtonRef}
                        onDeleteClick={() => {}}
                        deleteButtonRef={React.createRef<HTMLButtonElement>()}
                        showSaveButton={true}
                        showDeleteButton={false}
                        onUpdateCurriculumTitle={onUpdateCurriculumTitle}
                        lastRegeneratedCurriculumTitle={lastRegeneratedCurriculumTitle}
                        shortcut="Mod+S"
                    />
                    <SaveContentPopover 
                        isOpen={isSavePopoverOpen}
                        onClose={() => setIsSavePopoverOpen(false)}
                        onSave={handleSaveWithNotes}
                        triggerRef={saveButtonRef}
                    />
                    
                    {view === 'loading' && (
                        <div className="my-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-sm text-slate-500 flex-shrink min-w-0">
                                    <Sparkles className="w-5 h-5 text-primary animate-pulse flex-shrink-0" />
                                    <span className="font-semibold text-slate-700 flex-shrink-0">Generating:</span>
                                    <span className="truncate" title={currentLessonTitleWhileLoading}>{currentLessonTitleWhileLoading}</span>
                                </div>
                                <div className="w-full max-w-xs flex items-center gap-3">
                                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-out"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    {onCancel && (
                                        <Button variant="secondary" onClick={onCancel} className="!py-1 !px-3 !text-xs !border-red-300 !text-red-600 hover:!bg-red-50 focus:!ring-red-500">
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {numLessons > 1 && (
                        <LessonNavigator
                            currentLessonIndex={currentLessonIndex}
                            totalLessons={numLessons}
                            lessonTitle={lessonTitle}
                            onIndexChange={handleIndexChange}
                            className="my-4"
                        />
                    )}

                    <div className="relative">
                        <LessonPlanPreview
                            key={currentLessonIndex}
                            lessonPlan={lessonPlans?.[currentLessonIndex] ?? null}
                            lessonTitle={lessonTitle}
                            onRegenerate={openRegenPopover}
                            onGenerateNewPart={handleGenerateNewPartForCurrentLesson}
                            regeneratingPart={regeneratingPart}
                            openPopoverPartId={regenPopover.partId}
                            onUpdateLessonPlan={handleLessonPlanUpdate}
                            onUpdateLessonTitle={handleLessonTitleUpdate}
                            lastRegeneratedTitle={lastRegeneratedTitle}
                            currentLessonIndex={currentLessonIndex}
                            animationDirection={animationDirection}
                            totalLessons={numLessons}
                        />
                         <RegeneratePopover
                            isOpen={regenPopover.open}
                            onClose={() => setRegenPopover({ open: false, part: null, partId: null, ref: null })}
                            triggerRef={regenPopover.ref!}
                            onRegenerate={handleRegenerate}
                            isLoading={regeneratingPart === regenPopover.partId}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
