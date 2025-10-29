import React, { useState, useEffect, useRef } from 'react';
import type { Exercise as ExerciseType } from '../../../types';
import type { RegenerationPart } from '../../../types';
import { getRegenerationPartId } from '../../../types';
import { Exercise, FilePlus, Trash } from '../../icons';
import { MarkdownContent, RegenerateButton, IconButton, Textarea } from '../../ui';
import { exerciseToMarkdown, parseExerciseMarkdown } from '../../../utils/markdownEditorUtils';

interface ExercisesSectionProps {
    exercises: ExerciseType[];
    onRegenerate?: (part: RegenerationPart, ref: React.RefObject<HTMLButtonElement>) => void;
    onGenerateNewPart?: () => Promise<ExerciseType>;
    regeneratingPart?: string | null;
    openPopoverPartId?: string | null;
    isEditing: boolean;
    editedExercises: ExerciseType[];
    onEditChange: (newExercises: ExerciseType[]) => void;
}

export const ExercisesSection: React.FC<ExercisesSectionProps> = ({ exercises, onRegenerate, onGenerateNewPart, regeneratingPart, openPopoverPartId, isEditing, editedExercises, onEditChange }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const regenButtonRefs = useRef<Array<React.RefObject<HTMLButtonElement>>>([]);

    useEffect(() => {
        regenButtonRefs.current = Array(editedExercises.length).fill(null).map((_, i) => regenButtonRefs.current[i] || React.createRef());
    }, [editedExercises.length]);


    const handleExerciseChange = (exIndex: number, markdown: string) => {
        const newExercises = [...editedExercises];
        newExercises[exIndex] = parseExerciseMarkdown(markdown);
        onEditChange(newExercises);
    };

    const addExercise = async () => {
        if (isGenerating) return;

        if (onGenerateNewPart) {
            setIsGenerating(true);
            try {
                const generatedExercise = await onGenerateNewPart();
                onEditChange([...editedExercises, generatedExercise]);
            } catch (error) {
                // Parent component will show a toast
            } finally {
                setIsGenerating(false);
            }
        } else {
            // Fallback for when generation is not available
            onEditChange([...editedExercises, { problem: '', hint: '', answer: '', explanation: '' }]);
        }
    };

    const removeExercise = (exIndex: number) => {
        onEditChange(editedExercises.filter((_, i) => i !== exIndex));
    };

    if ((!exercises || exercises.length === 0) && !isEditing) {
        return null;
    }
    
    const simpleTitle = (
        <div className="flex items-center space-x-3">
            <Exercise className="w-5 h-5 text-primary" />
            <span className="font-semibold text-slate-700">Exercises</span>
        </div>
    );
    
    return (
        <div id="lesson-exercises" className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm relative group scroll-mt-8">
             <div className="flex justify-between items-center mb-4">
                {simpleTitle}
            </div>
            {isEditing ? (
                 <div className="space-y-6">
                    {editedExercises.map((ex, i) => {
                        const part: RegenerationPart = { type: 'exercise', index: i };
                        const partId = getRegenerationPartId(part);
                        const isPopoverOpen = openPopoverPartId === partId;
                        const ref = regenButtonRefs.current[i];
                        
                        return (
                            <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3 relative">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold text-slate-700">Exercise {i+1}</h4>
                                    <IconButton icon={Trash} tooltipText="Remove Exercise" variant="danger" onClick={() => removeExercise(i)} className="!w-8 !h-8" />
                                </div>
                                <div className="flex flex-row gap-4 items-start">
                                    <Textarea 
                                        value={exerciseToMarkdown(ex)}
                                        onChange={e => handleExerciseChange(i, e.target.value)}
                                        rows={10}
                                        placeholder={`**Problem:**\n...\n\n**Hint:**\n...\n\n**Answer:**\n...\n\n**Explanation:**\n...`}
                                    />
                                    {onRegenerate && (
                                        <RegenerateButton 
                                            ref={ref} 
                                            onClick={() => onRegenerate?.(part, ref)} 
                                            isPopoverOpen={isPopoverOpen}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <IconButton icon={FilePlus} tooltipText="Add Exercise" variant="primary" onClick={addExercise} disabled={isGenerating} />
                </div>
            ) : (
                <div className="space-y-8">
                    {exercises.map((exercise, index) => {
                        const part: RegenerationPart = { type: 'exercise', index };
                        const partId = getRegenerationPartId(part);
                        const isRegenerating = regeneratingPart === partId;
                        const ref = regenButtonRefs.current[index];
                        const isPopoverOpen = openPopoverPartId === partId;

                        return (
                            <div key={index} className="relative group/item space-y-4 text-sm pt-4 first:pt-0">
                                {isRegenerating && <div className="absolute inset-0 bg-slate-50/50 animate-pulse rounded-lg z-10 -m-2 p-2"></div>}
                                <div className="flex justify-between items-center">
                                    {exercises.length > 1 && <h4 className="text-md font-semibold text-slate-800">Exercise {index + 1}</h4>}
                                    {onRegenerate && (
                                        <div className={`transition-opacity ${isPopoverOpen ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'}`}>
                                            <RegenerateButton 
                                                ref={ref} 
                                                onClick={() => onRegenerate?.(part, ref)} 
                                                isPopoverOpen={isPopoverOpen}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 mb-1">Problem</p>
                                    <div className="text-slate-700">
                                        <MarkdownContent content={exercise.problem} />
                                    </div>
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 mb-1">Hint</p>
                                    <div className="text-slate-600 italic">
                                        <MarkdownContent content={exercise.hint} />
                                    </div>
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 mb-1">Answer & Explanation</p>
                                    <div className="p-3 bg-primary-lightest border border-primary-light rounded-md space-y-2">
                                        <div className="font-medium text-primary-dark">
                                            <MarkdownContent content={exercise.answer} />
                                        </div>
                                        <div className="text-slate-700 pt-2 border-t border-primary-light">
                                            <MarkdownContent content={exercise.explanation} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
