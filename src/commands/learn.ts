/**
 * ABOUTME: Learn command for ralph-tui.
 * Analyzes a project directory so AI agents understand the codebase structure and conventions.
 * Scans file structure, detects project type, and extracts patterns.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * File type detection patterns
 */
const FILE_PATTERNS = {
  javascript: /\.(js|mjs|cjs)$/,
  typescript: /\.(ts|tsx)$/,
  python: /\.py$/,
  rust: /\.rs$/,
  go: /\.go$/,
  java: /\.java$/,
  csharp: /\.cs$/,
  ruby: /\.rb$/,
  php: /\.php$/,
  markdown: /\.(md|mdx)$/,
  json: /\.json$/,
  yaml: /\.(yaml|yml)$/,
  toml: /\.toml$/,
  html: /\.(html|htm)$/,
  css: /\.(css|scss|sass|less)$/,
} as const;

/**
 * Common directories to ignore during analysis
 */
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.hg',
  '.svn',
  'dist',
  'build',
  'out',
  'target',
  '__pycache__',
  '.next',
  '.nuxt',
  '.cache',
  'coverage',
  '.nyc_output',
  'vendor',
  'venv',
  '.venv',
  'env',
  '.env',
]);

/**
 * Project type indicators
 */
const PROJECT_INDICATORS = {
  node: ['package.json'],
  python: ['setup.py', 'pyproject.toml', 'requirements.txt', 'Pipfile'],
  rust: ['Cargo.toml'],
  go: ['go.mod'],
  java: ['pom.xml', 'build.gradle', 'build.gradle.kts'],
  dotnet: ['*.csproj', '*.sln'],
  ruby: ['Gemfile'],
  php: ['composer.json'],
} as const;

/**
 * Analysis result structure
 */
export interface LearnResult {
  /** Root directory analyzed */
  rootPath: string;

  /** Total files found */
  totalFiles: number;

  /** Total directories found */
  totalDirectories: number;

  /** Detected project type(s) */
  projectTypes: string[];

  /** File counts by type */
  filesByType: Record<string, number>;

  /** Top-level structure */
  structure: string[];

  /** Detected conventions */
  conventions: string[];

  /** AGENTS.md files found */
  agentFiles: string[];

  /** Analysis duration in milliseconds */
  durationMs: number;

  /** Whether file limit was reached */
  truncated: boolean;
}

/**
 * Arguments for the learn command
 */
export interface LearnArgs {
  /** Directory to analyze (default: current working directory) */
  path: string;

  /** Output format */
  json: boolean;

  /** Verbose output */
  verbose: boolean;
}

/**
 * Print help for the learn command
 */
export function printLearnHelp(): void {
  console.log(`
ralph-tui learn - Analyze project for AI agents

Usage: ralph-tui learn [path] [options]

Arguments:
  [path]              Directory to analyze (default: current directory)

Options:
  --json              Output in JSON format (machine-readable)
  --verbose, -v       Show detailed analysis output
  -h, --help          Show this help message

Description:
  Analyzes the project directory so AI agents understand the codebase
  structure and conventions. The analysis includes:

  - Project type detection (Node.js, Python, Rust, etc.)
  - File structure overview
  - Code conventions and patterns
  - AGENTS.md file discovery

  Supports projects with up to 10,000 files for efficient analysis.

Exit Codes:
  0    Analysis completed successfully
  1    Analysis failed (invalid path, permission error, etc.)

Examples:
  ralph-tui learn                    # Analyze current directory
  ralph-tui learn ./my-project       # Analyze specific directory
  ralph-tui learn --json             # JSON output for scripts
  ralph-tui learn -v                 # Verbose output
`);
}

/**
 * Parse learn command arguments
 */
export function parseLearnArgs(args: string[]): LearnArgs {
  const result: LearnArgs = {
    path: process.cwd(),
    json: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      printLearnHelp();
      process.exit(0);
    } else if (arg === '--json') {
      result.json = true;
    } else if (arg === '--verbose' || arg === '-v') {
      result.verbose = true;
    } else if (!arg.startsWith('-')) {
      // Positional argument - treat as path
      result.path = path.resolve(arg);
    } else {
      console.error(`Unknown option: ${arg}`);
      printLearnHelp();
      process.exit(1);
    }
  }

  return result;
}

/**
 * Check if a directory should be ignored
 */
function shouldIgnoreDir(dirName: string): boolean {
  return IGNORED_DIRS.has(dirName) || dirName.startsWith('.');
}

/**
 * Detect file type from filename
 */
function detectFileType(filename: string): string | null {
  for (const [type, pattern] of Object.entries(FILE_PATTERNS)) {
    if (pattern.test(filename)) {
      return type;
    }
  }
  return null;
}

/**
 * Detect project type(s) from root directory contents
 */
function detectProjectTypes(_rootPath: string, files: string[]): string[] {
  const types: string[] = [];

  for (const [projectType, indicators] of Object.entries(PROJECT_INDICATORS)) {
    for (const indicator of indicators) {
      if (indicator.includes('*')) {
        // Glob pattern
        const pattern = new RegExp(indicator.replace('*', '.*'));
        if (files.some(f => pattern.test(f))) {
          types.push(projectType);
          break;
        }
      } else {
        // Exact match
        if (files.includes(indicator)) {
          types.push(projectType);
          break;
        }
      }
    }
  }

  return types.length > 0 ? types : ['unknown'];
}

/**
 * Detect code conventions from the project
 */
function detectConventions(rootPath: string, files: string[]): string[] {
  const conventions: string[] = [];

  // Check for TypeScript
  if (files.includes('tsconfig.json')) {
    conventions.push('TypeScript enabled');
  }

  // Check for ESLint
  if (files.some(f => f.startsWith('eslint') || f === '.eslintrc' || f === '.eslintrc.js' || f === '.eslintrc.json')) {
    conventions.push('ESLint for linting');
  }

  // Check for Prettier
  if (files.some(f => f.startsWith('.prettier') || f === 'prettier.config.js')) {
    conventions.push('Prettier for formatting');
  }

  // Check for testing frameworks
  if (files.includes('jest.config.js') || files.includes('jest.config.ts')) {
    conventions.push('Jest for testing');
  }
  if (files.includes('vitest.config.ts') || files.includes('vitest.config.js')) {
    conventions.push('Vitest for testing');
  }
  if (files.includes('pytest.ini') || files.includes('conftest.py')) {
    conventions.push('Pytest for testing');
  }

  // Check for CI/CD
  if (fs.existsSync(path.join(rootPath, '.github', 'workflows'))) {
    conventions.push('GitHub Actions for CI/CD');
  }
  if (files.includes('.gitlab-ci.yml')) {
    conventions.push('GitLab CI for CI/CD');
  }

  // Check for Docker
  if (files.includes('Dockerfile') || files.includes('docker-compose.yml') || files.includes('docker-compose.yaml')) {
    conventions.push('Docker containerization');
  }

  // Check for AGENTS.md
  if (files.includes('AGENTS.md')) {
    conventions.push('AGENTS.md for AI guidance');
  }

  return conventions;
}

/**
 * Recursively scan directory for files
 */
async function scanDirectory(
  dirPath: string,
  maxFiles: number,
  result: {
    files: number;
    directories: number;
    filesByType: Record<string, number>;
    agentFiles: string[];
  },
  relativePath: string = ''
): Promise<boolean> {
  // Check if we've hit the file limit
  if (result.files >= maxFiles) {
    return true; // truncated
  }

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    // Permission denied or other error - skip this directory
    return false;
  }

  for (const entry of entries) {
    if (result.files >= maxFiles) {
      return true; // truncated
    }

    if (entry.isDirectory()) {
      if (!shouldIgnoreDir(entry.name)) {
        result.directories++;
        const truncated = await scanDirectory(
          path.join(dirPath, entry.name),
          maxFiles,
          result,
          path.join(relativePath, entry.name)
        );
        if (truncated) {
          return true;
        }
      }
    } else if (entry.isFile()) {
      result.files++;

      // Track file type
      const fileType = detectFileType(entry.name);
      if (fileType) {
        result.filesByType[fileType] = (result.filesByType[fileType] || 0) + 1;
      }

      // Track AGENTS.md files
      if (entry.name === 'AGENTS.md') {
        result.agentFiles.push(path.join(relativePath, entry.name));
      }
    }
  }

  return false;
}

/**
 * Analyze a project directory
 */
export async function analyzeProject(rootPath: string): Promise<LearnResult> {
  const startTime = Date.now();
  const maxFiles = 10000;

  // Verify path exists and is a directory
  if (!fs.existsSync(rootPath)) {
    throw new Error(`Path does not exist: ${rootPath}`);
  }

  const stats = fs.statSync(rootPath);
  if (!stats.isDirectory()) {
    throw new Error(`Path is not a directory: ${rootPath}`);
  }

  // Get top-level contents
  const topLevelEntries = fs.readdirSync(rootPath, { withFileTypes: true });
  const topLevelFiles = topLevelEntries.filter(e => e.isFile()).map(e => e.name);
  const topLevelDirs = topLevelEntries.filter(e => e.isDirectory() && !shouldIgnoreDir(e.name)).map(e => e.name);

  // Detect project types
  const projectTypes = detectProjectTypes(rootPath, topLevelFiles);

  // Detect conventions
  const conventions = detectConventions(rootPath, topLevelFiles);

  // Scan all files
  const scanResult = {
    files: 0,
    directories: 0,
    filesByType: {} as Record<string, number>,
    agentFiles: [] as string[],
  };

  const truncated = await scanDirectory(rootPath, maxFiles, scanResult);

  // Build structure overview
  const structure: string[] = [];
  for (const dir of topLevelDirs.slice(0, 10)) {
    structure.push(`${dir}/`);
  }
  for (const file of topLevelFiles.slice(0, 10)) {
    structure.push(file);
  }
  if (topLevelDirs.length + topLevelFiles.length > 20) {
    structure.push(`... and ${topLevelDirs.length + topLevelFiles.length - 20} more`);
  }

  const durationMs = Date.now() - startTime;

  return {
    rootPath,
    totalFiles: scanResult.files,
    totalDirectories: scanResult.directories,
    projectTypes,
    filesByType: scanResult.filesByType,
    structure,
    conventions,
    agentFiles: scanResult.agentFiles,
    durationMs,
    truncated,
  };
}

/**
 * Print human-readable analysis results
 */
function printHumanResult(result: LearnResult, verbose: boolean): void {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    Project Analysis Complete                   ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  console.log(`  Path:             ${result.rootPath}`);
  console.log(`  Project Type:     ${result.projectTypes.join(', ')}`);
  console.log(`  Files:            ${result.totalFiles.toLocaleString()}${result.truncated ? ' (truncated)' : ''}`);
  console.log(`  Directories:      ${result.totalDirectories.toLocaleString()}`);
  console.log(`  Duration:         ${result.durationMs}ms`);
  console.log('');

  // File breakdown
  if (Object.keys(result.filesByType).length > 0) {
    console.log('  File Types:');
    const sortedTypes = Object.entries(result.filesByType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    for (const [type, count] of sortedTypes) {
      console.log(`    ${type.padEnd(14)} ${count.toLocaleString()}`);
    }
    console.log('');
  }

  // Conventions
  if (result.conventions.length > 0) {
    console.log('  Conventions:');
    for (const convention of result.conventions) {
      console.log(`    • ${convention}`);
    }
    console.log('');
  }

  // AGENTS.md files
  if (result.agentFiles.length > 0) {
    console.log('  AGENTS.md Files:');
    for (const agentFile of result.agentFiles.slice(0, 10)) {
      console.log(`    • ${agentFile || '(root)'}`);
    }
    if (result.agentFiles.length > 10) {
      console.log(`    ... and ${result.agentFiles.length - 10} more`);
    }
    console.log('');
  }

  // Structure
  if (verbose && result.structure.length > 0) {
    console.log('  Structure:');
    for (const item of result.structure) {
      console.log(`    ${item}`);
    }
    console.log('');
  }

  console.log('───────────────────────────────────────────────────────────────');
  console.log('  Analysis complete. AI agents can now better understand');
  console.log('  this codebase structure and conventions.');
  console.log('───────────────────────────────────────────────────────────────');
  console.log('');
}

/**
 * Execute the learn command
 */
export async function executeLearnCommand(args: string[]): Promise<void> {
  const parsedArgs = parseLearnArgs(args);

  try {
    if (!parsedArgs.json) {
      console.log(`Analyzing project at: ${parsedArgs.path}`);
      console.log('');
    }

    const result = await analyzeProject(parsedArgs.path);

    if (parsedArgs.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printHumanResult(result, parsedArgs.verbose);
    }

    process.exit(0);
  } catch (error) {
    if (parsedArgs.json) {
      console.log(JSON.stringify({
        error: true,
        message: error instanceof Error ? error.message : String(error),
      }));
    } else {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    process.exit(1);
  }
}
