import React, { useState } from 'react';
import {
  Bone,
  BookOpen,
  Trophy,
  Search,
  ChevronDown,
  Sparkles,
  Info,
} from 'lucide-react';
import { BONES_DATA } from '../data/skeletonData';
import { BoneData } from '../types/anatomy';
import { sound } from '../audio/soundEffects';

interface HeaderNavProps {
  activeMode: 'explore' | 'academy' | 'quiz';
  onSelectMode: (mode: 'explore' | 'academy' | 'quiz') => void;
  hoveredBoneName: string | null;
  onSelectBone: (boneId: string) => void;
  onOpenHelp: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeMode,
  onSelectMode,
  hoveredBoneName,
  onSelectBone,
  onOpenHelp,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBones = searchQuery.trim()
    ? BONES_DATA.filter(
        (b) =>
          b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.latinName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.commonName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : BONES_DATA;

  const handlePickBone = (bone: BoneData) => {
    onSelectBone(bone.id);
    setSearchOpen(false);
    setSearchQuery('');
    sound.playClick();
  };

  return (
    <header className="fixed top-0 inset-x-0 z-30 pointer-events-none p-3 sm:p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: App Brand & Hover feedback */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-300 flex items-center justify-center text-slate-950 font-black shadow-md shadow-sky-500/20">
              <Bone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-white">Osteo3D</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Lab
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Interactive 3D Skeletal Anatomy</p>
            </div>
          </div>

          {/* Hover Status Tag */}
          {hoveredBoneName && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-900/85 border border-slate-700/60 rounded-xl shadow-lg backdrop-blur-md text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span className="text-slate-400">Inspecting:</span>
              <span className="font-semibold text-sky-200">{hoveredBoneName}</span>
            </div>
          )}
        </div>

        {/* Center: Mode Navigation Buttons */}
        <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-2xl shadow-xl backdrop-blur-md">
          <button
            onClick={() => {
              onSelectMode('explore');
              sound.playClick();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeMode === 'explore'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Bone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">3D Disarticulate</span>
            <span className="sm:hidden">3D Lab</span>
          </button>

          <button
            onClick={() => {
              onSelectMode('academy');
              sound.playClick();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeMode === 'academy'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Beginner Academy</span>
          </button>

          <button
            onClick={() => {
              onSelectMode('quiz');
              sound.playClick();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeMode === 'quiz'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Quiz Mode</span>
          </button>
        </div>

        {/* Right: Quick Search & Guide */}
        <div className="relative pointer-events-auto flex items-center gap-2">
          {/* Bone Finder Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-300 transition-colors shadow-lg cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Find Bone...</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {searchOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-96">
                <div className="p-2.5 border-b border-slate-800 bg-slate-950">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-900 rounded-lg border border-slate-800">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search bone (e.g. Femur, Jaw)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none"
                    />
                  </div>
                </div>

                <div className="overflow-y-auto p-1.5 space-y-1">
                  {filteredBones.length === 0 ? (
                    <p className="p-3 text-center text-xs text-slate-500">No bones matching search</p>
                  ) : (
                    filteredBones.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => handlePickBone(b)}
                        className="w-full flex items-center justify-between p-2 hover:bg-slate-800 rounded-lg text-left text-xs text-slate-200 transition-colors cursor-pointer"
                      >
                        <div>
                          <p className="font-semibold text-white">{b.name}</p>
                          <p className="text-[10px] text-sky-400 font-mono italic">{b.latinName}</p>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 text-[10px]">
                          {b.division}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Help modal button */}
          <button
            onClick={onOpenHelp}
            className="p-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer shadow-lg"
            title="App Guide & Controls"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
