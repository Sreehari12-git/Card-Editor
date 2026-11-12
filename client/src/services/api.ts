import axios from 'axios';
import { DesignCategory, DesignTemplate } from '../types';

export const apiClient = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001',
  timeout: 10000,
});

/**
 * Fetch all design templates from NestJS backend
 */
export async function fetchTemplates(): Promise<DesignTemplate[]> {
  const response = await apiClient.get<DesignTemplate[]>('/templates');
  return response.data;
}

/**
 * Fetch all design template categories from NestJS backend
 */
export async function fetchCategories(): Promise<DesignCategory[]> {
  const response = await apiClient.get<DesignCategory[]>('/categories');
  return response.data;
}

/**
 * Fetch details for a single template by id
 */
export async function fetchTemplateById(id: string): Promise<DesignTemplate> {
  const response = await apiClient.get<DesignTemplate>(`/templates/${id}`);
  return response.data;
}
