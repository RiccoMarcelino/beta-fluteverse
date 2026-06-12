import { useEffect, useRef } from 'react';

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
float Hash21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float tri(float x){ return abs(fract(x)*2.0-1.0); }
float tris(float x){ float t=fract(x); return 1.0-smoothstep(0.0,1.0,abs(2.0*t-1.0)); }
float trisn(float x){ float t=fract(x); return 2.0*(1.0-smoothstep(0.0,1.0,abs(2.0*t-1.0)))-1.0; }
vec3 hsv2rgb(vec3 c){ vec4 K=vec4(1.0,2.0/3.0,1.0/3.0,3.0); vec3 p=abs(fract(c.xxx+K.xyz)*6.0-K.www); return c.z*mix(K.xxx,clamp(p-K.xxx,0.0,1.0),c.y); }
float Star(vec2 uv, float flare){
  float d=length(uv);
  float m=(0.05*uGlowIntensity)/d;
  float rays=smoothstep(0.0,1.0,1.0-abs(uv.x*uv.y*1000.0));
  m+=rays*flare*uGlowIntensity;
  uv*=MAT45;
  rays=smoothstep(0.0,1.0,1.0-abs(uv.x*uv.y*1000.0));
  m+=rays*0.3*flare*uGlowIntensity;
  m*=smoothstep(1.0,0.2,d);
  return m;
}
vec3 StarLayer(vec2 uv){
  vec3 col=vec3(0.0);
  vec2 gv=fract(uv)-0.5;
  vec2 id=floor(uv);
  for(int y=-1;y<=1;y++){
    for(int x=-1;x<=1;x++){
      vec2 offset=vec2(float(x),float(y));
      vec2 si=id+offset;
      float seed=Hash21(si);
      float size=fract(seed*345.32);
      float glossLocal=tri(uStarSpeed/(PERIOD*seed+1.0));
      float flareSize=smoothstep(0.9,1.0,size)*glossLocal;
      float red=smoothstep(STAR_COLOR_CUTOFF,1.0,Hash21(si+1.0))+STAR_COLOR_CUTOFF;
      float blu=smoothstep(STAR_COLOR_CUTOFF,1.0,Hash21(si+3.0))+STAR_COLOR_CUTOFF;
      float grn=min(red,blu)*seed;
      vec3 base=vec3(red,grn,blu);
      float hue=atan(base.g-base.r,base.b-base.r)/(2.0*3.14159)+0.5;
      hue=fract(hue+uHueShift/360.0);
      float sat=length(base-vec3(dot(base,vec3(0.299,0.587,0.114))))*uSaturation;
      float val=max(max(base.r,base.g),base.b);
      base=hsv2rgb(vec3(hue,sat,val));
      vec2 pad=vec2(tris(seed*34.0+uTime*uSpeed/10.0), tris(seed*38.0+uTime*uSpeed/30.0))-0.5;
      float star=Star(gv-offset-pad,flareSize);
      float twinkle=trisn(uTime*uSpeed+seed*6.2831)*0.5+1.0;
      twinkle=mix(1.0,twinkle,uTwinkleIntensity);
      star*=twinkle;
      float isWhite=step(0.5,Hash21(si+7.3));
      vec3 tint=mix(uTintColor,vec3(1.0),isWhite);
      col+=star*size*base*tint;
    }
  }
  return col;
}
void main(){
  vec2 focalPx=uFocal*uResolution.xy;
  vec2 uv=(vUv*uResolution.xy-focalPx)/uResolution.y;
  if(uAutoCenterRepulsion>0.0){
    vec2 cUV=vec2(0.0);
    float cDist=length(uv-cUV);
    vec2 rep=normalize(uv-cUV)*(uAutoCenterRepulsion/(cDist+0.1));
    uv+=rep*0.05;
  } else if(uMouseRepulsion){
    vec2 mUV=(uMouse*uResolution.xy-focalPx)/uResolution.y;
    float mDist=length(uv-mUV);
    vec2 rep=normalize(uv-mUV)*(uRepulsionStrength/(mDist+0.1));
    uv+=rep*0.05*uMouseActiveFactor;
  } else { uv+=(uMouse-vec2(0.5))*0.1*uMouseActiveFactor; }
  float ang=uTime*uRotationSpeed;
  mat2 rot=mat2(cos(ang),-sin(ang),sin(ang),cos(ang));
  uv=rot*uv;
  uv=mat2(uRotation.x,-uRotation.y,uRotation.y,uRotation.x)*uv;
  vec3 col=vec3(0.0);
  for(float i=0.0;i<1.0;i+=1.0/NUM_LAYER){
    float depth=fract(i+uStarSpeed*uSpeed);
    float scale=mix(20.0*uDensity,0.5*uDensity,depth);
    float fade=depth*smoothstep(1.0,0.9,depth);
    col+=StarLayer(uv*scale+i*453.32)*fade;
  }
  if(uTransparent){
    float alpha=length(col);
    alpha=smoothstep(0.0,0.3,alpha);
    alpha=min(alpha,1.0);
    gl_FragColor=vec4(col,alpha);
  } else { gl_FragColor=vec4(col,1.0); }
}`;

const CFG = {
  focal: [0.5, 0.5] as const,
  rotation: [1.0, 0.0] as const,
  starSpeed: 0.5,
  density: 1.5,
  hueShift: 0,
  speed: 1.0,
  glowIntensity: 0.5,
  saturation: 0.0,
  mouseRepulsion: true,
  repulsionStrength: 2,
  twinkleIntensity: 0.3,
  rotationSpeed: 0.1,
  autoCenterRepulsion: 0,
  transparent: true,
};

export function Galaxy() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    container.appendChild(canvas);

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, vertSrc);
    const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

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

    const uniforms = [
      'uTime','uResolution','uFocal','uRotation','uStarSpeed','uDensity',
      'uHueShift','uSpeed','uMouse','uGlowIntensity','uSaturation',
      'uMouseRepulsion','uTwinkleIntensity','uRotationSpeed','uRepulsionStrength',
      'uMouseActiveFactor','uAutoCenterRepulsion','uTransparent','uTintColor',
    ];
    const uLoc: Record<string, WebGLUniformLocation | null> = {};
    uniforms.forEach(n => { uLoc[n] = gl.getUniformLocation(program, n); });

    let targetMouse = { x: 0.5, y: 0.5 };
    let smoothMouse = { x: 0.5, y: 0.5 };
    let targetActive = 0;
    let smoothActive = 0;

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

    const heroSection = container.closest('#hero') as HTMLElement | null;
    const onMove = (e: MouseEvent) => {
      const rect = (heroSection ?? container).getBoundingClientRect();
      targetMouse.x = (e.clientX - rect.left) / rect.width;
      targetMouse.y = 1.0 - (e.clientY - rect.top) / rect.height;
      targetActive = 1.0;
    };
    const onLeave = () => { targetActive = 0; };
    (heroSection ?? container).addEventListener('mousemove', onMove, { passive: true });
    (heroSection ?? container).addEventListener('mouseleave', onLeave);

    let rafId = 0;
    const frame = (t: number) => {
      const time = t * 0.001;
      const starSpeedVal = time * CFG.starSpeed / 10.0;
      const w = gl.canvas.width;
      const h = gl.canvas.height;
      const aspect = w / Math.max(h, 1);
      const lf = 0.05;
      smoothMouse.x += (targetMouse.x - smoothMouse.x) * lf;
      smoothMouse.y += (targetMouse.y - smoothMouse.y) * lf;
      smoothActive  += (targetActive - smoothActive) * lf;

      gl.uniform1f(uLoc.uTime,             time);
      gl.uniform3f(uLoc.uResolution,        w, h, aspect);
      gl.uniform2f(uLoc.uFocal,             CFG.focal[0], CFG.focal[1]);
      gl.uniform2f(uLoc.uRotation,          CFG.rotation[0], CFG.rotation[1]);
      gl.uniform1f(uLoc.uStarSpeed,         starSpeedVal);
      gl.uniform1f(uLoc.uDensity,           CFG.density);
      gl.uniform1f(uLoc.uHueShift,          CFG.hueShift);
      gl.uniform1f(uLoc.uSpeed,             CFG.speed);
      gl.uniform2f(uLoc.uMouse,             smoothMouse.x, smoothMouse.y);
      gl.uniform1f(uLoc.uGlowIntensity,     CFG.glowIntensity);
      gl.uniform1f(uLoc.uSaturation,        CFG.saturation);
      gl.uniform1i(uLoc.uMouseRepulsion,    CFG.mouseRepulsion ? 1 : 0);
      gl.uniform1f(uLoc.uTwinkleIntensity,  CFG.twinkleIntensity);
      gl.uniform1f(uLoc.uRotationSpeed,     CFG.rotationSpeed);
      gl.uniform1f(uLoc.uRepulsionStrength, CFG.repulsionStrength);
      gl.uniform1f(uLoc.uMouseActiveFactor, smoothActive);
      gl.uniform1f(uLoc.uAutoCenterRepulsion, CFG.autoCenterRepulsion);
      gl.uniform1i(uLoc.uTransparent,       CFG.transparent ? 1 : 0);
      gl.uniform3f(uLoc.uTintColor,         0.024, 0.714, 0.831);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      (heroSection ?? container).removeEventListener('mousemove', onMove);
      (heroSection ?? container).removeEventListener('mouseleave', onLeave);
      canvas.remove();
    };
  }, []);

  return (
    <div
      id="galaxy-container"
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}
    />
  );
}
