"use client";

import { useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Html, Line, OrbitControls, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  Color,
  type Group,
  type Mesh,
  Vector3,
} from "three";

import type { PipelineMapNode, PipelineStage } from "./pipelineMapConfig";
import {
  hashSeed,
  lcg,
  normalizeCount,
  PIPELINE_MAP_CONNECTIONS,
  PIPELINE_MAP_NODES,
  tokenCountForStage,
} from "./pipelineMapConfig";

type WorldNode = PipelineMapNode & {
  count: number;
  position: [number, number, number];
};

/* eslint-disable ds/no-raw-color -- PP-001 Three.js shader colors for 3D visualization */
const STAGE_COLORS: Record<PipelineStage, { core: string; glow: string }> = {
  P: { core: "#ff5d45", glow: "#ffb39b" },
  M: { core: "#ffcc7a", glow: "#ffe7c3" },
  S: { core: "#6ddcff", glow: "#b8f1ff" },
  K: { core: "#b69cff", glow: "#e3d8ff" },
  L: { core: "#66ffc0", glow: "#c7ffea" },
};
/* eslint-enable ds/no-raw-color */

function worldPositionFromMap(x: number, y: number): [number, number, number] {
  const worldX = (x - 50) / 12;
  const worldY = (50 - y) / 12;
  const depth =
    Math.sin((x / 100) * Math.PI * 2) * 0.35 +
    Math.cos((y / 100) * Math.PI * 2) * 0.2;
  return [worldX, worldY, depth];
}

function FlowPulse({
  start,
  end,
  speed,
  offset,
  color,
}: {
  start: Vector3;
  end: Vector3;
  speed: number;
  offset: number;
  color: Color;
}) {
  const ref = useRef<Mesh>(null);
  const direction = useMemo(() => end.clone().sub(start), [end, start]);
  const temp = useMemo(() => new Vector3(), []);

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = (clock.elapsedTime * speed + offset) % 1;
    temp.copy(start).addScaledVector(direction, t);
    mesh.position.copy(temp);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.055, 12, 12]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.75}
        blending={AdditiveBlending}
      />
    </mesh>
  );
}

function Swarm({
  stage,
  count,
  reduceMotion,
}: {
  stage: PipelineStage;
  count: number;
  reduceMotion: boolean;
}) {
  const groupRef = useRef<Group>(null);
  const tokens = useMemo(() => {
    const tokensCount = tokenCountForStage(count);
    const rand = lcg(hashSeed(`3d:${stage}:${count}`));
    return Array.from({ length: tokensCount }, (_, index) => {
      const radius = 0.75 + rand() * 0.55;
      const theta = rand() * Math.PI * 2;
      const phi = (0.2 + rand() * 0.6) * Math.PI;
      const size = 0.03 + rand() * 0.035;
      const hue = 38 + rand() * 18;
      const alpha = 0.35 + rand() * 0.5;
      return {
        key: `${stage}-${index}`,
        radius,
        theta,
        phi,
        size,
        color: new Color(`hsla(${hue}, 90%, 88%, ${alpha})`),
      };
    });
  }, [count, stage]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group || reduceMotion) return;
    group.rotation.y += delta * 0.25;
    group.rotation.z += delta * 0.18;
  });

  return (
    <group ref={groupRef}>
      {tokens.map((token) => {
        const x = Math.cos(token.theta) * Math.sin(token.phi) * token.radius;
        const y = Math.cos(token.phi) * token.radius;
        const z = Math.sin(token.theta) * Math.sin(token.phi) * token.radius;
        return (
          <mesh key={token.key} position={[x, y, z]}>
            <sphereGeometry args={[token.size, 10, 10]} />
            <meshBasicMaterial
              color={token.color}
              transparent
              opacity={0.85}
              blending={AdditiveBlending}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function StageNode({
  node,
  label,
  reduceMotion,
  onNavigate,
}: {
  node: WorldNode;
  label: string;
  reduceMotion: boolean;
  onNavigate: () => void;
}) {
  const groupRef = useRef<Group>(null);
  const { core, glow } = STAGE_COLORS[node.stage];
  const active = node.count > 0;
  const scale = 1 + Math.min(0.55, Math.sqrt(node.count) / 6);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group || reduceMotion) return;
    group.rotation.y += delta * 0.2;
  });

  return (
    <group ref={groupRef} position={node.position} scale={scale}>
      <pointLight
        intensity={active ? 1.1 : 0.45}
        distance={5}
        color={glow}
      />

      <mesh
        onClick={(event) => {
          event.stopPropagation();
          onNavigate();
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
        }}
      >
        <icosahedronGeometry args={[0.42, 1]} />
        <meshStandardMaterial
          color={core}
          emissive={glow}
          emissiveIntensity={active ? 0.9 : 0.35}
          roughness={0.25}
          metalness={0.25}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.78, 48]} />
        <meshBasicMaterial
          color={glow}
          transparent
          opacity={active ? 0.35 : 0.16}
          blending={AdditiveBlending}
        />
      </mesh>

      <Swarm stage={node.stage} count={node.count} reduceMotion={reduceMotion} />

      <Html position={[0, 1.05, 0]} center style={{ pointerEvents: "auto" }}>
        <button
          type="button"
          onClick={onNavigate}
          className="min-h-11 min-w-11 rounded-2xl border border-border-1 bg-surface-1 px-3 py-2 text-start text-xs shadow-md backdrop-blur"
        >
          <div className="flex items-center gap-2">
            <span className="pp-chip">{node.stage}</span>
            <span className="font-semibold text-foreground">{label}</span>
          </div>
{/* eslint-disable-next-line ds/no-raw-typography, ds/no-arbitrary-tailwind -- PP-001 3D HUD label inside Three.js canvas */}
          <div className="mt-1 text-[11px] text-foreground/60">
            {/* i18n-exempt -- PP-001 [ttl=2027-01-01] internal admin tool */}
            Runs: <span className="font-semibold text-foreground">{node.count}</span>
          </div>
        </button>
      </Html>
    </group>
  );
}

function PipelineMapScene({
  stageCounts,
  reduceMotion,
  nodeLabels,
}: {
  stageCounts: Record<string, number>;
  reduceMotion: boolean;
  nodeLabels: Record<PipelineStage, string>;
}) {
  const router = useRouter();

  const nodes = useMemo((): WorldNode[] => {
    return PIPELINE_MAP_NODES.map((node) => ({
      ...node,
      count: normalizeCount(stageCounts[node.stage]),
      position: worldPositionFromMap(node.x, node.y),
    }));
  }, [stageCounts]);

  const nodesByStage = useMemo(() => {
    const map = new Map<string, WorldNode>();
    for (const node of nodes) map.set(node.stage, node);
    return map;
  }, [nodes]);

  const connections = useMemo(() => {
    return PIPELINE_MAP_CONNECTIONS.map(([from, to]) => {
      const start = nodesByStage.get(from);
      const end = nodesByStage.get(to);
      if (!start || !end) return null;
      return {
        key: `${from}-${to}`,
        fromStage: from,
        start: new Vector3(...start.position),
        end: new Vector3(...end.position),
      };
    }).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  }, [nodesByStage]);

  return (
    <>
      {/* eslint-disable ds/no-raw-color -- PP-001 Three.js scene colors */}
      <color attach="background" args={["#060c12"]} />
      <fog attach="fog" args={["#060c12", 7, 18]} />

      <ambientLight intensity={0.5} />
      <directionalLight
        position={[6, 6, 4]}
        intensity={0.65}
        color="#fff6e2"
      />
      {/* eslint-enable ds/no-raw-color */}

      <Stars
        radius={60}
        depth={18}
        count={2500}
        factor={4}
        saturation={0}
        fade
        speed={reduceMotion ? 0 : 1}
      />

      {connections.map((connection, index) => {
        const lineColor = new Color(STAGE_COLORS[connection.fromStage].glow);
        return (
          <group key={connection.key}>
            <Line
              points={[connection.start, connection.end]}
              color={lineColor}
              lineWidth={1}
              transparent
              opacity={0.22}
            />
            {!reduceMotion && (
              <FlowPulse
                start={connection.start}
                end={connection.end}
                speed={0.12}
                offset={index * 0.35}
                color={lineColor}
              />
            )}
          </group>
        );
      })}

      {nodes.map((node) => (
        <StageNode
          key={node.stage}
          node={node}
          label={nodeLabels[node.stage] ?? node.stage}
          reduceMotion={reduceMotion}
          onNavigate={() => router.push(node.href)}
        />
      ))}

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.12}
        rotateSpeed={0.55}
        minDistance={6}
        maxDistance={14}
        autoRotate={!reduceMotion}
        autoRotateSpeed={0.25}
        target={[0, 0, 0]}
      />
    </>
  );
}

export default function PipelineMap3D({
  stageCounts,
  reduceMotion = false,
  nodeLabels,
}: {
  stageCounts: Record<string, number>;
  reduceMotion?: boolean;
  nodeLabels: Record<PipelineStage, string>;
}) {
  return (
    <div className="pp-map">
      <Canvas
        className="pp-map-bg"
        camera={{ position: [0, 0.25, 11], fov: 45 }}
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <PipelineMapScene
          stageCounts={stageCounts}
          reduceMotion={reduceMotion}
          nodeLabels={nodeLabels}
        />
      </Canvas>
    </div>
  );
}
