/**
 * Zentrale Babylon-Importe über Subpfade (Issue #3, Punkt 1: Bundle).
 *
 * Der Root-Einstieg `@babylonjs/core` zieht die komplette Engine (≈ 6 MB JS) ins Bundle. Hier wird
 * nur importiert, was der Pilot nutzt. Side-Effect-Importe (Szenen-Komponenten, Loader, Loader-
 * Erweiterungen) stehen bewusst an EINER Stelle, damit ein fehlendes Feature nicht als stiller
 * Laufzeitfehler auftaucht, sondern hier ergänzt wird.
 */

// --- Side-Effects: Szenenkomponenten, ohne die Picking, Schatten, Glow, Partikel nicht laufen
import '@babylonjs/core/Culling/ray'; // scene.pick / createPickingRay
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import '@babylonjs/core/Layers/effectLayerSceneComponent';
import '@babylonjs/core/Particles/particleSystemComponent';
import '@babylonjs/core/Animations/animatable';

// --- glTF 2.0 Loader (nur 2.0, kein Legacy-1.0-Loader) + die Erweiterungen, die der Export nutzen darf.
// Alles, was hier nicht steht (Draco, Meshopt, Basis/KTX2, Transmission …), muss beim Export AUS sein;
// `scripts/check-glb.mjs` prüft `extensionsRequired` gegen dieselbe Liste (SUPPORTED_GLTF_EXTENSIONS).
import '@babylonjs/loaders/glTF/2.0/glTFLoader';
import '@babylonjs/loaders/glTF/2.0/Extensions/KHR_materials_emissive_strength';
import '@babylonjs/loaders/glTF/2.0/Extensions/KHR_texture_transform';
import '@babylonjs/loaders/glTF/2.0/Extensions/KHR_mesh_quantization';
import '@babylonjs/loaders/glTF/2.0/Extensions/KHR_materials_unlit';
import '@babylonjs/loaders/glTF/2.0/Extensions/KHR_lights_punctual';
import '@babylonjs/loaders/glTF/2.0/Extensions/EXT_texture_webp';

// --- Klassen und Funktionen
export { Engine } from '@babylonjs/core/Engines/engine';
export { Scene } from '@babylonjs/core/scene';
export { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
export { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
export { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
export { Camera } from '@babylonjs/core/Cameras/camera';
export { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
export { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
export { PointLight } from '@babylonjs/core/Lights/pointLight';
export { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
export { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
export { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
export { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
export { Texture } from '@babylonjs/core/Materials/Textures/texture';
export { Mesh } from '@babylonjs/core/Meshes/mesh';
export { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
export { TransformNode } from '@babylonjs/core/Meshes/transformNode';
export { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
export { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
export { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
export { CreateDisc } from '@babylonjs/core/Meshes/Builders/discBuilder';
export { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
export { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
export { AnimationGroup } from '@babylonjs/core/Animations/animationGroup';
export { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';
export { SceneInstrumentation } from '@babylonjs/core/Instrumentation/sceneInstrumentation';
export { LoadAssetContainerAsync } from '@babylonjs/core/Loading/sceneLoader';
export { AssetContainer, InstantiatedEntries } from '@babylonjs/core/assetContainer';

// --- Typen
export type { Node } from '@babylonjs/core/node';
export type { Material } from '@babylonjs/core/Materials/material';
export type { BaseTexture } from '@babylonjs/core/Materials/Textures/baseTexture';
export type { Skeleton } from '@babylonjs/core/Bones/skeleton';
export type { Light } from '@babylonjs/core/Lights/light';
