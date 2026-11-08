import React, { useState, useEffect } from 'react';
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Volume2,
  VolumeX,
  Eye,
  Sliders,
  ChevronDown,
  ChevronUp,
  Compass,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SkeletonRegion } from '../types/anatomy';
import { sound } from '../audio/soundEffects';

interface HUDDockProps {
  explodedFactor: number;
  onExplodedChange: (val: number) => void;
  selectedRegion: SkeletonRegion;
  onSelectRegion: (reg: SkeletonRegion) => void;
  onCameraPreset: (view: 'anterior' | 'posterior' | 'lateral' | 'superior' | 'reset') => void;
  isSoloMode: boolean;
  onToggleSoloMode: () => void;
  selectedBoneName: string | null;
  onDisarticulateToggle: () => void;
}

export const HUDDock: React.FC<HUDDockProps> = ({
  explodedFactor,
  onExplodedChange,
  selectedRegion,
  onSelectRegion,
  onCameraPreset,
  isSoloMode,
  onToggleSoloMode,
  selectedBoneName,
  onDisarticulateToggle,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'disarticulate' | 'regions' | 'camera'>('disarticulate');

  // Keyboard shortcut H to toggle collapse
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.toLowerCase() === 'h') {
        setIsCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.setSoundEnabled(next);
    sound.setSpeechEnabled(next);
    if (next) sound.playClick();
  };

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onExplodedChange(val);
  };

  const setPresetExplode = (val: number) => {
    sound.playWhoosh(val > explodedFactor ? 'expand' : 'collapse');
    onExplodedChange(val);
  };

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 w-full max-w-[940px] px-3 sm:px-6 pointer-events-none transition-all duration-300">
      {/* Collapse / Expand Tab */}
      <div className="flex justify-center mb-1.5 pointer-events-auto">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-300 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-full shadow-lg transition-colors cursor-pointer"
          title="Toggle Dock (Shortcut: H)"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-sky-400" />
              <span>Show Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Hide Controls (H)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Dock Container */}
      {!isCollapsed && (
        <div className="pointer-events-auto bg-slate-900/95 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xl shadow-black/80 flex flex-col gap-3">
          {/* Top row: Tab Switcher & Quick Utilities */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-medium">
              <button
                onClick={() => {
                  setActiveTab('disarticulate');
                  sound.playClick();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'disarticulate'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>Disarticulation</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('regions');
                  sound.playClick();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'regions'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>Regions</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('camera');
                  sound.playClick();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'camera'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                <span>Views</span>
              </button>
            </div>

            {/* Right side utilities: Solo Inspect, Sound */}
            <div className="flex items-center gap-2">
              {selectedBoneName && (
                <button
                  onClick={onToggleSoloMode}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    isSoloMode
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-950/40'
                      : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                  }`}
                  title="Isolate selected bone for 360-degree solo study"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">{isSoloMode ? 'Exit Solo Study' : 'Solo Bone 360°'}</span>
                </button>
              )}

              <button
                onClick={toggleSound}
                className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                title={soundEnabled ? 'Mute Sounds & Pronunciations' : 'Enable Audio'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              </button>
            </div>
          </div>

          {/* Tab 1: Disarticulation Exploded Slider */}
          {activeTab === 'disarticulate' && (
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 py-1">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={onDisarticulateToggle}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                    explodedFactor > 0.05
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                      : 'bg-sky-500/20 text-sky-300 border-sky-500/40 hover:bg-sky-500/30'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{explodedFactor > 0.05 ? 'Reassemble' : 'Disarticulate All'}</span>
                </button>
              </div>

              {/* Slider Track */}
              <div className="flex-1 w-full flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">Assembled</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={explodedFactor}
                  onChange={handleSlider}
                  className="w-full h-2 rounded-lg cursor-pointer accent-sky-400"
                />
                <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                  {Math.round(explodedFactor * 100)}%
                </span>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1.5">
                {[
                  { label: '0%', val: 0.0 },
                  { label: '25%', val: 0.25 },
                  { label: '60%', val: 0.6 },
                  { label: '100%', val: 1.0 },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setPresetExplode(p.val)}
                    className={`px-2 py-1 text-[11px] font-mono rounded border transition-colors cursor-pointer ${
                      Math.abs(explodedFactor - p.val) < 0.08
                        ? 'bg-sky-500/30 text-sky-200 border-sky-500/50'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Anatomical Regions */}
          {activeTab === 'regions' && (
            <div className="flex flex-wrap items-center gap-1.5 py-1">
              {[
                { id: 'all', label: 'All Skeleton' },
                { id: 'head', label: 'Cranium & Jaw' },
                { id: 'spine', label: 'Vertebral Column' },
                { id: 'thorax', label: 'Thoracic Cage' },
                { id: 'upper_limb', label: 'Upper Extremities' },
                { id: 'pelvis', label: 'Pelvis & Girdle' },
                { id: 'lower_limb', label: 'Lower Extremities' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    onSelectRegion(r.id as SkeletonRegion);
                    sound.playClick();
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    selectedRegion === r.id
                      ? 'bg-sky-500/25 text-sky-200 border-sky-500/50'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700/80 hover:bg-slate-700/60'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}

          {/* Tab 3: Camera Perspectives */}
          {activeTab === 'camera' && (
            <div className="flex flex-wrap items-center gap-2 py-1">
              {[
                { id: 'anterior', label: 'Anterior (Front)' },
                { id: 'posterior', label: 'Posterior (Back)' },
                { id: 'lateral', label: 'Lateral (Profile)' },
                { id: 'superior', label: 'Superior (Top)' },
                { id: 'reset', label: 'Reset Orbit' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onCameraPreset(c.id as 'anterior' | 'posterior' | 'lateral' | 'superior' | 'reset');
                    sound.playClick();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  {c.id === 'reset' && <RotateCcw className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
