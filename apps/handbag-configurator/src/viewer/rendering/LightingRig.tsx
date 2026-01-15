"use client";

import { Environment } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

const CAMERA_LIGHT_OFFSET = new THREE.Vector3(1.4, 1.0, 1.8);

export function LightingRig({
  hdriUrl,
  environmentIntensity = 0.9,
}: {
  hdriUrl: string;
  environmentIntensity?: number;
}) {
  const keyLight = useRef<THREE.PointLight>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (!keyLight.current) return;
    keyLight.current.position.copy(camera.position).add(CAMERA_LIGHT_OFFSET);
  });

  return (
    <>
      <Environment
        files={hdriUrl}
        background={false}
        environmentIntensity={environmentIntensity}
      />
      <hemisphereLight
        color="#ffffff"
        groundColor="#3b2a21"
        intensity={0.25}
      />
      <pointLight
        ref={keyLight}
        color="#ffffff"
        intensity={0.6}
        distance={20}
        decay={1.8}
      />
    </>
  );
}
