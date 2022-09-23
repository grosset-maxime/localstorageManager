import type { Operation } from 'json-joy/lib/json-patch/types';
import { applyPatch } from 'json-joy/lib/json-patch';
import { find, parseJsonPointer } from 'json-joy/lib/json-pointer';

export type LSValue = boolean | string | number | null;
export interface LSObj {
  [k: string]: LSValue | LSObj;
}

/**
 * @constant {string} LS_NAME - LS key name.
 * @private
 */
const LS_NAME = 'AdminWAPv2';

/**
 * @property {LSObj} ls - LS object cache.
 * @private
 */
let ls: LSObj = {};

/**
 * Clone LS object or sub LS object.
 * @param {LSObj} obj - LS object or sub LS object to clone.
 * @returns {LSObj}
 * @private
 */
const clone = (obj: LSObj): LSObj => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Normalize path. (add '/' at start and remove '/' at end and filter empty parts)
 * @param {string} [path=''] - Path to normalize.
 * @returns {string}
 * @private
 */
const normalizePath = (path: string = ''): string => {
  return `/${path
    .trim()
    .split('/')
    .filter((s) => s)
    .join('/')}`;
};

/**
 * Write LS object cache to browser LS.
 * @returns {void}
 * @private
 */
const writeLS = (): void => {
  localStorage.setItem(LS_NAME, JSON.stringify(ls));
};

/**
 * Apply patches to LS object cache.
 * @param {Array<Operation>} patches - Patches list.
 * @returns {void}
 * @private
 */
const applyPatches = (patches: readonly Operation[]) => {
  applyPatch(ls, patches, { mutate: true });
};

/**
 * Init LS cache.
 * @returns {void}
 * @private
 */
const initLS = (): void => {
  try {
    ls = (JSON.parse(localStorage.getItem(LS_NAME) || '{}') || {}) as LSObj;
  } catch (e) {
    console.error(e);
    throw new Error('Fail to read LS: ' + e);
  }
};

// Init LS cache.
initLS();

/**
 * Clear LS.
 * @returns {void}
 */
export const clearLS = (): void => {
  ls = {};
  localStorage.removeItem(LS_NAME);
};

/**
 * Is path exists.
 * @param {string} path - Path (ex: '/test/toto')
 * @param {LSObj} [obj=ls] - Object on which to test if path exists. If empty, use current LS.
 * @returns {boolean}
 */
export const isPathExist = (path: string, obj?: LSObj): boolean => {
  path = normalizePath(path);

  if (path === '/') {
    return true;
  }

  const pathParts: Array<string> = path.split('/').filter((s) => s);

  if (!obj) {
    obj = ls;
  }

  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i];

    if (part in obj) {
      const value = obj[part];

      if (
        value &&
        pathParts.length > 1 &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        return isPathExist(`/${pathParts.slice(1).join('/')}`, value);
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  return false;
};

/**
 * Get LS value.
 * Note: If path does not exists returns undefined.
 * @param {string} [path] - Path (ex: '/test/toto')
 * @returns {LSObj | LSValue | undefined}
 */
export const getLS = (path?: string): LSObj | LSValue | undefined => {
  path = normalizePath(path);

  if (path === '/') {
    return clone(ls);
  }

  path = path.indexOf('/') === 0 ? path : `/${path}`;

  if (!isPathExist(path)) {
    return undefined;
  }

  const pointer = parseJsonPointer(path);
  const value = find(ls, pointer).val as LSObj | LSValue;

  return value && typeof value === 'object' ? clone(value) : value;
};

/**
 * Set LS value.
 * Note: If path does not exists, will create it automatically.
 * @param {string} path - Path (ex: '/test/toto')
 * @param {LSObj | LSValue} [value=null] - Value to set.
 * @returns {void}
 */
export const setLS = (path: string, value: LSObj | LSValue = null): void => {
  path = normalizePath(path);

  if (path === '/') {
    if (value && typeof value === 'object') {
      ls = clone(value);
    } else {
      throw new Error('setLS: Value is not an object! path=' + path);
    }
  } else {
    let op: string;
    const patches = [];

    if (isPathExist(path)) {
      op = 'replace';
      patches.push({ op, path, value });
    } else {
      op = 'add';

      if (path.lastIndexOf('/') > 0) {
        const pathParts = path.split('/').filter((s) => s);
        let partialpath = '';

        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          partialpath += `/${part}`;

          if (!isPathExist(partialpath)) {
            patches.push({ op, path: partialpath, value: {} });
          } else {
            break;
          }
        }
      }

      patches.push({ op, path, value });
    }

    applyPatches(patches as readonly Operation[]);
  }

  writeLS();
};

/**
 * Remove LS path.
 * @param {string} path - Path (ex: '/test/toto')
 * @returns {boolean} TRUE if path exists else FALSE.
 */
export const removeLS = (path: string): boolean => {
  path = normalizePath(path);

  if (path === '/') {
    clearLS();
    return true;
  }

  if (!isPathExist(path)) {
    console.warn('Remove LS: Path does not exists: ', path);
    return false;
  }

  applyPatches([{ op: 'remove', path }] as readonly Operation[]);

  writeLS();

  return true;
};
