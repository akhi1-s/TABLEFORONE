import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { gsap } from 'gsap';

// Import animations
import './components/animations.css';

// Type definitions for our scene objects
interface SceneObjects {
  Table?: THREE.Object3D;
  Chair?: THREE.Object3D;
  Glass?: THREE.Object3D;
  floor?: THREE.Object3D;
}

// Extend HTMLMediaElement to include 'playing' property for type safety
declare global {
  interface HTMLMediaElement {
    playing?: boolean;
  }
}

// Audio elements
const audioElements: {
  ambient: HTMLAudioElement;
  pianoStab: HTMLAudioElement;
  chairCreak: HTMLAudioElement;
  whisper: HTMLAudioElement;
  windChime: HTMLAudioElement;
} = {
  ambient: new Audio('/audio/ambient.mp3'),
  pianoStab: new Audio('/audio/piano_stab.mp3'),
  chairCreak: new Audio('/audio/chair_creak.mp3'),
  whisper: new Audio('/audio/whisper.mp3'),
  windChime: new Audio('/audio/wind_chime.mp3'),
};

// Configure audio elements
audioElements.ambient.loop = true;
audioElements.ambient.volume = 0.3;
audioElements.pianoStab.volume = 0.7;
audioElements.chairCreak.volume = 0.4;
audioElements.whisper.volume = 0.5;
audioElements.windChime.volume = 0.4;

// Add playing property to track if audio is playing
for (const audio of Object.values(audioElements)) {
  audio.onplaying = () => {
    audio.playing = true;
  };
  audio.onpause = () => {
    audio.playing = false;
  };
}

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Pitch black background

// Camera setup
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 12); // Positioned higher and further back
camera.lookAt(0, 0.5, 0); // Looking more downward at the table level

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Fix for Three.js v0.175.0
// outputEncoding and sRGBEncoding are deprecated, use outputColorSpace instead
(renderer as any).outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8;

const container = document.getElementById('scene-container');
if (container) {
  container.appendChild(renderer.domElement);
}

// Lighting
const setupLighting = () => {
  // Warm spotlight above the table
  const spotLight = new THREE.SpotLight(0xFFDCA8, 1);
  spotLight.position.set(0, 8, 0);
  spotLight.angle = Math.PI / 6;
  spotLight.penumbra = 0.4;
  spotLight.decay = 2;
  spotLight.distance = 30;
  spotLight.castShadow = true;
  spotLight.shadow.bias = -0.0001;
  spotLight.shadow.mapSize.width = 1024;
  spotLight.shadow.mapSize.height = 1024;
  scene.add(spotLight);

  // Cool rimlight
  const rimLight = new THREE.DirectionalLight(0xA8D1FF, 0.2);
  rimLight.position.set(-4, 2, -5);
  rimLight.castShadow = true;
  scene.add(rimLight);

  // Ambient light (very subtle)
  const ambientLight = new THREE.AmbientLight(0x333333, 0.1);
  scene.add(ambientLight);
};

// Create fog
const fog = new THREE.FogExp2(0x000000, 0.05);
scene.fog = fog;

// Load 3D model
const sceneObjects: SceneObjects = {};
let modelLoaded = false;

// Create a placeholder model if no GLB is provided
const createPlaceholderModel = () => {
  // Create table
  const tableGeometry = new THREE.BoxGeometry(2, 0.1, 1);
  const tableMaterial = new THREE.MeshStandardMaterial({
    color: 0x5c3a21,
    roughness: 0.7,
    metalness: 0.1
  });
  const table = new THREE.Mesh(tableGeometry, tableMaterial);
  table.position.set(0, 0.8, 0);
  table.castShadow = true;
  table.receiveShadow = true;
  table.name = 'Table';
  scene.add(table);
  sceneObjects.Table = table;

  // Create chair
  const chairGroup = new THREE.Group();
  chairGroup.name = 'Chair';

  // Chair seat
  const chairSeatGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.6);
  const chairSeatMaterial = new THREE.MeshStandardMaterial({
    color: 0x3c2a12,
    roughness: 0.8,
    metalness: 0.05
  });
  const chairSeat = new THREE.Mesh(chairSeatGeometry, chairSeatMaterial);
  chairSeat.position.set(0, 0.45, -0.9);
  chairSeat.castShadow = true;
  chairSeat.receiveShadow = true;
  chairGroup.add(chairSeat);

  // Chair back
  const chairBackGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.1);
  const chairBack = new THREE.Mesh(chairBackGeometry, chairSeatMaterial);
  chairBack.position.set(0, 0.8, -1.15);
  chairBack.castShadow = true;
  chairBack.receiveShadow = true;
  chairGroup.add(chairBack);

  // Chair legs
  const chairLegGeometry = new THREE.BoxGeometry(0.05, 0.45, 0.05);
  const chairLegMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c1a08,
    roughness: 0.8,
    metalness: 0.1
  });

  const positions = [
    [0.25, 0.225, -0.7],
    [-0.25, 0.225, -0.7],
    [0.25, 0.225, -1.1],
    [-0.25, 0.225, -1.1]
  ];

  for (const pos of positions) {
    const leg = new THREE.Mesh(chairLegGeometry, chairLegMaterial);
    leg.position.set(pos[0], pos[1], pos[2]);
    leg.castShadow = true;
    leg.receiveShadow = true;
    chairGroup.add(leg);
  }

  scene.add(chairGroup);
  sceneObjects.Chair = chairGroup;

  // Create glass
  const glassGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 16);
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0,
    metalness: 0,
    transmission: 0.9,
    ior: 1.5,
    transparent: true,
    opacity: 0.5
  });
  const glass = new THREE.Mesh(glassGeometry, glassMaterial);
  glass.position.set(0.5, 0.95, 0);
  glass.castShadow = true;
  glass.receiveShadow = true;
  glass.name = 'Glass';
  scene.add(glass);
  sceneObjects.Glass = glass;

  // Create floor
  const floorGeometry = new THREE.PlaneGeometry(20, 20);
  const floorMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x000000,
    metalness: 0.2,
    roughness: 0.1,
    envMapIntensity: 0.8,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    reflectivity: 1.0
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  floor.name = 'floor';
  scene.add(floor);
  sceneObjects.floor = floor;

  // Setup after model is created
  setupLighting();
  startCameraAnimation();

  // Hide loading screen
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
  }

  modelLoaded = true;

  // Allow interaction now that model is loaded
  document.body.classList.add('model-loaded');
};

// Generate a placeholder model after a timeout if no model is loaded
const placeholderTimer = setTimeout(() => {
  if (!modelLoaded) {
    console.log('Creating placeholder model...');
    // First try to load the user-provided model from the models directory
    loadModel('/models/TableForOne.glb');
  }
}, 2000);  // Wait 2 seconds before loading model

// Update load model function to handle errors better
const loadModel = (file: File | string) => {
  // Clear the placeholder timer
  clearTimeout(placeholderTimer);

  const loadingScreen = document.getElementById('loadingScreen');
  const loadingText = document.querySelector('.loading-text') as HTMLElement;
  const dropMessage = document.getElementById('dropMessage');

  if (dropMessage) {
    dropMessage.style.display = 'none';
  }

  if (loadingText) {
    loadingText.textContent = 'Loading 3D model...';
  }

  const loader = new GLTFLoader();

  // Set up Draco loader for compressed models
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
  loader.setDRACOLoader(dracoLoader);

  const loadGLTF = (url: string) => {
    loader.load(
      url,
      (gltf) => {
        gltf.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // Apply materials based on object name
            if (child.name.toLowerCase() === 'floor' || child.parent?.name.toLowerCase() === 'floor') {
              // Make floor reflective black glass
              child.material = new THREE.MeshPhysicalMaterial({
                color: 0x000000,
                metalness: 0.2,
                roughness: 0.1,
                envMapIntensity: 0.8,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1,
                reflectivity: 1.0
              });

              // Store floor object
              sceneObjects.floor = child;
            }
          }
        });

        // Store named objects
        gltf.scene.traverse((child) => {
          if (child.name === 'Table' || child.name === 'table') {
            sceneObjects.Table = child;
          } else if (child.name === 'Chair' || child.name === 'chair') {
            sceneObjects.Chair = child;
          } else if (child.name === 'Glass' || child.name === 'glass') {
            sceneObjects.Glass = child;
          }
        });

        // Scale and position the model
        gltf.scene.scale.set(1, 1, 1);
        gltf.scene.position.set(0, 0, 0);

        scene.add(gltf.scene);

        // Setup after model is loaded
        setupLighting();
        startCameraAnimation();

        // Hide loading screen
        if (loadingScreen) {
          loadingScreen.style.display = 'none';
        }

        modelLoaded = true;

        // Allow interaction now that model is loaded
        document.body.classList.add('model-loaded');
      },
      (xhr) => {
        const progress = Math.floor((xhr.loaded / xhr.total) * 100);
        if (loadingText) {
          loadingText.textContent = `Loading: ${progress}%`;
        }
      },
      (error) => {
        console.error('Error loading model:', error);
        if (loadingText) {
          loadingText.textContent = 'Error loading model. Creating placeholder...';
        }

        // If the model fails to load and we're not already using the placeholder, create one
        if (!modelLoaded && typeof file === 'string' && file.includes('TableForOne.glb')) {
          console.log('Failed to load model, creating placeholder...');
          // Create a small delay before showing the placeholder to avoid flickering
          setTimeout(() => {
            createPlaceholderModel();
          }, 500);
        }
      }
    );
  };

  if (typeof file === 'string') {
    loadGLTF(file);
  } else {
    const url = URL.createObjectURL(file);
    loadGLTF(url);
  }
};

// Setup file dropping
const setupFileDrop = () => {
  const dropArea = document.getElementById('loadingScreen');
  const dropMessage = document.getElementById('dropMessage');

  if (!dropArea || !dropMessage) return;

  for (const eventName of ['dragenter', 'dragover', 'dragleave', 'drop']) {
    dropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  }

  for (const eventName of ['dragenter', 'dragover']) {
    dropArea.addEventListener(eventName, () => {
      dropArea.classList.add('highlight');
      dropMessage.classList.add('dragover');
    });
  }

  for (const eventName of ['dragleave', 'drop']) {
    dropArea.addEventListener(eventName, () => {
      dropArea.classList.remove('highlight');
      dropMessage.classList.remove('dragover');
    });
  }

  dropArea.addEventListener('drop', (e) => {
    const dt = (e as DragEvent).dataTransfer;
    if (dt?.files.length) {
      const file = dt.files[0];
      if (file.name.toLowerCase().endsWith('.glb')) {
        loadModel(file);
      } else {
        const loadingText = document.querySelector('.loading-text') as HTMLElement;
        if (loadingText) {
          loadingText.textContent = 'Please drop a .glb file';

          // Flash the message in red
          loadingText.style.color = '#ff0000';
          setTimeout(() => {
            loadingText.style.color = 'rgba(255, 255, 255, 0.6)';
          }, 1500);
        }
      }
    }
  });
};

// Camera animations
let cameraIdle = false;

const startCameraAnimation = () => {
  // Initial camera dolly animation - adjust to be more horizontal and further back
  gsap.to(camera.position, {
    x: 0,
    y: 3.5, // Higher position
    z: 8, // Further back
    duration: 8,
    ease: 'power1.inOut',
    onComplete: () => {
      cameraIdle = true;

      // Show the initial UI elements
      setTimeout(() => {
        showFirstQuote();
      }, 1000);
    }
  });

  // Also animate camera target point
  gsap.to(new THREE.Vector3(0, 0.5, 0), {
    y: 1.0, // Look downward at table
    duration: 8,
    ease: 'power1.inOut',
    onUpdate: function() {
      camera.lookAt(this.targets()[0].x, this.targets()[0].y, this.targets()[0].z);
    }
  });
};

// Random subtle camera movement during idle
const updateIdleCamera = () => {
  if (!cameraIdle) return;

  const time = Date.now() * 0.0005;
  camera.position.x = Math.sin(time) * 0.3;
  camera.position.y = 3.5 + Math.sin(time * 0.7) * 0.1; // Higher base position
  camera.lookAt(0, 1.0, 0); // Look more downward at the table
};

// UI animations and interactions
const showFirstQuote = () => {
  const quoteContainer = document.getElementById('quoteContainer');
  const primaryQuote = document.getElementById('primaryQuote');
  const secondaryQuote = document.getElementById('secondaryQuote');

  if (quoteContainer && primaryQuote) {
    // First quote: "You weren't invited."
    primaryQuote.textContent = 'You weren\'t invited.';
    // Remove glitch class - no shake in main quotes
    primaryQuote.classList.remove('glitch-active');

    // Fade in (1s)
    gsap.to(quoteContainer, {
      opacity: 1,
      duration: 1,
      onComplete: () => {
        // Hold (2s)
        setTimeout(() => {
          // Fade out (1s)
          gsap.to(quoteContainer, {
            opacity: 0,
            duration: 1,
            onComplete: () => {
              if (secondaryQuote) {
                // Second quote: "But you still came looking."
                primaryQuote.textContent = '';
                secondaryQuote.textContent = 'But you still came looking.';
                // Remove glitch class - no shake in main quotes
                secondaryQuote.classList.remove('glitch-active');

                // Fade in (1s)
                gsap.to(quoteContainer, {
                  opacity: 1,
                  duration: 1,
                  onComplete: () => {
                    // Hold (2s)
                    setTimeout(() => {
                      // Fade out (1s)
                      gsap.to(quoteContainer, {
                        opacity: 0,
                        duration: 1,
                        onComplete: () => {
                          // After quotes finish, show floating quote
                          setTimeout(() => {
                            showFloatingQuote();

                            // Then show button after floating quote appears
                            setTimeout(() => {
                              showButtonContainer();
                            }, 4000);
                          }, 2000);
                        }
                      });
                    }, 2000);
                  }
                });
              }
            }
          });
        }, 2000);
      }
    });
  }
};

const showButtonContainer = () => {
  const buttonContainer = document.getElementById('buttonContainer');
  if (buttonContainer) {
    // Create the "Take a Seat" button
    buttonContainer.innerHTML = '';
    const seatButton = document.createElement('button');
    seatButton.className = 'action-button';
    seatButton.id = 'seatButton';
    seatButton.textContent = 'Take a Seat';
    buttonContainer.appendChild(seatButton);

    // Display the button container
    gsap.to(buttonContainer, {
      opacity: 1,
      duration: 1
    });

    // Add event listener to the newly created button
    seatButton.addEventListener('click', handleSeatButtonClick);
  }
};

// Fix Audio Context and play functions
// Helper function to safely play audio with fallbacks
const safePlayAudio = (audio: HTMLAudioElement) => {
  try {
    // Reset the audio position
    audio.currentTime = 0;

    // Create a user gesture listener if needed
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.log('Audio play failed, user gesture needed:', error);

        // Add a one-time click handler to play on user interaction
        const playOnUserGesture = () => {
          audio.play().catch(e => console.error('Still failed to play audio:', e));
          document.removeEventListener('click', playOnUserGesture);
          document.removeEventListener('touchstart', playOnUserGesture);
        };

        document.addEventListener('click', playOnUserGesture, { once: true });
        document.addEventListener('touchstart', playOnUserGesture, { once: true });
      });
    }
  } catch (error) {
    console.error('Error playing audio:', error);
  }
};

// Show floating quote with wind chime sound
const showFloatingQuote = () => {
  const floatingQuote = document.getElementById('floatingQuote');

  if (floatingQuote && cameraIdle) {
    // Position the floating quote
    floatingQuote.style.top = '40%';
    floatingQuote.style.left = '0';
    floatingQuote.style.width = '100%';
    floatingQuote.style.fontSize = '1.5rem';
    floatingQuote.style.opacity = '0';
    floatingQuote.classList.add('floating-text');

    // Play wind chime sound using safe play method
    safePlayAudio(audioElements.windChime);

    // First fade in
    gsap.to(floatingQuote, {
      opacity: 0.4, // 40% opacity as specified
      duration: 2,
      ease: 'power1.inOut',
      onComplete: () => {
        // Then float upward and fade out like mist
        gsap.to(floatingQuote, {
          opacity: 0,
          y: -100,
          duration: 8,
          ease: 'power1.out'
        });
      }
    });
  }
};

// Handle button clicks
let clickCount = 0;

const handleSeatButtonClick = () => {
  clickCount++;

  const buttonContainer = document.getElementById('buttonContainer');
  const glitchText = document.getElementById('glitchText');

  if (buttonContainer) {
    // Hide the button container
    gsap.to(buttonContainer, {
      opacity: 0,
      duration: 0.5
    });
  }

  if (glitchText) {
    // Display rejection message with blood red color (#A60000)
    glitchText.textContent = 'Private list. Try again next lifetime.';
    glitchText.style.color = '#A60000';
    glitchText.classList.add('glitch-active');

    // Fade in text
    gsap.to(glitchText, {
      opacity: 1,
      duration: 0.3
    });

    // Play piano stab sound using safe play method
    safePlayAudio(audioElements.pianoStab);

    // Show text for 4 seconds, then fade out
    setTimeout(() => {
      glitchText.classList.remove('glitch-active');

      // Fade out text
      gsap.to(glitchText, {
        opacity: 0,
        duration: 0.5
      });

      // After 2s, show the "Request Access" button
      if (clickCount === 1) {
        setTimeout(() => {
          createRequestAccessButton();
        }, 2000);
      }
    }, 4000);
  }

  // Easter egg for triple-click
  if (clickCount === 3) {
    const glitchText = document.getElementById('glitchText');
    if (glitchText) {
      glitchText.textContent = 'Persistent, aren\'t you?';
      glitchText.style.color = '#FFD700'; // Golden color
      glitchText.classList.add('glitch-active');

      // Fade in text
      gsap.to(glitchText, {
        opacity: 1,
        duration: 0.3
      });

      // Shake the screen
      const sceneContainer = document.getElementById('scene-container');
      if (sceneContainer) {
        sceneContainer.style.animation = 'shake 0.5s';
        setTimeout(() => {
          sceneContainer.style.animation = '';
        }, 500);
      }

      // Show text for 2 seconds
      setTimeout(() => {
        glitchText.classList.remove('glitch-active');

        // Fade out text
        gsap.to(glitchText, {
          opacity: 0,
          duration: 0.5
        });
      }, 2000);
    }
  }
};

const createRequestAccessButton = () => {
  const buttonContainer = document.getElementById('buttonContainer');

  if (buttonContainer) {
    // Remove old button
    buttonContainer.innerHTML = '';

    // Create new button
    const requestButton = document.createElement('button');
    requestButton.className = 'action-button pulsing-button';
    requestButton.id = 'requestButton';
    requestButton.textContent = 'Request Access';

    // Add hover effect with whisper sound
    requestButton.addEventListener('mouseenter', () => {
      // Play whisper sound using safe play method
      safePlayAudio(audioElements.whisper);

      // Add heartbeat animation on hover
      requestButton.classList.add('heartbeat');
    });

    requestButton.addEventListener('mouseleave', () => {
      requestButton.classList.remove('heartbeat');
    });

    // Add click event to redirect to Instagram
    requestButton.addEventListener('click', () => {
      window.location.href = 'https://instagram.com/akhi1_s';
    });

    buttonContainer.appendChild(requestButton);

    // Show the button with fade-in
    gsap.to(buttonContainer, {
      opacity: 1,
      duration: 1
    });
  }
};

// This function is kept for compatibility but listeners are now added directly when creating buttons
const setupButtonListeners = () => {
  // No-op: listeners are handled inline with button creation
};

// Mobile device orientation handling
const handleDeviceOrientation = () => {
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (event) => {
      if (event.gamma && modelLoaded) {
        // event.gamma is the left-to-right tilt in degrees
        const tiltAngle = event.gamma;

        // Play chair creak sound when tilting past certain threshold
        if (Math.abs(tiltAngle) > 20) {
          try {
            audioElements.chairCreak.currentTime = 0;
            audioElements.chairCreak.play().catch(e => console.error('Audio play error:', e));

            // Pan audio based on tilt direction if Web Audio API is available
            try {
              // Use proper class reference for AudioContext from our type definition
              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
              const source = audioContext.createMediaElementSource(audioElements.chairCreak);
              const panner = audioContext.createStereoPanner();

              // Pan left or right based on tilt
              panner.pan.value = Math.max(-1, Math.min(1, tiltAngle / 45));

              source.connect(panner);
              panner.connect(audioContext.destination);
            } catch (audioApiError) {
              console.error('Error creating audio context:', audioApiError);
            }
          } catch (error) {
            console.error('Error playing audio:', error);
          }
        }

        // Also move camera slightly based on device orientation
        if (cameraIdle) {
          camera.position.x = tiltAngle * 0.01;
          camera.lookAt(0, 2, 0);
        }
      }
    });
  }
};

// Start ambient sound after user interaction
const setupAudioStart = () => {
  document.addEventListener('click', () => {
    if (!audioElements.ambient.playing) {
      safePlayAudio(audioElements.ambient);
    }
  });

  // Also listen for touchstart for mobile devices
  document.addEventListener('touchstart', () => {
    if (!audioElements.ambient.playing) {
      safePlayAudio(audioElements.ambient);
    }
  });
};

// Window resize handling
const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

window.addEventListener('resize', onWindowResize);

// Initialize
const init = () => {
  setupFileDrop();
  setupButtonListeners();
  setupAudioStart();
  handleDeviceOrientation();

  // Try to load the model directly rather than waiting for file upload
  loadModel('/models/TableForOne.glb');

  // Animation loop
  const animate = () => {
    requestAnimationFrame(animate);

    updateIdleCamera();

    renderer.render(scene, camera);
  };

  animate();
};

init();
