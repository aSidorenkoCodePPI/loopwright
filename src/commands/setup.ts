/**
 * ABOUTME: Setup command for Loopwright.
 * Runs the interactive setup wizard to create .loopwright/config.toml.
 */

import { runSetupWizard, printError } from '../setup/index.js';

/**
 * Parse setup command arguments
 */
export function parseSetupArgs(args: string[]): {
  force: boolean;
  cwd: string;
  help: boolean;
} {
  const result = {
    force: false,
    cwd: process.cwd(),
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--force' || arg === '-f') {
      result.force = true;
    } else if (arg === '--cwd' && args[i + 1]) {
      result.cwd = args[++i]!;
    } else if (arg === '--help' || arg === '-h') {
      result.help = true;
    }
  }

  return result;
}

/**
 * Print setup command help
 */
export function printSetupHelp(): void {
  console.log(`
Loopwright Setup - Interactive Configuration Wizard

Usage: loopwright setup [options]

Options:
  --force, -f     Overwrite existing configuration
  --cwd <path>    Working directory (default: current directory)
  --help, -h      Show this help message

Description:
  The setup wizard guides you through configuring Loopwright for your project.
  It will ask you to:

  1. Select an issue tracker (beads, json, etc.)
  2. Configure tracker-specific options (e.g., epic ID)
  3. Select an AI agent CLI (claude, opencode, etc.)
  4. Set iteration limits and auto-commit preferences

  The configuration is saved to .loopwright/config.toml in your project root.

Examples:
  loopwright setup              # Run interactive setup
  loopwright setup --force      # Overwrite existing config
`);
}

/**
 * Execute the setup command
 */
export async function executeSetupCommand(args: string[]): Promise<void> {
  const parsed = parseSetupArgs(args);

  if (parsed.help) {
    printSetupHelp();
    return;
  }

  const result = await runSetupWizard({
    cwd: parsed.cwd,
    force: parsed.force,
  });

  if (!result.success) {
    if (result.cancelled) {
      // User cancelled, already printed message
      return;
    }

    printError(result.error ?? 'Setup failed');
    process.exit(1);
  }

  // Success - wizard already printed completion message
}
