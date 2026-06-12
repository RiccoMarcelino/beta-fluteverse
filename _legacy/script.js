    // ─── ASSET URLS ────────────────────────────────────────────────────────────
    const ASSETS = {
      model: 'https://zccmrecwlvfqsftmsoxa.supabase.co/storage/v1/object/public/Test/gesture_recognizer_final.task',
      flutes: {
        'C#': 'https://zccmrecwlvfqsftmsoxa.supabase.co/storage/v1/object/public/Test/C_Sharp.png',
        'C':  'https://zccmrecwlvfqsftmsoxa.supabase.co/storage/v1/object/public/Test/C.png',
        'D':  'https://zccmrecwlvfqsftmsoxa.supabase.co/storage/v1/object/public/Test/D.png',
        'E':  'https://zccmrecwlvfqsftmsoxa.supabase.co/storage/v1/object/public/Test/E.png',
        'F':  'https://zccmrecwlvfqsftmsoxa.supabase.co/storage/v1/object/public/Test/F.png',
      },
      audio: {
        Sa:  'https://zccmrecwlvfqsftmsoxa.supabase.co/storage/v1/object/public/Test/Sa.wav',
        Re:  'https://zccmrecwlvfqsftmsoxa.supabase.co/storage/v1/object/public/Test/Re.wav',
        Ga:  'https://zccmrecwlvfqsftmsoxa.supabase.co/storage/v1/object/public/Test/Ga.wav',
        Ma:  'https://zccmrecwlvfqsftmsoxa.supabase.co/storage/v1/object/public/Test/Ma.wav',
        Pa:  'https://zccmrecwlvfqsftmsoxa.supabase.co/storage/v1/object/public/Test/Pa.wav',
        Dha: 'https://zccmrecwlvfqsftmsoxa.supabase.co/storage/v1/object/public/Test/Dha.wav',
        Ni:  'https://zccmrecwlvfqsftmsoxa.supabase.co/storage/v1/object/public/Test/Ni.wav',
      }
    };

    // ─── SWARA DATA ────────────────────────────────────────────────────────────
    const SWARA_DATA = {
      Sa:  { note: 'C#4', freq: 277.18 },
      Re:  { note: 'D#4', freq: 311.13 },
      Ga:  { note: 'F4',  freq: 349.23 },
      Ma:  { note: 'F#4', freq: 369.99 },
      Pa:  { note: 'G#4', freq: 415.30 },
      Dha: { note: 'A#4', freq: 466.16 },
      Ni:  { note: 'C5',  freq: 523.25 },
    };

    const CONFIDENCE_THRESHOLD = 0.75;
    const swaras = ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni'];

    // ─── FLUTE CATALOGUE ───────────────────────────────────────────────────────
    const FLUTES = [
      { key: 'C',  name: 'C FLUTE',  root: 'Root: C',       active: false, img: ASSETS.flutes['C']  },
      { key: 'D',  name: 'D FLUTE',  root: 'Root: D',       active: false, img: ASSETS.flutes['D']  },
      { key: 'C#', name: 'C# FLUTE', root: 'Root: C# / Db', active: true,  img: ASSETS.flutes['C#'] },
      { key: 'E',  name: 'E FLUTE',  root: 'Root: E',       active: false, img: ASSETS.flutes['E']  },
      { key: 'F',  name: 'F FLUTE',  root: 'Root: F',       active: false, img: ASSETS.flutes['F']  },
    ];

    // ─── DOM REFS ──────────────────────────────────────────────────────────────
    const loader              = document.getElementById('loader');
    const heroText            = document.getElementById('heroText');
    const grainOverlay        = document.querySelector('.grain');
    const horizontalContainer = document.querySelector('.horizontal-container');
    const horizontalTrack     = document.querySelector('.horizontal-track');
    const toast               = document.getElementById('toast');

    // ─── STATE ─────────────────────────────────────────────────────────────────
    let toastTimer       = null;

    // Parallax
    let mouseX = 0, mouseY = 0, curX = 0, curY = 0;
    // Gesture / audio
    let gestureRecognizer   = null;
    let webcamStream        = null;
    let isRunning           = false;
    let lastTriggeredSwara  = null;
    let lastTriggerTime     = 0;
    let noHandFrames        = 0;
    let lastInferenceTime   = 0;
    let audioCtx            = null;   // created/resumed only on user gesture
    let currentSource       = null;
    // Audio buffers decoded during loading with a temporary context
    const audioBuffers = {};

    // ─── GALAXY — Hero / Landing section ──────────────────────────────────────
    // Vanilla WebGL port of the React Bits Galaxy component.
    const galaxyState = (() => {
      const cfg = {
        focal:              [0.5, 0.5],
        rotation:           [1.0, 0.0],
        starSpeed:          0.5,
        density:            1.5,
        hueShift:           0,
        speed:              1.0,
        mouseInteraction:   true,
        glowIntensity:      0.5,
        saturation:         0.0,
        mouseRepulsion:     true,
        repulsionStrength:  2,
        twinkleIntensity:   0.3,
        rotationSpeed:      0.1,
        autoCenterRepulsion:0,
        transparent:        true,
      };

      let gl = null, program = null, rafId = null;
      let uniLocs = {};
      let container = null;
      let targetMouse = { x: 0.5, y: 0.5 };
      let smoothMouse = { x: 0.5, y: 0.5 };
      let targetActive = 0.0, smoothActive = 0.0;

      const vertSrc = `
        attribute vec2 uv;
        attribute vec2 position;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 0, 1);
        }`;

      const fragSrc = `
        precision highp float;
        uniform float uTime;
        uniform vec3  uResolution;
        uniform vec2  uFocal;
        uniform vec2  uRotation;
        uniform float uStarSpeed;
        uniform float uDensity;
        uniform float uHueShift;
        uniform float uSpeed;
        uniform vec2  uMouse;
        uniform float uGlowIntensity;
        uniform float uSaturation;
        uniform bool  uMouseRepulsion;
        uniform float uTwinkleIntensity;
        uniform float uRotationSpeed;
        uniform float uRepulsionStrength;
        uniform float uMouseActiveFactor;
        uniform float uAutoCenterRepulsion;
        uniform bool  uTransparent;
        uniform vec3  uTintColor;
        varying vec2 vUv;
        #define NUM_LAYER 4.0
        #define STAR_COLOR_CUTOFF 0.2
        #define MAT45 mat2(0.7071,-0.7071,0.7071,0.7071)
        #define PERIOD 3.0

        float Hash21(vec2 p) {
          p = fract(p * vec2(123.34,456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }
        float tri(float x) { return abs(fract(x)*2.0-1.0); }
        float tris(float x) {
          float t = fract(x);
          return 1.0 - smoothstep(0.0,1.0,abs(2.0*t-1.0));
        }
        float trisn(float x) {
          float t = fract(x);
          return 2.0*(1.0-smoothstep(0.0,1.0,abs(2.0*t-1.0)))-1.0;
        }
        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0,2.0/3.0,1.0/3.0,3.0);
          vec3 p = abs(fract(c.xxx+K.xyz)*6.0-K.www);
          return c.z*mix(K.xxx,clamp(p-K.xxx,0.0,1.0),c.y);
        }
        float Star(vec2 uv, float flare) {
          float d = length(uv);
          float m = (0.05*uGlowIntensity)/d;
          float rays = smoothstep(0.0,1.0,1.0-abs(uv.x*uv.y*1000.0));
          m += rays*flare*uGlowIntensity;
          uv *= MAT45;
          rays = smoothstep(0.0,1.0,1.0-abs(uv.x*uv.y*1000.0));
          m += rays*0.3*flare*uGlowIntensity;
          m *= smoothstep(1.0,0.2,d);
          return m;
        }
        vec3 StarLayer(vec2 uv) {
          vec3 col = vec3(0.0);
          vec2 gv = fract(uv)-0.5;
          vec2 id = floor(uv);
          for(int y=-1;y<=1;y++){
            for(int x=-1;x<=1;x++){
              vec2 offset = vec2(float(x),float(y));
              vec2 si = id+vec2(float(x),float(y));
              float seed = Hash21(si);
              float size = fract(seed*345.32);
              float glossLocal = tri(uStarSpeed/(PERIOD*seed+1.0));
              float flareSize = smoothstep(0.9,1.0,size)*glossLocal;
              float red = smoothstep(STAR_COLOR_CUTOFF,1.0,Hash21(si+1.0))+STAR_COLOR_CUTOFF;
              float blu = smoothstep(STAR_COLOR_CUTOFF,1.0,Hash21(si+3.0))+STAR_COLOR_CUTOFF;
              float grn = min(red,blu)*seed;
              vec3 base = vec3(red,grn,blu);
              float hue = atan(base.g-base.r,base.b-base.r)/(2.0*3.14159)+0.5;
              hue = fract(hue+uHueShift/360.0);
              float sat = length(base-vec3(dot(base,vec3(0.299,0.587,0.114))))*uSaturation;
              float val = max(max(base.r,base.g),base.b);
              base = hsv2rgb(vec3(hue,sat,val));
              vec2 pad = vec2(tris(seed*34.0+uTime*uSpeed/10.0),
                             tris(seed*38.0+uTime*uSpeed/30.0))-0.5;
              float star = Star(gv-offset-pad,flareSize);
              float twinkle = trisn(uTime*uSpeed+seed*6.2831)*0.5+1.0;
              twinkle = mix(1.0,twinkle,uTwinkleIntensity);
              star *= twinkle;
              // 50% cyan (#06B6D4), 50% white — decided by seed hash
              float isWhite = step(0.5, Hash21(si + 7.3));
              vec3 tint = mix(uTintColor, vec3(1.0), isWhite);
              col += star*size*base*tint;
            }
          }
          return col;
        }
        void main() {
          vec2 focalPx = uFocal*uResolution.xy;
          vec2 uv = (vUv*uResolution.xy-focalPx)/uResolution.y;
          if(uAutoCenterRepulsion>0.0){
            vec2 cUV = vec2(0.0);
            float cDist = length(uv-cUV);
            vec2 rep = normalize(uv-cUV)*(uAutoCenterRepulsion/(cDist+0.1));
            uv += rep*0.05;
          } else if(uMouseRepulsion){
            vec2 mUV = (uMouse*uResolution.xy-focalPx)/uResolution.y;
            float mDist = length(uv-mUV);
            vec2 rep = normalize(uv-mUV)*(uRepulsionStrength/(mDist+0.1));
            uv += rep*0.05*uMouseActiveFactor;
          } else {
            uv += (uMouse-vec2(0.5))*0.1*uMouseActiveFactor;
          }
          float ang = uTime*uRotationSpeed;
          mat2 rot = mat2(cos(ang),-sin(ang),sin(ang),cos(ang));
          uv = rot*uv;
          uv = mat2(uRotation.x,-uRotation.y,uRotation.y,uRotation.x)*uv;
          vec3 col = vec3(0.0);
          for(float i=0.0;i<1.0;i+=1.0/NUM_LAYER){
            float depth = fract(i+uStarSpeed*uSpeed);
            float scale = mix(20.0*uDensity,0.5*uDensity,depth);
            float fade  = depth*smoothstep(1.0,0.9,depth);
            col += StarLayer(uv*scale+i*453.32)*fade;
          }
          if(uTransparent){
            float alpha = length(col);
            alpha = smoothstep(0.0,0.3,alpha);
            alpha = min(alpha,1.0);
            gl_FragColor = vec4(col,alpha);
          } else {
            gl_FragColor = vec4(col,1.0);
          }        }`;

      function compileShader(type, src) {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        return sh;
      }

      function init() {
        container = document.getElementById('galaxy-container');
        if (!container) return;

        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
        container.appendChild(canvas);

        gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false }) ||
             canvas.getContext('experimental-webgl', { alpha: true });
        if (!gl) return;

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        const vs = compileShader(gl.VERTEX_SHADER, vertSrc);
        const fs = compileShader(gl.FRAGMENT_SHADER, fragSrc);
        program = gl.createProgram();
        gl.attachShader(program, vs); gl.attachShader(program, fs);
        gl.linkProgram(program); gl.useProgram(program);

        // Full-screen triangle with UV
        const verts = new Float32Array([-1,-1, 3,-1, -1,3]);
        const uvs   = new Float32Array([0,0, 2,0, 0,2]);
        const vBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuf);
        gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
        const posLoc = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        const uvBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
        gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
        const uvLoc = gl.getAttribLocation(program, 'uv');
        gl.enableVertexAttribArray(uvLoc);
        gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

        ['uTime','uResolution','uFocal','uRotation','uStarSpeed','uDensity',
         'uHueShift','uSpeed','uMouse','uGlowIntensity','uSaturation',
         'uMouseRepulsion','uTwinkleIntensity','uRotationSpeed','uRepulsionStrength',
         'uMouseActiveFactor','uAutoCenterRepulsion','uTransparent','uTintColor'].forEach(n => {
          uniLocs[n] = gl.getUniformLocation(program, n);
        });

        function resizeGL() {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const w = container.clientWidth, h = container.clientHeight;
          canvas.width = w * dpr; canvas.height = h * dpr;
          canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
          gl.viewport(0, 0, canvas.width, canvas.height);
        }
        resizeGL();
        const ro = window.ResizeObserver ? new ResizeObserver(resizeGL) : null;
        if (ro) ro.observe(container); else window.addEventListener('resize', resizeGL);

        if (cfg.mouseInteraction) {
          const heroSection = document.getElementById('hero');
          if (heroSection) {
            heroSection.style.pointerEvents = 'auto';
            heroSection.addEventListener('mousemove', e => {
              const rect = heroSection.getBoundingClientRect();
              targetMouse.x = (e.clientX - rect.left) / rect.width;
              targetMouse.y = 1.0 - (e.clientY - rect.top) / rect.height;
              targetActive = 1.0;
            }, { passive: true });
            heroSection.addEventListener('mouseleave', () => { targetActive = 0.0; });
          }
        }

        rafId = requestAnimationFrame(frame);
      }

      function frame(t) {
        if (!gl || !program) return;
        const time = t * 0.001;
        const starSpeedVal = time * cfg.starSpeed / 10.0;
        const w = gl.canvas.width, h = gl.canvas.height;
        const aspect = w / Math.max(h, 1);

        // Smooth mouse
        const lf = 0.05;
        smoothMouse.x += (targetMouse.x - smoothMouse.x) * lf;
        smoothMouse.y += (targetMouse.y - smoothMouse.y) * lf;
        smoothActive  += (targetActive - smoothActive) * lf;

        gl.uniform1f(uniLocs.uTime,              time);
        gl.uniform3f(uniLocs.uResolution,         w, h, aspect);
        gl.uniform2f(uniLocs.uFocal,              cfg.focal[0], cfg.focal[1]);
        gl.uniform2f(uniLocs.uRotation,           cfg.rotation[0], cfg.rotation[1]);
        gl.uniform1f(uniLocs.uStarSpeed,          starSpeedVal);
        gl.uniform1f(uniLocs.uDensity,            cfg.density);
        gl.uniform1f(uniLocs.uHueShift,           cfg.hueShift);
        gl.uniform1f(uniLocs.uSpeed,              cfg.speed);
        gl.uniform2f(uniLocs.uMouse,              smoothMouse.x, smoothMouse.y);
        gl.uniform1f(uniLocs.uGlowIntensity,      cfg.glowIntensity);
        gl.uniform1f(uniLocs.uSaturation,         cfg.saturation);
        gl.uniform1i(uniLocs.uMouseRepulsion,     cfg.mouseRepulsion ? 1 : 0);
        gl.uniform1f(uniLocs.uTwinkleIntensity,   cfg.twinkleIntensity);
        gl.uniform1f(uniLocs.uRotationSpeed,      cfg.rotationSpeed);
        gl.uniform1f(uniLocs.uRepulsionStrength,  cfg.repulsionStrength);
        gl.uniform1f(uniLocs.uMouseActiveFactor,  smoothActive);
        gl.uniform1f(uniLocs.uAutoCenterRepulsion,cfg.autoCenterRepulsion);
        gl.uniform1i(uniLocs.uTransparent,        cfg.transparent ? 1 : 0);
        gl.uniform3f(uniLocs.uTintColor,          0.024, 0.714, 0.831);

        gl.clearColor(0,0,0,0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        rafId = requestAnimationFrame(frame);
      }

      function destroy() { cancelAnimationFrame(rafId); }

      return { init, destroy };
    })();



    // Hidden video element for webcam feed
    const videoEl = document.createElement('video');
    videoEl.style.display = 'none';
    document.body.appendChild(videoEl);

    // ─── LOADING HELPERS ───────────────────────────────────────────────────────

    // ── Vanilla TextType: port of React Bits TextType component ───────────────
    // Types each new status label character-by-character using GSAP for cursor blink.
    const textTyper = (() => {
      let typeTimer     = null;
      let deleteTimer   = null;
      let currentText   = '';
      let targetText    = '';
      let isDeleting    = false;
      const TYPING_SPEED  = 38;  // ms per char
      const DELETING_SPEED = 18; // ms per char (faster delete)
      const PAUSE_BEFORE_DELETE = 320; // ms to show full text before deleting

      function getContentEl() { return document.getElementById('statusContent'); }
      function getCursorEl()  { return document.getElementById('statusCursor'); }

      function render() {
        const el = getContentEl();
        if (el) el.textContent = currentText;
      }

      function startDelete() {
        isDeleting = true;
        stepDelete();
      }

      function stepDelete() {
        clearTimeout(deleteTimer);
        if (currentText.length === 0) {
          isDeleting = false;
          stepType();
          return;
        }
        currentText = currentText.slice(0, -1);
        render();
        deleteTimer = setTimeout(stepDelete, DELETING_SPEED);
      }

      function stepType() {
        clearTimeout(typeTimer);
        if (currentText.length < targetText.length) {
          currentText += targetText[currentText.length];
          render();
          typeTimer = setTimeout(stepType, TYPING_SPEED);
        }
        // Done typing — no auto-delete, next call to setText will delete+retype
      }

      function setText(newText) {
        clearTimeout(typeTimer);
        clearTimeout(deleteTimer);
        targetText = newText;

        if (currentText === '') {
          // Nothing shown yet — type straight away
          stepType();
        } else {
          // Delete what's there, then type the new text
          isDeleting = true;
          stepDelete();
        }
      }

      function initCursorBlink() {
        if (typeof gsap === 'undefined') return;
        const cursor = getCursorEl();
        if (!cursor) return;
        gsap.to(cursor, {
          opacity: 0,
          duration: 0.45,
          repeat: -1,
          yoyo: true,
          ease: 'power2.inOut',
        });
      }

      return { setText, initCursorBlink };
    })();

    function setProgress(pct, label) {
      document.querySelector('.bar-fill').style.setProperty('--progress', pct + '%');
      document.querySelector('.bar-pct').textContent = pct + '%';
      // Type out the label instead of swapping it instantly
      textTyper.setText(label);
    }

    function nextFrame() {
      return new Promise(resolve => requestAnimationFrame(resolve));
    }

    function domReady() {
      if (document.readyState !== 'loading') return Promise.resolve();
      return new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
    }

    function waitForGlobal(test, timeout = 10000) {
      return new Promise((resolve, reject) => {
        if (test()) { resolve(); return; }
        const started = performance.now();
        const tick = () => {
          if (test()) { 
            resolve(); 
            return; 
          }
          if (performance.now() - started > timeout) { 
            reject(new Error('Timeout waiting for global')); 
            return; 
          }
          requestAnimationFrame(tick);
        };
        tick();
      });
    }

    // ─── MODEL FETCH ───────────────────────────────────────────────────────────
    async function fetchModel() {
      let response;
      try {
        response = await fetch(ASSETS.model);
      } catch (networkErr) {
        showToast('Failed to load gesture model. Check your connection.');
        // Keep START disabled — do not re-enable
        document.getElementById('startBtn').disabled = true;
        throw networkErr;
      }
      if (!response.ok) {
        showToast('Failed to load gesture model. Check your connection.');
        document.getElementById('startBtn').disabled = true;
        throw new Error('Model request failed with HTTP ' + response.status);
      }
      window.visionxModelBytes = await response.arrayBuffer();
    }

    // ─── AUDIO PRE-DECODE (uses a TEMPORARY context — NOT for playback) ────────
    // The decoded ArrayBuffer data is stored in audioBuffers[].
    // A real playback AudioContext is created on the START user gesture.
    async function preDecodeAudio() {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return; // graceful skip — will re-fetch on start

      // Temporary context used only for decoding; discarded after
      const tempCtx = new AudioContextClass();
      const entries = Object.entries(ASSETS.audio);

      await Promise.all(entries.map(async ([note, url]) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(note + ' audio fetch failed with HTTP ' + res.status);
        const arrayBuffer = await res.arrayBuffer();
        // Store decoded AudioBuffer
        audioBuffers[note] = await tempCtx.decodeAudioData(arrayBuffer);
      }));

      // Close the temp context — we don't need it for playback
      try { tempCtx.close(); } catch (_) {}
    }

    // ─── AUDIO PLAYBACK ────────────────────────────────────────────────────────
    // Ensures a live (non-suspended) AudioContext exists.
    // Must only be called inside a user-gesture handler.
    async function ensureAudioContext() {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!audioCtx) {
        audioCtx = new AudioContextClass();
      }
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
    }

    function playSwara(swara) {
      if (!audioCtx || !audioBuffers[swara]) return;
      if (currentSource) {
        try { currentSource.stop(); } catch (_) {}
        currentSource = null;
      }
      const src = audioCtx.createBufferSource();
      src.buffer   = audioBuffers[swara];
      src.loop     = true;
      src.connect(audioCtx.destination);
      src.start();
      currentSource = src;
    }

    function stopSwara() {
      if (currentSource) {
        try { currentSource.stop(); } catch (_) {}
        currentSource = null;
      }
    }

    // ─── GESTURE RECOGNIZER ────────────────────────────────────────────────────
    async function initGestureRecognizer() {
      let GestureRecognizerClass = window.GestureRecognizer;
      let FilesetResolverClass   = window.FilesetResolver;

      if (!GestureRecognizerClass || !FilesetResolverClass) {
        throw new Error('MediaPipe GestureRecognizer is not available. Please ensure the page is loaded via http://');
      }

      // Initialize the vision fileset resolver with the correct WASM path
      const vision = await FilesetResolverClass.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      
      const options = {
        baseOptions: {
          modelAssetPath: ASSETS.model,
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      };
      
      try {
        gestureRecognizer = await GestureRecognizerClass.createFromOptions(vision, options);
        console.log('✓ GestureRecognizer initialized successfully');
      } catch (err) {
        console.warn('GPU delegate failed, falling back to CPU:', err);
        options.baseOptions.delegate = 'CPU';
        gestureRecognizer = await GestureRecognizerClass.createFromOptions(vision, options);
        console.log('✓ GestureRecognizer initialized with CPU delegate');
      }
    }

    // ─── HAND SKELETON DRAWING ─────────────────────────────────────────────────
    const HAND_CONNECTIONS = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],
      [5,9],[9,13],[13,17]
    ];

    function drawHand(canvas, landmarks) {
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;

      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.5;
      HAND_CONNECTIONS.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(landmarks[a].x * W, landmarks[a].y * H);
        ctx.lineTo(landmarks[b].x * W, landmarks[b].y * H);
        ctx.stroke();
      });

      landmarks.forEach((lm, i) => {
        ctx.beginPath();
        ctx.arc(lm.x * W, lm.y * H, i === 0 ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 ? '#00FFE0' : '#ffffff';
        ctx.fill();
      });

      // Bounding box
      const xs = landmarks.map(l => l.x * W);
      const ys = landmarks.map(l => l.y * H);
      const minX = Math.min(...xs) - 12, maxX = Math.max(...xs) + 12;
      const minY = Math.min(...ys) - 12, maxY = Math.max(...ys) + 12;
      ctx.strokeStyle = '#00FFE0';
      ctx.lineWidth = 2;
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    }

    // ─── UI UPDATERS ───────────────────────────────────────────────────────────
    function updateConfidence(scores) {
      // Find highest-scoring swara
      const max = swaras.reduce((best, s) =>
        (scores[s] || 0) > (scores[best] || 0) ? s : best, swaras[0]);

      swaras.forEach(s => {
        const pct = Math.round((scores[s] || 0) * 100);
        const bar   = document.getElementById('bar-' + s);
        const label = document.getElementById('pct-' + s);
        if (!bar || !label) return;
        bar.style.width = pct + '%';
        label.textContent = pct + '%';
        // Active bar = highest score AND non-zero
        if (s === max && pct > 0) {
          bar.classList.add('active');
        } else {
          bar.classList.remove('active');
        }
      });
    }

    function updateActiveNote(swara) {
      const box = document.getElementById('activeNoteBox');
      document.getElementById('activeSwara').textContent = swara || '—';
      document.getElementById('activeDetail').textContent = swara
        ? (SWARA_DATA[swara].note + ' — ' + SWARA_DATA[swara].freq + ' Hz')
        : '';

      swaras.forEach(s => {
        document.getElementById('sw-' + s).classList.toggle('active', s === swara);
      });

      if (swara) {
        // Force reflow so the animation retriggers even on the same element
        box.classList.remove('flash');
        void box.offsetWidth; // REQUIRED — forces reflow
        box.classList.add('flash');
      }
    }

    function resetConfidence() {
      const zero = {};
      swaras.forEach(s => zero[s] = 0);
      updateConfidence(zero);
    }

    function buildConfidenceRows() {
      const container = document.getElementById('confidenceRows');
      container.innerHTML = '';
      swaras.forEach(s => {
        const row = document.createElement('div');
        row.className = 'conf-row';
        row.innerHTML = `
          <span class="conf-label">${s}</span>
          <div class="conf-bar-bg">
            <div class="conf-bar-fill" id="bar-${s}"></div>
          </div>
          <span class="conf-pct" id="pct-${s}">0%</span>`;
        container.appendChild(row);
      });
    }

    function buildSwaraStrip() {
      const strip = document.getElementById('swaraStrip');
      strip.innerHTML = '';
      swaras.forEach(s => {
        const box = document.createElement('div');
        box.className = 'swara-box';
        box.id = 'sw-' + s;
        box.textContent = s;
        strip.appendChild(box);
      });
    }

    // ─── GESTURE DETECT LOOP ───────────────────────────────────────────────────
    // Runs inside the unified mainLoop — called each RAF tick when isRunning.
    function runDetection(nowMs) {
      // Throttle to ~30 fps for inference
      if (nowMs - lastInferenceTime < 33) return;
      lastInferenceTime = nowMs;

      const canvas    = document.getElementById('gestureCanvas');
      const ctx       = canvas.getContext('2d');
      const noHandMsg = document.getElementById('noHandMsg');

      // Set canvas resolution to match video stream (only once when dimensions change)
      if (videoEl.videoWidth && videoEl.videoHeight) {
        if (canvas.width  !== videoEl.videoWidth)  canvas.width  = videoEl.videoWidth;
        if (canvas.height !== videoEl.videoHeight) canvas.height = videoEl.videoHeight;
      }

      // Clear and draw video frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (videoEl.readyState >= 2) {
        // Draw video maintaining aspect ratio
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      }

      const results = gestureRecognizer.recognizeForVideo(videoEl, nowMs);

      if (results.landmarks && results.landmarks.length > 0) {
        // Hand visible — reset counter
        noHandFrames = 0;
        noHandMsg.style.display = 'none';

        drawHand(canvas, results.landmarks[0]);

        // Build score map
        const scores = {};
        swaras.forEach(s => scores[s] = 0);
        if (results.gestures.length > 0) {
          results.gestures[0].forEach(g => {
            if (Object.prototype.hasOwnProperty.call(scores, g.categoryName)) {
              scores[g.categoryName] = g.score;
            }
          });
        }

        // Update bars EVERY frame (not just on note change)
        updateConfidence(scores);

        // Trigger note only above threshold
        if (results.gestures.length > 0 && results.gestures[0].length > 0) {
          const top     = results.gestures[0][0];
          const label   = top.categoryName;
          const now     = Date.now();
          const cooldown = parseInt(document.getElementById('cooldownInput').value, 10) || 300;

          if (
            top.score >= CONFIDENCE_THRESHOLD &&
            swaras.includes(label) &&
            label !== lastTriggeredSwara &&   // only trigger on CHANGE
            now - lastTriggerTime >= cooldown
          ) {
            lastTriggeredSwara = label;
            lastTriggerTime    = now;
            playSwara(label);
            updateActiveNote(label);
          }
        }
      } else {
        noHandFrames++;
        // After ~200 ms of no hand (~6 frames at 30 fps): stop audio
        if (noHandFrames >= 6) {
          noHandMsg.style.display = 'flex';
          // Update text to just raise hand since session is already started
          const line1 = noHandMsg.querySelector('.no-hand-line1');
          const line2 = noHandMsg.querySelector('.no-hand-line2');
          if (line1) line1.textContent = 'RAISE YOUR HAND';
          if (line2) line2.style.display = 'none';
          if (lastTriggeredSwara) {
            stopSwara();
            lastTriggeredSwara = null;
            updateActiveNote(null);
            resetConfidence();
          }
        }
      }
    }

    // ─── SESSION CONTROL ───────────────────────────────────────────────────────
    async function startSession() {
      try {
        // AudioContext must be created/resumed inside the user-gesture handler
        await ensureAudioContext();

        if (!gestureRecognizer) {
          console.log('Initializing gesture recognizer...');
          await initGestureRecognizer();
        }

        console.log('Requesting camera access...');
        webcamStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' },
          audio: false
        });
        
        videoEl.srcObject = webcamStream;
        videoEl.setAttribute('playsinline', '');
        videoEl.setAttribute('autoplay', '');
        
        await new Promise((resolve, reject) => {
          videoEl.onloadedmetadata = () => {
            console.log('Video metadata loaded:', videoEl.videoWidth, 'x', videoEl.videoHeight);
            resolve();
          };
          videoEl.onerror = reject;
        });
        
        await videoEl.play();
        console.log('Video playing, readyState:', videoEl.readyState);

        // Initialize canvas size
        const canvas = document.getElementById('gestureCanvas');
        canvas.width = videoEl.videoWidth || 1280;
        canvas.height = videoEl.videoHeight || 720;
        console.log('Canvas initialized:', canvas.width, 'x', canvas.height);

        noHandFrames = 0;
        isRunning = true;
        document.getElementById('noHandMsg').style.display = 'none';
        document.getElementById('startBtn').textContent = 'STOP';
      } catch (err) {
        console.error('Failed to start session:', err);
        drawCameraError();
        throw err;
      }
    }

    function stopSession() {
      isRunning = false;
      if (webcamStream) {
        webcamStream.getTracks().forEach(t => t.stop());
        webcamStream = null;
      }
      videoEl.srcObject = null;
      stopSwara();
      lastTriggeredSwara = null;
      noHandFrames = 0;
      updateActiveNote(null);
      resetConfidence();
      document.getElementById('startBtn').textContent = 'START';
      // Clear canvas
      const canvas = document.getElementById('gestureCanvas');
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Reset noHandMsg back to original "click start" state
      const noHandMsg = document.getElementById('noHandMsg');
      const line1 = noHandMsg.querySelector('.no-hand-line1');
      const line2 = noHandMsg.querySelector('.no-hand-line2');
      if (line1) line1.textContent = 'CLICK START';
      if (line2) line2.style.display = '';
      noHandMsg.style.display = 'flex';
    }

    function drawCameraError() {
      const canvas = document.getElementById('gestureCanvas');
      const ctx    = canvas.getContext('2d');
      const W = canvas.width  || 640;
      const H = canvas.height || 360;
      canvas.width  = W;
      canvas.height = H;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = "bold 20px 'Bebas Neue'";
      ctx.textAlign = 'center';
      ctx.fillText('CAMERA ACCESS DENIED', W / 2, H / 2 - 16);
      ctx.font = "13px 'Space Grotesk'";
      ctx.fillStyle = '#555';
      ctx.fillText('Allow camera permissions and refresh.', W / 2, H / 2 + 16);
    }

    function bindPlayPage() {
      buildConfidenceRows();
      buildSwaraStrip();

      document.getElementById('backBtn').addEventListener('click', () => {
        closePlayPage();
      });
      document.getElementById('backBtn').addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById('backBtn').click(); }
      });

      document.getElementById('startBtn').addEventListener('click', () => {
        if (isRunning) {
          stopSession();
        } else {
          // AudioContext is created here, inside the user gesture handler
          startSession().catch(err => {
            drawCameraError();
            showToast('Camera error: ' + err.message);
          });
        }
      });
    }

    // ─── UNIFIED RAF LOOP ──────────────────────────────────────────────────────
    // Single requestAnimationFrame chain for Three.js + parallax + DotField + detection.
    function mainLoop(time) {
      // 1. Parallax lerp (speed 0.05 — no jitter)
      curX += (mouseX - curX) * 0.05;
      curY += (mouseY - curY) * 0.05;

      if (heroText) {
        heroText.style.transform =
          `translate(calc(-50% + ${curX * 30}px), calc(-50% + ${curY * 20}px))`;
      }
      if (grainOverlay) {
        grainOverlay.style.transform = `translate(${curX * 8}px, ${curY * 6}px)`;
      }
      // 4. Gesture detection (only when session is running)
      if (isRunning && gestureRecognizer && videoEl.readyState >= 2) {
        runDetection(time);
      }

      requestAnimationFrame(mainLoop);
    }

    // ─── CUSTOM SCROLLBAR ──────────────────────────────────────────────────────
    function initScrollbar() {
      const bar     = document.getElementById('custom-scrollbar');
      const track   = document.getElementById('scrollbar-track');
      const thumb   = document.getElementById('scrollbar-thumb');
      if (!bar || !thumb) return;

      // Number of sections = 3 (hero + carousel + roadmap)
      const sectionCount = 3;
      const thumbPct = 1 / sectionCount; // thumb is 1/2 the track width
      thumb.style.width = (thumbPct * 100) + '%';

      // Update thumb position from scroll
      function syncThumb() {
        const maxScroll = horizontalContainer.scrollWidth - horizontalContainer.clientWidth;
        if (maxScroll <= 0) return;
        const progress = horizontalContainer.scrollLeft / maxScroll;
        // Thumb travels from 0 to (trackWidth - thumbWidth)
        const maxLeft = 100 - thumbPct * 100;
        thumb.style.left = (progress * maxLeft) + '%';
      }

      horizontalContainer.addEventListener('scroll', syncThumb, { passive: true });
      syncThumb();

      // Click on track → jump to that position
      track.addEventListener('click', e => {
        if (thumb.classList.contains('dragging')) return;
        const rect = track.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const ratio  = Math.max(0, Math.min(1, clickX / rect.width));
        const maxScroll = horizontalContainer.scrollWidth - horizontalContainer.clientWidth;
        horizontalContainer.scrollTo({ left: ratio * maxScroll, behavior: 'smooth' });
      });

      // Drag thumb
      let dragStartX   = 0;
      let dragStartLeft = 0;
      let isDragging   = false;

      thumb.addEventListener('mousedown', e => {
        isDragging = true;
        dragStartX    = e.clientX;
        dragStartLeft = horizontalContainer.scrollLeft;
        thumb.classList.add('dragging');
        e.preventDefault();
      });

      document.addEventListener('mousemove', e => {
        if (!isDragging) return;
        const rect     = track.getBoundingClientRect();
        const delta    = e.clientX - dragStartX;
        const maxScroll = horizontalContainer.scrollWidth - horizontalContainer.clientWidth;
        const scrollDelta = (delta / rect.width) * maxScroll / (1 - thumbPct);
        horizontalContainer.scrollLeft = Math.max(0, Math.min(maxScroll, dragStartLeft + scrollDelta));
      });

      document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        thumb.classList.remove('dragging');
      });

      // Hide scrollbar when play overlay is open
      const observer = new MutationObserver(() => {
        const playOpen = document.getElementById('play-overlay').classList.contains('visible');
        bar.classList.toggle('hidden', playOpen);
      });
      observer.observe(document.getElementById('play-overlay'), { attributes: true, attributeFilter: ['class'] });
    }
    function renderCarousel() {
      const wrapper        = document.getElementById('carouselWrapper');
      const rotations      = [-35, -18, 0, 18, 35];
      const depths         = [-80, -40, 0, -40, -80];
      const imageRotations = ['-12deg', '-12deg', '-12deg', '-12deg', '0deg'];

      wrapper.innerHTML = FLUTES.map((flute, index) => `
        <article
          class="flute-card ${flute.active ? 'active' : 'inactive'}"
          style="
            --rotate-y: ${rotations[index]}deg;
            --translate-z: ${depths[index]}px;
            --scale: ${flute.active ? '1.08' : '1'};
            --img-rotate: ${imageRotations[index]};
          "
          data-key="${flute.key}"
          data-active="${flute.active}"
          tabindex="0"
          role="button"
          aria-label="${flute.active ? 'Play ' + flute.name : flute.name + ' — coming soon'}">
          <div class="flute-image-wrap">
            <img src="${flute.img}" alt="${flute.name}" loading="eager" decoding="async">
          </div>
          <h3 class="card-name">${flute.name}</h3>
          <div class="root-note">${flute.root}</div>
          <div class="badge">${flute.active ? 'TAP TO PLAY' : 'COMING SOON'}</div>
        </article>
      `).join('');

      wrapper.querySelectorAll('.flute-card').forEach(card => {
        const handler = () => {
          if (card.dataset.active === 'true') {
            openPlayPage();
          } else {
            showToast(card.dataset.key + ' FLUTE — COMING SOON');
          }
        };
        card.addEventListener('click', handler);
        card.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
        });
      });
    }

    // ─── NAVIGATION ────────────────────────────────────────────────────────────
    function scrollToSection(id) {
      const section = document.getElementById(id);
      if (!section) return;
      horizontalContainer.scrollTo({
        left: section.offsetLeft,
        behavior: 'smooth'
      });
    }

    function openPlayPage() {
      document.getElementById('play-overlay').classList.add('visible');
    }

    function closePlayPage() {
      if (isRunning) stopSession();
      document.getElementById('play-overlay').classList.remove('visible');
    }

    // ── Close play page on scroll-up or scroll-right ───────────────────────
    (function bindPlayPageSwipeBack() {
      const overlay = document.getElementById('play-overlay');
      if (!overlay) return;

      // Wheel: close on scroll UP (deltaY < 0) or scroll RIGHT (deltaX > 0)
      overlay.addEventListener('wheel', e => {
        if (!overlay.classList.contains('visible')) return;
        // Ignore horizontal scroll on inputs
        if (e.target.tagName === 'INPUT') return;
        if (e.deltaY < -30 || e.deltaX > 30) {
          e.preventDefault();
          closePlayPage();
        }
      }, { passive: false });

      // Touch: swipe down (finger moves down = scroll up intent) or swipe right
      let touchStartX = 0;
      let touchStartY = 0;

      overlay.addEventListener('touchstart', e => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      overlay.addEventListener('touchend', e => {
        if (!overlay.classList.contains('visible')) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        // Swipe right (dx > 60) or swipe down (dy > 60) with dominant axis check
        if (dx > 60 && Math.abs(dx) > Math.abs(dy)) closePlayPage();
        if (dy > 60 && Math.abs(dy) > Math.abs(dx)) closePlayPage();
      }, { passive: true });
    })();

    // Wheel → horizontal scroll
    // Wheel → horizontal scroll with momentum + settle-to-section.
    // Works for: vertical trackpad, horizontal trackpad, mouse wheel.
    // No CSS snap (it fights manual scrollLeft) — we snap in JS after scroll settles.
    function initWheelScroll() {
      let velocity    = 0;
      let rafId       = null;
      let settleTimer = null;
      const friction  = 0.85;  // decay per frame — lower = stops faster
      const scale     = 0.55;  // sensitivity multiplier
      const sectionW  = window.innerWidth;

      window.addEventListener('resize', () => { sectionW === window.innerWidth; });

      function snapToNearest() {
        const idx = Math.round(horizontalContainer.scrollLeft / window.innerWidth);
        const target = idx * window.innerWidth;
        horizontalContainer.scrollTo({ left: target, behavior: 'smooth' });
      }

      function step() {
        if (Math.abs(velocity) < 0.8) {
          velocity = 0;
          rafId = null;
          // Settle to nearest section after momentum dies
          clearTimeout(settleTimer);
          settleTimer = setTimeout(snapToNearest, 80);
          return;
        }
        horizontalContainer.scrollLeft += velocity;
        velocity *= friction;
        rafId = requestAnimationFrame(step);
      }

      function addVelocity(delta) {
        // Reset settle timer — user is still scrolling
        clearTimeout(settleTimer);
        velocity += delta * scale;
        // Cap so a single flick can't jump more than ~1.5 sections
        const cap = window.innerWidth * 0.06;
        velocity = Math.max(-cap, Math.min(cap, velocity));
        if (!rafId) rafId = requestAnimationFrame(step);
      }

      horizontalContainer.addEventListener('wheel', e => {
        e.preventDefault();
        // Use dominant axis — handles both vertical and horizontal trackpad
        const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        addVelocity(delta);
      }, { passive: false });
    }

    // ─── TOAST (only one at a time) ────────────────────────────────────────────
    function showToast(message) {
      clearTimeout(toastTimer);
      toast.classList.remove('show');
      // Let the remove paint, then re-show
      requestAnimationFrame(() => {
        toast.textContent = message;
        toast.classList.add('show');
      });
      toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
    }

    // ─── INTERACTIONS ──────────────────────────────────────────────────────────
    function bindInteractions() {
      document.addEventListener('mousemove', e => {
        mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      });

      document.querySelectorAll('[data-target]').forEach(link => {
        link.addEventListener('click', () => scrollToSection(link.dataset.target));
      });

      // Keyboard → horizontal scroll
      // ArrowUp/Down and PageUp/Down map to left/right section jumps.
      // ArrowLeft/Right also work for consistency.
      const sectionIds = ['hero', 'carousel', 'roadmap'];
      document.addEventListener('keydown', e => {
        // Don't hijack when typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        // Don't hijack when play overlay is open
        if (document.getElementById('play-overlay').classList.contains('visible')) return;

        const currentIndex = Math.round(
          horizontalContainer.scrollLeft / horizontalContainer.clientWidth
        );

        let next = null;
        switch (e.key) {
          case 'ArrowDown':
          case 'ArrowRight':
          case 'PageDown':
            e.preventDefault();
            next = Math.min(currentIndex + 1, sectionIds.length - 1);
            break;
          case 'ArrowUp':
          case 'ArrowLeft':
          case 'PageUp':
            e.preventDefault();
            next = Math.max(currentIndex - 1, 0);
            break;
          case 'Home':
            e.preventDefault();
            next = 0;
            break;
          case 'End':
            e.preventDefault();
            next = sectionIds.length - 1;
            break;
        }

        if (next !== null && next !== currentIndex) {
          scrollToSection(sectionIds[next]);
        }
      });
    }

    // ─── LOADER HIDE ───────────────────────────────────────────────────────────
    async function hideLoader() {
      await new Promise(resolve => setTimeout(resolve, 600));
      loader.classList.add('hidden');           // opacity fade starts (800ms)
      await new Promise(resolve => setTimeout(resolve, 800));
      loader.style.display = 'none';            // fully removed from layout
      // Small pause so the hero is fully visible before text starts moving
      await new Promise(resolve => setTimeout(resolve, 120));
      initHeroAnimation();   // chars animate up — takes ~3.9s total
      // Start rotating text early so box is visible as line2 animates in
      initRotatingText(1800);
    }

    // ─── ROTATING TEXT — driven by GSAP (no CSS animation timing issues) ───────
    function initRotatingText(delayMs) {
      setTimeout(() => {
        const inner = document.getElementById('rotatingInner');
        const pill  = document.getElementById('rotatingPill');
        if (!inner || !pill) return;

        // Fade the pill in
        gsap.to(pill, { opacity: 1, duration: 0.4, ease: 'power2.out' });

        const words      = ['SWARS', 'RAGAS', 'TONES', 'NOTES', 'BEATS', 'VIBES'];
        const INTERVAL   = 2400;
        const STAGGER    = 0.035;
        let currentIndex  = 0;
        let currentWordEl = null;

        function buildWordEl(word) {
          const wordEl = document.createElement('span');
          // Fill the inner container — position absolute, centered
          wordEl.style.cssText = [
            'position:absolute',
            'top:0', 'left:0', 'right:0', 'bottom:0',
            'display:flex',
            'align-items:center',
            'justify-content:center',
            'white-space:nowrap',
          ].join(';');
          word.split('').forEach(ch => {
            const s = document.createElement('span');
            s.style.display = 'inline-block';
            s.textContent   = ch === ' ' ? '\u00A0' : ch;
            wordEl.appendChild(s);
          });
          return wordEl;
        }

        function enterWord(wordEl) {
          const chars = Array.from(wordEl.children);
          // Start off-screen below the clipping box
          gsap.set(chars, { y: '120%', opacity: 0 });
          inner.appendChild(wordEl);
          // Animate chars up into view
          gsap.to(chars, {
            y: 0,
            opacity: 1,
            duration: 0.45,
            ease: 'back.out(1.4)',
            stagger: { each: STAGGER, from: 'end' },
          });
        }

        function exitWord(wordEl) {
          const chars = Array.from(wordEl.children);
          gsap.to(chars, {
            y: '-120%',
            opacity: 0,
            duration: 0.28,
            ease: 'power2.in',
            stagger: { each: STAGGER, from: 'end' },
            onComplete: () => wordEl.remove(),
          });
        }

        function rotate() {
          currentIndex = (currentIndex + 1) % words.length;
          const nextEl = buildWordEl(words[currentIndex]);
          if (currentWordEl) exitWord(currentWordEl);
          enterWord(nextEl);
          currentWordEl = nextEl;
        }

        // Show first word
        const firstEl = buildWordEl(words[0]);
        enterWord(firstEl);
        currentWordEl = firstEl;

        setInterval(rotate, INTERVAL);
      }, delayMs);
    }

    // ─── HERO TEXT SPLIT ANIMATION ─────────────────────────────────────────────
    function initHeroAnimation() {
      const line1 = document.getElementById('heroLine1');
      const line2 = document.getElementById('heroLine2');
      const sub   = document.getElementById('heroSub');
      if (!line1 || !line2) return;

      // Ensure gsap is loaded
      if (typeof gsap === 'undefined') {
        // Fallback: just show everything
        if (sub) sub.style.opacity = '1';
        return;
      }

      // Register SplitText if available (free in 3.13+)
      if (typeof SplitText !== 'undefined') {
        gsap.registerPlugin(SplitText);
      }

      // ── With SplitText ──────────────────────────────────────────────────────
      if (typeof SplitText !== 'undefined') {
        // Make h1s visible (overrides CSS opacity:0) then split
        gsap.set([line1, line2], { opacity: 1 });
        gsap.set(sub, { opacity: 0, y: 14 });

        // Temporarily detach the rotating pill so SplitText doesn't split it
        const pill = document.getElementById('rotatingPill');
        const pillParent = pill ? pill.parentNode : null;
        const pillPlaceholder = pill ? document.createComment('pill') : null;
        if (pill && pillParent) {
          pillParent.replaceChild(pillPlaceholder, pill);
        }

        const split1 = new SplitText(line1, { type: 'chars,words' });
        const split2 = new SplitText(line2, { type: 'chars,words' });

        // Restore the pill after splitting
        if (pill && pillParent && pillPlaceholder) {
          pillParent.replaceChild(pill, pillPlaceholder);
        }

        // Immediately hide all chars — no flash
        gsap.set(split1.chars, { opacity: 0, y: 56 });
        gsap.set(split2.chars, { opacity: 0, y: 56 });

        const tl = gsap.timeline();

        tl.to(split1.chars, {
          opacity: 1,
          y: 0,
          duration: 4,
          ease: 'power3.out',
          stagger: 0.13,
        })
        .to(split2.chars, {
          opacity: 1,
          y: 0,
          duration: 4,
          ease: 'power3.out',
          stagger: 0.13,
        }, '-=0.3')
        .to(sub, {
          opacity: 1,
          y: 0,
          duration: 3,
          ease: 'power2.out',
        }, '+=0.15');

      } else {
        // ── Fallback: plain GSAP without SplitText ──────────────────────────
        gsap.set([line1, line2, sub], { opacity: 0, y: 30 });
        gsap.to([line1, line2, sub], {
          opacity: 1,
          y: 0,
          duration: 2,
          ease: 'power3.out',
          stagger: 0.22,
        });
      }
    }


    // ─── DOT FIELD — Hero / Landing section ───────────────────────────────────
    // Pure canvas implementation of the React Bits DotField component.
    const dotFieldState = (() => {
      const TWO_PI = Math.PI * 2;
      const cfg = {
        dotRadius:     2.5,
        dotSpacing:    14,
        cursorRadius:  500,
        cursorForce:   0.33,
        bulgeOnly:     true,
        bulgeStrength: 75,
        gradientFrom:  '#3B82F6',
        gradientTo:    '#06B6D4',
        glowColor:     '#061930',
        glowRadius:    120,
        sparkle:       false,
        waveAmplitude: 0,
      };

      let canvas, svgEl, glowCircle, ctx, dpr = 1;
      let dots = [], mouseX = -9999, mouseY = -9999;
      let prevMX = -9999, prevMY = -9999, mouseSpeed = 0;
      let engagement = 0, glowOpacity = 0;
      let rafId = null, frameCount = 0;
      let speedInterval = null;
      const glowId = 'df-glow-' + Math.random().toString(36).slice(2, 8);

      function hexToRgba(hex, alpha) {
        const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!m) return 'rgba(59,130,246,' + alpha + ')';
        return 'rgba(' + parseInt(m[1],16) + ',' + parseInt(m[2],16) + ',' + parseInt(m[3],16) + ',' + alpha + ')';
      }

      function buildDots(w, h) {
        const step = cfg.dotRadius + cfg.dotSpacing;
        const cols = Math.floor(w / step);
        const rows = Math.floor(h / step);
        const padX = (w % step) / 2;
        const padY = (h % step) / 2;
        dots = [];
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const ax = padX + col * step + step / 2;
            const ay = padY + row * step + step / 2;
            dots.push({ ax, ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay });
          }
        }
      }

      function resize() {
        const container = canvas.parentElement;
        const w = container.clientWidth;
        const h = container.clientHeight;
        canvas.width  = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width  = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        svgEl.setAttribute('width',  w);
        svgEl.setAttribute('height', h);
        buildDots(w, h);
      }

      function updateSpeed() {
        const dx = prevMX - mouseX, dy = prevMY - mouseY;
        const d = Math.sqrt(dx*dx + dy*dy);
        mouseSpeed += (d - mouseSpeed) * 0.5;
        if (mouseSpeed < 0.001) mouseSpeed = 0;
        prevMX = mouseX; prevMY = mouseY;
      }

      function tick() {
        frameCount++;
        const t = frameCount * 0.02;
        const container = canvas.parentElement;
        const w = container.clientWidth;
        const h = container.clientHeight;

        const targetEng = Math.min(mouseSpeed / 5, 1);
        engagement += (targetEng - engagement) * 0.06;
        if (engagement < 0.001) engagement = 0;
        const eng = engagement;

        glowOpacity += (eng - glowOpacity) * 0.08;
        if (glowCircle) {
          glowCircle.setAttribute('cx', mouseX);
          glowCircle.setAttribute('cy', mouseY);
          glowCircle.style.opacity = glowOpacity;
        }

        ctx.clearRect(0, 0, w, h);

        // Build gradient from config colors
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, cfg.gradientFrom);
        grad.addColorStop(1, cfg.gradientTo);
        ctx.fillStyle = grad;

        const cr = cfg.cursorRadius, crSq = cr * cr;
        const rad = cfg.dotRadius / 2;
        const isBulge = cfg.bulgeOnly;

        ctx.beginPath();
        for (let i = 0; i < dots.length; i++) {
          const d = dots[i];
          const dx = mouseX - d.ax, dy = mouseY - d.ay;
          const distSq = dx*dx + dy*dy;

          if (distSq < crSq && eng > 0.01) {
            const dist = Math.sqrt(distSq);
            if (isBulge) {
              const tVal = 1 - dist / cr;
              const push = tVal * tVal * cfg.bulgeStrength * eng;
              const angle = Math.atan2(dy, dx);
              d.sx += (d.ax - Math.cos(angle) * push - d.sx) * 0.15;
              d.sy += (d.ay - Math.sin(angle) * push - d.sy) * 0.15;
            } else {
              const angle = Math.atan2(dy, dx);
              const move = (500 / dist) * (mouseSpeed * cfg.cursorForce);
              d.vx += Math.cos(angle) * -move;
              d.vy += Math.sin(angle) * -move;
            }
          } else if (isBulge) {
            d.sx += (d.ax - d.sx) * 0.1;
            d.sy += (d.ay - d.sy) * 0.1;
          }

          if (!isBulge) {
            d.vx *= 0.9; d.vy *= 0.9;
            d.x = d.ax + d.vx; d.y = d.ay + d.vy;
            d.sx += (d.x - d.sx) * 0.1;
            d.sy += (d.y - d.sy) * 0.1;
          }

          let drawX = d.sx, drawY = d.sy;
          if (cfg.waveAmplitude > 0) {
            drawY += Math.sin(d.ax * 0.03 + t) * cfg.waveAmplitude;
            drawX += Math.cos(d.ay * 0.03 + t * 0.7) * cfg.waveAmplitude * 0.5;
          }

          if (cfg.sparkle) {
            const hash = (((i * 2654435761) ^ (frameCount >> 3)) >>> 0);
            const r2 = (hash % 100) < 3 ? rad * 1.8 : rad;
            ctx.moveTo(drawX + r2, drawY);
            ctx.arc(drawX, drawY, r2, 0, TWO_PI);
          } else {
            ctx.moveTo(drawX + rad, drawY);
            ctx.arc(drawX, drawY, rad, 0, TWO_PI);
          }
        }
        ctx.fill();

        rafId = requestAnimationFrame(tick);
      }

      function onMouseMove(e) {
        const rect = canvas.parentElement.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
      }

      function init() {
        const container = document.getElementById('dot-field-container');
        if (!container) return;

        // Canvas
        canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
        container.appendChild(canvas);
        ctx = canvas.getContext('2d', { alpha: true });
        dpr = Math.min(window.devicePixelRatio || 1, 2);

        // SVG glow overlay
        svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgEl.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const rg = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
        rg.setAttribute('id', glowId);
        const s1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        s1.setAttribute('offset', '0%');
        s1.setAttribute('stop-color', cfg.glowColor);
        const s2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        s2.setAttribute('offset', '100%');
        s2.setAttribute('stop-color', 'transparent');
        rg.appendChild(s1); rg.appendChild(s2);
        defs.appendChild(rg);
        svgEl.appendChild(defs);
        glowCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        glowCircle.setAttribute('cx', '-9999');
        glowCircle.setAttribute('cy', '-9999');
        glowCircle.setAttribute('r', cfg.glowRadius);
        glowCircle.setAttribute('fill', 'url(#' + glowId + ')');
        glowCircle.style.opacity = '0';
        svgEl.appendChild(glowCircle);
        container.appendChild(svgEl);

        resize();
        const ro = window.ResizeObserver ? new ResizeObserver(resize) : null;
        if (ro) ro.observe(container); else window.addEventListener('resize', resize);
        window.addEventListener('mousemove', onMouseMove, { passive: true });
        speedInterval = setInterval(updateSpeed, 20);
        rafId = requestAnimationFrame(tick);
      }

      function destroy() {
        cancelAnimationFrame(rafId);
        clearInterval(speedInterval);
        window.removeEventListener('mousemove', onMouseMove);
      }

      return { init, destroy };
    })();

    // ─── LIGHT RAYS — Carousel / Select Instrument section ────────────────────
    // Pure WebGL implementation of the React Bits LightRays component.
    // Uses a raw WebGL context (no OGL dependency) for the same GLSL shader.
    const lightRaysState = (() => {
      const cfg = {
        raysOrigin:     'top-center',
        raysColor:      '#06B6D4',
        raysSpeed:      1.1,
        lightSpread:    0.6,
        rayLength:      1.2,
        followMouse:    true,
        mouseInfluence: 0.4,
        noiseAmount:    0.24,
        distortion:     0.1,
        fadeDistance:   0.8,
        saturation:     1.4,
        pulsating:      false,
      };

      let gl = null, program = null, rafId = null;
      let uniLocs = {};
      let startTime = performance.now();
      let mouseNorm = { x: 0.5, y: 0.5 };
      let smoothMouse = { x: 0.5, y: 0.5 };
      let container = null;

      function hexToRgb(hex) {
        const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return m ? [parseInt(m[1],16)/255, parseInt(m[2],16)/255, parseInt(m[3],16)/255] : [1,1,1];
      }

      function getAnchorAndDir(origin, w, h) {
        const outside = 0.2;
        switch (origin) {
          case 'top-left':     return { anchor: [0,            -outside*h], dir: [0,1] };
          case 'top-right':    return { anchor: [w,            -outside*h], dir: [0,1] };
          case 'left':         return { anchor: [-outside*w,   0.5*h],      dir: [1,0] };
          case 'right':        return { anchor: [(1+outside)*w, 0.5*h],     dir: [-1,0] };
          case 'bottom-left':  return { anchor: [0,     (1+outside)*h],     dir: [0,-1] };
          case 'bottom-center':return { anchor: [0.5*w, (1+outside)*h],     dir: [0,-1] };
          case 'bottom-right': return { anchor: [w,     (1+outside)*h],     dir: [0,-1] };
          default:             return { anchor: [0.5*w, -outside*h],        dir: [0,1] };
        }
      }

      function compileShader(type, src) {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        return sh;
      }

      function init() {
        container = document.getElementById('light-rays-container');
        if (!container) return;

        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
        container.appendChild(canvas);

        gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false }) ||
             canvas.getContext('experimental-webgl', { alpha: true });
        if (!gl) return;

        const vert = `
          attribute vec2 position;
          varying vec2 vUv;
          void main() {
            vUv = position * 0.5 + 0.5;
            gl_Position = vec4(position, 0.0, 1.0);
          }`;

        const frag = `
          precision highp float;
          uniform float iTime;
          uniform vec2  iResolution;
          uniform vec2  rayPos;
          uniform vec2  rayDir;
          uniform vec3  raysColor;
          uniform float raysSpeed;
          uniform float lightSpread;
          uniform float rayLength;
          uniform float pulsating;
          uniform float fadeDistance;
          uniform float saturation;
          uniform vec2  mousePos;
          uniform float mouseInfluence;
          uniform float noiseAmount;
          uniform float distortion;
          varying vec2 vUv;

          float noise(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
          }

          float rayStrength(vec2 raySource, vec2 rayRefDir, vec2 coord,
                            float seedA, float seedB, float speed) {
            vec2 sourceToCoord = coord - raySource;
            vec2 dirNorm = normalize(sourceToCoord);
            float cosAngle = dot(dirNorm, rayRefDir);
            float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
            float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));
            float dist = length(sourceToCoord);
            float maxDist = iResolution.x * rayLength;
            float lengthFalloff = clamp((maxDist - dist) / maxDist, 0.0, 1.0);
            float fadeFalloff   = clamp((iResolution.x * fadeDistance - dist) / (iResolution.x * fadeDistance), 0.5, 1.0);
            float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;
            float base = clamp(
              (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) +
              (0.3  + 0.2  * cos(-distortedAngle * seedB + iTime * speed)),
              0.0, 1.0);
            return base * lengthFalloff * fadeFalloff * spreadFactor * pulse;
          }

          void main() {
            vec2 coord = vec2(gl_FragCoord.x, iResolution.y - gl_FragCoord.y);
            vec2 finalDir = rayDir;
            if (mouseInfluence > 0.0) {
              vec2 mPos = mousePos * iResolution.xy;
              finalDir = normalize(mix(rayDir, normalize(mPos - rayPos), mouseInfluence));
            }
            vec4 r1 = vec4(1.0) * rayStrength(rayPos, finalDir, coord, 36.2214, 21.11349, 1.5 * raysSpeed);
            vec4 r2 = vec4(1.0) * rayStrength(rayPos, finalDir, coord, 22.3991, 18.0234, 1.1 * raysSpeed);
            vec4 color = r1 * 0.5 + r2 * 0.4;
            if (noiseAmount > 0.0) {
              float n = noise(coord * 0.01 + iTime * 0.1);
              color.rgb *= (1.0 - noiseAmount + noiseAmount * n);
            }
            float brightness = 1.0 - (coord.y / iResolution.y);
            color.x *= 0.1 + brightness * 0.8;
            color.y *= 0.3 + brightness * 0.6;
            color.z *= 0.5 + brightness * 0.5;
            if (saturation != 1.0) {
              float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
              color.rgb = mix(vec3(gray), color.rgb, saturation);
            }
            color.rgb *= raysColor;
            gl_FragColor = color;
          }`;

        const vs = compileShader(gl.VERTEX_SHADER, vert);
        const fs = compileShader(gl.FRAGMENT_SHADER, frag);
        program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        gl.useProgram(program);

        // Full-screen triangle
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
        const posLoc = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        // Cache uniform locations
        ['iTime','iResolution','rayPos','rayDir','raysColor','raysSpeed',
         'lightSpread','rayLength','pulsating','fadeDistance','saturation',
         'mousePos','mouseInfluence','noiseAmount','distortion'].forEach(n => {
          uniLocs[n] = gl.getUniformLocation(program, n);
        });

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        function resizeGL() {
          const dpr = Math.min(window.devicePixelRatio||1, 2);
          const w = container.clientWidth, h = container.clientHeight;
          canvas.width  = w * dpr;
          canvas.height = h * dpr;
          canvas.style.width  = w + 'px';
          canvas.style.height = h + 'px';
          gl.viewport(0, 0, canvas.width, canvas.height);
        }

        resizeGL();
        const ro = window.ResizeObserver ? new ResizeObserver(resizeGL) : null;
        if (ro) ro.observe(container); else window.addEventListener('resize', resizeGL);

        if (cfg.followMouse) {
          window.addEventListener('mousemove', e => {
            const rect = container.getBoundingClientRect();
            mouseNorm.x = (e.clientX - rect.left) / rect.width;
            mouseNorm.y = (e.clientY - rect.top) / rect.height;
          }, { passive: true });
        }

        startTime = performance.now();
        rafId = requestAnimationFrame(frame);
      }

      function frame() {
        if (!gl || !program) return;
        const t = (performance.now() - startTime) * 0.001;
        const w = gl.canvas.width, h = gl.canvas.height;
        const dpr = Math.min(window.devicePixelRatio||1, 2);
        const cw = w / dpr, ch = h / dpr;

        // Smooth mouse
        const s = 0.92;
        smoothMouse.x = smoothMouse.x * s + mouseNorm.x * (1-s);
        smoothMouse.y = smoothMouse.y * s + mouseNorm.y * (1-s);

        const { anchor, dir } = getAnchorAndDir(cfg.raysOrigin, w, h);
        const color = hexToRgb(cfg.raysColor);

        gl.uniform1f(uniLocs.iTime,           t);
        gl.uniform2f(uniLocs.iResolution,      w, h);
        gl.uniform2f(uniLocs.rayPos,           anchor[0], anchor[1]);
        gl.uniform2f(uniLocs.rayDir,           dir[0], dir[1]);
        gl.uniform3f(uniLocs.raysColor,        color[0], color[1], color[2]);
        gl.uniform1f(uniLocs.raysSpeed,        cfg.raysSpeed);
        gl.uniform1f(uniLocs.lightSpread,      cfg.lightSpread);
        gl.uniform1f(uniLocs.rayLength,        cfg.rayLength);
        gl.uniform1f(uniLocs.pulsating,        cfg.pulsating ? 1.0 : 0.0);
        gl.uniform1f(uniLocs.fadeDistance,     cfg.fadeDistance);
        gl.uniform1f(uniLocs.saturation,       cfg.saturation);
        gl.uniform2f(uniLocs.mousePos,         smoothMouse.x, smoothMouse.y);
        gl.uniform1f(uniLocs.mouseInfluence,   cfg.mouseInfluence);
        gl.uniform1f(uniLocs.noiseAmount,      cfg.noiseAmount);
        gl.uniform1f(uniLocs.distortion,       cfg.distortion);

        gl.clearColor(0,0,0,0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        rafId = requestAnimationFrame(frame);
      }

      function destroy() { cancelAnimationFrame(rafId); }

      return { init, destroy };
    })();

    // ─── SIDE RAYS — C# Flute / Play Overlay section ──────────────────────────
    // Pure WebGL implementation of the React Bits SideRays component.
    const sideRaysState = (() => {
      const cfg = {
        speed:      2.5,
        rayColor1:  '#EAB308',
        rayColor2:  '#96c8ff',
        intensity:  2,
        spread:     2,
        origin:     'top-right',
        tilt:       0,
        saturation: 1.5,
        blend:      0.75,
        falloff:    1.6,
        opacity:    0.8,
      };

      let gl = null, program = null, rafId = null;
      let uniLocs = {};
      let startTime = performance.now();
      let container = null;
      let isVisible = false;

      function hexToRgb(hex) {
        const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return m ? [parseInt(m[1],16)/255, parseInt(m[2],16)/255, parseInt(m[3],16)/255] : [1,1,1];
      }

      function originToFlip(origin) {
        switch (origin) {
          case 'top-left':    return [1, 0];
          case 'bottom-right':return [0, 1];
          case 'bottom-left': return [1, 1];
          default:            return [0, 0];
        }
      }

      function compileShader(type, src) {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        return sh;
      }

      function init() {
        container = document.getElementById('side-rays-container');
        if (!container) return;

        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
        container.appendChild(canvas);

        gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false }) ||
             canvas.getContext('experimental-webgl', { alpha: true });
        if (!gl) return;

        const vert = `
          attribute vec2 position;
          void main() {
            gl_Position = vec4(position, 0.0, 1.0);
          }`;

        const frag = `
          precision highp float;
          uniform float iTime;
          uniform vec2  iResolution;
          uniform float iSpeed;
          uniform vec3  iRayColor1;
          uniform vec3  iRayColor2;
          uniform float iIntensity;
          uniform float iSpread;
          uniform float iFlipX;
          uniform float iFlipY;
          uniform float iTilt;
          uniform float iSaturation;
          uniform float iBlend;
          uniform float iFalloff;
          uniform float iOpacity;

          float rayStrength(vec2 raySource, vec2 rayRefDir, vec2 coord,
                            float seedA, float seedB, float speed) {
            vec2 sourceToCoord = coord - raySource;
            float cosAngle = dot(normalize(sourceToCoord), rayRefDir);
            return clamp(
              (0.45 + 0.15 * sin(cosAngle * seedA + iTime * speed)) +
              (0.3  + 0.2  * cos(-cosAngle * seedB + iTime * speed)),
              0.0, 1.0) *
              clamp((iResolution.x - length(sourceToCoord)) / iResolution.x, 0.5, 1.0);
          }

          void main() {
            vec2 fragCoord = gl_FragCoord.xy;
            if (iFlipX > 0.5) fragCoord.x = iResolution.x - fragCoord.x;
            if (iFlipY > 0.5) fragCoord.y = iResolution.y - fragCoord.y;
            vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
            vec2 rayPos = vec2(iResolution.x * 1.1, -0.5 * iResolution.y);
            float tiltRad = iTilt * 3.14159265 / 180.0;
            float cs = cos(tiltRad), sn = sin(tiltRad);
            vec2 rel = coord - rayPos;
            vec2 tiltedCoord = vec2(rel.x*cs - rel.y*sn, rel.x*sn + rel.y*cs) + rayPos;
            float halfSpread = iSpread * 0.275;
            vec2 rd1 = normalize(vec2(cos(0.785398 + halfSpread), sin(0.785398 + halfSpread)));
            vec2 rd2 = normalize(vec2(cos(0.785398 - halfSpread), sin(0.785398 - halfSpread)));
            vec4 r1 = vec4(iRayColor1, 1.0) * rayStrength(rayPos, rd1, tiltedCoord, 36.2214, 21.11349, iSpeed);
            vec4 r2 = vec4(iRayColor2, 1.0) * rayStrength(rayPos, rd2, tiltedCoord, 22.3991, 18.0234, iSpeed * 0.2);
            vec4 color = r1 * (1.0 - iBlend) * 0.9 + r2 * iBlend * 0.9;
            float distToLight = length(fragCoord.xy - vec2(rayPos.x, iResolution.y - rayPos.y)) / iResolution.y;
            float brightness = iIntensity * 0.4 / pow(max(distToLight, 0.001), iFalloff);
            color.rgb *= brightness;
            float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
            color.rgb = mix(vec3(gray), color.rgb, iSaturation);
            color.a = max(color.r, max(color.g, color.b)) * iOpacity;
            gl_FragColor = color;
          }`;

        const vs = compileShader(gl.VERTEX_SHADER, vert);
        const fs = compileShader(gl.FRAGMENT_SHADER, frag);
        program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        gl.useProgram(program);

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
        const posLoc = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        ['iTime','iResolution','iSpeed','iRayColor1','iRayColor2','iIntensity',
         'iSpread','iFlipX','iFlipY','iTilt','iSaturation','iBlend','iFalloff','iOpacity'].forEach(n => {
          uniLocs[n] = gl.getUniformLocation(program, n);
        });

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        function resizeGL() {
          const dpr = Math.min(window.devicePixelRatio||1, 2);
          const w = container.clientWidth, h = container.clientHeight;
          canvas.width  = w * dpr;
          canvas.height = h * dpr;
          canvas.style.width  = w + 'px';
          canvas.style.height = h + 'px';
          gl.viewport(0, 0, canvas.width, canvas.height);
        }

        resizeGL();
        const ro = window.ResizeObserver ? new ResizeObserver(resizeGL) : null;
        if (ro) ro.observe(container); else window.addEventListener('resize', resizeGL);

        // Only animate when play overlay is visible (performance)
        const playOverlay = document.getElementById('play-overlay');
        const mo = new MutationObserver(() => {
          isVisible = playOverlay.classList.contains('visible');
          if (isVisible && !rafId) {
            startTime = performance.now();
            rafId = requestAnimationFrame(frame);
          }
        });
        mo.observe(playOverlay, { attributes: true, attributeFilter: ['class'] });
        // Don't start the loop until visible
      }

      function frame() {
        if (!gl || !program || !isVisible) { rafId = null; return; }
        const t = (performance.now() - startTime) * 0.001;
        const w = gl.canvas.width, h = gl.canvas.height;
        const c1 = hexToRgb(cfg.rayColor1), c2 = hexToRgb(cfg.rayColor2);
        const [flipX, flipY] = originToFlip(cfg.origin);

        gl.uniform1f(uniLocs.iTime,        t);
        gl.uniform2f(uniLocs.iResolution,   w, h);
        gl.uniform1f(uniLocs.iSpeed,        cfg.speed);
        gl.uniform3f(uniLocs.iRayColor1,    c1[0], c1[1], c1[2]);
        gl.uniform3f(uniLocs.iRayColor2,    c2[0], c2[1], c2[2]);
        gl.uniform1f(uniLocs.iIntensity,    cfg.intensity);
        gl.uniform1f(uniLocs.iSpread,       cfg.spread);
        gl.uniform1f(uniLocs.iFlipX,        flipX);
        gl.uniform1f(uniLocs.iFlipY,        flipY);
        gl.uniform1f(uniLocs.iTilt,         cfg.tilt);
        gl.uniform1f(uniLocs.iSaturation,   cfg.saturation);
        gl.uniform1f(uniLocs.iBlend,        cfg.blend);
        gl.uniform1f(uniLocs.iFalloff,      cfg.falloff);
        gl.uniform1f(uniLocs.iOpacity,      cfg.opacity);

        gl.clearColor(0,0,0,0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        rafId = requestAnimationFrame(frame);
      }

      function destroy() { cancelAnimationFrame(rafId); }

      return { init, destroy };
    })();

    // ─── BOOT SEQUENCE ─────────────────────────────────────────────────────────
    async function boot() {
      let modelLoadFailed = false;

      try {
        await domReady();
        textTyper.initCursorBlink(); // start cursor blinking immediately
        setProgress(10, 'DOM ready');

        renderCarousel();
        bindInteractions();
        bindPlayPage();
        initWheelScroll();
        initScrollbar();

        await document.fonts.ready;
        setProgress(20, 'Fonts resolved');



        await waitForGlobal(() =>
          window.GestureRecognizer && window.FilesetResolver
        );
        setProgress(55, 'MediaPipe tasks-vision script loaded');

        // Step 6: fetch + init gesture model
        setProgress(60, 'Fetching gesture model');
        try {
          await fetchModel();
          await initGestureRecognizer();
          setProgress(75, 'Gesture model ready');
        } catch (modelErr) {
          // Toast already shown by fetchModel(); keep START disabled
          modelLoadFailed = true;
          setProgress(75, 'Gesture model unavailable');
        }

        // Step 7: decode audio (temporary context — no autoplay policy issue)
        setProgress(78, 'Decoding swaras');
        await preDecodeAudio();
        setProgress(90, 'Seven swaras decoded');

        // Step 8: Initialize Galaxy background
        galaxyState.init();
        // Initialize motion backgrounds for all sections
        lightRaysState.init();
        sideRaysState.init();
        await nextFrame();
        setProgress(95, 'Motion backgrounds initialized');

        setProgress(100, 'Ready');

        // Enable START only if model loaded successfully
        if (!modelLoadFailed) {
          document.getElementById('startBtn').disabled = false;
        }

      } catch (err) {
        console.error('[FluteVerse boot error]', err);
        setProgress(100, 'Loaded with a recoverable issue');
        galaxyState.init();
        lightRaysState.init();
        sideRaysState.init();

      } finally {
        // Start the single unified RAF loop
        requestAnimationFrame(mainLoop);
        await hideLoader(); // hideLoader calls initHeroAnimation internally after fade
      }
    }

    boot();

    // ─── DECRYPTED TEXT — vanilla port of React Bits DecryptedText ─────────────
    function decryptedText(el, options = {}) {
      const {
        speed           = 50,
        maxIterations   = 10,
        sequential      = true,
        revealDirection = 'start',
        characters      = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*_+=-',
        encryptedClass  = 'dt-encrypted',
        revealedClass   = 'dt-revealed',
      } = options;

      const originalText = el.textContent;
      const chars        = characters.split('');

      function randChar() {
        return chars[Math.floor(Math.random() * chars.length)];
      }

      function buildOrder(len) {
        const order = [];
        if (revealDirection === 'end') {
          for (let i = len - 1; i >= 0; i--) order.push(i);
        } else if (revealDirection === 'center') {
          const mid = Math.floor(len / 2);
          let offset = 0;
          while (order.length < len) {
            const a = mid + Math.floor(offset / 2);
            const b = mid - Math.ceil(offset / 2);
            if (offset % 2 === 0 && a < len)       order.push(a);
            else if (offset % 2 !== 0 && b >= 0)   order.push(b);
            offset++;
          }
        } else {
          for (let i = 0; i < len; i++) order.push(i);
        }
        return order;
      }

      function render(displayArr, revealed) {
        el.innerHTML = '';
        displayArr.forEach((ch, i) => {
          const span = document.createElement('span');
          span.textContent = ch;
          span.className = revealed.has(i) ? revealedClass : encryptedClass;
          el.appendChild(span);
        });
      }

      function scramble(revealed) {
        return originalText.split('').map((ch, i) => {
          if (ch === ' ') return ' ';
          if (revealed.has(i)) return originalText[i];
          return randChar();
        });
      }

      let intervalId = null;
      const revealed = new Set();
      const order    = buildOrder(originalText.length);
      let orderPtr   = 0;
      let iteration  = 0;

      render(scramble(revealed), revealed);

      intervalId = setInterval(() => {
        if (sequential) {
          if (orderPtr < order.length) {
            revealed.add(order[orderPtr++]);
            render(scramble(revealed), revealed);
          } else {
            clearInterval(intervalId);
            el.innerHTML = '';
            originalText.split('').forEach((ch, i) => {
              const span = document.createElement('span');
              span.textContent = ch;
              span.className = revealedClass;
              el.appendChild(span);
            });
          }
        } else {
          iteration++;
          if (iteration >= maxIterations) {
            clearInterval(intervalId);
            el.innerHTML = '';
            originalText.split('').forEach(ch => {
              const span = document.createElement('span');
              span.textContent = ch;
              span.className = revealedClass;
              el.appendChild(span);
            });
          } else {
            render(scramble(revealed), revealed);
          }
        }
      }, speed);
    }

    // ── "Choose a flute scale to begin" — fires when carousel scrolls into view
    (function () {
      const el = document.getElementById('carouselSubtitle');
      if (!el) return;
      let fired = false;
      const io  = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !fired) {
            fired = true;
            io.disconnect();
            setTimeout(() => decryptedText(el, {
              speed: 45,
              sequential: true,
              revealDirection: 'start',
            }), 300);
          }
        });
      }, { threshold: 0.2 });
      io.observe(el);
    })();

    // ── "GESTURE MODE — C# MAJOR SCALE" — fires each time play overlay opens
    (function () {
      const overlay = document.getElementById('play-overlay');
      const el      = document.getElementById('playSubtitle');
      if (!overlay || !el) return;
      const originalText = el.textContent;
      let lastVisible = false;
      const mo = new MutationObserver(() => {
        const isVisible = overlay.classList.contains('visible');
        if (isVisible && !lastVisible) {
          el.textContent = originalText; // reset before re-animating
          setTimeout(() => decryptedText(el, {
            speed: 35,
            sequential: true,
            revealDirection: 'start',
          }), 200);
        }
        lastVisible = isVisible;
      });
      mo.observe(overlay, { attributes: true, attributeFilter: ['class'] });
    })();

    // ─── GRADIENT TEXT — vanilla port of React Bits GradientText ───────────────
    // Reads every .gradient-text-el, applies animated gradient via CSS custom prop.
    (function initGradientText() {
      const els = document.querySelectorAll('.gradient-text-el');
      if (!els.length) return;

      els.forEach(el => {
        const colors     = (el.dataset.colors || '#ffffff,#00FFE0,#ffffff').split(',').map(s => s.trim());
        const speed      = parseFloat(el.dataset.speed || '5') * 1000; // ms per cycle
        const yoyo       = el.dataset.yoyo !== 'false';

        // Build gradient: duplicate first color at end for seamless loop
        const stops      = [...colors, colors[0]].join(', ');
        el.style.backgroundImage  = `linear-gradient(to right, ${stops})`;
        el.style.backgroundSize   = '300% 100%';
        el.style.backgroundRepeat = 'no-repeat';
        el.style.backgroundClip  = 'text';
        el.style.webkitBackgroundClip = 'text';
        el.style.webkitTextFillColor  = 'transparent';
        el.style.color = 'transparent';
        el.style.display = 'inline';

        let start    = null;
        let rafId    = null;
        let running  = true;

        function tick(ts) {
          if (!running) return;
          if (!start) start = ts;
          const elapsed = ts - start;

          let pct;
          if (yoyo) {
            const full  = speed * 2;
            const cycle = elapsed % full;
            pct = cycle < speed
              ? (cycle / speed) * 100
              : 100 - ((cycle - speed) / speed) * 100;
          } else {
            pct = ((elapsed / speed) * 100) % 100;
          }

          el.style.backgroundPosition = `${pct}% 50%`;
          rafId = requestAnimationFrame(tick);
        }

        rafId = requestAnimationFrame(tick);

        // Expose cleanup in case needed
        el._stopGradient = () => { running = false; cancelAnimationFrame(rafId); };
      });
    })();

    // ─── FUZZY TEXT — vanilla port of React Bits FuzzyText ────────────────────
    // Renders canvas-based fuzzy text for the FLUTEVERSE brand logo.
    (function initFuzzyText() {
      const canvas = document.getElementById('fuzzyBrandCanvas');
      if (!canvas) return;

      const TEXT           = 'FLUTEVERSE';
      const FONT_SIZE      = 28;           // matches .brand font-size
      const FONT_WEIGHT    = 400;
      const FONT_FAMILY    = '"Bebas Neue", sans-serif';
      const COLOR          = '#ffffff';
      const BASE_INTENSITY = 0.08;
      const HOVER_INTENSITY= 0.45;
      const FUZZ_RANGE     = 6;
      const FPS            = 60;
      const TRANS_FRAMES   = 12;          // smooth transition
      const LETTER_SPACING = 6;           // matches letter-spacing: 6px

      const frameDuration = 1000 / FPS;
      let isCancelled = false;
      let animId;

      async function init() {
        const ctx = canvas.getContext('2d');

        // Wait for Bebas Neue to be ready
        try { await document.fonts.load(`${FONT_WEIGHT} ${FONT_SIZE}px "Bebas Neue"`); }
        catch { await document.fonts.ready; }
        if (isCancelled) return;

        // ── offscreen render ────────────────────────────────────────────────
        const off    = document.createElement('canvas');
        const offCtx = off.getContext('2d');
        const fontStr = `${FONT_WEIGHT} ${FONT_SIZE}px ${FONT_FAMILY}`;
        offCtx.font = fontStr;
        offCtx.textBaseline = 'alphabetic';

        // Measure with letter spacing
        let totalW = 0;
        for (const ch of TEXT) totalW += offCtx.measureText(ch).width + LETTER_SPACING;
        totalW -= LETTER_SPACING;

        const metrics    = offCtx.measureText(TEXT);
        const ascent     = metrics.actualBoundingBoxAscent  ?? FONT_SIZE;
        const descent    = metrics.actualBoundingBoxDescent ?? FONT_SIZE * 0.2;
        const tightH     = Math.ceil(ascent + descent);
        const bufW       = Math.ceil(totalW) + 10;

        off.width  = bufW;
        off.height = tightH;

        offCtx.font      = fontStr;
        offCtx.textBaseline = 'alphabetic';
        offCtx.fillStyle    = COLOR;

        let xPos = 5;
        for (const ch of TEXT) {
          offCtx.fillText(ch, xPos, ascent);
          xPos += offCtx.measureText(ch).width + LETTER_SPACING;
        }

        // ── main canvas size ────────────────────────────────────────────────
        const hMargin = FUZZ_RANGE + 4;
        canvas.width  = bufW + hMargin * 2;
        canvas.height = tightH;
        ctx.translate(hMargin, 0);

        // ── interaction state ───────────────────────────────────────────────
        let isHovering        = false;
        let currentIntensity  = BASE_INTENSITY;
        let targetIntensity   = BASE_INTENSITY;
        let lastFrame         = 0;
        const step            = 1 / TRANS_FRAMES;

        const onMove = e => {
          const r = canvas.getBoundingClientRect();
          const x = e.clientX - r.left - hMargin;
          const y = e.clientY - r.top;
          isHovering = x >= 0 && x <= bufW && y >= 0 && y <= tightH;
        };
        const onLeave = () => { isHovering = false; };
        canvas.addEventListener('mousemove', onMove);
        canvas.addEventListener('mouseleave', onLeave);

        // ── rickroll easter egg ─────────────────────────────────────────────
        canvas.addEventListener('click', () => {
          window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank');
        });

        // ── render loop ─────────────────────────────────────────────────────
        function render(ts) {
          if (isCancelled) return;
          if (ts - lastFrame < frameDuration) { animId = requestAnimationFrame(render); return; }
          lastFrame = ts;

          targetIntensity = isHovering ? HOVER_INTENSITY : BASE_INTENSITY;
          if (currentIntensity < targetIntensity)
            currentIntensity = Math.min(currentIntensity + step * HOVER_INTENSITY, targetIntensity);
          else if (currentIntensity > targetIntensity)
            currentIntensity = Math.max(currentIntensity - step * HOVER_INTENSITY, targetIntensity);

          ctx.clearRect(-hMargin - 2, -2, bufW + hMargin * 2 + 4, tightH + 4);

          for (let j = 0; j < tightH; j++) {
            const dx = Math.floor(currentIntensity * (Math.random() - 0.5) * FUZZ_RANGE * 2);
            ctx.drawImage(off, 0, j, bufW, 1, dx, j, bufW, 1);
          }

          animId = requestAnimationFrame(render);
        }
        animId = requestAnimationFrame(render);
      }

      init();

      // Also remove old brandLogo click handler from previous implementation
      const oldBrand = document.getElementById('brandLogo');
      if (oldBrand) oldBrand.style.cursor = 'pointer';
    })();

    // ─── CURVED LOOP — vanilla port of React Bits CurvedLoop ──────────────────
    (function initCurvedLoop() {
      const container = document.getElementById('curved-loop-container');
      if (!container) return;

      const MARQUEE_TEXT = '✦ Made ✦ For ✦ Demo ✦ Day ✦ By ✦ Ricco Marcelino ';
      const SPEED        = 3;
      const CURVE_AMOUNT = 0;
      const DIRECTION    = 'right';
      const INTERACTIVE  = true;

      // Build SVG
      const svgNS  = 'http://www.w3.org/2000/svg';
      const uid    = 'cl-' + Math.random().toString(36).slice(2, 8);
      const pathId = 'curve-' + uid;
      const pathD  = `M-100,40 Q720,${40 + CURVE_AMOUNT} 1540,40`;

      const jacket = document.createElement('div');
      jacket.className = 'curved-loop-jacket';

      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('viewBox', '0 0 1440 120');
      svg.classList.add('curved-loop-svg');

      // Hidden measure text
      const measureText = document.createElementNS(svgNS, 'text');
      measureText.setAttribute('xml:space', 'preserve');
      measureText.style.cssText = 'visibility:hidden;opacity:0;pointer-events:none;';
      measureText.textContent = MARQUEE_TEXT;
      svg.appendChild(measureText);

      // Defs + path
      const defs = document.createElementNS(svgNS, 'defs');
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('id', pathId);
      path.setAttribute('d', pathD);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'transparent');
      defs.appendChild(path);
      svg.appendChild(defs);

      // Visible text on path
      const textEl     = document.createElementNS(svgNS, 'text');
      textEl.setAttribute('font-weight', 'bold');
      textEl.setAttribute('xml:space', 'preserve');
      const textPath   = document.createElementNS(svgNS, 'textPath');
      textPath.setAttribute('href', '#' + pathId);
      textPath.setAttribute('xml:space', 'preserve');
      textEl.appendChild(textPath);
      svg.appendChild(textEl);

      jacket.appendChild(svg);
      container.appendChild(jacket);

      // Wait for fonts, then measure + start loop
      document.fonts.ready.then(() => {
        // Copy computed font styles to measure text
        const computedStyle = window.getComputedStyle(svg);
        measureText.style.fontFamily = '"Bebas Neue", sans-serif';
        measureText.style.fontSize   = '1.8rem';
        measureText.style.fontWeight = '700';
        measureText.style.letterSpacing = '4px';

        // Must be in DOM to measure
        const spacing = measureText.getComputedTextLength();
        if (!spacing) return;

        // Fill with enough copies to overflow
        const copies  = Math.ceil(1800 / spacing) + 2;
        textPath.textContent = Array(copies).fill(MARQUEE_TEXT).join('');

        let offset  = -spacing;
        textPath.setAttribute('startOffset', offset + 'px');

        // Drag state
        let dragging  = false;
        let lastX     = 0;
        let velocity  = 0;
        let dir       = DIRECTION;

        jacket.style.cursor = INTERACTIVE ? 'grab' : 'auto';
        jacket.style.visibility = 'visible';

        if (INTERACTIVE) {
          jacket.addEventListener('pointerdown', e => {
            dragging  = true;
            lastX     = e.clientX;
            velocity  = 0;
            jacket.style.cursor = 'grabbing';
            jacket.setPointerCapture(e.pointerId);
          });
          jacket.addEventListener('pointermove', e => {
            if (!dragging) return;
            const dx = e.clientX - lastX;
            lastX    = e.clientX;
            velocity = dx;
            offset  += dx;
            if (offset <= -spacing) offset += spacing;
            if (offset > 0)         offset -= spacing;
            textPath.setAttribute('startOffset', offset + 'px');
          });
          const endDrag = () => {
            if (!dragging) return;
            dragging = false;
            dir      = velocity > 0 ? 'right' : 'left';
            jacket.style.cursor = 'grab';
          };
          jacket.addEventListener('pointerup',    endDrag);
          jacket.addEventListener('pointerleave', endDrag);
        }

        // Animation loop
        function tick() {
          if (!dragging) {
            const delta = dir === 'right' ? SPEED : -SPEED;
            offset += delta;
            if (offset <= -spacing) offset += spacing;
            if (offset > 0)         offset -= spacing;
            textPath.setAttribute('startOffset', offset + 'px');
          }
          requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    })();

    // ─── ROADMAP FEATURES DATA ─────────────────────────────────────────────────
    const ROADMAP_FEATURES = [
      { title: 'DUAL HAND CONTROL', desc: 'Play two-handed gestures for complex compositions and chord-style combinations.' },
      { title: 'BREATH INTENSITY', desc: 'A second MediaPipe model tracks lip openness in real time. Open wider to blow harder and control volume naturally.' },
      { title: 'MULTI-ANGLE GESTURE RECOGNITION', desc: 'Improved model accuracy across different hand angles, distances and orientations.' },
      { title: '2ND, 3RD & 4TH OCTAVE SUPPORT', desc: 'Extend beyond one octave and unlock the full bansuri range.' },
      { title: 'HALF NOTES & MICROTONES', desc: 'Additional gesture shapes for komal and tivra swaras.' },
      { title: 'ALL FLUTE SCALES', desc: 'C, D, E, F and additional scales available to play.' },
      { title: 'LEARN EASY SONGS', desc: 'Step-by-step guided melodies and ragas.' },
      { title: 'RECORDING & PLAYBACK', desc: 'Save performances and replay them later.' },
      { title: 'QUALITY OF LIFE IMPROVEMENTS', desc: 'Faster loading, smoother animations and improved mobile support.' }
    ];

    // ─── ROADMAP INIT ──────────────────────────────────────────────────────────
    (function initRoadmap() {
      const rail = document.getElementById('roadmapRail');
      if (!rail) return;

      ROADMAP_FEATURES.forEach((f, i) => {
        const item = document.createElement('div');
        item.className = 'feature-item';
        item.innerHTML = `<h3 class="feature-title" data-index="${i}">${f.title}</h3><p class="feature-desc">${f.desc}</p>`;
        rail.appendChild(item);
      });

      const titles = rail.querySelectorAll('.feature-title');
      
      // Don't blur any titles initially — let all be visible
      // Only blur on scroll if they're far from center
      let rafId;
      function updateFocus() {
        const section = document.getElementById('roadmap');
        if (!section) return;
        
        const sectionRect = section.getBoundingClientRect();
        const centerX = sectionRect.left + sectionRect.width / 2;

        titles.forEach(title => {
          const rect = title.getBoundingClientRect();
          const titleCenterX = rect.left + rect.width / 2;
          const distFromCenter = Math.abs(titleCenterX - centerX);
          
          // Only blur if very far from viewport center (more than 600px away)
          title.classList.toggle('blurred', distFromCenter > 600);
        });
      }

      rail.addEventListener('scroll', () => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(updateFocus);
      });

      // Initial — don't blur anything
      setTimeout(updateFocus, 100);

      const marquee = document.getElementById('roadmapMarquee');
      if (marquee) {
        const text = marquee.textContent;
        marquee.textContent = text + text + text;
      }
    })();

    // ─── FLOATING LINES BACKGROUND ─────────────────────────────────────────────
    (function initFloatingLines() {
      const container = document.getElementById('floating-lines-container');
      if (!container || typeof THREE === 'undefined') return;

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      camera.position.z = 1;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
      container.appendChild(renderer.domElement);

      const vertexShader = `void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
      const fragmentShader = `
        uniform float iTime;
        uniform vec3 iResolution;
        float wave(vec2 uv, float offset) {
          float y = sin(uv.x + offset + iTime * 0.08) * 0.2;
          float m = uv.y - y;
          return 0.015 / max(abs(m) + 0.01, 1e-3);
        }
        void main() {
          vec2 uv = (2.0 * gl_FragCoord.xy - iResolution.xy) / iResolution.y;
          uv.y *= -1.0;
          vec3 col = vec3(0.0);
          vec3 cyan = vec3(0.0, 1.0, 0.88);
          for (int i = 0; i < 8; ++i) {
            float fi = float(i);
            col += cyan * wave(uv + vec2(0.05 * fi, 0.0), 1.0 + 0.2 * fi) * 0.15;
          }
          gl_FragColor = vec4(col, 1.0);
        }
      `;

      const uniforms = {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector3(1, 1, 1) }
      };

      const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
      const geometry = new THREE.PlaneGeometry(2, 2);
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      const clock = new THREE.Clock();

      function setSize() {
        const w = container.clientWidth || 1;
        const h = container.clientHeight || 1;
        renderer.setSize(w, h, false);
        uniforms.iResolution.value.set(renderer.domElement.width, renderer.domElement.height, 1);
      }
      setSize();

      const ro = new ResizeObserver(() => setSize());
      ro.observe(container);

      let active = true;
      function render() {
        if (!active) return;
        uniforms.iTime.value = clock.getElapsedTime();
        renderer.render(scene, camera);
        requestAnimationFrame(render);
      }
      render();
    })();

