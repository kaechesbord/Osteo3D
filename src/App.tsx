/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { SkeletalCanvas } from './components/SkeletalCanvas';
import { HUDDock } from './components/HUDDock';
import { HeaderNav } from './components/HeaderNav';
import { BoneDetailModal } from './components/BoneDetailModal';
import { BeginnerAcademy } from './components/BeginnerAcademy';
import { QuizMode } from './components/QuizMode';
import { HelpModal } from './components/HelpModal';
import { BONES_DATA } from './data/skeletonData';
import { SkeletonRegion, BoneData } from './types/anatomy';
import { sound } from './audio/soundEffects';

export default function App() {
  const [activeMode, setActiveMode] = useState<'explore' | 'academy' | 'quiz'>('explore');
  const [selectedBoneId, setSelectedBoneId] = useState<string | null>(null);
  const [hoveredBoneId, setHoveredBoneId] = useState<string | null>(null);
  const [highlightedBoneId, setHighlightedBoneId] = useState<string | null>(null);
  const [quizFlashState, setQuizFlashState] = useState<'correct' | 'incorrect' | null>(null);
  const [lastClickedBoneId, setLastClickedBoneId] = useState<string | null>(null);

  const [explodedFactor, setExplodedFactor] = useState<number>(0.0);
  const [isSoloMode, setIsSoloMode] = useState<boolean>(false);
  const [selectedRegion, setSelectedRegion] = useState<SkeletonRegion>('all');
  const [showHelp, setShowHelp] = useState<boolean>(false);

  const [cameraCommand, setCameraCommand] = useState<{
    target: [number, number, number];
    position: [number, number, number];
    token: number;
  } | null>(null);

  // Selected bone data lookup
  const selectedBone = BONES_DATA.find((b) => b.id === selectedBoneId) || null;
  const hoveredBone = BONES_DATA.find((b) => b.id === hoveredBoneId) || null;

  // Handle bone selection from 3D canvas or UI
  const handleSelectBone = useCallback((boneId: string | null) => {
    setSelectedBoneId(boneId);
    setLastClickedBoneId(boneId);

    if (boneId) {
      const bone = BONES_DATA.find((b) => b.id === boneId);
      if (bone) {
        // If in explore mode, subtly center camera target toward bone
        setCameraCommand({
          target: bone.cameraTarget,
          position: bone.cameraPosition,
          token: Date.now(),
        });
      }
    } else {
      setIsSoloMode(false);
    }
  }, []);

  // Handle camera perspective buttons
  const handleCameraPreset = useCallback((view: 'anterior' | 'posterior' | 'lateral' | 'superior' | 'reset') => {
    let pos: [number, number, number] = [0, 0.5, 9.2];
    let target: [number, number, number] = [0, 0, 0];

    switch (view) {
      case 'anterior':
        pos = [0, 0.2, 8.8];
        target = [0, 0, 0];
        break;
      case 'posterior':
        pos = [0, 0.2, -8.8];
        target = [0, 0, 0];
        break;
      case 'lateral':
        pos = [8.8, 0.2, 0];
        target = [0, 0, 0];
        break;
      case 'superior':
        pos = [0, 9.5, 0.1];
        target = [0, 0, 0];
        break;
      case 'reset':
      default:
        pos = [0, 0.5, 9.2];
        target = [0, 0, 0];
        break;
    }

    setCameraCommand({
      target,
      position: pos,
      token: Date.now(),
    });
  }, []);

  // Handle anatomical region buttons
  const handleSelectRegion = useCallback((region: SkeletonRegion) => {
    setSelectedRegion(region);

    let pos: [number, number, number] = [0, 0.5, 9.2];
    let target: [number, number, number] = [0, 0, 0];

    switch (region) {
      case 'head':
        pos = [0, 4.3, 3.2];
        target = [0, 4.1, 0];
        break;
      case 'spine':
        pos = [0, 2.0, 4.2];
        target = [0, 2.0, 0];
        break;
      case 'thorax':
        pos = [0, 2.1, 3.6];
        target = [0, 2.1, 0.2];
        break;
      case 'upper_limb':
        pos = [2.2, 1.6, 3.2];
        target = [1.2, 1.4, 0];
        break;
      case 'pelvis':
        pos = [0, 0.2, 3.2];
        target = [0, 0.1, 0];
        break;
      case 'lower_limb':
        pos = [0, -2.6, 4.8];
        target = [0, -2.6, 0];
        break;
      case 'all':
      default:
        pos = [0, 0.5, 9.2];
        target = [0, 0, 0];
        break;
    }

    setCameraCommand({
      target,
      position: pos,
      token: Date.now(),
    });
  }, []);

  // Disarticulate / Reassemble quick toggle
  const handleDisarticulateToggle = () => {
    const nextVal = explodedFactor > 0.05 ? 0.0 : 0.65;
    sound.playWhoosh(nextVal > 0 ? 'expand' : 'collapse');
    setExplodedFactor(nextVal);
  };

  // Solo study mode toggle
  const handleToggleSoloMode = () => {
    const next = !isSoloMode;
    setIsSoloMode(next);
    sound.playClick();
  };

  // Guided Academy camera focus
  const handleAcademyFocusBone = (
    boneId: string,
    position?: [number, number, number],
    target?: [number, number, number]
  ) => {
    setSelectedBoneId(boneId);
    setHighlightedBoneId(boneId);

    const bone = BONES_DATA.find((b) => b.id === boneId);
    if (position && target) {
      setCameraCommand({ position, target, token: Date.now() });
    } else if (bone) {
      setCameraCommand({
        position: bone.cameraPosition,
        target: bone.cameraTarget,
        token: Date.now(),
      });
    }
  };

  // Mode switcher
  const handleSelectMode = (mode: 'explore' | 'academy' | 'quiz') => {
    setActiveMode(mode);
    setHighlightedBoneId(null);
    setQuizFlashState(null);
    if (mode === 'explore') {
      setIsSoloMode(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D WebGL Canvas Layer (Full Bleed 100vw x 100vh) */}
      <SkeletalCanvas
        selectedBoneId={selectedBoneId}
        hoveredBoneId={hoveredBoneId}
        highlightedBoneId={highlightedBoneId}
        quizFlashState={quizFlashState}
        explodedFactor={explodedFactor}
        soloMode={isSoloMode}
        cameraCommand={cameraCommand}
        onSelectBone={handleSelectBone}
        onHoverBone={setHoveredBoneId}
      />

      {/* Top Header & Mode Navigation */}
      <HeaderNav
        activeMode={activeMode}
        onSelectMode={handleSelectMode}
        hoveredBoneName={hoveredBone ? hoveredBone.name : null}
        onSelectBone={(id) => handleSelectBone(id)}
        onOpenHelp={() => setShowHelp(true)}
      />

      {/* Floating Bone Detail Card (when a bone is selected) */}
      {selectedBone && activeMode !== 'quiz' && (
        <BoneDetailModal
          bone={selectedBone}
          isSoloMode={isSoloMode}
          onToggleSoloMode={handleToggleSoloMode}
          onSelectConnectedBone={(id) => handleSelectBone(id)}
          onClose={() => {
            setSelectedBoneId(null);
            setIsSoloMode(false);
          }}
        />
      )}

      {/* Beginner Osteology Academy Overlay */}
      {activeMode === 'academy' && (
        <BeginnerAcademy
          onFocusBoneIn3D={handleAcademyFocusBone}
          onClose={() => handleSelectMode('explore')}
        />
      )}

      {/* Interactive 3D Quiz Mode Overlay */}
      {activeMode === 'quiz' && (
        <QuizMode
          onHighlightBoneIn3D={setHighlightedBoneId}
          onCameraFocus={(target, pos) => setCameraCommand({ target, position: pos, token: Date.now() })}
          onSetQuizFlash={setQuizFlashState}
          lastClickedBoneId={lastClickedBoneId}
          onClose={() => handleSelectMode('explore')}
        />
      )}

      {/* Bottom Control Dock (Consolidated, zero-viewport-occlusion, collapsible) */}
      <HUDDock
        explodedFactor={explodedFactor}
        onExplodedChange={setExplodedFactor}
        selectedRegion={selectedRegion}
        onSelectRegion={handleSelectRegion}
        onCameraPreset={handleCameraPreset}
        isSoloMode={isSoloMode}
        onToggleSoloMode={handleToggleSoloMode}
        selectedBoneName={selectedBone ? selectedBone.name : null}
        onDisarticulateToggle={handleDisarticulateToggle}
      />

      {/* Help Modal */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
