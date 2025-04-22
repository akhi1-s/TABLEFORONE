/// <reference types="vite/client" />

// Extend HTMLMediaElement with playing property
interface HTMLMediaElement {
  playing?: boolean;
}

// Define device orientation event properties
interface DeviceOrientationEvent {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
}

// Extend Window interface with audio context and device orientation event
interface Window {
  AudioContext: typeof AudioContext;
  webkitAudioContext: typeof AudioContext;
  DeviceOrientationEvent: DeviceOrientationEvent;
}
