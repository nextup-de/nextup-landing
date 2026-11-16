// The tower scene's renderer. It draws one SceneState per frame (features/tower/story decides what that is) and
// runs the ambient life - wind, traffic, lamps - on its own clock. It owns nothing of the story and no loop:
// the director (../director.ts) calls frame() and is the only owner of time and scroll.
import { NeutralToneMapping, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from "three";
import type { Desk, Example, Paths, SceneState, Vec3 } from "@/features/tower/story";
import { HOPS, SENDER } from "@/features/tower/story";
import { damp } from "@/features/tower/timeline";
import { createShared, type Layer, type Tier } from "./common";
import { createRoute } from "./route";
import { createSky } from "./sky";
import { createTower } from "./tower";

export type EngineOptions = { canvas: HTMLCanvasElement; tier: Tier; examples: readonly Example[]; still: boolean };
export type EngineInfo = { calls: number; triangles: number; scale: number; width: number; height: number; gpu: string };
export type Engine = {
  frame: (time: number, dt: number, state: SceneState) => void;
  setPaths: (paths: Paths) => void;
  setPointer: (x: number, y: number) => void;
  resize: (width: number, height: number, dpr: number) => void;
  project: (at: Vec3, out: { x: number; y: number; behind: boolean }) => void;
  info: () => EngineInfo;
  dispose: () => void;
};

// Extra layers arrive as their modules do; each is { object, update?, dispose }.
type Extras = Array<(shared: ReturnType<typeof createShared>, tier: Tier, tower: ReturnType<typeof createTower>, heroes: readonly Desk[]) => Layer>;

export function createEngine({ canvas, tier, examples, still }: EngineOptions, extras: Extras = []): Engine {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance", stencil: false });
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1.06;
  const gl = renderer.getContext();
  const debug = gl.getExtension("WEBGL_debug_renderer_info");
  const gpu = debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : "unknown";

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 2, 14000);
  const shared = createShared();

  // Every desk the story can stop at: the interior furnishes them first.
  const heroes: Desk[] = [SENDER, ...HOPS.map((h) => h.to), ...examples.flatMap((e) => [e.owner.desk, e.deputy.desk])];

  const sky = createSky(shared);
  const tower = createTower(shared, tier);
  tower.hardAlpha.value = gl.getContextAttributes()?.antialias ? 0 : 1;
  const route = createRoute(shared);
  const layers: Layer[] = [sky, tower, route, ...extras.map((make) => make(shared, tier, tower, heroes))];
  for (const layer of layers) scene.add(layer.object);

  let width = 1, height = 1, baseDpr = 1, scale = 1;
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  const eye = new Vector3(), target = new Vector3(), right = new Vector3(), up = new Vector3(), fwd = new Vector3(), v = new Vector3();
  // Resolution follows the frame rate: a slow run of frames lowers it a step, a fast run raises it again.
  let slow = 0, fast = 0;
  const applySize = () => { renderer.setPixelRatio(baseDpr * scale); renderer.setSize(width, height, false); };

  return {
    frame(time, dt, state) {
      shared.uTime.value = time;
      shared.uDay.value = state.day;
      if (!still) for (const layer of layers) layer.update?.(time, dt);

      const lamps = tower.floorLight.value;
      for (let i = 0; i < lamps.length; i++) lamps[i] = state.floorLight[i] ?? 0.55;
      tower.cut.value.set(state.cut.z0, state.cut.z1, state.cut.y0, state.cut.y1);
      tower.cutOpen.value = state.cut.open;
      route.apply(state);

      // The camera: where the story puts it, plus a bounded lean toward the pointer.
      const c = state.cam;
      eye.set(c[0], c[1], c[2]); target.set(c[3], c[4], c[5]);
      pointer.sx = damp(pointer.sx, pointer.x, 3.2, dt); pointer.sy = damp(pointer.sy, pointer.y, 3.2, dt);
      fwd.subVectors(target, eye);
      const reach = fwd.length() * 0.014;
      right.crossVectors(fwd, up.set(0, 1, 0)).normalize();
      eye.addScaledVector(right, pointer.sx * reach).addScaledVector(up, -pointer.sy * reach * 0.6);
      camera.position.copy(eye);
      camera.lookAt(target);
      if (camera.fov !== c[6]) camera.fov = c[6];
      camera.setViewOffset(width, height, -state.shift[0] * width, state.shift[1] * height, width, height);
      camera.updateMatrixWorld();

      renderer.render(scene, camera);

      if (dt > 0.03) { slow++; fast = 0; } else if (dt < 0.019) { fast++; slow = Math.max(0, slow - 1); }
      if (slow > 24 && scale > 0.6) { scale = Math.max(0.6, scale - 0.12); slow = 0; applySize(); }
      else if (fast > 240 && scale < 1) { scale = Math.min(1, scale + 0.06); fast = 0; applySize(); }
    },
    setPaths: (paths) => route.setPaths(paths),
    setPointer(x, y) { pointer.x = Math.max(-1, Math.min(1, x)); pointer.y = Math.max(-1, Math.min(1, y)); },
    resize(w, h, dpr) {
      width = Math.max(1, w); height = Math.max(1, h); baseDpr = dpr;
      camera.aspect = width / height;
      applySize();
    },
    project(at, out) {
      v.set(at[0], at[1], at[2]).project(camera);
      out.x = (v.x * 0.5 + 0.5) * width; out.y = (-v.y * 0.5 + 0.5) * height; out.behind = v.z > 1 || v.z < -1;
    },
    info: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, scale, width: renderer.domElement.width, height: renderer.domElement.height, gpu }),
    dispose() {
      for (const layer of layers) layer.dispose();
      renderer.dispose();
    },
  };
}
