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

import { defineStore } from 'pinia';
import {
  listProjects,
  createProject as createGcsProject,
  deleteProject as deleteGcsProject,
} from '@/services/gcp/gcs.ts';
import { useStoryStore } from './story.ts';

/**
 * @interface ProjectState
 * @property {string[]} projects - A list of all project IDs.
 * @property {string | null} currentProjectId - The ID of the currently selected project.
 * @property {boolean} loading - A flag indicating whether the store is currently loading data.
 * @property {Error | null} error - An error object if an error has occurred.
 * @property {boolean} isCollapsed - A flag indicating whether the project list is collapsed.
 */
interface ProjectState {
  projects: string[];
  currentProjectId: string | null;
  loading: boolean;
  error: Error | null;
  isCollapsed: boolean;
}

/**
 * Pinia store for managing projects.
 */
export const useProjectStore = defineStore('project', {
  /**
   * The initial state of the store.
   * @return {ProjectState} The initial state.
   */
  state: (): ProjectState => ({
    projects: [],
    currentProjectId: null,
    loading: false,
    error: null,
    isCollapsed: false,
  }),
  actions: {
    /**
     * Toggles the collapsed state of the project list.
     */
    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed;
    },
    /**
     * Fetches the list of projects from GCS and sets the current project.
     */
    async fetchProjects() {
      this.loading = true;
      this.error = null;
      try {
        this.projects = await listProjects();
        if (this.projects.length > 0) {
          const lastProjectId = localStorage.getItem('currentProjectId');
          if (lastProjectId && this.projects.includes(lastProjectId)) {
            await this.setCurrentProject(lastProjectId);
          } else {
            await this.setCurrentProject(this.projects[0]);
          }
        }
      } catch (error: any) {
        this.error = error;
        console.error('Error fetching projects:', error);
      } finally {
        this.loading = false;
      }
    },
    /**
     * Sets the current project and loads its data.
     * @param {string} projectId - The ID of the project to set as current.
     */
    async setCurrentProject(projectId: string) {
      if (this.currentProjectId === projectId) return;

      this.loading = true;
      this.currentProjectId = projectId;
      localStorage.setItem('currentProjectId', projectId);
      const storyStore = useStoryStore();
      try {
        await storyStore.loadProject(projectId);
      } catch (error: any) {
        this.error = new Error(
          `Failed to load project ${projectId}: ${error.message}`
        );
        console.error(this.error);
      } finally {
        this.loading = false;
      }
    },
    /**
     * Creates a new project.
     * @param {string} projectName - The name of the new project.
     */
    async createProject(projectName: string) {
      this.loading = true;
      this.error = null;
      try {
        await createGcsProject(projectName);
        await this.fetchProjects();
        await this.setCurrentProject(projectName);
      } catch (error: any) {
        this.error = error;
        console.error('Error creating project:', error);
      } finally {
        this.loading = false;
      }
    },
    /**
     * Deletes a project.
     * @param {string} projectId - The ID of the project to delete.
     */
    async deleteProject(projectId: string) {
      this.loading = true;
      this.error = null;
      try {
        await deleteGcsProject(projectId);
        await this.fetchProjects();
      } catch (error: any) {
        this.error = new Error(
          `Failed to delete project ${projectId}: ${error.message}`
        );
        console.error(this.error);
      } finally {
        this.loading = false;
      }
    },
  },
});
