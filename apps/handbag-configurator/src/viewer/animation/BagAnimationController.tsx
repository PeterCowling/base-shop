"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { ProductAssetProceduralOpen } from "@acme/product-configurator";

type BagAnimationControllerProps = {
  scene?: THREE.Object3D | null;
  clips?: THREE.AnimationClip[];
  openClipName?: string;
  closeClipName?: string;
  isOpen: boolean;
  proceduralOpen?: ProductAssetProceduralOpen;
};

function findClip(clips: THREE.AnimationClip[] | undefined, name?: string) {
  if (!clips || !name) return undefined;
  return clips.find((clip) => clip.name === name);
}

function playClip(
  mixer: THREE.AnimationMixer,
  clip: THREE.AnimationClip,
  direction: 1 | -1,
) {
  mixer.stopAllAction();
  const action = mixer.clipAction(clip);
  action.reset();
  action.setLoop(THREE.LoopOnce, 1);
  action.clampWhenFinished = true;
  action.enabled = true;
  action.paused = false;
  action.timeScale = direction;
  if (direction < 0) {
    action.time = clip.duration;
  }
  action.play();
}

export function BagAnimationController({
  scene,
  clips,
  openClipName,
  closeClipName,
  isOpen,
  proceduralOpen,
}: BagAnimationControllerProps) {
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const initializedRef = useRef(false);
  const proceduralRef = useRef<{
    pivot: THREE.Object3D;
    axis: "x" | "y" | "z";
    angleRad: number;
    baseRotation: number;
    parent: THREE.Object3D;
    target: THREE.Object3D;
    usesWrapper: boolean;
  } | null>(null);

  const openClip = useMemo(
    () => findClip(clips, openClipName),
    [clips, openClipName],
  );
  const closeClip = useMemo(
    () => findClip(clips, closeClipName),
    [clips, closeClipName],
  );
  const hasClip = Boolean(openClip || closeClip);
  const useProcedural = Boolean(proceduralOpen) && !hasClip;

  const proceduralKey = useMemo(() => {
    if (!proceduralOpen) return "";
    const pivot = proceduralOpen.pivot ?? {};
    return [
      proceduralOpen.nodeName,
      proceduralOpen.axis,
      proceduralOpen.degrees,
      pivot.x ?? 0.5,
      pivot.y ?? 0.5,
      pivot.z ?? 0.5,
    ].join("|");
  }, [proceduralOpen]);

  useEffect(() => {
    if (!scene || !useProcedural || !proceduralOpen) {
      if (proceduralRef.current) {
        const { parent, target, pivot, axis, baseRotation, usesWrapper } =
          proceduralRef.current;
        if (usesWrapper) {
          parent.attach(target);
          parent.remove(pivot);
        } else {
          target.rotation[axis] = baseRotation;
        }
        proceduralRef.current = null;
      }
      return;
    }

    const target = scene.getObjectByName(proceduralOpen.nodeName);
    if (!target || !target.parent) return;

    const parent = target.parent;
    const useNodePivot = proceduralOpen.pivot === undefined;
    const angleRad = THREE.MathUtils.degToRad(proceduralOpen.degrees);

    if (useNodePivot) {
      const baseRotation = target.rotation[proceduralOpen.axis];
      proceduralRef.current = {
        pivot: target,
        axis: proceduralOpen.axis,
        angleRad,
        baseRotation,
        parent,
        target,
        usesWrapper: false,
      };
      return () => {
        if (!proceduralRef.current) return;
        const { axis: cleanupAxis, baseRotation: cleanupBaseRotation } =
          proceduralRef.current;
        target.rotation[cleanupAxis] = cleanupBaseRotation;
        proceduralRef.current = null;
      };
    }

    const box = new THREE.Box3().setFromObject(target);
    if (box.isEmpty()) return;

    const center = new THREE.Vector3();
    box.getCenter(center);
    const pivotPoint = center.clone();
    const pivot = proceduralOpen.pivot;
    if (!pivot) return;
    const x = Math.min(Math.max(pivot.x ?? 0.5, 0), 1);
    const y = Math.min(Math.max(pivot.y ?? 0.5, 0), 1);
    const z = Math.min(Math.max(pivot.z ?? 0.5, 0), 1);
    pivotPoint.set(
      box.min.x + (box.max.x - box.min.x) * x,
      box.min.y + (box.max.y - box.min.y) * y,
      box.min.z + (box.max.z - box.min.z) * z,
    );

    const pivotNode = new THREE.Object3D();
    pivotNode.name = `pivot:${proceduralOpen.nodeName}`;
    parent.add(pivotNode);
    const localPivot = parent.worldToLocal(pivotPoint.clone());
    pivotNode.position.copy(localPivot);
    pivotNode.updateMatrixWorld(true);
    pivotNode.attach(target);

    proceduralRef.current = {
      pivot: pivotNode,
      axis: proceduralOpen.axis,
      angleRad,
      baseRotation: pivotNode.rotation[proceduralOpen.axis],
      parent,
      target,
      usesWrapper: true,
    };

    return () => {
      if (!proceduralRef.current) return;
      const { parent: cleanupParent, target: cleanupTarget, pivot: cleanupPivot } =
        proceduralRef.current;
      cleanupParent.attach(cleanupTarget);
      cleanupParent.remove(cleanupPivot);
      proceduralRef.current = null;
    };
  }, [scene, proceduralKey, proceduralOpen, useProcedural]);

  useEffect(() => {
    initializedRef.current = false;
    if (!scene || !hasClip) {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = null;
      }
      return;
    }
    const mixer = new THREE.AnimationMixer(scene);
    mixerRef.current = mixer;
    return () => {
      mixer.stopAllAction();
      mixerRef.current = null;
    };
  }, [scene, hasClip]);

  useEffect(() => {
    const mixer = mixerRef.current;
    if (!mixer || !hasClip) return;
    if (!initializedRef.current) {
      initializedRef.current = true;
      if (!isOpen) return;
    }

    if (isOpen) {
      const clip = openClip ?? closeClip;
      if (!clip) return;
      playClip(mixer, clip, 1);
      return;
    }

    if (closeClip) {
      playClip(mixer, closeClip, 1);
      return;
    }

    if (openClip) {
      playClip(mixer, openClip, -1);
    }
  }, [isOpen, hasClip, openClip, closeClip]);

  useFrame((_, delta) => {
    mixerRef.current?.update(delta);
    if (!useProcedural || !proceduralRef.current) return;
    const { pivot, axis, angleRad, baseRotation } = proceduralRef.current;
    const targetAngle = baseRotation + (isOpen ? angleRad : 0);
    const current = pivot.rotation[axis];
    pivot.rotation[axis] = THREE.MathUtils.damp(
      current,
      targetAngle,
      6,
      delta,
    );
  });

  return null;
}
