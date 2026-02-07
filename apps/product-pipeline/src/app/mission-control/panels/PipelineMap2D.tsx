"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";

import type { PipelineStage } from "./pipelineMapConfig";
import {
  hashSeed,
  lcg,
  normalizeCount,
  PIPELINE_MAP_CONNECTIONS,
  PIPELINE_MAP_NODES,
  tokenCountForStage,
} from "./pipelineMapConfig";

function useStarfield(canvasRef: React.RefObject<HTMLCanvasElement | null>): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrame = 0;
    let width = 0;
    let height = 0;

    type Star = { x: number; y: number; z: number; speed: number; alpha: number };
    const stars: Star[] = [];

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      stars.length = 0;
      const count = Math.min(220, Math.floor((width * height) / 10000));
      for (let i = 0; i < count; i += 1) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z: Math.random() * 1,
          speed: 0.08 + Math.random() * 0.18,
          alpha: 0.25 + Math.random() * 0.45,
        });
      }
    };

    const observer = new ResizeObserver(() => resize());
    observer.observe(canvas);
    resize();

    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(6, 12, 18, 0.96)";
      ctx.fillRect(0, 0, width, height);

      for (const star of stars) {
        star.x += star.speed * (0.5 + star.z);
        star.y += star.speed * 0.35;
        if (star.x > width + 20) star.x = -20;
        if (star.y > height + 20) star.y = -20;

        const size = 0.6 + star.z * 1.5;
        ctx.fillStyle = `rgba(255, 246, 226, ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  }, [canvasRef]);
}

export default function PipelineMap2D({
  stageCounts,
  nodeLabels,
}: {
  stageCounts: Record<string, number>;
  nodeLabels: Record<PipelineStage, string>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useStarfield(canvasRef);

  const nodeByStage = useMemo(() => {
    const map = new Map<string, (typeof PIPELINE_MAP_NODES)[number]>();
    for (const node of PIPELINE_MAP_NODES) map.set(node.stage, node);
    return map;
  }, []);

  const swarms = useMemo(() => {
    return PIPELINE_MAP_NODES.map((node) => {
      const count = normalizeCount(stageCounts[node.stage]);
      const tokens = tokenCountForStage(count);
      const rand = lcg(hashSeed(`${node.stage}:${count}`));
      const entries = Array.from({ length: tokens }, (_, index) => {
        const radius = 18 + rand() * 34;
        const size = 2 + rand() * 3;
        const duration = 7 + rand() * 9;
        const delay = -rand() * duration;
        const hue = 38 + rand() * 20;
        const alpha = 0.3 + rand() * 0.45;
        return {
          key: `${node.stage}-${index}`,
          radius,
          size,
          duration,
          delay,
          color: `hsla(${hue} 80% 92% / ${alpha})`,
        };
      });
      return { stage: node.stage, x: node.x, y: node.y, entries };
    });
  }, [stageCounts]);

  return (
    <div className="pp-map">
      <canvas ref={canvasRef} className="pp-map-bg" aria-hidden="true" />
      <svg
        className="pp-map-lines"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {PIPELINE_MAP_CONNECTIONS.map(([from, to]) => {
          const start = nodeByStage.get(from);
          const end = nodeByStage.get(to);
          if (!start || !end) return null;
          return (
            <line
              key={`${from}-${to}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              className="pp-map-line"
            />
          );
        })}
      </svg>

      {swarms.map((swarm) => (
        <div
          key={`swarm-${swarm.stage}`}
          className="pp-map-swarm"
          style={{ left: `${swarm.x}%`, top: `${swarm.y}%` }}
          aria-hidden="true"
        >
          {swarm.entries.map((token) => (
            <span
              key={token.key}
              className="pp-map-token"
              style={
                {
                  "--pp-orbit-radius": `${token.radius}px`,
                  "--pp-orbit-duration": `${token.duration}s`,
                  "--pp-orbit-delay": `${token.delay}s`,
                  "--pp-token-size": `${token.size}px`,
                  "--pp-token-color": token.color,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      ))}

      {PIPELINE_MAP_NODES.map((node) => {
        const count = normalizeCount(stageCounts[node.stage]);
        const glow = count > 0 ? "pp-map-node-active" : "pp-map-node-idle";
        return (
          <Link
            key={node.stage}
            href={node.href}
            className={`pp-map-node ${glow}`}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <span className="pp-map-node-stage">{node.stage}</span>
            <span className="pp-map-node-label">
              {nodeLabels[node.stage] ?? node.stage}
            </span>
            <span className="pp-map-node-count">{count}</span>
          </Link>
        );
      })}
    </div>
  );
}
