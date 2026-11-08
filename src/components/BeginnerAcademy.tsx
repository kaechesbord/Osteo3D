import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Compass,
  Sparkles,
  Layers,
  Brain,
  Split,
  Activity,
  Repeat,
} from 'lucide-react';
import { ACADEMY_LESSONS, BONES_DATA } from '../data/skeletonData';
import { sound } from '../audio/soundEffects';

interface BeginnerAcademyProps {
  onFocusBoneIn3D: (boneId: string, position?: [number, number, number], target?: [number, number, number]) => void;
  onClose: () => void;
}

export const BeginnerAcademy: React.FC<BeginnerAcademyProps> = ({
  onFocusBoneIn3D,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'curriculum' | 'flashcards'>('curriculum');
  const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const lesson = ACADEMY_LESSONS[currentLessonIdx];

  const handleSelectLesson = (idx: number) => {
    setCurrentLessonIdx(idx);
    setSelectedQuizAnswer(null);
    setHasAnswered(false);
    const target = ACADEMY_LESSONS[idx];
    if (target.targetBoneId) {
      onFocusBoneIn3D(target.targetBoneId, target.cameraPosition, target.cameraTarget);
    }
    sound.playClick();
  };

  const handleNextLesson = () => {
    if (currentLessonIdx < ACADEMY_LESSONS.length - 1) {
      handleSelectLesson(currentLessonIdx + 1);
    }
  };

  const handlePrevLesson = () => {
    if (currentLessonIdx > 0) {
      handleSelectLesson(currentLessonIdx - 1);
    }
  };

  const handleAnswerCheck = (optionIdx: number) => {
    if (hasAnswered) return;
    setSelectedQuizAnswer(optionIdx);
    setHasAnswered(true);

    if (optionIdx === lesson.quickCheck.correctIndex) {
      sound.playCorrect();
    } else {
      sound.playWrong();
    }
  };

  const currentFlashcardBone = BONES_DATA[flashcardIdx];

  const handleFlashcardNext = () => {
    setIsFlipped(false);
    setFlashcardIdx((prev) => (prev + 1) % BONES_DATA.length);
    sound.playClick();
  };

  const handleFlashcardPrev = () => {
    setIsFlipped(false);
    setFlashcardIdx((prev) => (prev - 1 + BONES_DATA.length) % BONES_DATA.length);
    sound.playClick();
  };

  const handleInspectFlashcard3D = () => {
    if (currentFlashcardBone) {
      onFocusBoneIn3D(currentFlashcardBone.id, currentFlashcardBone.cameraPosition, currentFlashcardBone.cameraTarget);
      sound.playClick();
    }
  };

  return (
    <div className="fixed inset-y-0 left-0 z-40 w-full sm:w-[480px] bg-slate-950/95 border-r border-slate-800 shadow-2xl flex flex-col pointer-events-auto backdrop-blur-md">
      {/* Academy Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Beginner Osteology Academy</h2>
            <p className="text-[11px] text-slate-400">Step-by-step foundation to 3D anatomy</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/40 px-4 pt-2 gap-2 text-xs font-medium">
        <button
          onClick={() => {
            setActiveTab('curriculum');
            sound.playClick();
          }}
          className={`flex items-center gap-1.5 pb-2 px-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'curriculum'
              ? 'border-sky-400 text-sky-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Curriculum Modules ({ACADEMY_LESSONS.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('flashcards');
            sound.playClick();
          }}
          className={`flex items-center gap-1.5 pb-2 px-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'flashcards'
              ? 'border-sky-400 text-sky-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>Flashcards Study Deck</span>
        </button>
      </div>

      {/* Mode A: Curriculum Modules */}
      {activeTab === 'curriculum' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Progress Bar / Steps */}
          <div className="flex items-center gap-1 px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 overflow-x-auto">
            {ACADEMY_LESSONS.map((l, idx) => (
              <button
                key={l.id}
                onClick={() => handleSelectLesson(idx)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono whitespace-nowrap border transition-colors cursor-pointer ${
                  currentLessonIdx === idx
                    ? 'bg-sky-500/25 text-sky-200 border-sky-500/60 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{idx + 1}</span>
                <span className="truncate max-w-[80px]">{l.title.split(':')[0]}</span>
              </button>
            ))}
          </div>

          {/* Lesson Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-300 leading-relaxed">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-sky-950 text-sky-400 border border-sky-800">
                  {lesson.category}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Module {currentLessonIdx + 1} of {ACADEMY_LESSONS.length}
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">{lesson.title}</h3>
              <p className="mt-1 text-slate-400 font-medium">{lesson.summary}</p>
            </div>

            {/* Guided 3D Alignment Callout */}
            {lesson.targetBoneId && (
              <div className="flex items-center justify-between p-3 bg-slate-900 border border-sky-500/30 rounded-xl">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-sky-400" />
                  <span className="text-slate-200 font-medium">3D Viewport Synchronized</span>
                </div>
                <button
                  onClick={() => {
                    onFocusBoneIn3D(lesson.targetBoneId!, lesson.cameraPosition, lesson.cameraTarget);
                    sound.playClick();
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40 rounded-lg cursor-pointer"
                >
                  Refocus Bone
                </button>
              </div>
            )}

            {/* Paragraphs */}
            <div className="space-y-2.5 text-slate-300">
              {lesson.content.map((p, idx) => (
                <p key={idx} className="leading-relaxed">
                  {p}
                </p>
              ))}
            </div>

            {/* Mnemonic Banner */}
            {lesson.mnemonic && (
              <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl">
                <div className="flex items-center gap-2 font-bold text-amber-300 text-[11px] uppercase tracking-wider mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Beginner Memory Mnemonic</span>
                </div>
                <p className="text-amber-200/90 text-xs font-medium leading-normal">{lesson.mnemonic}</p>
              </div>
            )}

            {/* Mini Quick Check Quiz */}
            <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                <span>Quick Checkpoint Question</span>
              </div>
              <p className="font-semibold text-white text-xs">{lesson.quickCheck.question}</p>

              <div className="grid grid-cols-1 gap-1.5 pt-1">
                {lesson.quickCheck.options.map((opt, optIdx) => {
                  const isSelected = selectedQuizAnswer === optIdx;
                  const isCorrect = optIdx === lesson.quickCheck.correctIndex;

                  let btnStyle = 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800';
                  if (hasAnswered) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/60 font-semibold';
                    } else if (isSelected) {
                      btnStyle = 'bg-rose-950/60 text-rose-300 border-rose-500/60';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleAnswerCheck(optIdx)}
                      className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors cursor-pointer ${btnStyle}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {hasAnswered && (
                <div
                  className={`p-2.5 rounded-lg text-xs leading-normal ${
                    selectedQuizAnswer === lesson.quickCheck.correctIndex
                      ? 'bg-emerald-950/40 text-emerald-200 border border-emerald-800/60'
                      : 'bg-rose-950/40 text-rose-200 border border-rose-800/60'
                  }`}
                >
                  <p className="font-semibold mb-0.5">
                    {selectedQuizAnswer === lesson.quickCheck.correctIndex ? '✓ Correct!' : '✗ Not quite.'}
                  </p>
                  <p>{lesson.quickCheck.explanation}</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
            <button
              onClick={handlePrevLesson}
              disabled={currentLessonIdx === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${
                currentLessonIdx === 0
                  ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="text-[11px] text-slate-400 font-mono">
              {currentLessonIdx + 1} / {ACADEMY_LESSONS.length}
            </span>

            <button
              onClick={handleNextLesson}
              disabled={currentLessonIdx === ACADEMY_LESSONS.length - 1}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                currentLessonIdx === ACADEMY_LESSONS.length - 1
                  ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                  : 'bg-sky-500/20 text-sky-300 border-sky-500/50 hover:bg-sky-500/30'
              }`}
            >
              <span>Next Module</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Mode B: Flashcards Study Deck */}
      {activeTab === 'flashcards' && (
        <div className="flex-1 flex flex-col p-4 justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-mono">
              <span>Card {flashcardIdx + 1} of {BONES_DATA.length}</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 uppercase text-[10px]">
                {currentFlashcardBone.division}
              </span>
            </div>

            {/* Interactive Flip Card */}
            <div
              onClick={() => {
                setIsFlipped(!isFlipped);
                sound.playClick();
              }}
              className="w-full min-h-[300px] p-6 bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 rounded-2xl shadow-xl flex flex-col justify-between cursor-pointer transition-all hover:shadow-sky-950/20"
            >
              {!isFlipped ? (
                // Front of card
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">{currentFlashcardBone.name}</h3>
                    <p className="text-xs text-sky-400 font-mono italic mt-1">{currentFlashcardBone.latinName}</p>
                  </div>
                  <span className="inline-block px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-xs">
                    {currentFlashcardBone.classification} bone • Region: {currentFlashcardBone.region}
                  </span>
                  <p className="text-[11px] text-slate-400 pt-4">Tap to flip & reveal anatomical landmarks and notes</p>
                </div>
              ) : (
                // Back of card
                <div className="flex-1 flex flex-col space-y-3 text-left">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-1">Function & Description</h4>
                    <p className="text-xs text-slate-300 leading-normal">{currentFlashcardBone.description}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">Key Landmarks</h4>
                    <div className="flex flex-wrap gap-1">
                      {currentFlashcardBone.landmarks.slice(0, 4).map((m, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-slate-950 text-slate-300 border border-slate-800 rounded text-[10px] font-mono">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  {currentFlashcardBone.mnemonic && (
                    <div className="p-2 bg-amber-950/30 rounded border border-amber-900/40 text-[11px] text-amber-200">
                      💡 {currentFlashcardBone.mnemonic}
                    </div>
                  )}

                  <p className="text-[10px] text-slate-500 text-center pt-2">Tap to flip back</p>
                </div>
              )}
            </div>

            {/* Direct 3D Focus Action */}
            <div className="mt-3 flex justify-center">
              <button
                onClick={handleInspectFlashcard3D}
                className="flex items-center gap-1.5 px-4 py-2 bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-md"
              >
                <Compass className="w-4 h-4" />
                <span>Locate & Highlight in 3D</span>
              </button>
            </div>
          </div>

          {/* Flashcard Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={handleFlashcardPrev}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <button
              onClick={handleFlashcardNext}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
            >
              <span>Next Card</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
