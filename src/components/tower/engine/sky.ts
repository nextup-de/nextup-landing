// The sky: a dome that follows the camera. Blue hour, the afterglow west-north-west, a few thin clouds catching
// the last light from below, the first stars overhead.
import { BackSide, Mesh, ShaderMaterial, SphereGeometry } from "three";
import { COMMON_GLSL, FRAG_END, type Layer, type Shared } from "./common";

const VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0);
  gl_Position = p.xyww; // on the far plane, behind everything
}`;

const FRAG = /* glsl */ `
varying vec3 vDir;
void main() {
  vec3 dir = normalize(vDir);
  vec3 col = skyColor(dir);
  float h = max(dir.y, 0.0);
  float az = atan(dir.x, -dir.z);
  float toward = dot(normalize(dir.xz + vec2(1e-5)), uGlowDir) * 0.5 + 0.5;

  // Clouds: long thin streaks low in the sky, drifting very slowly; warm underneath where they face the glow.
  vec2 q = vec2(az * 3.2 + uTime * 0.003, h * 58.0);
  float streak = noise21(q) * 0.55 + noise21(q * vec2(2.1, 2.7) + 7.0) * 0.3 + noise21(q * vec2(5.3, 6.1) + 3.0) * 0.15;
  float band = smoothstep(0.04, 0.1, h) * (1.0 - smoothstep(0.16, 0.34, h));
  float cloud = smoothstep(0.6, 0.82, streak) * band;
  vec3 lit = mix(vec3(0.2, 0.26, 0.44), vec3(0.96, 0.58, 0.46), pow(toward, 3.0));
  col = mix(col, lit, cloud * 0.22);

  // Stars: only high up, only a few, and they do not twinkle enough to notice.
  vec2 cell = vec2(az, dir.y) * 140.0;
  float star = step(0.9965, hash21(floor(cell))) * smoothstep(0.42, 0.0, length(fract(cell) - 0.5));
  col += vec3(0.8, 0.86, 1.0) * star * smoothstep(0.3, 0.6, h) * 0.5;

  col = mix(col, uDayColor, uDay);
  gl_FragColor = vec4(col, 1.0);
  ${FRAG_END}
}`;

export function createSky(shared: Shared): Layer {
  const material = new ShaderMaterial({
    uniforms: { ...shared }, vertexShader: `${COMMON_GLSL}\n${VERT}`, fragmentShader: `${COMMON_GLSL}\n${FRAG}`,
    side: BackSide, depthWrite: false, depthTest: true,
  });
  const mesh = new Mesh(new SphereGeometry(1, 32, 16), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  return { object: mesh, dispose: () => { mesh.geometry.dispose(); material.dispose(); } };
}
