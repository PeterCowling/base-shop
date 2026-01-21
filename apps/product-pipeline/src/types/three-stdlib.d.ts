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