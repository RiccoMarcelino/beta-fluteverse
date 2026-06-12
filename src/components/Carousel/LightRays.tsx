import { useEffect, useRef } from 'react';

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
float noise(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123); }
float rayStrength(vec2 raySource, vec2 rayRefDir, vec2 coord, float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  vec2 dirNorm = normalize(sourceToCoord);
  float cosAngle = dot(dirNorm, rayRefDir);
  float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
  float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));
  float dist = length(sourceToCoord);
  float maxDist = iResolution.x * rayLength;
  float lengthFalloff = clamp((maxDist - dist) / maxDist, 0.0, 1.0);
  float fadeFalloff = clamp((iResolution.x * fadeDistance - dist) / (iResolution.x * fadeDistance), 0.5, 1.0);
  float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;
  float base = clamp((0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) + (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)), 0.0, 1.0);
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

const CFG = {
  raysSpeed: 1.1,
  lightSpread: 0.6,
  rayLength: 1.2,
  mouseInfluence: 0.4,
  noiseAmount: 0.24,
  distortion: 0.1,
  fadeDistance: 0.8,
  saturation: 1.4,
  raysColor: [0.024, 0.714, 0.831] as const, // #06B6D4
};

export function LightRays() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    container.appendChild(canvas);
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vert));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uniforms = [
      'iTime','iResolution','rayPos','rayDir','raysColor','raysSpeed',
      'lightSpread','rayLength','pulsating','fadeDistance','saturation',
      'mousePos','mouseInfluence','noiseAmount','distortion',
    ];
    const uLoc: Record<string, WebGLUniformLocation | null> = {};
    uniforms.forEach(n => { uLoc[n] = gl.getUniformLocation(program, n); });

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    let mouseNorm = { x: 0.5, y: 0.5 };
    let smoothMouse = { x: 0.5, y: 0.5 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = container.clientWidth;
      const h = container.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseNorm.x = (e.clientX - rect.left) / rect.width;
      mouseNorm.y = (e.clientY - rect.top) / rect.height;
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const startTime = performance.now();
    let rafId = 0;
    const frameTick = () => {
      const t = (performance.now() - startTime) * 0.001;
      const w = gl.canvas.width;
      const h = gl.canvas.height;
      const s = 0.92;
      smoothMouse.x = smoothMouse.x * s + mouseNorm.x * (1 - s);
      smoothMouse.y = smoothMouse.y * s + mouseNorm.y * (1 - s);

      const outside = 0.2;
      const anchor = [0.5 * w, -outside * h];
      const dir = [0, 1];

      gl.uniform1f(uLoc.iTime, t);
      gl.uniform2f(uLoc.iResolution, w, h);
      gl.uniform2f(uLoc.rayPos, anchor[0], anchor[1]);
      gl.uniform2f(uLoc.rayDir, dir[0], dir[1]);
      gl.uniform3f(uLoc.raysColor, CFG.raysColor[0], CFG.raysColor[1], CFG.raysColor[2]);
      gl.uniform1f(uLoc.raysSpeed, CFG.raysSpeed);
      gl.uniform1f(uLoc.lightSpread, CFG.lightSpread);
      gl.uniform1f(uLoc.rayLength, CFG.rayLength);
      gl.uniform1f(uLoc.pulsating, 0);
      gl.uniform1f(uLoc.fadeDistance, CFG.fadeDistance);
      gl.uniform1f(uLoc.saturation, CFG.saturation);
      gl.uniform2f(uLoc.mousePos, smoothMouse.x, smoothMouse.y);
      gl.uniform1f(uLoc.mouseInfluence, CFG.mouseInfluence);
      gl.uniform1f(uLoc.noiseAmount, CFG.noiseAmount);
      gl.uniform1f(uLoc.distortion, CFG.distortion);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      rafId = requestAnimationFrame(frameTick);
    };
    rafId = requestAnimationFrame(frameTick);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('mousemove', onMove);
      canvas.remove();
    };
  }, []);

  return (
    <div
      id="light-rays-container"
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}
    />
  );
}
