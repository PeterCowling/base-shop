/* eslint-disable ds/no-raw-color -- HAND-0008 [ttl=2026-12-31]: Three.js material colors for asset generation script */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

if (typeof globalThis.FileReader === "undefined") {
  globalThis.FileReader = class {
    constructor() {
      this.result = null;
      this.onloadend = null;
    }

    readAsArrayBuffer(blob) {
      blob
        .arrayBuffer()
        .then((buffer) => {
          this.result = buffer;
          if (typeof this.onloadend === "function") {
            this.onloadend();
          }
        })
        .catch((error) => {
          if (typeof this.onerror === "function") {
            this.onerror(error);
          }
        });
    }
  };
}

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(SCRIPT_DIR, "../../../products/bag-001/assets");
const PARTS_DIR = path.join(OUTPUT_DIR, "parts");

const BAG_DIMENSIONS = {
  width: 1.8,
  height: 1.05,
  depth: 0.6,
  flapHeight: 0.22,
  flapDepth: 0.52,
  handleRadius: 0.6,
  handleTube: 0.06,
};

const DEFAULT_COLORS = {
  body: "#c7b49b",
  handle: "#3b2a21",
  hardware: "#d2d4d8",
  lining: "#c8a27a",
  personalization: "#8b6f55",
};

function createMaterial(name, { color, metalness = 0, roughness = 0.8 } = {}) {
  const material = new THREE.MeshStandardMaterial({
    color: color ? new THREE.Color(color) : new THREE.Color("#ffffff"),
    metalness,
    roughness,
  });
  material.name = name;
  return material;
}

function addAnchor(group, name, position) {
  const anchor = new THREE.Object3D();
  anchor.name = name;
  anchor.position.copy(position);
  group.add(anchor);
}

function buildHandbagScene({ detail }) {
  const scene = new THREE.Scene();
  const root = new THREE.Group();
  root.name = "HandbagRoot";
  scene.add(root);

  const segs = detail === "desktop" ? 4 : 1;
  const handleSegments = detail === "desktop" ? 24 : 12;

  const bodyMaterial = createMaterial("body_default", {
    color: DEFAULT_COLORS.body,
    roughness: 0.82,
    metalness: 0.02,
  });
  const handleMaterial = createMaterial("handle_default", {
    color: DEFAULT_COLORS.handle,
    roughness: 0.7,
    metalness: 0.02,
  });
  const hardwareMaterial = createMaterial("hardware_default", {
    color: DEFAULT_COLORS.hardware,
    roughness: 0.28,
    metalness: 1,
  });
  const liningMaterial = createMaterial("lining_default", {
    color: DEFAULT_COLORS.lining,
    roughness: 0.92,
    metalness: 0,
  });

  const bodyGeometry = new THREE.BoxGeometry(
    BAG_DIMENSIONS.width,
    BAG_DIMENSIONS.height,
    BAG_DIMENSIONS.depth,
    segs,
    segs,
    segs,
  );
  const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
  bodyMesh.name = "Body_Handbag";
  bodyMesh.position.set(0, BAG_DIMENSIONS.height / 2, 0);
  root.add(bodyMesh);

  const flapGeometry = new THREE.BoxGeometry(
    BAG_DIMENSIONS.width * 0.98,
    BAG_DIMENSIONS.flapHeight,
    BAG_DIMENSIONS.flapDepth,
    segs,
    1,
    segs,
  );
  const flapMesh = new THREE.Mesh(flapGeometry, bodyMaterial);
  flapMesh.name = "Body_Flap";
  flapMesh.position.set(
    0,
    BAG_DIMENSIONS.height - 0.02 + BAG_DIMENSIONS.flapHeight / 2,
    0,
  );
  root.add(flapMesh);

  const handleGeometry = new THREE.TorusGeometry(
    BAG_DIMENSIONS.handleRadius,
    BAG_DIMENSIONS.handleTube,
    handleSegments / 2,
    handleSegments,
    Math.PI,
  );
  const handleMesh = new THREE.Mesh(handleGeometry, handleMaterial);
  handleMesh.name = "Handle_Classic";
  handleMesh.rotation.z = Math.PI;
  handleMesh.position.set(
    0,
    BAG_DIMENSIONS.height + BAG_DIMENSIONS.handleRadius - 0.05,
    0,
  );
  root.add(handleMesh);

  const hardwareGeometry = new THREE.BoxGeometry(0.22, 0.12, 0.05, segs, segs, segs);
  const hardwareMesh = new THREE.Mesh(hardwareGeometry, hardwareMaterial);
  hardwareMesh.name = "Hardware_Clasp";
  hardwareMesh.position.set(
    0,
    BAG_DIMENSIONS.height * 0.55,
    BAG_DIMENSIONS.depth / 2 + 0.03,
  );
  root.add(hardwareMesh);

  const liningGeometry = new THREE.BoxGeometry(
    BAG_DIMENSIONS.width * 0.86,
    BAG_DIMENSIONS.height * 0.72,
    BAG_DIMENSIONS.depth * 0.75,
    segs,
    segs,
    segs,
  );
  const liningMesh = new THREE.Mesh(liningGeometry, liningMaterial);
  liningMesh.name = "Lining_Interior";
  liningMesh.position.set(0, BAG_DIMENSIONS.height * 0.5, 0);
  root.add(liningMesh);


  const anchors = new THREE.Group();
  anchors.name = "HotspotAnchors";
  root.add(anchors);

  addAnchor(
    anchors,
    "hs_body",
    new THREE.Vector3(0, BAG_DIMENSIONS.height * 0.6, BAG_DIMENSIONS.depth / 2 + 0.02),
  );
  addAnchor(anchors, "focus_body", new THREE.Vector3(0, BAG_DIMENSIONS.height * 0.5, 0));

  addAnchor(anchors, "hs_handle", new THREE.Vector3(0, BAG_DIMENSIONS.height + 0.35, 0));
  addAnchor(anchors, "focus_handle", new THREE.Vector3(0, BAG_DIMENSIONS.height + 0.2, 0));

  addAnchor(
    anchors,
    "hs_hardware",
    new THREE.Vector3(0, BAG_DIMENSIONS.height * 0.55, BAG_DIMENSIONS.depth / 2 + 0.05),
  );
  addAnchor(anchors, "focus_hardware", new THREE.Vector3(0, BAG_DIMENSIONS.height * 0.55, 0.1));

  addAnchor(anchors, "hs_lining", new THREE.Vector3(0, BAG_DIMENSIONS.height * 0.7, 0));
  addAnchor(anchors, "focus_lining", new THREE.Vector3(0, BAG_DIMENSIONS.height * 0.6, 0));

  addAnchor(
    anchors,
    "hs_personalization",
    new THREE.Vector3(0.35, BAG_DIMENSIONS.height * 0.42, BAG_DIMENSIONS.depth / 2 + 0.04),
  );
  addAnchor(
    anchors,
    "focus_personalization",
    new THREE.Vector3(0.35, BAG_DIMENSIONS.height * 0.42, 0.1),
  );

  addAnchor(anchors, "slot_body", new THREE.Vector3(0, BAG_DIMENSIONS.height / 2, 0));
  addAnchor(
    anchors,
    "slot_handle",
    new THREE.Vector3(0, BAG_DIMENSIONS.height + BAG_DIMENSIONS.handleRadius - 0.05, 0),
  );
  addAnchor(
    anchors,
    "slot_hardware",
    new THREE.Vector3(0, BAG_DIMENSIONS.height * 0.55, BAG_DIMENSIONS.depth / 2 + 0.03),
  );
  addAnchor(anchors, "slot_lining", new THREE.Vector3(0, BAG_DIMENSIONS.height * 0.5, 0));
  addAnchor(
    anchors,
    "slot_personalization",
    new THREE.Vector3(0.38, BAG_DIMENSIONS.height * 0.45, BAG_DIMENSIONS.depth / 2 + 0.03),
  );

  return scene;
}

function buildHandlePart({ detail, style }) {
  const scene = new THREE.Scene();
  const root = new THREE.Group();
  root.name = "HandlePart";
  scene.add(root);

  const handleSegments = detail === "desktop" ? 24 : 12;
  const handleMaterial = createMaterial("handle_default", {
    color: DEFAULT_COLORS.handle,
    roughness: 0.7,
    metalness: 0.02,
  });
  const hardwareMaterial = createMaterial("hardware_default", {
    color: DEFAULT_COLORS.hardware,
    roughness: 0.28,
    metalness: 1,
  });

  const handleGeometry = new THREE.TorusGeometry(
    BAG_DIMENSIONS.handleRadius,
    BAG_DIMENSIONS.handleTube,
    handleSegments / 2,
    handleSegments,
    Math.PI,
  );
  const handleMesh = new THREE.Mesh(handleGeometry, handleMaterial);
  handleMesh.name = style === "buckle" ? "Handle_Buckle" : "Handle_Classic";
  handleMesh.rotation.z = Math.PI;
  root.add(handleMesh);

  if (style === "buckle") {
    const buckleGeometry = new THREE.BoxGeometry(0.2, 0.08, 0.04);
    const buckleMesh = new THREE.Mesh(buckleGeometry, hardwareMaterial);
    buckleMesh.name = "Hardware_Buckle";
    buckleMesh.position.set(0, BAG_DIMENSIONS.handleRadius - 0.02, 0);
    root.add(buckleMesh);
  }

  return scene;
}

function buildMonogramPart({ detail }) {
  const scene = new THREE.Scene();
  const root = new THREE.Group();
  root.name = "MonogramPart";
  scene.add(root);

  const segs = detail === "desktop" ? 2 : 1;
  const personalizationMaterial = createMaterial("personalization_default", {
    color: DEFAULT_COLORS.personalization,
    roughness: 0.6,
    metalness: 0.1,
  });

  const plateGeometry = new THREE.BoxGeometry(0.34, 0.12, 0.02, segs, segs, segs);
  const plateMesh = new THREE.Mesh(plateGeometry, personalizationMaterial);
  plateMesh.name = "Personalization_Monogram";
  root.add(plateMesh);

  return scene;
}

async function exportGlb(scene, outputPath) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  const exporter = new GLTFExporter();
  const result = await new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (data) => resolve(data),
      (error) => reject(error),
      { binary: true, forceIndices: true, truncateDrawRange: true },
    );
  });

  if (!(result instanceof ArrayBuffer)) {
    throw new Error("Unexpected GLTF export result");
  }

  await writeFile(outputPath, Buffer.from(result));
}

async function build() {
  const desktopScene = buildHandbagScene({ detail: "desktop" });
  const mobileScene = buildHandbagScene({ detail: "mobile" });

  await exportGlb(desktopScene, path.join(OUTPUT_DIR, "desktop.glb"));
  await exportGlb(mobileScene, path.join(OUTPUT_DIR, "mobile.glb"));

  const desktopClassic = buildHandlePart({ detail: "desktop", style: "classic" });
  const desktopBuckle = buildHandlePart({ detail: "desktop", style: "buckle" });
  const mobileClassic = buildHandlePart({ detail: "mobile", style: "classic" });
  const mobileBuckle = buildHandlePart({ detail: "mobile", style: "buckle" });

  await exportGlb(desktopClassic, path.join(PARTS_DIR, "handle-classic-desktop.glb"));
  await exportGlb(desktopBuckle, path.join(PARTS_DIR, "handle-buckle-desktop.glb"));
  await exportGlb(mobileClassic, path.join(PARTS_DIR, "handle-classic-mobile.glb"));
  await exportGlb(mobileBuckle, path.join(PARTS_DIR, "handle-buckle-mobile.glb"));

  const desktopMonogram = buildMonogramPart({ detail: "desktop" });
  const mobileMonogram = buildMonogramPart({ detail: "mobile" });
  await exportGlb(
    desktopMonogram,
    path.join(PARTS_DIR, "monogram-embossed-desktop.glb"),
  );
  await exportGlb(
    mobileMonogram,
    path.join(PARTS_DIR, "monogram-embossed-mobile.glb"),
  );
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
