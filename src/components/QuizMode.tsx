import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Flame,
  X,
  Target,
  Compass,
} from 'lucide-react';
import { QUIZ_QUESTIONS, BONES_DATA } from '../data/skeletonData';
import { QuizQuestion } from '../types/anatomy';
import { sound } from '../audio/soundEffects';

interface QuizModeProps {
  onHighlightBoneIn3D: (boneId: string | null) => void;
  onCameraFocus: (target: [number, number, number], pos: [number, number, number]) => void;
  onSetQuizFlash: (state: 'correct' | 'incorrect' | null) => void;
  lastClickedBoneId: string | null;
  onClose: () => void;
}

export const QuizMode: React.FC<QuizModeProps> = ({
  onHighlightBoneIn3D,
  onCameraFocus,
  onSetQuizFlash,
  lastClickedBoneId,
  onClose,
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [missedQuestions, setMissedQuestions] = useState<QuizQuestion[]>([]);

  // Shuffle and pick 10 questions on mount
  useEffect(() => {
    const shuffled = [...QUIZ_QUESTIONS].sort(() => 0.5 - Math.random());
    setQuestions(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setIsFinished(false);
    setMissedQuestions([]);
  }, []);

  const currentQ = questions[currentIndex];

  // Set up 3D view for current question
  useEffect(() => {
    if (!currentQ || isFinished) return;

    setShowHint(false);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(false);
    onSetQuizFlash(null);

    // If identification question, highlight bone in 3D and frame camera
    if (currentQ.type === 'identify_bone' && currentQ.targetBoneId) {
      onHighlightBoneIn3D(currentQ.targetBoneId);
      const bone = BONES_DATA.find((b) => b.id === currentQ.targetBoneId);
      if (bone) {
        onCameraFocus(bone.cameraTarget, bone.cameraPosition);
      }
    } else {
      // In 3D click mode, remove highlight so user must find it
      onHighlightBoneIn3D(null);
    }
  }, [currentIndex, currentQ, isFinished]);

  // Handle direct 3D clicks for 'click_3d' questions
  useEffect(() => {
    if (!currentQ || isFinished || isAnswered) return;
    if (currentQ.type !== 'click_3d') return;

    if (lastClickedBoneId) {
      // Check if user clicked correct bone (or bilateral counterpart e.g. femur_left / femur_right)
      const targetBase = currentQ.correctAnswer.replace(/_left|_right/, '');
      const clickedBase = lastClickedBoneId.replace(/_left|_right/, '');

      const correct = targetBase === clickedBase || lastClickedBoneId === currentQ.correctAnswer;
      handleAnswerResolution(correct, lastClickedBoneId);
    }
  }, [lastClickedBoneId]);

  const handleAnswerResolution = (correct: boolean, chosenAnswerText: string) => {
    setIsAnswered(true);
    setIsCorrect(correct);

    if (correct) {
      sound.playCorrect();
      onSetQuizFlash('correct');
      setScore((s) => s + 1);
      setStreak((st) => {
        const next = st + 1;
        if (next > maxStreak) setMaxStreak(next);
        return next;
      });
      // Highlight the correct bone
      if (currentQ.targetBoneId) {
        onHighlightBoneIn3D(currentQ.targetBoneId);
      }
    } else {
      sound.playWrong();
      onSetQuizFlash('incorrect');
      setStreak(0);
      setMissedQuestions((prev) => [...prev, currentQ]);
      // Show correct bone location so user learns
      if (currentQ.targetBoneId) {
        onHighlightBoneIn3D(currentQ.targetBoneId);
      }
    }

    setTimeout(() => {
      onSetQuizFlash(null);
    }, 1200);
  };

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    const correct = option.toLowerCase() === currentQ.correctAnswer.toLowerCase();
    handleAnswerResolution(correct, option);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      sound.playClick();
    } else {
      setIsFinished(true);
      onHighlightBoneIn3D(null);
      // Trigger confetti celebration on high score
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Fallback
      }
    }
  };

  const handleRestart = () => {
    const shuffled = [...QUIZ_QUESTIONS].sort(() => 0.5 - Math.random());
    setQuestions(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setIsFinished(false);
    setMissedQuestions([]);
    sound.playClick();
  };

  if (!currentQ && !isFinished) return null;

  return (
    <div className="fixed top-20 left-4 sm:left-6 z-40 w-[92vw] sm:w-[420px] max-h-[calc(100vh-160px)] flex flex-col bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden pointer-events-auto backdrop-blur-md">
      {/* Quiz Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Osteology Challenge</h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              {streak > 1 && (
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {streak} streak!
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Finished Summary Screen */}
      {isFinished ? (
        <div className="p-6 overflow-y-auto space-y-4 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/40">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-white">Quiz Complete!</h3>
            <p className="text-xs text-slate-400 mt-1">
              You scored <span className="font-bold text-emerald-400">{score}</span> out of {questions.length} (
              {Math.round((score / questions.length) * 100)}%)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">CORRECT</span>
              <span className="text-lg font-bold text-emerald-400">{score}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">MAX STREAK</span>
              <span className="text-lg font-bold text-amber-400">{maxStreak}</span>
            </div>
          </div>

          {missedQuestions.length > 0 && (
            <div className="text-left p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Review Missed Bones:</h4>
              <div className="space-y-1.5 text-xs">
                {missedQuestions.map((mq, idx) => (
                  <div key={idx} className="p-2 bg-slate-900 rounded border border-slate-800">
                    <p className="font-semibold text-slate-200">{mq.prompt}</p>
                    <p className="text-[11px] text-emerald-400 font-mono mt-0.5">Answer: {mq.correctAnswer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleRestart}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition-colors cursor-pointer shadow-lg shadow-emerald-950/50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Challenge</span>
          </button>
        </div>
      ) : (
        /* Active Question */
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
          {/* Question Type Badge */}
          <div className="flex items-center justify-between">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider border ${
                currentQ.type === 'click_3d'
                  ? 'bg-purple-950/60 text-purple-300 border-purple-800'
                  : currentQ.type === 'identify_bone'
                  ? 'bg-sky-950/60 text-sky-300 border-sky-800'
                  : 'bg-amber-950/60 text-amber-300 border-amber-800'
              }`}
            >
              {currentQ.type === 'click_3d'
                ? '3D Interactive: Click the Bone'
                : currentQ.type === 'identify_bone'
                ? 'Identify Highlighted Bone'
                : 'Clinical Osteology Trivia'}
            </span>

            <span className="text-[11px] font-mono text-slate-400">Score: {score}</span>
          </div>

          {/* Prompt */}
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white leading-snug">{currentQ.prompt}</h3>
            {currentQ.subtitle && (
              <p className="text-xs text-slate-400 mt-1 leading-normal">{currentQ.subtitle}</p>
            )}
          </div>

          {/* 3D Click Mode Instructions & Visual cue */}
          {currentQ.type === 'click_3d' && !isAnswered && (
            <div className="p-3 bg-purple-950/20 border border-purple-900/40 rounded-xl flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-900/40 text-purple-300">
                <Target className="w-5 h-5 animate-pulse" />
              </div>
              <p className="text-xs text-purple-200">
                Rotate and zoom the 3D model in the viewport, then click the target bone directly on the skeleton!
              </p>
            </div>
          )}

          {/* Multiple Choice Options for identify/trivia */}
          {currentQ.options && (
            <div className="grid grid-cols-1 gap-2 pt-1">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                const isTargetCorrect = opt.toLowerCase() === currentQ.correctAnswer.toLowerCase();

                let style = 'bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-800';
                if (isAnswered) {
                  if (isTargetCorrect) {
                    style = 'bg-emerald-950/70 text-emerald-200 border-emerald-500 font-semibold';
                  } else if (isSelected) {
                    style = 'bg-rose-950/70 text-rose-200 border-rose-500';
                  } else {
                    style = 'bg-slate-950/50 text-slate-500 border-slate-900';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(opt)}
                    disabled={isAnswered}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs text-left transition-all cursor-pointer ${style}`}
                  >
                    <span>{opt}</span>
                    {isAnswered && isTargetCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {isAnswered && isSelected && !isTargetCorrect && <XCircle className="w-4 h-4 text-rose-400" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Hint Section */}
          {currentQ.hint && !isAnswered && (
            <div>
              {!showHint ? (
                <button
                  onClick={() => {
                    setShowHint(true);
                    sound.playClick();
                  }}
                  className="flex items-center gap-1.5 text-[11px] text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Need a hint?</span>
                </button>
              ) : (
                <div className="p-2.5 bg-amber-950/30 border border-amber-900/40 rounded-xl text-xs text-amber-200">
                  💡 <span className="font-semibold">Hint:</span> {currentQ.hint}
                </div>
              )}
            </div>
          )}

          {/* Answer Resolution Feedback Card */}
          {isAnswered && (
            <div
              className={`p-3.5 rounded-xl text-xs leading-relaxed space-y-1 ${
                isCorrect
                  ? 'bg-emerald-950/40 border border-emerald-600/50 text-emerald-200'
                  : 'bg-rose-950/40 border border-rose-600/50 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Brilliant! That is correct.</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>Incorrect. The answer is {currentQ.correctAnswer}.</span>
                  </>
                )}
              </div>
              <p className="text-slate-300 pt-1 leading-normal">{currentQ.explanation}</p>
            </div>
          )}

          {/* Next Button */}
          {isAnswered && (
            <button
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-lg shadow-sky-950/50"
            >
              <span>{currentIndex === questions.length - 1 ? 'Finish Challenge' : 'Next Question'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
