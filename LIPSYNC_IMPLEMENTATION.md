# Audio-Reactive Lip Sync Implementation

This document explains how to create a lip-synced animated mouth that moves in response to audio playback using the Web Audio API.

## Overview

The lip sync system works by:
1. Routing audio through a Web Audio API `AnalyserNode`
2. Reading frequency data in real-time during animation frames
3. Converting volume levels to mouth openness values
4. Rendering the mouth shape on a canvas overlay

---

## Step 1: Audio Pipeline Setup

Create an audio context with an `AnalyserNode` in the signal chain:

```typescript
const audioContextRef = useRef<AudioContext | null>(null);
const analyserRef = useRef<AnalyserNode | null>(null);
const gainNodeRef = useRef<GainNode | null>(null);

const ensureAudioContext = () => {
  if (!audioContextRef.current) {
    const ctx = new AudioContext({ sampleRate: 24000 });
    audioContextRef.current = ctx;
    
    // Create gain node for volume control
    const gainNode = ctx.createGain();
    gainNode.gain.value = 1.0;
    gainNode.connect(ctx.destination);
    gainNodeRef.current = gainNode;
    
    // Create analyser node
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;  // Determines frequency resolution
    analyser.connect(gainNode);
    analyserRef.current = analyser;
  }
  return audioContextRef.current;
};
```

**Key Settings:**
- `fftSize = 512` provides 256 frequency bins - enough detail for voice without excessive CPU usage
- The signal chain is: `AudioSource → AnalyserNode → GainNode → Destination`

---

## Step 2: Connect Audio Sources to the Analyser

When playing audio, connect the source to the analyser node:

```typescript
const playAudio = async (audioBuffer: AudioBuffer) => {
  const ctx = ensureAudioContext();
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  
  // Connect through analyser for lip sync
  if (analyserRef.current) {
    source.connect(analyserRef.current);
  }
  
  source.start();
};
```

---

## Step 3: Analyze Audio Volume

In your animation loop, read frequency data and calculate average volume:

```typescript
const analyze = () => {
  if (!analyser || !dataArray) {
    mouthOpenness = 0;  // Close mouth when no audio
    return;
  }
  
  // Get frequency data (values 0-255 per bin)
  analyser.getByteFrequencyData(dataArray);
  
  // Calculate average of lower frequencies (voice range)
  let sum = 0;
  const binCount = dataArray.length / 2;  // Focus on lower half (voice frequencies)
  for (let i = 0; i < binCount; i++) {
    sum += dataArray[i];
  }
  let avg = binCount > 0 ? sum / binCount : 0;
  
  // Apply noise gate - ignore very quiet sounds
  if (avg < 5) avg = 0;
  
  // Normalize to 0-1 range
  // Divisor of 150 works well for speech (adjust based on your audio levels)
  let targetOpenness = Math.min(1, avg / 150);
  
  // Square the value for more natural movement
  // Makes mouth less reactive at low volumes, more dramatic at high
  targetOpenness = targetOpenness * targetOpenness;
  
  // Smooth the transition to prevent jittery movement
  smoothedVolume += (targetOpenness - smoothedVolume) * 0.5;
  mouthOpenness = smoothedVolume;
};
```

**Key Techniques:**

| Technique | Purpose |
|-----------|---------|
| `dataArray.length / 2` | Focus on lower frequencies where voice energy is concentrated |
| Noise gate (`avg < 5`) | Prevents mouth from twitching during silence |
| Squaring (`x * x`) | Creates non-linear response - subtle at low volumes, expressive at high |
| Smoothing (`* 0.5`) | Interpolates between frames to prevent jitter |

---

## Step 4: Render the Mouth

Use the `mouthOpenness` value (0-1) to draw the mouth shape:

```typescript
const drawMouth = (ctx: CanvasRenderingContext2D, config: MouthConfig) => {
  const { mouthX, mouthY, mouthWidth, maxMouthHeight, teethHeight } = config;
  
  // Calculate current mouth height based on openness
  const currentMouthH = 5 + (mouthOpenness * maxMouthHeight);
  
  if (mouthOpenness < 0.1) {
    // Nearly closed - draw a curved line (smile/frown based on mood)
    ctx.beginPath();
    ctx.moveTo(mouthX - mouthWidth/2, mouthY);
    ctx.quadraticCurveTo(
      mouthX,
      mouthY + moodOffset,  // Positive = smile, negative = frown
      mouthX + mouthWidth/2,
      mouthY
    );
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#300';
    ctx.stroke();
  } else {
    // Open mouth - draw ellipse
    ctx.beginPath();
    ctx.ellipse(mouthX, mouthY, mouthWidth/2, currentMouthH/2, 0, 0, Math.PI * 2);
    
    // Fill with dark color (inside of mouth)
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#600';
    ctx.fill();
    
    // Optional: Draw teeth at top of mouth
    if (mouthOpenness > 0.2) {
      ctx.fillStyle = '#eee';
      ctx.fillRect(
        mouthX - mouthWidth * 0.6,
        mouthY - currentMouthH/2 + 2,
        mouthWidth * 1.2,
        teethHeight
      );
    }
    ctx.restore();
    
    // Outline
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#300';
    ctx.stroke();
  }
};
```

---

## Step 5: Animation Loop

Combine analysis and rendering in a `requestAnimationFrame` loop:

```typescript
useEffect(() => {
  const canvas = canvasRef.current;
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;
  
  let mouthOpenness = 0;
  let smoothedVolume = 0;
  let dataArray: Uint8Array | null = null;
  
  // Create data array for frequency analysis
  if (analyser) {
    dataArray = new Uint8Array(analyser.frequencyBinCount);
  }
  
  const animate = () => {
    analyze();      // Update mouthOpenness based on audio
    draw();         // Render face with current mouth state
    animationRef.current = requestAnimationFrame(animate);
  };
  
  animate();
  
  return () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };
}, [analyser]);
```

---

## Configuration Options

Define configurable parameters for different characters:

```typescript
interface MouthConfig {
  mouthX: number;        // Horizontal center position
  mouthY: number;        // Vertical center position
  mouthWidth: number;    // Width when fully open
  maxMouthHeight: number; // Max height when fully open
  teethHeight: number;   // Height of teeth rectangle (0 to hide)
}

// Example configurations
const smallMouth: MouthConfig = {
  mouthX: 250,
  mouthY: 280,
  mouthWidth: 30,
  maxMouthHeight: 15,
  teethHeight: 0
};

const largeMouth: MouthConfig = {
  mouthX: 250,
  mouthY: 340,
  mouthWidth: 60,
  maxMouthHeight: 50,
  teethHeight: 12
};
```

---

## Tuning Tips

### Volume Sensitivity
Adjust the divisor in normalization based on your audio source:
- `avg / 100` - More sensitive (louder audio sources)
- `avg / 150` - Default (speech)
- `avg / 200` - Less sensitive (quiet audio)

### Smoothing Factor
Adjust the interpolation multiplier:
- `* 0.3` - Smoother, slightly delayed
- `* 0.5` - Balanced (recommended)
- `* 0.7` - More responsive, slightly jittery

### Noise Gate
Adjust the minimum threshold:
- `< 3` - More sensitive to quiet sounds
- `< 5` - Default
- `< 10` - Ignores more background noise

---

## Complete Minimal Example

```typescript
import { useEffect, useRef } from 'react';

interface LipSyncProps {
  analyser: AnalyserNode | null;
}

export const LipSyncMouth: React.FC<LipSyncProps> = ({ analyser }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let mouthOpenness = 0;
    let smoothedVolume = 0;
    let dataArray: Uint8Array | null = null;

    if (analyser) {
      dataArray = new Uint8Array(analyser.frequencyBinCount);
    }

    const animate = () => {
      // Analyze
      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        const binCount = dataArray.length / 2;
        for (let i = 0; i < binCount; i++) sum += dataArray[i];
        let avg = binCount > 0 ? sum / binCount : 0;
        if (avg < 5) avg = 0;
        let target = Math.min(1, avg / 150);
        target = target * target;
        smoothedVolume += (target - smoothedVolume) * 0.5;
        mouthOpenness = smoothedVolume;
      } else {
        mouthOpenness = 0;
      }

      // Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mouthH = 5 + mouthOpenness * 40;
      
      ctx.beginPath();
      ctx.ellipse(150, 150, 30, mouthH / 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#600';
      ctx.fill();
      ctx.strokeStyle = '#300';
      ctx.lineWidth = 3;
      ctx.stroke();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [analyser]);

  return <canvas ref={canvasRef} width={300} height={300} />;
};
```

---

## Summary

1. **Create an AnalyserNode** in your Web Audio API chain
2. **Connect audio sources** to the analyser before playback
3. **Read frequency data** each animation frame with `getByteFrequencyData()`
4. **Calculate average volume** from lower frequency bins (voice range)
5. **Apply noise gate and smoothing** for natural movement
6. **Map volume to mouth height** using non-linear curve (squaring)
7. **Render mouth shape** as line (closed) or ellipse (open) based on openness value

