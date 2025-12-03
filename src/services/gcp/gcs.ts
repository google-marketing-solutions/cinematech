/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

import { getAccessToken } from '../auth.ts';
import { useConfigStore } from '@/stores/config.ts';
import type { FileSystemNode } from '@/types';

const GCS_UPLOAD_API_BASE_URL =
  'https://storage.googleapis.com/upload/storage/v1/b';
const GCS_STORAGE_API_BASE_URL = 'https://storage.googleapis.com/storage/v1/b';

/**
 * @interface GcsUriParts
 * @property {string} bucket - The GCS bucket name.
 * @property {string} object - The GCS object name.
 */
interface GcsUriParts {
  bucket: string;
  object: string;
}

interface GcsItem {
  name: string;
  bucket: string;
  contentType: string;
  size: string;
  updated: string;
  metadata?: {
    duration?: string;
  };
}

/**
 * Parses a GCS URI into its bucket and object parts.
 * @param {string} gcsUri - The GCS URI to parse.
 * @return {GcsUriParts} An object containing the bucket and object parts.
 * @throws {Error} If the GCS URI format is invalid.
 */
function _parseGcsUri(gcsUri: string): GcsUriParts {
  if (typeof gcsUri !== 'string' || !gcsUri.startsWith('gs://')) {
    throw new Error(
      'Invalid GCS URI format. Expected "gs://bucket-name/object-name".'
    );
  }
  const [bucket, ...objectParts] = gcsUri.replace('gs://', '').split('/');
  const object = objectParts.join('/');
  if (!bucket || !object) {
    throw new Error(
      'Invalid GCS URI format. Expected "gs://bucket-name/object-name".'
    );
  }
  return { bucket, object };
}

/**
 * Recursively updates GCS URIs in a JSON object.
 * @param {unknown} obj - The object to traverse.
 * @param {string} sourceProjectName - The source project name to replace.
 * @param {string} destinationProjectName - The destination project name.
 * @return {unknown} The object with updated GCS URIs.
 */
function _updateGcsUris(
  obj: unknown,
  sourceProjectName: string,
  destinationProjectName: string
): unknown {
  if (typeof obj === 'string' && obj.startsWith('gs://')) {
    return obj.replace(`/${sourceProjectName}/`, `/${destinationProjectName}/`);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) =>
      _updateGcsUris(item, sourceProjectName, destinationProjectName)
    );
  }
  if (typeof obj === 'object' && obj !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = _updateGcsUris(
        value,
        sourceProjectName,
        destinationProjectName
      );
    }
    return result;
  }
  return obj;
}

/**
 * Makes a request to the GCS API.
 * @param {string} baseUrl - The base URL of the GCS API.
 * @param {string} path - The path of the API endpoint.
 * @param {Record<string, string>} params - The query parameters for the request.
 * @param {RequestInit} options - The options for the fetch request.
 * @return {Promise<Response>} A promise that resolves with the fetch response.
 * @throws {Error} If the API request fails.
 */
async function _gcsApiRequest(
  baseUrl: string,
  path: string,
  params: Record<string, string> = {},
  options: RequestInit = {}
): Promise<Response> {
  const url = new URL(`${baseUrl}/${path}`);
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.append(key, value)
  );

  const accessToken = await getAccessToken();
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    ...options.headers,
  };

  const response = await fetch(url.toString(), { ...options, headers });

  if (!response.ok) {
    if (options.method === 'DELETE' && response.status === 404) {
      return response;
    }

    const contentType = response.headers.get('Content-Type');
    let errorMessage = `GCS API request failed with status ${response.status}`;

    if (contentType && contentType.includes('application/json')) {
      try {
        const errorBody = await response.json();
        errorMessage = errorBody.error?.message || errorMessage;
      } catch (e) {
        errorMessage = 'Failed to parse JSON error response.';
      }
    } else {
      try {
        errorMessage = await response.text();
      } catch (e) {
        errorMessage = 'Failed to read error response text.';
      }
    }

    throw new Error(errorMessage);
  }

  return response;
}

/**
 * Resolves the GCS bucket name to use for a request.
 * If a bucket name is provided, it is used. Otherwise, the default bucket name from the config store is used.
 * @param {string} [bucketName] - The optional bucket name to use.
 * @return {string} The resolved bucket name.
 */
function _getBucketName(bucketName?: string): string {
  const configStore = useConfigStore();
  return bucketName || configStore.gcsBucketName;
}

/**
 * Lists all projects in a GCS bucket.
 * Projects are identified by the prefixes of the objects in the bucket.
 * @param {string} [bucketName] - The optional name of the bucket to list projects from.
 * @return {Promise<string[]>} A promise that resolves with an array of project names.
 */
/**
 * Lists all projects in a GCS bucket.
 * Projects are identified by the prefixes of the objects in the bucket.
 * Only prefixes containing a valid `project.json` file are returned.
 * @param {string} [bucketName] - The optional name of the bucket to list projects from.
 * @return {Promise<string[]>} A promise that resolves with an array of project names.
 */
export async function listProjects(bucketName?: string): Promise<string[]> {
  const resolvedBucketName = _getBucketName(bucketName);
  const path = `${resolvedBucketName}/o`;
  const params = { delimiter: '/' };

  try {
    if (resolvedBucketName) {
      const response = await _gcsApiRequest(
        GCS_STORAGE_API_BASE_URL,
        path,
        params,
        {
          method: 'GET',
        }
      );
      const result = await response.json();
      if (result.prefixes) {
        const potentialProjects = result.prefixes.map((p: string) =>
          p.slice(0, -1)
        );
        const validProjects: string[] = [];

        // Check each prefix for a valid project.json
        await Promise.all(
          potentialProjects.map(async (projectName: string) => {
            try {
              const gcsUri = `gs://${resolvedBucketName}/${projectName}/project.json`;
              const projectData = await downloadFileFromGCS(gcsUri, 'json');
              // Minimal validation: check for version or scenes array
              if (
                projectData &&
                (projectData.version !== undefined ||
                  Array.isArray(projectData.scenes))
              ) {
                validProjects.push(projectName);
              }
            } catch (error) {
              // Ignore if project.json doesn't exist or is invalid
            }
          })
        );

        return validProjects.sort();
      }
    }
    return [];
  } catch (error) {
    console.error('Error listing projects:', error);
    throw error;
  }
}

/**
 * Deletes a project and all its associated files from a GCS bucket.
 * @param {string} projectName - The name of the project to delete.
 * @param {string} [bucketName] - The optional name of the bucket to delete the project from.
 * @return {Promise<void>} A promise that resolves when the project has been deleted.
 */
export async function deleteProject(
  projectName: string,
  bucketName?: string
): Promise<void> {
  const resolvedBucketName = _getBucketName(bucketName);
  const path = `${resolvedBucketName}/o`;
  const params = { prefix: `${projectName}/` };

  try {
    const response = await _gcsApiRequest(
      GCS_STORAGE_API_BASE_URL,
      path,
      params,
      {
        method: 'GET',
      }
    );
    const { items } = await response.json();

    if (!items || items.length === 0) {
      const gcsUri = `gs://${resolvedBucketName}/${projectName}/`;
      await deleteFileFromGCS(gcsUri);
      return;
    }

    const deletePromises = items.map((item: GcsItem) => {
      const gcsUri = `gs://${item.bucket}/${item.name}`;
      return deleteFileFromGCS(gcsUri);
    });

    await Promise.all(deletePromises);
  } catch (error) {
    console.error(`Error deleting project "${projectName}":`, error);
    throw error;
  }
}

/**
 * Creates a new project in a GCS bucket.
 * A project is created by uploading an empty `project.json` file to a new prefix.
 * @param {string} projectName - The name of the project to create.
 * @param {string} [bucketName] - The optional name of the bucket to create the project in.
 * @return {Promise<string>} A promise that resolves with the name of the created project.
 */
export async function createProject(
  projectName: string,
  bucketName?: string
): Promise<string> {
  const resolvedBucketName = _getBucketName(bucketName);
  const fileName = `${projectName}/project.json`;
  const path = `${resolvedBucketName}/o`;
  const params = { uploadType: 'media', name: fileName };

  // Initial project structure
  const initialProjectData = {
    version: 1, // Hardcoded for now, or import CURRENT_SCHEMA_VERSION if available
    scenes: [],
    characters: [],
    prompt: '',
    summary: '',
  };

  try {
    await _gcsApiRequest(GCS_UPLOAD_API_BASE_URL, path, params, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(initialProjectData),
    });
    return projectName;
  } catch (error) {
    console.error(`Error creating project "${projectName}":`, error);
    throw error;
  }
}

/**
 * Copies a project in GCS by duplicating its files under a new project name.
 * @param {string} sourceProjectName - The name of the project to copy.
 * @param {string} destinationProjectName - The name of the new project.
 * @param {string} [bucketName] - The optional name of the bucket.
 * @return {Promise<void>} A promise that resolves when the project is copied.
 */
export async function copyProject(
  sourceProjectName: string,
  destinationProjectName: string,
  bucketName?: string
): Promise<void> {
  const resolvedBucketName = _getBucketName(bucketName);
  const sourcePath = `${resolvedBucketName}/o`;
  const sourceParams = { prefix: `${sourceProjectName}/` };

  try {
    const response = await _gcsApiRequest(
      GCS_STORAGE_API_BASE_URL,
      sourcePath,
      sourceParams,
      { method: 'GET' }
    );
    const { items } = await response.json();

    if (!items || items.length === 0) {
      return;
    }

    const projectJsonItem = items.find(
      (item: GcsItem) => item.name === `${sourceProjectName}/project.json`
    );

    if (projectJsonItem) {
      const projectJson = await downloadFileFromGCS(
        `gs://${resolvedBucketName}/${projectJsonItem.name}`,
        'json'
      );
      const updatedProjectJson = _updateGcsUris(
        projectJson,
        sourceProjectName,
        destinationProjectName
      );
      const blob = new Blob([JSON.stringify(updatedProjectJson, null, 2)], {
        type: 'application/json',
      });
      const file = new File([blob], 'project.json', {
        type: 'application/json',
      });
      await uploadFileToGCS(
        file,
        'project.json',
        resolvedBucketName,
        destinationProjectName
      );
    }

    const otherFiles = items.filter(
      (item: GcsItem) => item.name !== `${sourceProjectName}/project.json`
    );

    const copyPromises = otherFiles.map((item: GcsItem) => {
      const destinationObjectName = item.name.replace(
        sourceProjectName,
        destinationProjectName
      );
      const copyPath = `${item.bucket}/o/${encodeURIComponent(
        item.name
      )}/copyTo/b/${item.bucket}/o/${encodeURIComponent(
        destinationObjectName
      )}`;
      return _gcsApiRequest(
        GCS_STORAGE_API_BASE_URL,
        copyPath,
        {},
        { method: 'POST' }
      );
    });

    await Promise.all(copyPromises);
  } catch (error) {
    console.error(`Error copying project "${sourceProjectName}":`, error);
    throw error;
  }
}

/**
 * Uploads a file to a GCS bucket.
 * @param {File} file - The file to upload.
 * @param {string} fileName - The name of the file to create in the bucket.
 * @param {string} [bucketName] - The optional name of the bucket to upload the file to.
 * @param {string} [prefix] - The optional prefix to prepend to the file name.
 * @return {Promise<string>} A promise that resolves with the GCS URI of the uploaded file.
 */
export async function uploadFileToGCS(
  file: File,
  fileName: string,
  bucketName?: string,
  prefix = '',
  metadata?: Record<string, string>
): Promise<string> {
  const resolvedBucketName = _getBucketName(bucketName);
  const objectName = prefix ? `${prefix}/${fileName}` : fileName;
  const path = `${resolvedBucketName}/o`;
  const params = { uploadType: 'media', name: objectName };

  try {
    const response = await _gcsApiRequest(
      GCS_UPLOAD_API_BASE_URL,
      path,
      params,
      {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      }
    );
    const result = await response.json();

    // If metadata is provided, update it
    if (metadata) {
      const updatePath = `${resolvedBucketName}/o/${encodeURIComponent(result.name)}`;
      await _gcsApiRequest(
        GCS_STORAGE_API_BASE_URL,
        updatePath,
        {},
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metadata }),
        }
      );
    }

    return `gs://${result.bucket}/${result.name}`;
  } catch (error) {
    console.error('Error uploading file to GCS:', error);
    throw error;
  }
}

/**
 * Uploads a file to a GCS bucket with a type-prefixed name.
 * @param {File} file - The file to upload.
 * @param {'image' | 'video' | string} fileType - The type of the file.
 * @param {string} [bucketName] - The optional name of the bucket to upload the file to.
 * @param {string} [prefix] - The optional prefix to prepend to the file name.
 * @return {Promise<string>} A promise that resolves with the GCS URI of the uploaded file.
 */
export async function uploadTypedFileToGCS(
  file: File,
  fileType: 'image' | 'video' | string,
  bucketName?: string,
  prefix = ''
): Promise<string> {
  const fileName = `${fileType}-${Date.now()}-${file.name}`;
  return uploadFileToGCS(file, fileName, bucketName, prefix);
}

/**
 * Converts a base64 encoded string to a File object.
 * @param {string} base64 - The base64 encoded string.
 * @param {string} fileName - The name of the file to create.
 * @param {string} mimeType - The MIME type of the file.
 * @return {File} The created File object.
 */
function _base64ToFile(
  base64: string,
  fileName: string,
  mimeType: string
): File {
  const pureBase64 = base64.split(',').pop()!;
  const byteCharacters = atob(pureBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  return new File([blob], fileName, { type: mimeType });
}

/**
 * Saves a base64 encoded string to a GCS bucket.
 * @param {string} bytesBase64Encoded - The base64 encoded string to save.
 * @param {'image' | 'video' | string} fileType - The type of the file.
 * @param {string} mimeType - The MIME type of the file.
 * @param {string} [bucketName] - The optional name of the bucket to save the file to.
 * @param {string} [prefix] - The optional prefix to prepend to the file name.
 * @return {Promise<string>} A promise that resolves with the GCS URI of the saved file.
 */
export async function saveBase64ToGCS(
  bytesBase64Encoded: string,
  fileType: 'image' | 'video' | string,
  mimeType: string,
  bucketName?: string,
  prefix = '',
  metadata?: Record<string, string>
): Promise<string> {
  let extension = mimeType.split('/')[1] || 'bin';
  if (mimeType === 'audio/mpeg') {
    extension = 'mp3';
  }
  const fileName = `${fileType}-${Date.now()}.${extension}`;
  const file = _base64ToFile(bytesBase64Encoded, fileName, mimeType);
  return uploadFileToGCS(file, fileName, bucketName, prefix, metadata);
}

type DownloadAs = 'arrayBuffer' | 'blob' | 'json' | 'text';

/**
 * Downloads a file from a GCS bucket.
 * @param {string} gcsUri - The GCS URI of the file to download.
 * @param {DownloadAs} [as='blob'] - The format to download the file as.
 * @return {Promise<any>} A promise that resolves with the downloaded file in the specified format.
 */
export async function downloadFileFromGCS(
  gcsUri: string,
  as: DownloadAs = 'blob'
): Promise<any> {
  const { bucket, object } = _parseGcsUri(gcsUri);
  const path = `${bucket}/o/${encodeURIComponent(object)}`;
  const params = { alt: 'media' };

  try {
    const response = await _gcsApiRequest(
      GCS_STORAGE_API_BASE_URL,
      path,
      params,
      { method: 'GET' }
    );
    return response[as]();
  } catch (error) {
    console.error(`Error downloading file from GCS as ${as}:`, error);
    throw error;
  }
}

/**
 * Downloads a file from a GCS bucket and returns it as a base64 encoded string.
 * @param {string} gcsUri - The GCS URI of the file to download.
 * @return {Promise<string>} A promise that resolves with the base64 encoded file content.
 */
export async function downloadFileAsBase64(gcsUri: string): Promise<string> {
  const blob = await downloadFileFromGCS(gcsUri, 'blob');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = (reader.result as string).split(',')[1];
      resolve(base64data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Downloads a video from a GCS bucket and returns it as a Uint8Array.
 * @param {string} gcsUri - The GCS URI of the video to download.
 * @return {Promise<Uint8Array>} A promise that resolves with the video content as a Uint8Array.
 */
export async function downloadVideoAsUint8Array(
  gcsUri: string
): Promise<Uint8Array> {
  const arrayBuffer = await downloadFileFromGCS(gcsUri, 'arrayBuffer');
  return new Uint8Array(arrayBuffer);
}

/**
 * Gets the public URL of a file in a GCS bucket.
 * @param {string} gcsUri - The GCS URI of the file.
 * @return {string} The public URL of the file.
 */
export function getPublicUrlFromGcsUri(gcsUri: string): string {
  const { bucket, object } = _parseGcsUri(gcsUri);
  return `https://storage.googleapis.com/${bucket}/${object}`;
}

/**
 * Deletes a file from a GCS bucket.
 * @param {string} gcsUri - The GCS URI of the file to delete.
 * @return {Promise<void>} A promise that resolves when the file has been deleted.
 */
export async function deleteFileFromGCS(gcsUri: string): Promise<void> {
  try {
    const { bucket, object } = _parseGcsUri(gcsUri);
    const path = `${bucket}/o/${encodeURIComponent(object)}`;
    await _gcsApiRequest(
      GCS_STORAGE_API_BASE_URL,
      path,
      {},
      { method: 'DELETE' }
    );
  } catch (error) {
    console.error('Error deleting file from GCS:', error);
    throw error;
  }
}

/**
 * Lists files in a GCS bucket.
 * @param {string} [bucketName] - The optional name of the bucket to list files from.
 * @param {string} [prefix] - The optional prefix to filter files by.
 * @param {string} [delimiter] - The optional delimiter to use for grouping files (e.g., '/').
 * @return {Promise<FileSystemNode[]>} A promise that resolves with an array of file system nodes.
 */
export async function listFiles(
  bucketName?: string,
  prefix = '',
  delimiter = '/'
): Promise<FileSystemNode[]> {
  const resolvedBucketName = _getBucketName(bucketName);
  const path = `${resolvedBucketName}/o`;
  const params: Record<string, string> = { prefix };
  if (delimiter) {
    params.delimiter = delimiter;
  }

  try {
    const response = await _gcsApiRequest(
      GCS_STORAGE_API_BASE_URL,
      path,
      params,
      {
        method: 'GET',
      }
    );
    const result = await response.json();
    const nodes: FileSystemNode[] = [];

    if (result.prefixes) {
      result.prefixes.forEach((p: string) => {
        const name = p.replace(prefix, '').replace(/\/$/, '');
        nodes.push({
          id: p,
          name,
          type: 'folder',
          gcsUri: `gs://${resolvedBucketName}/${p}`,
        });
      });
    }

    if (result.items) {
      result.items.forEach((item: GcsItem) => {
        if (item.name !== prefix) {
          // Exclude the folder itself if it appears as an item
          const name = item.name.replace(prefix, '');
          nodes.push({
            id: `gs://${item.bucket}/${item.name}`,
            name,
            type: 'file',
            gcsUri: `gs://${item.bucket}/${item.name}`,
            mimeType: item.contentType,
            size: Number(item.size),
            updated: item.updated,
            duration: item.metadata?.duration
              ? Number(item.metadata.duration)
              : undefined,
          });
        }
      });
    }

    return nodes;
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
}
