"use client";

import { OrbitControls } from "@react-three/drei";
import type { OrbitControlsProps } from "@react-three/drei";
import type { ComponentType } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useCameraFocusStore } from "../state/cameraStore";

export type FrameBounds = {
  sphere: THREE.Sphere;
  center: THREE.Vector3;
  size: THREE.Vector3;
};

type CameraControllerProps = {
  bounds?: FrameBounds | null;
  viewMode?: "exterior" | "interior";
  onInteraction?: () => void;
  frameKey?: string;
  frameOffsetScale?: { x: number; y: number; z?: number };
  frameTightness?: number;
  frameFit?: "contain" | "height" | "width";
};

const tmpVec = new THREE.Vector3();
const tmpSpherical = new THREE.Spherical();
const tmpOffset = new THREE.Vector3();
const isPerspectiveCamera = (cam: THREE.Camera): cam is THREE.PerspectiveCamera =>
  (cam as THREE.PerspectiveCamera).isPerspectiveCamera === true;

export function CameraController({
  bounds,
  viewMode = "exterior",
  onInteraction,
  frameKey,
  frameOffsetScale,
  frameTightness,
  frameFit = "contain",
}: CameraControllerProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const { camera } = useThree();
  const focusPoint = useCameraFocusStore((state) => state.focusPoint);
  const focusDistance = useCameraFocusStore((state) => state.focusDistance);
  const clearFocus = useCameraFocusStore((state) => state.clearFocus);
  const Controls = OrbitControls as unknown as ComponentType<OrbitControlsProps>;
  const hasFramed = useRef(false);
  const userInteracted = useRef(false);
  const lastFrameKey = useRef<string | null>(null);

  const limits = useMemo(() => {
    if (viewMode === "interior") {
      return {
        minPolar: THREE.MathUtils.degToRad(10),
        maxPolar: THREE.MathUtils.degToRad(150),
        near: 0.02,
      };
    }
    return {
      minPolar: THREE.MathUtils.degToRad(15),
      maxPolar: THREE.MathUtils.degToRad(85),
      near: 0.05,
    };
  }, [viewMode]);

  useEffect(() => {
    camera.near = limits.near;
    camera.updateProjectionMatrix();
  }, [camera, limits]);

  useEffect(() => {
    if (!frameKey) return;
    if (frameKey === lastFrameKey.current) return;
    lastFrameKey.current = frameKey;
    hasFramed.current = false;
    userInteracted.current = false;
  }, [frameKey]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const fitDistance = bounds
      ? (() => {
          if (!isPerspectiveCamera(camera)) {
            return bounds.sphere.radius * 2;
          }
          const fill = frameTightness ?? 0.9;
          const height = Math.max(bounds.size.y, 0.001);
          const width = Math.max(bounds.size.x, 0.001);
          const fov = THREE.MathUtils.degToRad(camera.fov);
          const aspect = camera.aspect || 1;
          const fitHeight = (height / 2) / (Math.tan(fov / 2) * fill);
          const fitWidth = (width / 2) / (Math.tan(fov / 2) * aspect * fill);
          if (frameFit === "height") return fitHeight;
          if (frameFit === "width") return fitWidth;
          return Math.max(fitHeight, fitWidth);
        })()
      : null;

    if (bounds && fitDistance && !hasFramed.current && !userInteracted.current) {
      const target = controls.target;
      if (frameOffsetScale) {
        tmpOffset.set(
          bounds.sphere.radius * frameOffsetScale.x,
          bounds.sphere.radius * frameOffsetScale.y,
          bounds.sphere.radius * (frameOffsetScale.z ?? 0),
        );
      } else {
        tmpOffset.set(0, 0, 0);
      }
      target.copy(bounds.center).add(tmpOffset);
      const direction = new THREE.Vector3()
        .copy(camera.position)
        .sub(target)
        .normalize();
      const distance = Math.max(
        fitDistance,
        bounds.sphere.radius * 0.85,
        0.45,
      );

      camera.position.copy(target).add(direction.multiplyScalar(distance));
      camera.far = Math.max(camera.far, distance * 12);
      camera.updateProjectionMatrix();
      controls.update();
      hasFramed.current = true;
    }

    const target = controls.target;
    tmpVec.copy(camera.position).sub(target);
    tmpSpherical.setFromVector3(tmpVec);

    const minDistance = bounds && fitDistance
      ? Math.max(fitDistance * 0.45, bounds.sphere.radius * 0.55, 0.35)
      : 0.7;
    controls.minDistance = minDistance;
    controls.maxDistance = Math.max(7, minDistance * 6);
    if (tmpSpherical.radius < minDistance) {
      tmpSpherical.radius = THREE.MathUtils.damp(
        tmpSpherical.radius,
        minDistance,
        6,
        delta,
      );
    }

    const clampedPhi = THREE.MathUtils.clamp(
      tmpSpherical.phi,
      limits.minPolar,
      limits.maxPolar,
    );
    if (Math.abs(tmpSpherical.phi - clampedPhi) > 0.0001) {
      tmpSpherical.phi = THREE.MathUtils.damp(
        tmpSpherical.phi,
        clampedPhi,
        6,
        delta,
      );
    }

    if (focusPoint) {
      target.lerp(focusPoint, 1 - Math.exp(-delta * 4));
      if (focusDistance) {
        tmpSpherical.radius = THREE.MathUtils.damp(
          tmpSpherical.radius,
          focusDistance,
          6,
          delta,
        );
      }
    }

    tmpVec.setFromSpherical(tmpSpherical);
    camera.position.copy(target).add(tmpVec);
    controls.update();
  });

  return (
    <Controls
      ref={controlsRef}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.6}
      zoomSpeed={0.7}
      minDistance={0.4}
      maxDistance={10}
      onStart={() => {
        userInteracted.current = true;
        clearFocus();
        onInteraction?.();
      }}
    />
  );
}
