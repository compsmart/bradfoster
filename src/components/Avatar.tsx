import React, { useRef, useEffect } from 'react';
import type { Expression } from '../hooks/useGeminiLive';

interface AvatarProps {
  analyser?: AnalyserNode;
  isListening: boolean;
  className?: string;
  expression?: Expression;
}

// Expression configuration for avatar facial features
interface ExpressionConfig {
  leftEyebrowOffset: number;    // Vertical offset (negative = raised)
  rightEyebrowOffset: number;
  leftEyebrowRotation: number;  // Rotation in degrees
  rightEyebrowRotation: number;
  eyeHeightModifier: number;    // Multiplier for eye height (1.0 = normal)
}

const EXPRESSION_CONFIG: Record<Expression, ExpressionConfig> = {
  neutral: {
    leftEyebrowOffset: 0,
    rightEyebrowOffset: 0,
    leftEyebrowRotation: 0,
    rightEyebrowRotation: 0,
    eyeHeightModifier: 1.0
  },
  surprised: {
    leftEyebrowOffset: -12,
    rightEyebrowOffset: -12,
    leftEyebrowRotation: 0,
    rightEyebrowRotation: 0,
    eyeHeightModifier: 1.3
  },
  thinking: {
    leftEyebrowOffset: -5,
    rightEyebrowOffset: -2,
    leftEyebrowRotation: 5,
    rightEyebrowRotation: 0,
    eyeHeightModifier: 0.9
  },
  happy: {
    leftEyebrowOffset: -3,
    rightEyebrowOffset: -3,
    leftEyebrowRotation: 0,
    rightEyebrowRotation: 0,
    eyeHeightModifier: 0.85
  },
  concerned: {
    leftEyebrowOffset: 3,
    rightEyebrowOffset: 3,
    leftEyebrowRotation: -8,
    rightEyebrowRotation: 8,
    eyeHeightModifier: 1.0
  },
  angry: {
    leftEyebrowOffset: 5,
    rightEyebrowOffset: 5,
    leftEyebrowRotation: 10,
    rightEyebrowRotation: -10,
    eyeHeightModifier: 0.9
  },
  sad: {
    leftEyebrowOffset: -2,
    rightEyebrowOffset: -2,
    leftEyebrowRotation: -12,
    rightEyebrowRotation: 12,
    eyeHeightModifier: 1.0
  },
  skeptical: {
    leftEyebrowOffset: -8,
    rightEyebrowOffset: 2,
    leftEyebrowRotation: 0,
    rightEyebrowRotation: 5,
    eyeHeightModifier: 0.95
  },
  excited: {
    leftEyebrowOffset: -10,
    rightEyebrowOffset: -10,
    leftEyebrowRotation: 0,
    rightEyebrowRotation: 0,
    eyeHeightModifier: 1.2
  },
  confused: {
    leftEyebrowOffset: -6,
    rightEyebrowOffset: 2,
    leftEyebrowRotation: 8,
    rightEyebrowRotation: -5,
    eyeHeightModifier: 1.1
  }
};

const FACE_CONFIG = {
  eyeY: 152,          // Vertical position of eyes
  leftEyeX: 205,      // Horizontal pos of left eye center
  rightEyeX: 282,     // Horizontal pos of right eye center
  eyeWidth: 17,       // Horizontal radius (narrower)
  eyeHeight: 15,      // Vertical radius (height)
  mouthY: 235,        // Vertical center of the mouth
  mouthX: 245,        // Horizontal center of the mouth
  maxMouthHeight: 65, // How wide it opens vertically
  mouthWidth: 50      // How wide it is horizontally
};

// Lip sync configuration - Enhanced for smoother animation
const LIPSYNC_CONFIG = {
  noiseGate: 5,           // Minimum volume threshold to ignore background noise
  sensitivity: 130,       // Divisor for normalization (lower = more sensitive)
  attackRate: 0.45,       // How fast mouth opens (higher = faster)
  releaseRate: 0.32,      // How fast mouth closes (lower = smoother)
  secondarySmooth: 0.25,  // Secondary smoothing pass for silky movement
  useNonLinear: true,     // Square the value for more natural movement
  frameBufferSize: 6,     // Number of frames to average for smoother input
  // Vowel shape detection
  roundnessSmooth: 0.15,  // How fast roundness changes (lower = smoother)
  roundnessThreshold: 0.6 // Ratio threshold for detecting "oo" sounds
};

export const Avatar: React.FC<AvatarProps> = ({ analyser, isListening, className, expression = 'neutral' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const leftEyebrowRef = useRef<HTMLImageElement>(null);
  const rightEyebrowRef = useRef<HTMLImageElement>(null);
  const particlesRef = useRef<{x: number, y: number, speed: number, size: number}[]>([]);
  
  // Store current smoothed expression values for transitions
  const expressionStateRef = useRef({
    leftEyebrowOffset: 0,
    rightEyebrowOffset: 0,
    leftEyebrowRotation: 0,
    rightEyebrowRotation: 0,
    eyeHeightModifier: 1.0
  });

  useEffect(() => {
    // Initialize particles
    particlesRef.current = Array.from({ length: 20 }, () => ({
      x: Math.random() * 500,
      y: Math.random() * 500,
      speed: 0.5 + Math.random() * 1.5,
      size: 1 + Math.random() * 2
    }));

    // Load eyebrow images
    const leftEb = new Image();
    leftEb.src = '/images/left_eyebrow.png';
    // @ts-ignore
    leftEyebrowRef.current = leftEb;

    const rightEb = new Image();
    rightEb.src = '/images/right_eyebrow.png';
    // @ts-ignore
    rightEyebrowRef.current = rightEb;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mousePosRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const bgCanvas = bgCanvasRef.current;
    if (!canvas || !bgCanvas) return;
    const ctx = canvas.getContext('2d');
    const bgCtx = bgCanvas.getContext('2d');
    if (!ctx || !bgCtx) return;

    let animationFrameId: number;
    let mouthOpenness = 0;
    let mouthRoundness = 0; // 0 = wide (ah/ee), 1 = round (oo)
    let smoothedVolume = 0;
    let smoothedRoundness = 0; // Smoothed roundness for transitions
    let secondarySmooth = 0; // Second pass smoothing for silkier motion
    let blinkState = 1; // 1 = open, 0 = closed
    let blinkTimer = 0;
    let nextBlinkFrame = 200;

    // Frame buffer for averaging audio over multiple frames
    const frameBuffer: number[] = new Array(LIPSYNC_CONFIG.frameBufferSize).fill(0);
    const roundnessBuffer: number[] = new Array(LIPSYNC_CONFIG.frameBufferSize).fill(0);
    let frameBufferIndex = 0;

    // Byte array for audio analysis
    const dataArray = analyser ? new Uint8Array(analyser.frequencyBinCount) : new Uint8Array(0);

    const drawEye = (x: number, y: number, width: number, height: number) => {
      ctx.beginPath();
      // Almond shape using Bezier curves
      // Top lid
      ctx.moveTo(x - width, y);
      ctx.bezierCurveTo(
        x - width / 2, y - height * 1.0,
        x + width / 2, y - height * 1.0,
        x + width, y
      );
      // Bottom lid (flatter)
      ctx.bezierCurveTo(
        x + width / 2, y + height * 0.4,
        x - width / 2, y + height * 0.4,
        x - width, y
      );

      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pupil with clipping
      ctx.save();
      ctx.clip(); // Clip drawing to the eye shape

      if (height > 2) {
        // Calculate pupil position based on mouse (simple tracking)
        // Normalize mouse pos relative to eye center
        const dx = mousePosRef.current.x - (x * (canvas.clientWidth / 500)); // approximate scaling
        const dy = mousePosRef.current.y - (y * (canvas.clientHeight / 500));
        
        // Limit pupil movement
        const maxOffset = width / 2;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const ratio = dist > maxOffset ? maxOffset / dist : 1; // scale down if too far

        const pupilX = x + (dx * ratio * 0.3); // 0.3 dampening
        const pupilY = y + (dy * ratio * 0.3) - 3; // Offset up by 3px

        // Iris (Blue)
        ctx.beginPath();
        ctx.arc(pupilX, pupilY, width / 1.8, 0, Math.PI * 2);
        ctx.fillStyle = '#5b86b5'; // Custom Blue
        ctx.fill();

        // Pupil (Black)
        ctx.beginPath();
        ctx.arc(pupilX, pupilY, width / 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        
        // Optional: Eye shine
        ctx.beginPath();
        ctx.arc(pupilX + width/6, pupilY - width/6, width/8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
      }
      ctx.restore();
    };

    const render = () => {
      // 1. Analyze Audio - Enhanced lip sync with vowel shape detection
      if (analyser && isListening) {
        // Get frequency data (values 0-255 per bin)
        analyser.getByteFrequencyData(dataArray);
        
        const totalBins = dataArray.length;
        const sampleRate = analyser.context.sampleRate;
        const binFrequency = sampleRate / (totalBins * 2); // Hz per bin
        
        // Define frequency bands for vowel detection
        // "OO" sounds: energy concentrated in low frequencies (F1: 300-500Hz, F2: 800-1200Hz)
        // "AH/EE" sounds: energy spread to higher frequencies (F2: 1500-2500Hz+)
        const lowBandEnd = Math.floor(600 / binFrequency);   // 0-600Hz (low formants)
        const midBandEnd = Math.floor(1500 / binFrequency);  // 600-1500Hz (mid formants)
        const highBandEnd = Math.floor(3500 / binFrequency); // 1500-3500Hz (high formants)
        
        // Calculate energy in each band
        let lowSum = 0, midSum = 0, highSum = 0, totalSum = 0;
        
        for (let i = 0; i < Math.min(highBandEnd, totalBins / 2); i++) {
          const val = dataArray[i];
          totalSum += val;
          
          if (i < lowBandEnd) {
            lowSum += val;
          } else if (i < midBandEnd) {
            midSum += val;
          } else {
            highSum += val;
          }
        }
        
        // Calculate average for mouth openness (voice range)
        const voiceBins = Math.min(totalBins / 2, highBandEnd);
        let avg = voiceBins > 0 ? totalSum / voiceBins : 0;
        
        // Apply noise gate
        if (avg < LIPSYNC_CONFIG.noiseGate) {
          avg = 0;
        }
        
        // Normalize to 0-1 range
        let targetOpenness = Math.min(1, avg / LIPSYNC_CONFIG.sensitivity);
        
        // Apply non-linear curve for more natural movement
        if (LIPSYNC_CONFIG.useNonLinear) {
          targetOpenness = targetOpenness * targetOpenness;
        }
        
        // Calculate roundness (how "oo"-like the sound is)
        // "OO" has low+mid energy concentrated, with less high frequency
        // Ratio: (low + mid*0.5) / (high + small constant to avoid division by zero)
        let targetRoundness = 0;
        if (totalSum > LIPSYNC_CONFIG.noiseGate * voiceBins) {
          const lowMidEnergy = lowSum + midSum * 0.6;
          const highEnergy = highSum + 1; // Add 1 to avoid division by zero
          const ratio = lowMidEnergy / (lowMidEnergy + highEnergy * 1.5);
          
          // If ratio is high, sound is more "oo"-like (round)
          // If ratio is low, sound is more "ah/ee"-like (wide)
          targetRoundness = Math.max(0, Math.min(1, (ratio - 0.3) / 0.4));
        }
        
        // Store in frame buffers
        frameBuffer[frameBufferIndex] = targetOpenness;
        roundnessBuffer[frameBufferIndex] = targetRoundness;
        frameBufferIndex = (frameBufferIndex + 1) % LIPSYNC_CONFIG.frameBufferSize;
        
        // Average over all frames in buffer
        const bufferedTarget = frameBuffer.reduce((a, b) => a + b, 0) / LIPSYNC_CONFIG.frameBufferSize;
        const bufferedRoundness = roundnessBuffer.reduce((a, b) => a + b, 0) / LIPSYNC_CONFIG.frameBufferSize;
        
        // Smooth openness with attack/release
        const rate = bufferedTarget > smoothedVolume 
          ? LIPSYNC_CONFIG.attackRate 
          : LIPSYNC_CONFIG.releaseRate;
        smoothedVolume += (bufferedTarget - smoothedVolume) * rate;
        
        // Smooth roundness
        smoothedRoundness += (bufferedRoundness - smoothedRoundness) * LIPSYNC_CONFIG.roundnessSmooth;
        
        // Second pass smoothing for extra silky motion
        secondarySmooth += (smoothedVolume - secondarySmooth) * LIPSYNC_CONFIG.secondarySmooth;
        
        mouthOpenness = secondarySmooth;
        mouthRoundness = smoothedRoundness;
      } else {
        // Gradually close mouth when not listening
        smoothedVolume *= 0.92;
        smoothedRoundness *= 0.9;
        secondarySmooth += (smoothedVolume - secondarySmooth) * LIPSYNC_CONFIG.secondarySmooth;
        mouthOpenness = secondarySmooth;
        mouthRoundness = smoothedRoundness;
        if (mouthOpenness < 0.005) {
          mouthOpenness = 0;
          mouthRoundness = 0;
          smoothedVolume = 0;
          smoothedRoundness = 0;
          secondarySmooth = 0;
        }
      }

      // 2. Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

      // 2.5 Draw Particles (on Background Canvas)
      bgCtx.fillStyle = 'rgba(100, 200, 255, 0.3)';
      particlesRef.current.forEach(p => {
        p.y -= p.speed;
        if (p.y < 0) {
          p.y = 500;
          p.x = Math.random() * 500;
        }
        bgCtx.beginPath();
        bgCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        bgCtx.fill();
      });

      // 3. Blink Logic
      blinkTimer++;
      if (blinkTimer > nextBlinkFrame) {
        blinkState -= 0.1;
        if (blinkState <= 0) {
          blinkState = 0;
          blinkTimer = 0;
          nextBlinkFrame = 120 + Math.random() * 180;
        }
      } else if (blinkState < 1) {
        blinkState += 0.1;
        if (blinkState > 1) blinkState = 1;
      }

      // 4. Smooth expression transitions
      const targetExpr = EXPRESSION_CONFIG[expression] || EXPRESSION_CONFIG.neutral;
      const smoothingRate = 0.12; // How fast expressions transition (lower = smoother)
      
      const exprState = expressionStateRef.current;
      exprState.leftEyebrowOffset += (targetExpr.leftEyebrowOffset - exprState.leftEyebrowOffset) * smoothingRate;
      exprState.rightEyebrowOffset += (targetExpr.rightEyebrowOffset - exprState.rightEyebrowOffset) * smoothingRate;
      exprState.leftEyebrowRotation += (targetExpr.leftEyebrowRotation - exprState.leftEyebrowRotation) * smoothingRate;
      exprState.rightEyebrowRotation += (targetExpr.rightEyebrowRotation - exprState.rightEyebrowRotation) * smoothingRate;
      exprState.eyeHeightModifier += (targetExpr.eyeHeightModifier - exprState.eyeHeightModifier) * smoothingRate;

      // 5. Draw Eyebrows (Dynamic based on expression)
      const baseEyebrowOffset = isListening ? -3 : 0; // Slight raise when listening
      
      // Left eyebrow with rotation
      if (leftEyebrowRef.current && leftEyebrowRef.current.complete) {
        const ebX = FACE_CONFIG.leftEyeX - 30;
        const ebY = FACE_CONFIG.eyeY - 32 + baseEyebrowOffset + exprState.leftEyebrowOffset;
        const ebWidth = 55;
        const ebHeight = 20;
        
        ctx.save();
        // Rotate around the center of the eyebrow
        ctx.translate(ebX + ebWidth / 2, ebY + ebHeight / 2);
        ctx.rotate((exprState.leftEyebrowRotation * Math.PI) / 180);
        ctx.drawImage(leftEyebrowRef.current, -ebWidth / 2, -ebHeight / 2, ebWidth, ebHeight);
        ctx.restore();
      }
      
      // Right eyebrow with rotation
      if (rightEyebrowRef.current && rightEyebrowRef.current.complete) {
        const ebX = FACE_CONFIG.rightEyeX - 26;
        const ebY = FACE_CONFIG.eyeY - 32 + baseEyebrowOffset + exprState.rightEyebrowOffset;
        const ebWidth = 55;
        const ebHeight = 20;
        
        ctx.save();
        // Rotate around the center of the eyebrow
        ctx.translate(ebX + ebWidth / 2, ebY + ebHeight / 2);
        ctx.rotate((exprState.rightEyebrowRotation * Math.PI) / 180);
        ctx.drawImage(rightEyebrowRef.current, -ebWidth / 2, -ebHeight / 2, ebWidth, ebHeight);
        ctx.restore();
      }

      // 6. Draw Eyes with expression-based height modifier
      const expressionEyeHeight = FACE_CONFIG.eyeHeight * exprState.eyeHeightModifier;
      const currentEyeHeight = Math.max(2, expressionEyeHeight * blinkState);
      drawEye(FACE_CONFIG.leftEyeX, FACE_CONFIG.eyeY, FACE_CONFIG.eyeWidth, currentEyeHeight);
      drawEye(FACE_CONFIG.rightEyeX, FACE_CONFIG.eyeY, FACE_CONFIG.eyeWidth, currentEyeHeight);

      // 6. Draw Mouth - Blends between wide lips and round "O" shape
      const mouthX = FACE_CONFIG.mouthX;
      const mouthY = FACE_CONFIG.mouthY;
      const baseMouthW = FACE_CONFIG.mouthWidth;
      
      // Calculate dimensions for both shapes and blend based on roundness
      const maxLipSeparation = FACE_CONFIG.maxMouthHeight / 2;
      
      // Wide mouth shape (for "ah", "ee" sounds)
      const wideWidth = baseMouthW;
      const wideHeight = mouthOpenness * maxLipSeparation;
      
      // Round "O" shape (for "oo", "oh" sounds) - narrower, taller, circular
      const roundWidth = baseMouthW * 0.45; // Much narrower
      const roundHeight = mouthOpenness * maxLipSeparation * 1.3; // Taller
      
      // Blend between wide and round based on mouthRoundness
      const currentWidth = wideWidth + (roundWidth - wideWidth) * mouthRoundness;
      const currentHeight = wideHeight + (roundHeight - wideHeight) * mouthRoundness;
      
      // Corner positions for wide shape
      const wideLeftX = mouthX - wideWidth / 2;
      const wideRightX = mouthX + wideWidth / 2;
      
      // Lip opening ratio: top lip moves less (attached to skull), bottom lip moves more (jaw)
      const topLipRatio = 0.3;    // Top lip gets 30% of the opening
      const bottomLipRatio = 0.7; // Bottom lip gets 70% of the opening (jaw drop)
      
      if (mouthOpenness < 0.02) {
        // Fully closed - just a curved line at mouthY with lip color
        const lipColor = '#e59782';
        ctx.beginPath();
        ctx.moveTo(wideLeftX, mouthY);
        ctx.quadraticCurveTo(mouthX, mouthY + 3, wideRightX, mouthY);
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.strokeStyle = lipColor;
        ctx.stroke();
        
        // Add subtle highlight above the closed lip line
        ctx.beginPath();
        ctx.moveTo(wideLeftX + 10, mouthY - 1);
        ctx.quadraticCurveTo(mouthX, mouthY + 1, wideRightX - 10, mouthY - 1);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 200, 180, 0.35)';
        ctx.stroke();
      } else {
        // Calculate top and bottom lip positions from the closed line (mouthY)
        const topLipY = mouthY - (currentHeight * topLipRatio);
        const bottomLipY = mouthY + (currentHeight * bottomLipRatio);
        
        ctx.beginPath();
        
        if (mouthRoundness > 0.3) {
          // Use ellipse for rounder "O" shapes
          // Center the ellipse between top and bottom lip positions
          const ellipseCenterY = (topLipY + bottomLipY) / 2;
          const ellipseW = currentWidth / 2;
          const ellipseH = (bottomLipY - topLipY) / 2;
          
          ctx.ellipse(mouthX, ellipseCenterY, ellipseW, ellipseH, 0, 0, Math.PI * 2);
        } else {
          // Use bezier lips for wider shapes - opens from the corners
          const cornerBlend = mouthRoundness / 0.3; // 0 to 1 within this range
          
          // Corner positions - start at wide corners, blend toward center for roundness
          const leftX = wideLeftX + (mouthX - currentWidth/2 - wideLeftX) * cornerBlend;
          const rightX = wideRightX + (mouthX + currentWidth/2 - wideRightX) * cornerBlend;
          
          // Start at left corner (on the original mouth line)
          ctx.moveTo(leftX, mouthY);
          
          // Top lip - curves up from corners, with control points creating smooth arc
          ctx.bezierCurveTo(
            leftX + (rightX - leftX) * 0.15, topLipY,   // CP1 - curve up from left
            rightX - (rightX - leftX) * 0.15, topLipY,  // CP2 - curve down to right
            rightX, mouthY                               // End at right corner
          );
          
          // Bottom lip - curves down from corners (jaw drop)
          ctx.bezierCurveTo(
            rightX - (rightX - leftX) * 0.15, bottomLipY,  // CP1 - curve down from right
            leftX + (rightX - leftX) * 0.15, bottomLipY,   // CP2 - curve up to left
            leftX, mouthY                                   // Back to left corner
          );
        }
        
        ctx.closePath();
        
        // Save for clipping
        ctx.save();
        ctx.clip();
        
        // Dark mouth interior with gradient
        const mouthCenterY = (topLipY + bottomLipY) / 2;
        const mouthOpeningHeight = bottomLipY - topLipY;
        const gradient = ctx.createRadialGradient(
          mouthX, mouthCenterY + mouthOpeningHeight * 0.5, 0,
          mouthX, mouthCenterY, mouthOpeningHeight + 10
        );
        gradient.addColorStop(0, '#100');
        gradient.addColorStop(0.6, '#300');
        gradient.addColorStop(1, '#500');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Tongue - large semi-circle at bottom, only top curve visible
        // Positioned relative to bottom lip so it's always partially hidden
        // Draw tongue BEFORE teeth so teeth appear in front
        if (mouthOpenness > 0.15) {
          const tongueVisibility = Math.min(1, (mouthOpenness - 0.15) / 0.25) * (1 - mouthRoundness * 0.6);
          
          if (tongueVisibility > 0) {
            // Large tongue ellipse - center positioned below the bottom lip
            // Only the top crest will be visible due to clipping
            const tongueWidth = currentWidth * 0.7;
            const tongueHeight = mouthOpeningHeight * 0.9;
            
            // Position center below bottom lip so only top arc shows
            const tongueRise = mouthOpenness * mouthOpeningHeight * 0.2;
            const tongueCenterY = bottomLipY + tongueHeight * 0.45 - tongueRise;
            
            ctx.beginPath();
            ctx.ellipse(
              mouthX,
              tongueCenterY,
              tongueWidth,
              tongueHeight,
              0, 0, Math.PI * 2
            );
            
            // Tongue gradient for depth
            const tongueGradient = ctx.createRadialGradient(
              mouthX, tongueCenterY - tongueHeight * 0.5, 0,
              mouthX, tongueCenterY, tongueHeight
            );
            tongueGradient.addColorStop(0, `rgba(200, 80, 80, ${tongueVisibility})`);
            tongueGradient.addColorStop(0.5, `rgba(170, 50, 50, ${tongueVisibility})`);
            tongueGradient.addColorStop(1, `rgba(140, 40, 40, ${tongueVisibility})`);
            ctx.fillStyle = tongueGradient;
            ctx.fill();
            
            // Subtle center line on tongue
            if (tongueVisibility > 0.5) {
              ctx.beginPath();
              ctx.moveTo(mouthX, tongueCenterY - tongueHeight + 5);
              ctx.lineTo(mouthX, tongueCenterY - tongueHeight * 0.6);
              ctx.lineWidth = 2;
              ctx.strokeStyle = `rgba(120, 30, 30, ${(tongueVisibility - 0.5) * 0.4})`;
              ctx.stroke();
            }
          }
        }
        
        // Teeth - anchored to the top lip position
        // Less visible during "O" sounds (lips cover them more)
        // Draw teeth AFTER tongue so they appear in front
        const teethVisibility = 1 - (mouthRoundness * 0.8);
        if (mouthOpenness > 0.08 && teethVisibility > 0.15) {
          const teethOpacity = Math.min(1, (mouthOpenness - 0.08) / 0.15) * teethVisibility;
          
          // Teeth extend from top lip down, covering ~45% of mouth opening
          const teethHeight = Math.max(8, mouthOpeningHeight * 0.45);
          const teethWidth = currentWidth * 1.2;
          const teethY = topLipY - 5;  // Offset teeth slightly higher
          
          ctx.fillStyle = `rgba(245, 245, 245, ${teethOpacity})`;
          ctx.fillRect(
            mouthX - teethWidth / 2,
            teethY,  // Start slightly above top lip
            teethWidth,
            teethHeight
          );
          
          // Add subtle tooth separation lines for detail
          if (teethOpacity > 0.5 && teethHeight > 6) {
            ctx.strokeStyle = `rgba(200, 200, 200, ${(teethOpacity - 0.5) * 0.6})`;
            ctx.lineWidth = 1;
            const toothCount = 6;
            const toothWidth = teethWidth / toothCount;
            for (let i = 1; i < toothCount; i++) {
              const lineX = mouthX - teethWidth / 2 + i * toothWidth;
              ctx.beginPath();
              ctx.moveTo(lineX, teethY + 2);
              ctx.lineTo(lineX, teethY + teethHeight - 2);
              ctx.stroke();
            }
          }
        }
        
        ctx.restore();
        
        // Draw lips around the mouth edges
        const lipColor = '#e59782';
        const lipThickness = 1 + mouthOpenness * 2; // Slightly thicker when mouth is more open
        
        ctx.beginPath();
        
        if (mouthRoundness > 0.3) {
          // Ellipse lips for "O" shapes
          const ellipseCenterY = (topLipY + bottomLipY) / 2;
          const ellipseW = currentWidth / 2;
          const ellipseH = (bottomLipY - topLipY) / 2;
          
          // Outer lip (slightly larger than mouth opening)
          ctx.ellipse(mouthX, ellipseCenterY, ellipseW + lipThickness/2, ellipseH + lipThickness/2, 0, 0, Math.PI * 2);
        } else {
          // Bezier lips for wider shapes
          const cornerBlend = mouthRoundness / 0.3;
          const leftX = wideLeftX + (mouthX - currentWidth/2 - wideLeftX) * cornerBlend;
          const rightX = wideRightX + (mouthX + currentWidth/2 - wideRightX) * cornerBlend;
          
          // Upper lip
          ctx.moveTo(leftX, mouthY);
          ctx.bezierCurveTo(
            leftX + (rightX - leftX) * 0.15, topLipY,
            rightX - (rightX - leftX) * 0.15, topLipY,
            rightX, mouthY
          );
          
          // Lower lip
          ctx.bezierCurveTo(
            rightX - (rightX - leftX) * 0.15, bottomLipY,
            leftX + (rightX - leftX) * 0.15, bottomLipY,
            leftX, mouthY
          );
        }
        
        ctx.closePath();
        ctx.strokeStyle = lipColor;
        ctx.lineWidth = lipThickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        
        // Add subtle lip highlight on top lip (catching light)
        ctx.beginPath();
        if (mouthRoundness > 0.3) {
          const ellipseCenterY = (topLipY + bottomLipY) / 2;
          const ellipseW = currentWidth / 2;
          const ellipseH = (bottomLipY - topLipY) / 2;
          ctx.ellipse(mouthX, ellipseCenterY, ellipseW, ellipseH, 0, Math.PI * 1.1, Math.PI * 1.9);
        } else {
          const cornerBlend = mouthRoundness / 0.3;
          const leftX = wideLeftX + (mouthX - currentWidth/2 - wideLeftX) * cornerBlend;
          const rightX = wideRightX + (mouthX + currentWidth/2 - wideRightX) * cornerBlend;
          
          // Just the top lip arc for highlight
          ctx.moveTo(leftX + (rightX - leftX) * 0.2, mouthY - 2);
          ctx.quadraticCurveTo(
            mouthX, topLipY - 2,
            rightX - (rightX - leftX) * 0.2, mouthY - 2
          );
        }
        ctx.strokeStyle = 'rgba(255, 200, 180, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Add bottom lip shadow for depth
        ctx.beginPath();
        if (mouthRoundness > 0.3) {
          const ellipseCenterY = (topLipY + bottomLipY) / 2;
          const ellipseW = currentWidth / 2;
          const ellipseH = (bottomLipY - topLipY) / 2;
          ctx.ellipse(mouthX, ellipseCenterY, ellipseW, ellipseH, 0, Math.PI * 0.1, Math.PI * 0.9);
        } else {
          const cornerBlend = mouthRoundness / 0.3;
          const leftX = wideLeftX + (mouthX - currentWidth/2 - wideLeftX) * cornerBlend;
          const rightX = wideRightX + (mouthX + currentWidth/2 - wideRightX) * cornerBlend;
          
          // Just the bottom lip arc for shadow
          ctx.moveTo(leftX + (rightX - leftX) * 0.2, mouthY + 2);
          ctx.quadraticCurveTo(
            mouthX, bottomLipY + 3,
            rightX - (rightX - leftX) * 0.2, mouthY + 2
          );
        }
        ctx.strokeStyle = 'rgba(150, 80, 70, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [analyser, isListening, expression]);
  
  return (
    <div ref={containerRef} className={`relative overflow-hidden rounded-2xl shadow-2xl bg-gray-800 ${className}`} style={{ width: 500, height: 500 }}>
      <canvas 
        ref={bgCanvasRef}
        width={500}
        height={500}
        className="absolute top-0 left-0 w-full h-full z-0"
      />
      <img 
        src="/images/brad.png" 
        alt="Avatar Base" 
        className="absolute top-0 left-0 w-full h-full object-cover z-10"
      />
      {/* Static mouth image - shown when not connected to Gemini */}
      <img 
        src="/images/mouth.png" 
        alt="Mouth" 
        className={`absolute z-[25] transition-opacity duration-300 ${isListening ? 'opacity-0' : 'opacity-100'}`}
        style={{ 
          left: FACE_CONFIG.mouthX - 35, 
          top: FACE_CONFIG.mouthY - 7,
          width: 70,
          height: 25
        }}
      />
      <canvas 
        ref={canvasRef} 
        width={500} 
        height={500} 
        className="absolute top-0 left-0 w-full h-full z-20"
      />
    </div>
  );
};

