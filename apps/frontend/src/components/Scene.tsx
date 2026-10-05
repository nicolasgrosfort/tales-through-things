import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { InstancedBufferAttribute } from "three";
import { PLYLoader } from "three/examples/jsm/Addons.js";
import {
  instancedBufferAttribute,
  mx_noise_vec3,
  time,
  uniform,
  vec3,
} from "three/tsl";
import {
  type Node,
  PointsNodeMaterial,
  Sprite,
  WebGPURenderer,
} from "three/webgpu";

export const Scene = ({
  model,
  pointSize = 0.005,
}: {
  model: string;
  pointSize?: number;
}) => {
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
          <Model model={model} pointSize={pointSize} />
        </Suspense>
        <OrbitControls />
      </Canvas>
    </div>
  );
};

// WebGPU only renders 1px points, so each point is an instanced sprite quad
const useNoiseMaterial = (
  positions: InstancedBufferAttribute,
  colors: InstancedBufferAttribute,
  pointSize: number,
) => {
  const size = useMemo(() => uniform(pointSize), []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    size.value = pointSize;
  }, [size, pointSize]);

  return useMemo(() => {
    const amplitude = uniform(0);
    const frequency = uniform(1);
    const speed = uniform(0.1);

    const position = vec3(
      instancedBufferAttribute(positions, "vec3") as unknown as Node<"vec3">,
    );

    // 3D perlin noise sampled at the point position, scrolling over time
    const noise = mx_noise_vec3(position.mul(frequency).add(time.mul(speed)));

    const material = new PointsNodeMaterial({ sizeAttenuation: true });
    material.sizeNode = size;
    material.colorNode = instancedBufferAttribute(colors, "vec3");
    material.positionNode = position.add(noise.mul(amplitude));
    return material;
  }, [positions, colors, size]);
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

  const material = useNoiseMaterial(positions, colors, pointSize);
  const sprite = useRef<Sprite>(null);

  useFrame((_, delta) => {
    if (sprite.current) sprite.current.rotation.z += delta * 0.2;
  });

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 4]}>
      <sprite
        ref={sprite}
        count={positions.count}
        material={material}
        frustumCulled={false}
      />
    </group>
  );
};
