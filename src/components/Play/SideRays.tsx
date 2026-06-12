import { useEffect, useRef } from 'react';

interface Props {
  /** Only animates while play overlay is visible. */
  active: boolean;
}

const frag = `
precision highp float;
uniform float iTime;
uniform vec2  iResolution;
uniform float iSpeed;
uniform vec3  iRayColor1;
uniform vec3  iRayColor2;
uniform float iIntensity;
uniform float iSpread;
uniform float iTilt;
uniform float iSaturation;
uniform float iBlend;
uniform float iFalloff;
uniform float iOpacity;
float rayStrength(vec2 raySource, vec2 rayRefDir, vec2 coord, float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  float cosAngle = dot(normalize(sourceToCoord), rayRefDir);
  return clamp((0.45 + 0.15 * sin(cosAngle * seedA + iTime * speed)) + (0.3 + 0.2 * cos(-cosAngle * seedB + iTime * speed)), 0.0, 1.0)
    * clamp((iResolution.x - length(sourceToCoord)) / iResolution.x, 0.5, 1.0);
}
void main() {
  vec2 fragCoord = gl_FragCoord.xy;
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

const vert = `attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

export function SideRays({ active }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

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

    const uniforms = ['iTime','iResolution','iSpeed','iRayColor1','iRayColor2','iIntensity','iSpread','iTilt','iSaturation','iBlend','iFalloff','iOpacity'];
    const uLoc: Record<string, WebGLUniformLocation | null> = {};
    uniforms.forEach(n => { uLoc[n] = gl.getUniformLocation(program, n); });

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

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

    let rafId = 0;
    const startTime = performance.now();
    const tick = () => {
      if (!activeRef.current) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      const t = (performance.now() - startTime) * 0.001;
      const w = gl.canvas.width;
      const h = gl.canvas.height;

      gl.uniform1f(uLoc.iTime, t);
      gl.uniform2f(uLoc.iResolution, w, h);
      gl.uniform1f(uLoc.iSpeed, 2.5);
      gl.uniform3f(uLoc.iRayColor1, 234/255, 179/255, 8/255);
      gl.uniform3f(uLoc.iRayColor2, 150/255, 200/255, 255/255);
      gl.uniform1f(uLoc.iIntensity, 2);
      gl.uniform1f(uLoc.iSpread, 2);
      gl.uniform1f(uLoc.iTilt, 0);
      gl.uniform1f(uLoc.iSaturation, 1.5);
      gl.uniform1f(uLoc.iBlend, 0.75);
      gl.uniform1f(uLoc.iFalloff, 1.6);
      gl.uniform1f(uLoc.iOpacity, 0.8);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      canvas.remove();
    };
  }, []);

  return (
    <div
      id="side-rays-container"
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}
    />
  );
}
