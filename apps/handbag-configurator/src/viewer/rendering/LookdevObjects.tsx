"use client";

/* eslint-disable ds/no-raw-color -- HAND-0008 [ttl=2026-12-31]: Three.js material colors for lookdev reference objects */
export function LookdevObjects() {
  return (
    <group position={[0, -0.4, 0]}>
      <mesh position={[-1.2, 0.5, 0]}>
        <sphereGeometry args={[0.35, 64, 64]} />
        <meshPhysicalMaterial
          color="#3b241c"
          roughness={0.45}
          metalness={0.12}
          sheen={0.4}
          sheenRoughness={0.6}
        />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.35, 64, 64]} />
        <meshPhysicalMaterial
          color="#c7b07a"
          roughness={0.2}
          metalness={1}
          anisotropy={0.6}
          anisotropyRotation={Math.PI / 4}
        />
      </mesh>
      <mesh position={[1.2, 0.5, 0]}>
        <boxGeometry args={[0.6, 0.45, 0.2]} />
        <meshPhysicalMaterial
          color="#7c5c48"
          roughness={0.7}
          metalness={0.05}
          sheen={0.8}
          sheenRoughness={0.8}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]}>
        <circleGeometry args={[2, 64]} />
        <meshStandardMaterial color="#1a1411" roughness={0.9} metalness={0} />
      </mesh>
    </group>
  );
}
