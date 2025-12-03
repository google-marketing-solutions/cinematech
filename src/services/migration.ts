import type { Scene } from '@/types';
import { Logger } from './logger';

/**
 * The current version of the scene and project schema.
 * This is used to determine if a migration is needed when loading old data.
 */
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Migrates a scene from V0 (legacy) to V1 (structured prompt schema).
 * @param {Record<string, any>} scene - The scene object.
 * @return {Scene} The migrated scene.
 */
function migrateSceneV0ToV1(scene: Record<string, any>): Scene {
  const migratedScene: Scene = { ...scene } as Scene;

  // Ensure new structured fields exist
  if (!migratedScene.camera) {
    migratedScene.camera = {
      angle: scene.videoDirectives?.camera || '',
      movement: scene.videoDirectives?.movement || '',
      type: '',
      lens: '',
    };
  }

  if (!migratedScene.audio) {
    migratedScene.audio = {
      dialogue: scene.script || '',
      ambient: '',
      music: '',
      soundEffects: '',
    };
  }

  if (!migratedScene.style) {
    migratedScene.style = {
      artStyle:
        scene.imageDirectives?.style || scene.videoDirectives?.style || '',
      lighting:
        scene.imageDirectives?.lighting ||
        scene.videoDirectives?.lighting ||
        '',
      colorPalette: scene.imageDirectives?.color || '',
      mood: scene.imageDirectives?.mood || '',
    };
  }

  if (migratedScene.subject === undefined) {
    migratedScene.subject = '';
  }
  if (migratedScene.action === undefined) {
    migratedScene.action = '';
  }
  if (migratedScene.environment === undefined) {
    migratedScene.environment = scene.background || '';
  }
  if (migratedScene.negativePrompt === undefined) {
    migratedScene.negativePrompt = '';
  }

  // Ensure legacy fields are present (optional but good for type safety if we access them)
  if (!migratedScene.imageDirectives) {
    migratedScene.imageDirectives = {
      description: '',
      style: '',
      framing: '',
      lighting: '',
      color: '',
      mood: '',
    };
  }
  if (!migratedScene.videoDirectives) {
    migratedScene.videoDirectives = {
      style: '',
      camera: '',
      movement: '',
      lighting: '',
      transition: '',
    };
  }

  return migratedScene;
}

/**
 * Migrates an entire project's data to the latest schema version.
 * @param {Record<string, any>} projectData - The raw project data from JSON.
 * @return {unknown} The migrated project data.
 */
export function migrateProject(projectData: Record<string, unknown>): unknown {
  if (!projectData) return projectData;

  const migratedData = { ...projectData } as any;
  let currentVersion = migratedData.version || 0;

  // Migration Chain
  if (currentVersion < 1) {
    Logger.info('Migration', 'Migrating project from V0 to V1...');
    if (migratedData.scenes) {
      migratedData.scenes = migratedData.scenes.map(migrateSceneV0ToV1);
    }
    currentVersion = 1;
  }

  // Future migrations can be added here:
  // if (currentVersion < 2) { ... }

  migratedData.version = currentVersion;
  return migratedData;
}
