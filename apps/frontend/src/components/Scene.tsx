import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import { BufferAttribute } from "three";
import { PLYLoader } from "three/examples/jsm/Addons.js";
import {
  attribute,
  float,
  mx_noise_vec3,
  positionLocal,
  time,
  uniform,
} from "three/tsl";
import { PointsNodeMaterial, WebGPURenderer } from "three/webgpu";

export const Scene = ({ model }: { model: string }) => {
  return (
    <div className="w-full h-100">
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
          <Model model={model} />
        </Suspense>
        <OrbitControls />
      </Canvas>
    </div>
  );
};

const useNoiseMaterial = () =>
  useMemo(() => {
    const amplitude = uniform(0.05);
    const frequency = uniform(1);
    const speed = uniform(0.1);

    // 3D perlin noise sampled at the point position, scrolling over time
    const noise = mx_noise_vec3(
      positionLocal.mul(frequency).add(time.mul(speed)),
    );

    const material = new PointsNodeMaterial({ sizeAttenuation: true });
    material.sizeNode = float(0.001);
    material.colorNode = attribute("color", "vec3");
    material.positionNode = positionLocal.add(noise.mul(amplitude));
    return material;
  }, []);

const Model = ({ model }: { model: string }) => {
  const geometry = useLoader(PLYLoader, model, (loader) => {
    loader.setCustomPropertyNameMapping({
      colorDc: ["f_dc_0", "f_dc_1", "f_dc_2"],
    });
  });

  // Gaussian splat: color is stored as SH DC coefficients, convert to RGB
  useMemo(() => {
    const dc = geometry.getAttribute("colorDc");
    if (!dc || geometry.getAttribute("color")) return;
    const SH_C0 = 0.28209479177387814;
    const colors = new Float32Array(dc.count * 3);
    for (let i = 0; i < colors.length; i++) {
      colors[i] = Math.min(1, Math.max(0, 0.5 + SH_C0 * dc.array[i]));
    }
    geometry.setAttribute("color", new BufferAttribute(colors, 3));
  }, [geometry]);

  const material = useNoiseMaterial();

  useFrame((_, delta) => {
    if (geometry) {
      geometry.rotateZ(delta * 0.2);
      //   geometry.rotateY(delta * -0.1);
    }
  });

  return (
    <points
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 4]}
    >
      <primitive object={material} attach="material" />
    </points>
  );
};
