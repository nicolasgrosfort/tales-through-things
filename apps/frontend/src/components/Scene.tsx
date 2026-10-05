import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { InstancedBufferAttribute, Vector3 } from "three";
import { PLYLoader } from "three/examples/jsm/Addons.js";
import {
  float,
  instancedBufferAttribute,
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

const MODEL_POSITION: [number, number, number] = [0, 0, 4];
const CAMERA_DISTANCE = 1;
const APPEAR_DURATION = 1; // seconds
const REVEAL_SOFTNESS = 0.15;
const ARRIVAL_PATCHES = 5; // noise frequency of the arrival patches
const FLY_IN_DISTANCE = 0.3; // relative to the model extent
// Isometric view: 45° azimuth, elevation of atan(1/√2) ≈ 35.264°
const ISO_AZIMUTH = Math.PI / 4;
const ISO_ELEVATION = Math.atan(1 / Math.SQRT2);

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export const Scene = ({
  model,
  pointSize = 0.005,
}: {
  model?: string;
  pointSize?: number;
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
          <Model key={model} model={model} pointSize={pointSize} />
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
    // Capped so a long first frame (shader compilation) doesn't eat the animation
    elapsed.current += Math.min(delta, 0.05);
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
const useRevealMaterial = (
  positions: InstancedBufferAttribute,
  colors: InstancedBufferAttribute,
  pointSize: number,
) => {
  const size = useMemo(() => uniform(pointSize), []); // eslint-disable-line react-hooks/exhaustive-deps
  // Appear progress, 0 (nothing visible) to 1 (fully revealed)
  const reveal = useMemo(() => uniform(0), []);

  useEffect(() => {
    size.value = pointSize;
  }, [size, pointSize]);

  const material = useMemo(() => {
    const array = positions.array as Float32Array;
    const count = positions.count;

    // Model bounds, so that the appear animation adapts to the scale of the model
    const min = new Vector3(Infinity, Infinity, Infinity);
    const max = new Vector3(-Infinity, -Infinity, -Infinity);
    for (let i = 0; i < count; i++) {
      const x = array[i * 3];
      const y = array[i * 3 + 1];
      const z = array[i * 3 + 2];
      min.set(Math.min(min.x, x), Math.min(min.y, y), Math.min(min.z, z));
      max.set(Math.max(max.x, x), Math.max(max.y, y), Math.max(max.z, z));
    }
    const extent = max.clone().sub(min).length();
    const center = min.clone().add(max).multiplyScalar(0.5);

    const position = vec3(
      instancedBufferAttribute(positions, "vec3") as unknown as Node<"vec3">,
    );

    // Random noise offset so the arrival sides differ at each load
    const seed = new Vector3(
      Math.random() * 100,
      Math.random() * 100,
      Math.random() * 100,
    );

    // Low-frequency noise splits the model into patches, each one with its own
    // arrival direction: the model assembles from several sides at once
    const side = mx_noise_vec3(
      position.mul(ARRIVAL_PATCHES / extent).add(vec3(seed)),
    )
      .add(vec3(0.0001))
      .normalize();

    // Each patch is revealed along its direction, starting from the side it comes from
    const along = position.sub(vec3(center)).dot(side).div(extent).add(0.5);
    // Patches start at slightly different moments
    const delay = mx_noise_float(
      position.mul(ARRIVAL_PATCHES / extent).add(vec3(seed).add(31.7)),
    )
      .mul(0.5)
      .add(0.5);
    // High-frequency noise breaks the front and gives each point its own offset
    const grain = mx_noise_float(position.mul(53.7)).mul(0.5).add(0.5);
    const jitter = mx_noise_vec3(position.mul(97.13)).mul(2);

    const threshold = along
      .clamp(0, 1)
      .mul(0.45)
      .add(delay.mul(0.15))
      .add(grain.mul(0.25))
      // Noise sits around its middle, so the raw values mostly span ~0.15-0.75:
      // remap them so that the first points appear right at the start
      .sub(0.15)
      .div(0.6)
      .mul(1 - REVEAL_SOFTNESS)
      .clamp(0, 1 - REVEAL_SOFTNESS);
    const appear = smoothstep(
      threshold,
      threshold.add(REVEAL_SOFTNESS),
      reveal,
    );

    // Points fly in from the side their patch comes from
    const flyIn = side
      .mul(-extent * FLY_IN_DISTANCE)
      .add(jitter.mul(extent * 0.05))
      .mul(float(1).sub(appear));

    const material = new PointsNodeMaterial({ sizeAttenuation: true });
    material.sizeNode = size.mul(appear);
    material.colorNode = instancedBufferAttribute(colors, "vec3");
    material.positionNode = position.add(flyIn);
    return material;
  }, [positions, colors, size, reveal]);

  return { material, reveal };
};

const Model = ({ model, pointSize }: { model: string; pointSize: number }) => {
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

  const { material, reveal } = useRevealMaterial(positions, colors, pointSize);
  const sprite = useRef<Sprite>(null);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    if (sprite.current) sprite.current.rotation.z += delta * 0.2;
    if (elapsed.current < APPEAR_DURATION) {
      // Capped so a long first frame (shader compilation) doesn't eat the animation
      elapsed.current += Math.min(delta, 0.05);
      // Linear on purpose: the thresholds already spread points over the whole range
      reveal.value = Math.min(1, elapsed.current / APPEAR_DURATION);
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
