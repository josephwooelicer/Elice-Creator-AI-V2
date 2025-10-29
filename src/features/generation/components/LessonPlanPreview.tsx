import React, { useState, useEffect, useRef } from 'react';
import type { LessonPlan, RegenerationPart } from '../../../types';
import { LessonPlanSkeleton } from '../../../components/skeletons/LessonPlanSkeleton';
// FIX: Imported missing RegenerateButton component.
import { Button, EditModeFooter, RegenerateButton } from '../../../components/ui';
import { Modification } from '../../../components/icons';
import { LessonDisplay } from '../../../components/content/LessonDisplay';

interface LessonPlanPreviewProps {
    lessonPlan: LessonPlan | null;
    lessonTitle: string;
    regeneratingPart: string | null;
    onRegenerate: (part: RegenerationPart, ref: React.RefObject<HTMLButtonElement>) => void;
    onGenerateNewPart: (partType: 'exercise' | 'quiz') => Promise<any>;
    openPopoverPartId: string | null;
    onUpdateLessonPlan: (updatedPlan: LessonPlan) => void;
    onUpdateLessonTitle: (newTitle: string) => void;
    lastRegeneratedTitle?: { lessonIndex: number; title: string; id: number } | null;
    currentLessonIndex: number;
    totalLessons: number;
    animationDirection?: 'right' | 'left' | null;
}

export const LessonPlanPreview: React.FC<LessonPlanPreviewProps> = ({ 
    lessonPlan, 
    lessonTitle, 
    onRegenerate, 
    onGenerateNewPart, 
    regeneratingPart, 
    openPopoverPartId, 
    onUpdateLessonPlan, 
    onUpdateLessonTitle, 
    lastRegeneratedTitle, 
    currentLessonIndex, 
    animationDirection,
    totalLessons
}) => {
    const isCapstone = totalLessons > 0 && currentLessonIndex === totalLessons - 1;

    const titleRegenButtonRef = useRef<HTMLButtonElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedPlan, setEditedPlan] = useState<LessonPlan | null>(lessonPlan);
    const [editedTitle, setEditedTitle] = useState(lessonTitle);
    const [processedRegenId, setProcessedRegenId] = useState<number | null>(null);

    useEffect(() => {
        if (
            lastRegeneratedTitle &&
            lastRegeneratedTitle.id !== processedRegenId &&
            lastRegeneratedTitle.lessonIndex === currentLessonIndex
        ) {
            setEditedTitle(lastRegeneratedTitle.title);
            if (lessonPlan) { // Only enter edit mode if content exists
              setIsEditing(true);
            }
            setProcessedRegenId(lastRegeneratedTitle.id);
        }
    }, [lastRegeneratedTitle, currentLessonIndex, processedRegenId, lessonPlan]);

    useEffect(() => {
        setEditedTitle(lessonTitle);
    }, [lessonTitle]);

    useEffect(() => {
        if (lessonPlan) {
            setEditedPlan(lessonPlan);
        }
        setIsEditing(false); // Exit edit mode on lesson change
    }, [lessonPlan, currentLessonIndex]);


    const handleSave = () => {
        if (editedTitle.trim()) {
            onUpdateLessonTitle(editedTitle.trim());
        }
        if (editedPlan) {
            onUpdateLessonPlan(editedPlan);
        }
        setIsEditing(false);
    };
    
    const handleCancel = () => {
        setEditedPlan(lessonPlan);
        setEditedTitle(lessonTitle);
        setIsEditing(false);
    };
    
    const animationClass = animationDirection === 'right' 
        ? 'animate-slideInFromRight' 
        : animationDirection === 'left' 
        ? 'animate-slideInFromLeft' 
        : 'animate-fadeIn';

    return (
        <div className="relative">
            <div className={`flex justify-between items-end w-full mb-6 ${animationClass}`}>
                <div>
                    <p className="text-sm font-semibold text-slate-400">Lesson Plan</p>
                    {!isEditing && (
                        <h2 className="text-2xl font-bold text-slate-800 mt-1 break-words">{lessonTitle}</h2>
                    )}
                </div>
                <div className="flex-shrink-0 ml-4">
                    {!isEditing && (
                        <Button variant="secondary" icon={Modification} onClick={() => setIsEditing(true)} disabled={!lessonPlan} className="!py-2">
                            Edit Lesson
                        </Button>
                    )}
                </div>
            </div>

            {isEditing && (
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm relative mb-6">
                    <label htmlFor="lesson-title-editor-card" className="block text-sm font-semibold text-slate-700 mb-2">Lesson Title</label>
                    <div className="flex items-center gap-2">
                        <input
                            id="lesson-title-editor-card"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-focus focus:border-primary-focus"
                        />
                        <RegenerateButton
                            ref={titleRegenButtonRef}
                            onClick={() => onRegenerate({ type: 'title' }, titleRegenButtonRef)}
                            isPopoverOpen={openPopoverPartId === 'title'}
                        />
                    </div>
                </div>
            )}

            <div className="relative">
                {lessonPlan && editedPlan ? (
                    <LessonDisplay
                        lessonPlan={lessonPlan}
                        lessonTitle={lessonTitle}
                        isEditing={isEditing}
                        editedPlan={editedPlan}
                        onPlanChange={setEditedPlan}
                        onRegenerate={onRegenerate}
                        onGenerateNewPart={onGenerateNewPart}
                        regeneratingPart={regeneratingPart}
                        openPopoverPartId={openPopoverPartId}
                        isCapstone={isCapstone}
                        animationDirection={animationDirection}
                    />
                ) : (
                    <LessonPlanSkeleton isCapstone={isCapstone} />
                )}
            </div>

            {isEditing && <EditModeFooter onCancel={handleCancel} onSave={handleSave} />}
        </div>
    );
};