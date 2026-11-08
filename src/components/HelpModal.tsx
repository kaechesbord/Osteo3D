import React from 'react';
import { X, MousePointer, Move, ZoomIn, Sliders, Eye, BookOpen, Trophy } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm pointer-events-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Osteo3D Navigation Guide</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs text-slate-300">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <MousePointer className="w-4 h-4 mx-auto text-sky-400" />
              <p className="font-semibold text-white">Left Click + Drag</p>
              <p className="text-[10px] text-slate-400">Orbit & 360° Rotate</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <Move className="w-4 h-4 mx-auto text-sky-400" />
              <p className="font-semibold text-white">Right Click + Drag</p>
              <p className="text-[10px] text-slate-400">Pan camera</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <ZoomIn className="w-4 h-4 mx-auto text-sky-400" />
              <p className="font-semibold text-white">Scroll Wheel</p>
              <p className="text-[10px] text-slate-400">Zoom in & out</p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-start gap-2.5 p-2 bg-slate-950/60 rounded-xl border border-slate-800">
              <Sliders className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Disarticulation (Exploded View)</p>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Use the slider in the bottom dock or tap "Disarticulate All" to glide all bones apart along their anatomical separation vectors for unobstructed inspection.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 bg-slate-950/60 rounded-xl border border-slate-800">
              <Eye className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Solo Bone 360° Study Mode</p>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Click any bone on the skeleton or use the "Find Bone" search, then click "Solo Study" to dim the rest of the skeleton and rotate that bone in isolation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 bg-slate-950/60 rounded-xl border border-slate-800">
              <BookOpen className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Beginner Academy</p>
                <p className="text-[11px] text-slate-400 leading-normal">
                  New to anatomy? Start with the 6 step-by-step beginner modules and flashcards that guide the 3D camera to major bones with easy-to-remember mnemonics.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 bg-slate-950/60 rounded-xl border border-slate-800">
              <Trophy className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Quiz Mode</p>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Test your skills with 3D interactive challenges where you find and click the bones directly in the scene, identify highlighted structures, and answer clinical case trivia.
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition-colors"
        >
          Got it, let's explore!
        </button>
      </div>
    </div>
  );
};
