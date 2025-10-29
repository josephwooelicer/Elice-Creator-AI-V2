import React, { useState, useEffect, useRef } from 'react';
import type { LessonPlan } from '../../../types';
import type { RegenerationPart } from '../../../types';
import { getRegenerationPartId } from '../../../types';
import { Quiz, FilePlus, Trash } from '../../icons';
import { MarkdownContent, RegenerateButton, IconButton, Textarea } from '../../ui';
import { quizQuestionToMarkdown, parseQuizQuestionMarkdown } from '../../../utils/markdownEditorUtils';

type QuizQuestion = LessonPlan['quiz']['questions'][0];

interface QuizSectionProps {
    quiz: LessonPlan['quiz'];
    onRegenerate?: (part: RegenerationPart, ref: React.RefObject<HTMLButtonElement>) => void;
    onGenerateNewPart?: () => Promise<QuizQuestion>;
    regeneratingPart?: string | null;
    openPopoverPartId?: string | null;
    isEditing: boolean;
    editedQuiz: LessonPlan['quiz'];
    onEditChange: (newQuiz: LessonPlan['quiz']) => void;
}

export const QuizSection: React.FC<QuizSectionProps> = ({ quiz, onRegenerate, onGenerateNewPart, regeneratingPart, openPopoverPartId, isEditing, editedQuiz, onEditChange }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const regenButtonRefs = useRef<Array<React.RefObject<HTMLButtonElement>>>([]);

    useEffect(() => {
        regenButtonRefs.current = Array(editedQuiz?.questions?.length || 0).fill(null).map((_, i) => regenButtonRefs.current[i] || React.createRef());
    }, [editedQuiz?.questions?.length]);


    const handleQuizQuestionChange = (qIndex: number, markdown: string) => {
        const newQuestions = [...(editedQuiz?.questions || [])];
        newQuestions[qIndex] = parseQuizQuestionMarkdown(markdown);
        onEditChange({ questions: newQuestions });
    };

    const addQuizQuestion = async () => {
        if (isGenerating) return;

        if (onGenerateNewPart) {
            setIsGenerating(true);
            try {
                const generatedQuestion = await onGenerateNewPart();
                onEditChange({ questions: [...(editedQuiz?.questions || []), generatedQuestion]});
            } catch (error) {
                 // Parent component will show a toast
            } finally {
                setIsGenerating(false);
            }
        } else {
            onEditChange({ questions: [...(editedQuiz?.questions || []), { question: '', options: [], answer: '', explanation: '' }]});
        }
    };

    const removeQuizQuestion = (qIndex: number) => {
        onEditChange({ questions: (editedQuiz?.questions || []).filter((_, i) => i !== qIndex) });
    };

    if ((!quiz || !quiz.questions || quiz.questions.length === 0) && !isEditing) {
        return null;
    }

    const simpleTitle = (
        <div className="flex items-center space-x-3">
            <Quiz className="w-5 h-5 text-primary" />
            <span className="font-semibold text-slate-700">Quiz</span>
        </div>
    );
    
    return (
        <div id="lesson-quiz" className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm relative group scroll-mt-8">
            <div className="flex justify-between items-center mb-4">
                {simpleTitle}
            </div>

            {isEditing ? (
                <div className="space-y-6">
                    {(editedQuiz?.questions || []).map((q, i) => {
                        const part: RegenerationPart = { type: 'quiz', index: i };
                        const partId = getRegenerationPartId(part);
                        const isPopoverOpen = openPopoverPartId === partId;
                        const ref = regenButtonRefs.current[i];
                        
                        return (
                            <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3 relative">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold text-slate-700">Question {i+1}</h4>
                                    <IconButton icon={Trash} tooltipText="Remove Question" variant="danger" onClick={() => removeQuizQuestion(i)} className="!w-8 !h-8" />
                                </div>
                                <div className="flex flex-row gap-4 items-start">
                                    <Textarea 
                                        value={quizQuestionToMarkdown(q)}
                                        onChange={e => handleQuizQuestionChange(i, e.target.value)}
                                        rows={10}
                                        placeholder={`**Question:**\n...\n\n**Options:**\nOption 1\nOption 2\n\n**Answer:**\n...\n\n**Explanation:**\n...`}
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
                        )
                    })}
                    <IconButton icon={FilePlus} tooltipText="Add Question" variant="primary" onClick={addQuizQuestion} disabled={isGenerating} />
                </div>
            ) : (
                <div className="space-y-5">
                    {quiz.questions.map((q, index) => {
                        const part: RegenerationPart = { type: 'quiz', index };
                        const partId = getRegenerationPartId(part);
                        const isRegenerating = regeneratingPart === partId;
                        const ref = regenButtonRefs.current[index];
                        const isPopoverOpen = openPopoverPartId === partId;

                        return (
                            <div key={index} className="relative group/item text-sm border-b border-slate-200 pb-4 last:border-b-0 last:pb-0 pt-2 first:pt-0">
                                {isRegenerating && <div className="absolute inset-0 bg-slate-50/50 animate-pulse rounded-lg z-10 -m-2 p-2"></div>}
                                <div className="flex justify-between items-start">
                                    <div className="font-semibold text-slate-800 mb-2 pr-4">
                                        <MarkdownContent content={`${index + 1}. ${q.question}`} />
                                    </div>
                                    {onRegenerate && (
                                        <div className={`transition-opacity flex-shrink-0 ${isPopoverOpen ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'}`}>
                                            <RegenerateButton 
                                                ref={ref} 
                                                onClick={() => onRegenerate?.(part, ref)} 
                                                isPopoverOpen={isPopoverOpen}
                                            />
                                        </div>
                                    )}
                                </div>
                                <ul className="space-y-1.5 list-none pl-2">
                                    {q.options.map(opt => (
                                        <li key={opt} className="text-slate-600 flex items-start">
                                            <span className={`flex-shrink-0 inline-block w-4 h-4 mr-2 mt-1 border rounded-full ${opt === q.answer ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}></span>
                                            <MarkdownContent content={opt} />
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-2">
                                    {q.explanation && (
                                        <div className="text-slate-600">
                                            <strong className="font-medium text-slate-700">Explanation:</strong>
                                            <div className="prose prose-sm max-w-none inline-block">
                                                <MarkdownContent content={q.explanation} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
