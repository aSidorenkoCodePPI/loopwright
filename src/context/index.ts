/**
 * ABOUTME: Context file loader for loopwright run command.
 * Loads and validates context files (e.g., loopwright-context.md) for injection into AI prompts.
 * Supports multiple context files with size validation for performance.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Maximum allowed file size for context files (100KB).
 * Larger files would slow down loading and prompt generation.
 */
const MAX_CONTEXT_FILE_SIZE = 100 * 1024; // 100KB

/**
 * Maximum time allowed for loading context files (1 second).
 */
const MAX_LOAD_TIME_MS = 1000;

/**
 * Result of loading a single context file.
 */
export interface ContextFileResult {
  /** Path to the context file */
  path: string;
  /** Whether the file was loaded successfully */
  success: boolean;
  /** The file content (if successful) */
  content?: string;
  /** File size in bytes (if successful) */
  sizeBytes?: number;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Result of loading all context files.
 */
export interface ContextLoadResult {
  /** Whether all files were loaded successfully */
  success: boolean;
  /** Results for each file */
  files: ContextFileResult[];
  /** Combined context content (all successful files) */
  combinedContent: string;
  /** Total size of all loaded files in bytes */
  totalSizeBytes: number;
  /** Time taken to load all files in milliseconds */
  loadTimeMs: number;
  /** Error messages (if any files failed) */
  errors: string[];
}

/**
 * Validate that a file is a valid context file format.
 * Currently accepts markdown (.md) files.
 * @param filePath Path to the file
 * @returns null if valid, error message if invalid
 */
function validateContextFileFormat(filePath: string): string | null {
  const ext = path.extname(filePath).toLowerCase();
  const validExtensions = ['.md', '.markdown', '.txt'];
  
  if (!validExtensions.includes(ext)) {
    return `Invalid context file format: ${ext}. Expected ${validExtensions.join(', ')}`;
  }
  
  return null;
}

/**
 * Load a single context file.
 * @param filePath Path to the context file (relative or absolute)
 * @param cwd Working directory for resolving relative paths
 * @returns Result of loading the file
 */
export function loadContextFile(filePath: string, cwd: string): ContextFileResult {
  // Resolve relative paths
  const resolvedPath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(cwd, filePath);

  // Check if file exists
  if (!fs.existsSync(resolvedPath)) {
    return {
      path: resolvedPath,
      success: false,
      error: `Context file not found: ${resolvedPath}`,
    };
  }

  // Validate file format
  const formatError = validateContextFileFormat(resolvedPath);
  if (formatError) {
    return {
      path: resolvedPath,
      success: false,
      error: formatError,
    };
  }

  // Get file stats
  let stats: fs.Stats;
  try {
    stats = fs.statSync(resolvedPath);
  } catch (err) {
    return {
      path: resolvedPath,
      success: false,
      error: `Cannot access context file: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // Check file size
  if (stats.size > MAX_CONTEXT_FILE_SIZE) {
    return {
      path: resolvedPath,
      success: false,
      error: `Context file too large: ${(stats.size / 1024).toFixed(1)}KB exceeds ${MAX_CONTEXT_FILE_SIZE / 1024}KB limit`,
    };
  }

  // Read file content
  try {
    const content = fs.readFileSync(resolvedPath, 'utf-8');
    return {
      path: resolvedPath,
      success: true,
      content,
      sizeBytes: stats.size,
    };
  } catch (err) {
    return {
      path: resolvedPath,
      success: false,
      error: `Failed to read context file: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Load multiple context files.
 * @param filePaths Array of paths to context files
 * @param cwd Working directory for resolving relative paths
 * @returns Combined result of loading all files
 */
export function loadContextFiles(filePaths: string[], cwd: string): ContextLoadResult {
  const startTime = Date.now();
  const results: ContextFileResult[] = [];
  const errors: string[] = [];
  const contents: string[] = [];
  let totalSize = 0;

  for (const filePath of filePaths) {
    // Check if we've exceeded the time limit
    const elapsed = Date.now() - startTime;
    if (elapsed > MAX_LOAD_TIME_MS) {
      errors.push(`Context loading timeout: exceeded ${MAX_LOAD_TIME_MS}ms limit`);
      break;
    }

    const result = loadContextFile(filePath, cwd);
    results.push(result);

    if (result.success && result.content) {
      contents.push(result.content);
      totalSize += result.sizeBytes ?? 0;
    } else if (result.error) {
      errors.push(result.error);
    }
  }

  const loadTimeMs = Date.now() - startTime;
  const combinedContent = contents.join('\n\n---\n\n');
  const success = results.length > 0 && results.every((r) => r.success);

  return {
    success,
    files: results,
    combinedContent,
    totalSizeBytes: totalSize,
    loadTimeMs,
    errors,
  };
}

/**
 * Format context content for inclusion in prompts.
 * Wraps the content with appropriate headers.
 * @param content The raw context content
 * @param filePaths The source file paths (for attribution)
 * @returns Formatted context string
 */
export function formatContextForPrompt(content: string, filePaths: string[]): string {
  if (!content.trim()) {
    return '';
  }

  const sources = filePaths.length === 1
    ? `Source: ${filePaths[0]}`
    : `Sources:\n${filePaths.map((p) => `  - ${p}`).join('\n')}`;

  return `## Project Context

${sources}

${content}`;
}
