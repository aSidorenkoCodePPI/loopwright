/**
 * ABOUTME: Cross-platform sound playback utility for loopwright.
 * Provides audio playback across macOS, Linux, and Windows.
 * Supports system notification sounds.
 */

import { spawn } from 'node:child_process';
import { platform } from 'node:os';
import type { NotificationSoundMode } from './config/types.js';

/**
 * Play the system notification sound.
 * Uses platform-specific methods to trigger the default alert sound.
 */
async function playSystemSound(): Promise<void> {
  const os = platform();

  return new Promise((resolve) => {
    let proc: ReturnType<typeof spawn>;

    switch (os) {
      case 'darwin':
        // macOS: play the system 'Glass' sound
        proc = spawn('afplay', ['/System/Library/Sounds/Glass.aiff'], {
          stdio: 'ignore',
          detached: true,
        });
        break;

      case 'linux':
        // Linux: use paplay with freedesktop sound theme
        // Try common notification sound paths
        proc = spawn(
          'paplay',
          ['/usr/share/sounds/freedesktop/stereo/complete.oga'],
          {
            stdio: 'ignore',
            detached: true,
          }
        );
        proc.on('error', () => {
          // Try alternative path
          const altProc = spawn(
            'paplay',
            ['/usr/share/sounds/freedesktop/stereo/message.oga'],
            {
              stdio: 'ignore',
              detached: true,
            }
          );
          altProc.unref();
        });
        break;

      case 'win32':
        // Windows: play system asterisk sound
        proc = spawn(
          'powershell',
          [
            '-NoProfile',
            '-Command',
            '[System.Media.SystemSounds]::Asterisk.Play()',
          ],
          {
            stdio: 'ignore',
            detached: true,
            windowsHide: true,
          }
        );
        break;

      default:
        console.warn(`[sound] Unsupported platform: ${os}`);
        resolve();
        return;
    }

    proc.unref();
    proc.on('spawn', () => resolve());
    proc.on('error', (err) => {
      console.warn(`[sound] Failed to play system sound: ${err.message}`);
      resolve();
    });
  });
}

/**
 * Play notification sound based on the configured mode.
 *
 * @param mode - The sound mode ('off' or 'system')
 */
export async function playNotificationSound(mode: NotificationSoundMode): Promise<void> {
  switch (mode) {
    case 'off':
      // No sound
      return;

    case 'system':
      return playSystemSound();

    default: {
      // Exhaustive check - block scoped to prevent identifier leakage
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

/**
 * Check if sound playback is likely to work on this system.
 * Useful for providing user feedback about sound availability.
 *
 * @returns Promise resolving to true if sound playback should work
 */
export async function checkSoundAvailable(): Promise<boolean> {
  const os = platform();

  return new Promise((resolve) => {
    switch (os) {
      case 'darwin': {
        const proc = spawn('which', ['afplay'], { stdio: 'ignore' });
        proc.on('close', (code) => resolve(code === 0));
        proc.on('error', () => resolve(false));
        break;
      }

      case 'linux': {
        // Check for paplay first (PulseAudio), fall back to aplay (ALSA)
        // Matches the fallback order in playFile
        const paplayProc = spawn('which', ['paplay'], { stdio: 'ignore' });
        paplayProc.on('close', (code) => {
          if (code === 0) {
            resolve(true);
          } else {
            // paplay not found, try aplay
            const aplayProc = spawn('which', ['aplay'], { stdio: 'ignore' });
            aplayProc.on('close', (aplayCode) => resolve(aplayCode === 0));
            aplayProc.on('error', () => resolve(false));
          }
        });
        paplayProc.on('error', () => {
          // paplay check failed, try aplay
          const aplayProc = spawn('which', ['aplay'], { stdio: 'ignore' });
          aplayProc.on('close', (aplayCode) => resolve(aplayCode === 0));
          aplayProc.on('error', () => resolve(false));
        });
        break;
      }

      case 'win32':
        // PowerShell is always available on modern Windows
        resolve(true);
        return;

      default:
        resolve(false);
        return;
    }
  });
}

// Export types
export type { NotificationSoundMode };
