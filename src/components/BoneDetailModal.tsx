import React from 'react';
import {
  Volume2,
  X,
  Eye,
  Link as LinkIcon,
  Activity,
  Lightbulb,
  Sparkles,
  Layers,
} from 'lucide-react';
import { BoneData } from '../types/anatomy';
import { sound } from '../audio/soundEffects';

interface BoneDetailModalProps {
  bone: BoneData;
  isSoloMode: boolean;
  onToggleSoloMode: () => void;
  onSelectConnectedBone: (boneId: string) => void;
  onClose: () => void;
}

export const BoneDetailModal: React.FC<BoneDetailModalProps> = ({
  bone,
  isSoloMode,
  onToggleSoloMode,
  onSelectConnectedBone,
  onClose,
}) => {
  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.speakTerm(bone.latinName, true);
  };

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-20 w-[92vw] sm:w-[380px] max-h-[calc(100vh-160px)] flex flex-col bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden pointer-events-auto backdrop-blur-md">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border ${
                bone.division === 'axial'
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
              }`}
            >
              {bone.division} Skeleton
            </span>
            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-slate-800 text-slate-300 border border-slate-700">
              {bone.classification} Bone
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
            {bone.name}
          </h2>

          <div className="flex items-center gap-2 mt-0.5 text-xs text-sky-400 font-mono italic">
            <span>{bone.latinName}</span>
            <button
              onClick={handleSpeak}
              className="p-1 text-sky-400 hover:text-sky-200 bg-sky-950/60 hover:bg-sky-900/60 rounded border border-sky-800/60 transition-colors cursor-pointer"
              title="Pronounce Latin terminology"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
          title="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Content Body */}
      <div className="p-4 overflow-y-auto space-y-3.5 text-xs leading-relaxed text-slate-300">
        {/* Solo Study Action Banner */}
        <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" />
            <span className="font-medium text-slate-200">
              {isSoloMode ? 'Solo 360° Active' : 'Isolate & Rotate 360°'}
            </span>
          </div>
          <button
            onClick={onToggleSoloMode}
            className={`px-3 py-1 font-semibold rounded-lg border transition-all cursor-pointer ${
              isSoloMode
                ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400'
                : 'bg-slate-800 text-slate-200 hover:text-white border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isSoloMode ? 'Exit Solo' : 'Solo Study'}
          </button>
        </div>

        {/* Anatomical Overview */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Overview & Function</span>
          </h4>
          <p className="text-slate-300 leading-normal">{bone.description}</p>
        </div>

        {/* Articulations (Connected Bones) */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>Articulating Joints</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {bone.articulations.map((art, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-slate-800/80 text-slate-300 border border-slate-700/60 rounded-md text-[11px]"
              >
                {art}
              </span>
            ))}
          </div>
        </div>

        {/* Key Landmarks */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Key Landmarks & Foramina</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {bone.landmarks.map((mark, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-slate-950 text-slate-300 border border-slate-800 rounded text-[11px] font-mono"
              >
                {mark}
              </span>
            ))}
          </div>
        </div>

        {/* Clinical Note */}
        <div className="p-2.5 bg-rose-950/20 border border-rose-900/40 rounded-xl">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-rose-300 mb-1 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-rose-400" />
            <span>Clinical Pearl / Fractures</span>
          </h4>
          <p className="text-rose-200/90 text-[11px] leading-normal">{bone.clinicalNote}</p>
        </div>

        {/* Mnemonic / Memory Trick */}
        {bone.mnemonic && (
          <div className="p-2.5 bg-amber-950/20 border border-amber-900/40 rounded-xl">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-1 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Memory Mnemonic</span>
            </h4>
            <p className="text-amber-200/90 text-[11px] leading-normal font-medium">{bone.mnemonic}</p>
          </div>
        )}

        {/* Fun Fact */}
        <div className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/80">
          💡 <span className="font-semibold text-slate-300">Did you know?</span> {bone.funFact}
        </div>
      </div>
    </div>
  );
};
