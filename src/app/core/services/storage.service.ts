import { Injectable } from '@angular/core';

/**
 * Service for handling storage operations (localStorage, sessionStorage, etc.)
 */
@Injectable({
  providedIn: 'root',
})
export class StorageService {
  /**
   * Get an item from localStorage
   * @param key The key of the item to retrieve
   * @returns The stored value or null if not found
   */
  getItem<T = any>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error getting item from localStorage', error);
      return null;
    }
  }

  /**
   * Set an item in localStorage
   * @param key The key under which to store the value
   * @param value The value to store
   */
  setItem(key: string, value: any): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error('Error setting item in localStorage', error);
    }
  }

  /**
   * Remove an item from localStorage
   * @param key The key of the item to remove
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from localStorage', error);
    }
  }

  /**
   * Clear all items from localStorage
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage', error);
    }
  }

  /**
   * Get an item from sessionStorage
   * @param key The key of the item to retrieve
   * @returns The stored value or null if not found
   */
  getSessionItem<T = any>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error getting item from sessionStorage', error);
      return null;
    }
  }

  /**
   * Set an item in sessionStorage
   * @param key The key under which to store the value
   * @param value The value to store
   */
  setSessionItem(key: string, value: any): void {
    try {
      const serializedValue = JSON.stringify(value);
      sessionStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error('Error setting item in sessionStorage', error);
    }
  }

  /**
   * Remove an item from sessionStorage
   * @param key The key of the item to remove
   */
  removeSessionItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from sessionStorage', error);
    }
  }

  /**
   * Clear all items from sessionStorage
   */
  clearSession(): void {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error('Error clearing sessionStorage', error);
    }
  }
}
