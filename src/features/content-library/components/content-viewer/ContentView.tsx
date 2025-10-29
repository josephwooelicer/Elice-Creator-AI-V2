import React, { useState, useEffect, useMemo, useRef } from 'react';
import { parseLessonPlanMarkdown } from '../../../../utils';
import { LessonDisplay } from '../../../../components/content';
import type { RegenerationPart, LessonPlan } from '../../../../types';
import { RegenerateButton, Button, EditModeFooter } from '../../../../components/ui';
import { Modification, Check, X } from '../../../../components/icons';
import { LessonPlanSkeleton } from '../../../../components/skeletons/LessonPlanSkeleton';

interface ContentViewProps {
    notes?: string;
    lessonContent?: string;
    lessonTitle?: string;
    onRegenerate: (part: RegenerationPart, ref: React.RefObject<HTMLButtonElement>) => void;
    onGenerateNewPart: (partType: 'exercise' | 'quiz') => Promise<any>;
    regeneratingPart: string | null;
    openPopoverPartId: string | null;
    onUpdateNotes: (notes: string) => void;
    onUpdateLessonPlan: (updatedPlan: LessonPlan) => void;
    onUpdateLessonTitle: (newTitle: string) => void;
    lastRegeneratedTitle?: { lessonIndex: number; title: string; id: number } | null;
    currentLessonIndex?: number;
    animationDirection?: 'right' | 'left' | null;
}

export const ContentView: React.FC<ContentViewProps> = ({ 
    notes, 
    lessonContent, 
    lessonTitle, 
    onRegenerate, 
    onGenerateNewPart,
    regeneratingPart, 
    openPopoverPartId,
    onUpdateNotes,
    onUpdateLessonPlan,
    onUpdateLessonTitle,
    lastRegeneratedTitle,
    currentLessonIndex,
    animationDirection,
}) => {
    const parsedContent = useMemo(() => parseLessonPlanMarkdown(lessonContent || '') as LessonPlan, [lessonContent]);
    const isCapstone = useMemo(() => lessonTitle?.toLowerCase().includes('capstone project:') ?? false, [lessonTitle]);
    
    const [isNotesEditing, setIsNotesEditing] = useState(false);
    const [editedNotes, setEditedNotes] = useState(notes || '');

    const titleRegenButtonRef = useRef<HTMLButtonElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedPlan, setEditedPlan] = useState<LessonPlan>(parsedContent);
    const [editedTitle, setEditedTitle] = useState(lessonTitle || '');
    const [processedRegenId, setProcessedRegenId] = useState<number | null>(null);

    useEffect(() => {
        if (
            lastRegeneratedTitle &&
            lastRegeneratedTitle.id !== processedRegenId &&
            lastRegeneratedTitle.lessonIndex === currentLessonIndex
        ) {
            setEditedTitle(lastRegeneratedTitle.title);
            setIsEditing(true);
            setProcessedRegenId(lastRegeneratedTitle.id);
        }
    }, [lastRegeneratedTitle, currentLessonIndex, processedRegenId]);

    useEffect(() => {
        setEditedTitle(lessonTitle || '');
        setEditedPlan(parsedContent);
        setIsEditing(false);
    }, [lessonTitle, parsedContent, currentLessonIndex]);


    const handleSave = () => {
        if (editedTitle.trim()) {
            onUpdateLessonTitle(editedTitle.trim());
        }
        onUpdateLessonPlan(editedPlan);
        setIsEditing(false);
    };
    
    const handleCancel = () => {
        setEditedPlan(parsedContent);
        setEditedTitle(lessonTitle || '');
        setIsEditing(false);
    };

    useEffect(() => {
        setEditedNotes(notes || '');
    }, [notes]);

    const handleSaveNotes = () => {
        onUpdateNotes(editedNotes);
        setIsNotesEditing(false);
    };

    const handleCancelNotes = () => {
        setEditedNotes(notes || '');
        setIsNotesEditing(false);
    };
    
    return (
        <div className="relative">
            <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm font-semibold text-slate-700">Notes</h4>
                    {isNotesEditing ? (
                        <div className="flex items-center gap-2">
                            <button onClick={handleCancelNotes} className="text-slate-500 hover:text-slate-700 p-1"><X className="w-5 h-5" /></button>
                            <button onClick={handleSaveNotes} className="text-primary hover:text-primary-dark p-1"><Check className="w-5 h-5" /></button>
                        </div>
                    ) : (
                        <button onClick={() => setIsNotesEditing(true)} className="text-slate-500 hover:text-slate-700 p-1"><Modification className="w-5 h-5" /></button>
                    )}
                </div>

                {isNotesEditing ? (
                    <textarea
                        id="notes-editor"
                        value={editedNotes}
                        onChange={(e) => setEditedNotes(e.target.value)}
                        className="w-full h-[100px] text-slate-700 p-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-0 focus:ring-primary-focus focus:border-primary-focus"
                        placeholder="Add notes..."
                    />
                ) : notes ? (
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{notes}</p>
                ) : (
                    <p className="text-sm text-slate-400 italic">No notes added yet.</p>
                )}
            </div>

            {lessonContent ? (
                <div className="relative">
                     <div className="flex justify-between items-end w-full mb-6">
                        <div>
                            <p className="text-sm font-semibold text-slate-400">Lesson Plan</p>
                            {!isEditing && (
                                <h2 className="text-2xl font-bold text-slate-800 mt-1 break-words">{lessonTitle}</h2>
                            )}
                        </div>
                        <div className="flex-shrink-0 ml-4">
                            {!isEditing && (
                                <Button variant="secondary" icon={Modification} onClick={() => setIsEditing(true)} className="!py-2">
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
                    
                    <LessonDisplay
                        lessonPlan={parsedContent}
                        lessonTitle={editedTitle}
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
                    
                    {isEditing && <EditModeFooter onCancel={handleCancel} onSave={handleSave} />}
                </div>
            ) : (
                <div className="text-center py-10 px-4 text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg mt-4">
                    This curriculum has no lessons yet.
                </div>
            )}
        </div>
    );
};
