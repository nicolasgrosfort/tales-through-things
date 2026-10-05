import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { InstancedBufferAttribute, Vector3 } from "three";
import { PLYLoader } from "three/examples/jsm/Addons.js";
import {
  float,
  instancedBufferAttribute,
  max as maxNode,
  mx_noise_float,
  mx_noise_vec3,
  smoothstep,
  uniform,
  vec3,
} from "three/tsl";
import {
  type Node,
  PointsNodeMaterial,
  Sprite,
  WebGPURenderer,
} from "three/webgpu";

export type BurstOptions = {
  /** Number of bursts, placed randomly on the model at each load */
  count: number;
  /** [min, max] burst radius, relative to the model extent */
  radius: [number, number];
  /** How far points are pushed away, relative to the model extent */
  amplitude: number;
  /** How much noise roughens the burst edges, relative to the radius */
  edgeRoughness: number;
};

const DEFAULT_BURSTS: BurstOptions = {
  count: 20,
  radius: [0.01, 0.1],
  amplitude: 0.1,
  edgeRoughness: 0.2,
};

const MODEL_POSITION: [number, number, number] = [0, 0, 4];
const CAMERA_DISTANCE = 1;
const APPEAR_DURATION = 3; // seconds
const REVEAL_SOFTNESS = 0.15;
// Isometric view: 45° azimuth, elevation of atan(1/√2) ≈ 35.264°
const ISO_AZIMUTH = Math.PI / 4;
const ISO_ELEVATION = Math.atan(1 / Math.SQRT2);

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const Scene = ({
  model,
  pointSize = 0.005,
  bursts,
}: {
  model?: string;
  pointSize?: number;
  bursts?: Partial<BurstOptions>;
}) => {
  if (!model) return false;

  return (
    <div className="w-full h-full">
      <Canvas
        gl={async (props) => {
          const renderer = new WebGPURenderer(
            props as ConstructorParameters<typeof WebGPURenderer>[0],
          );
          await renderer.init();
          return renderer;
        }}
      >
        <Suspense fallback={null}>
          <Model
            key={model}
            model={model}
            pointSize={pointSize}
            bursts={{ ...DEFAULT_BURSTS, ...bursts }}
          />
          <CameraRig key={`rig-${model}`} />
        </Suspense>
        <OrbitControls makeDefault target={MODEL_POSITION} />
      </Canvas>
    </div>
  );
};

// Swings the camera from front view to an isometric azimuth while the model appears
const CameraRig = () => {
  const camera = useThree((state) => state.camera);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    if (elapsed.current >= APPEAR_DURATION) return;
    elapsed.current += delta;
    const t = easeOutCubic(Math.min(1, elapsed.current / APPEAR_DURATION));
    const azimuth = ISO_AZIMUTH * t;
    const elevation = ISO_ELEVATION * t;
    camera.position.set(
      MODEL_POSITION[0] +
        CAMERA_DISTANCE * Math.cos(elevation) * Math.sin(azimuth),
      MODEL_POSITION[1] + CAMERA_DISTANCE * Math.sin(elevation),
      MODEL_POSITION[2] +
        CAMERA_DISTANCE * Math.cos(elevation) * Math.cos(azimuth),
    );
    camera.lookAt(...MODEL_POSITION);
  });

  return null;
};

// WebGPU only renders 1px points, so each point is an instanced sprite quad
const useNoiseMaterial = (
  positions: InstancedBufferAttribute,
  colors: InstancedBufferAttribute,
  pointSize: number,
  {
    count: burstCount,
    radius,
    amplitude: amplitudeScale,
    edgeRoughness,
  }: BurstOptions,
) => {
  const [radiusMin, radiusMax] = radius;
  const size = useMemo(() => uniform(pointSize), []); // eslint-disable-line react-hooks/exhaustive-deps
  // Appear progress, 0 (nothing visible) to 1 (fully revealed)
  const reveal = useMemo(() => uniform(0), []);

  useEffect(() => {
    size.value = pointSize;
  }, [size, pointSize]);

  const material = useMemo(() => {
    const array = positions.array as Float32Array;
    const count = positions.count;

    // Model extent, so that burst sizes adapt to the scale of the model
    const min = new Vector3(Infinity, Infinity, Infinity);
    const max = new Vector3(-Infinity, -Infinity, -Infinity);
    for (let i = 0; i < count; i++) {
      const x = array[i * 3];
      const y = array[i * 3 + 1];
      const z = array[i * 3 + 2];
      min.set(Math.min(min.x, x), Math.min(min.y, y), Math.min(min.z, z));
      max.set(Math.max(max.x, x), Math.max(max.y, y), Math.max(max.z, z));
    }
    const extent = max.sub(min).length();

    const amplitude = uniform(extent * amplitudeScale);

    const position = vec3(
      instancedBufferAttribute(positions, "vec3") as unknown as Node<"vec3">,
    );

    // Random noise offset so the ragged edges differ at each load
    const seed = new Vector3(
      Math.random() * 100,
      Math.random() * 100,
      Math.random() * 100,
    );
    const edgeNoise = mx_noise_float(position.mul(3 / extent).add(vec3(seed)));

    // Each burst is centered on a random point of the cloud, with a random radius
    let mask: Node<"float"> = float(0);
    for (let i = 0; i < burstCount; i++) {
      const p = Math.floor(Math.random() * count) * 3;
      const center = vec3(array[p], array[p + 1], array[p + 2]);
      const radius =
        extent * (radiusMin + Math.random() * (radiusMax - radiusMin));
      const distance = position
        .sub(center)
        .length()
        .add(edgeNoise.mul(radius * edgeRoughness));
      const burst = smoothstep(float(radius), float(radius * 0.4), distance);
      mask = maxNode(mask, burst);
    }

    // High-frequency noise gives each point its own random offset direction
    const jitter = mx_noise_vec3(position.mul(97.13)).mul(2);

    // Appear: points pop in sweeping up the model (model space is z-up),
    // with noise breaking the front, and fly in from a random offset
    const height = position.z.sub(min.z).div(Math.max(max.z - min.z, 1e-6));
    const grain = mx_noise_float(position.mul(53.7)).mul(0.5).add(0.5);
    const threshold = height
      .mul(0.55)
      .add(grain.mul(0.3))
      .clamp(0, 1 - REVEAL_SOFTNESS);
    const appear = smoothstep(threshold, threshold.add(REVEAL_SOFTNESS), reveal);
    const flyIn = jitter.mul(extent * 0.05).mul(float(1).sub(appear));

    const material = new PointsNodeMaterial({ sizeAttenuation: true });
    material.sizeNode = size.mul(appear);
    material.colorNode = instancedBufferAttribute(colors, "vec3");
    material.positionNode = position
      .add(jitter.mul(amplitude).mul(mask))
      .add(flyIn);
    return material;
  }, [
    positions,
    colors,
    size,
    reveal,
    burstCount,
    radiusMin,
    radiusMax,
    amplitudeScale,
    edgeRoughness,
  ]);

  return { material, reveal };
};

const Model = ({
  model,
  pointSize,
  bursts,
}: {
  model: string;
  pointSize: number;
  bursts: BurstOptions;
}) => {
  const geometry = useLoader(PLYLoader, model, (loader) => {
    loader.setCustomPropertyNameMapping({
      colorDc: ["f_dc_0", "f_dc_1", "f_dc_2"],
    });
  });

  const { positions, colors } = useMemo(() => {
    const position = geometry.getAttribute("position");
    const dc = geometry.getAttribute("colorDc");
    // Gaussian splat: color is stored as SH DC coefficients, convert to RGB
    const SH_C0 = 0.28209479177387814;
    const colorArray = new Float32Array(position.count * 3);
    if (dc) {
      for (let i = 0; i < colorArray.length; i++) {
        colorArray[i] = Math.min(1, Math.max(0, 0.5 + SH_C0 * dc.array[i]));
      }
    }
    return {
      positions: new InstancedBufferAttribute(
        new Float32Array(position.array),
        3,
      ),
      colors: new InstancedBufferAttribute(colorArray, 3),
      count: position.count,
    };
  }, [geometry]);

  const { material, reveal } = useNoiseMaterial(
    positions,
    colors,
    pointSize,
    bursts,
  );
  const sprite = useRef<Sprite>(null);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    if (sprite.current) sprite.current.rotation.z += delta * 0.2;
    if (elapsed.current < APPEAR_DURATION) {
      elapsed.current += delta;
      reveal.value = easeInOutCubic(
        Math.min(1, elapsed.current / APPEAR_DURATION),
      );
    }
  });

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={MODEL_POSITION}>
      <sprite
        ref={sprite}
        count={positions.count}
        material={material}
        frustumCulled={false}
      />
    </group>
  );
};
