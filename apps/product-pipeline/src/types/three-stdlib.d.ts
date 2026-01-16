declare module "three-stdlib/libs/MotionControllers" {
  interface ComponentDescription {
    touchPointNodeName?: string | undefined;
  }

  class Component {
    touchPointNodeName?: string | undefined;
  }
}

declare module "three-stdlib/lines/LineMaterial" {
  interface LineMaterialParameters {
    alphaToCoverage?: boolean;
  }
}

declare module "@react-three/fiber" {
  export type RootState = {
    clock: { elapsedTime: number };
  };

  export const Canvas: (props: Record<string, unknown>) => JSX.Element;

  export function useFrame(
    callback: (state: RootState, delta: number) => void,
  ): void;
}

declare module "@react-three/drei" {
  export const Html: (props: Record<string, unknown>) => JSX.Element;
  export const Line: (props: Record<string, unknown>) => JSX.Element;
  export const OrbitControls: (props: Record<string, unknown>) => JSX.Element;
  export const Stars: (props: Record<string, unknown>) => JSX.Element;
}

declare module "three" {
  export const AdditiveBlending: number;

  export class Vector3 {
    constructor(x?: number, y?: number, z?: number);
    clone(): Vector3;
    sub(v: Vector3): Vector3;
    copy(v: Vector3): this;
    addScaledVector(v: Vector3, s: number): this;
  }

  export class Color {
    constructor(color?: string);
  }

  export interface Mesh {
    position: { copy(v: Vector3): void };
  }

  export interface Group {
    rotation: { y: number; z: number };
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh?: Record<string, unknown>;
      sphereGeometry?: Record<string, unknown>;
      meshBasicMaterial?: Record<string, unknown>;
      group?: Record<string, unknown>;
      pointLight?: Record<string, unknown>;
      icosahedronGeometry?: Record<string, unknown>;
      meshStandardMaterial?: Record<string, unknown>;
      ringGeometry?: Record<string, unknown>;
      color?: Record<string, unknown>;
      fog?: Record<string, unknown>;
      ambientLight?: Record<string, unknown>;
      directionalLight?: Record<string, unknown>;
    }
  }
}

declare module "react/jsx-runtime" {
  export namespace JSX {
    interface IntrinsicElements {
      mesh?: Record<string, unknown>;
      sphereGeometry?: Record<string, unknown>;
      meshBasicMaterial?: Record<string, unknown>;
      group?: Record<string, unknown>;
      pointLight?: Record<string, unknown>;
      icosahedronGeometry?: Record<string, unknown>;
      meshStandardMaterial?: Record<string, unknown>;
      ringGeometry?: Record<string, unknown>;
      color?: Record<string, unknown>;
      fog?: Record<string, unknown>;
      ambientLight?: Record<string, unknown>;
      directionalLight?: Record<string, unknown>;
    }
  }
}

declare module "react/jsx-dev-runtime" {
  export namespace JSX {
    interface IntrinsicElements {
      mesh?: Record<string, unknown>;
      sphereGeometry?: Record<string, unknown>;
      meshBasicMaterial?: Record<string, unknown>;
      group?: Record<string, unknown>;
      pointLight?: Record<string, unknown>;
      icosahedronGeometry?: Record<string, unknown>;
      meshStandardMaterial?: Record<string, unknown>;
      ringGeometry?: Record<string, unknown>;
      color?: Record<string, unknown>;
      fog?: Record<string, unknown>;
      ambientLight?: Record<string, unknown>;
      directionalLight?: Record<string, unknown>;
    }
  }
}

export {};
