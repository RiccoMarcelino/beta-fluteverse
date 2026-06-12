import { useEffect, useRef } from 'react';
import * as THREE from 'three';

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
}`;

export function FloatingLines() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    container.appendChild(renderer.domElement);

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector3(1, 1, 1) },
    };

    const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const clock = new THREE.Clock();

    const setSize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      uniforms.iResolution.value.set(renderer.domElement.width, renderer.domElement.height, 1);
    };
    setSize();
    const ro = new ResizeObserver(setSize);
    ro.observe(container);

    let active = true;
    let rafId = 0;
    const render = () => {
      if (!active) return;
      uniforms.iTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(render);
    };
    render();

    return () => {
      active = false;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      id="floating-lines-container"
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}
    />
  );
}
