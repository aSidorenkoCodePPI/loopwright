/**
 * ABOUTME: Completion Summary Screen component for the Loopwright TUI.
 * Displays analysis summary when all workers complete, including elapsed time,
 * folder/file counts, worker success/failure stats, output path, and warnings.
 * US-008: View Analysis Summary on Completion
 */

import type { ReactNode } from 'react';
import { colors } from '../theme.js';
import type { CompletionSummary, WorkerStatistics, WorkerWarning } from '../worker-types.js';
import { formatWorkerElapsedTime } from '../worker-types.js';

/**
 * Props for the CompletionSummaryScreen component.
 */
export interface CompletionSummaryScreenProps {
  /** The completion summary data */
  summary: CompletionSummary;
  /** Whether verbose mode is enabled (shows detailed per-worker stats) */
  verboseMode: boolean;
  /** Maximum height for the component */
  maxHeight?: number;
}

/**
 * Format file size in human-readable format (KB, MB, etc.)
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Header section showing overall status (success/failure with icon)
 */
function StatusHeader({ summary }: { summary: CompletionSummary }): ReactNode {
  const statusIcon = summary.success ? '✓' : '✗';
  const statusColor = summary.success ? colors.status.success : colors.status.error;
  const statusText = summary.success ? 'Analysis Complete' : 'Analysis Completed with Errors';

  return (
    <box style={{ marginBottom: 1 }}>
      <text>
        <span fg={statusColor}>{statusIcon}</span>
        <span fg={colors.fg.primary}> {statusText}</span>
      </text>
    </box>
  );
}

/**
 * Summary statistics section showing counts and timing.
 */
function SummaryStats({ summary }: { summary: CompletionSummary }): ReactNode {
  const elapsedDisplay = formatWorkerElapsedTime(summary.totalElapsedMs);
  
  return (
    <box
      title="Summary"
      style={{
        border: true,
        borderColor: colors.border.normal,
        backgroundColor: colors.bg.secondary,
        padding: 1,
        marginBottom: 1,
      }}
    >
      <box style={{ flexDirection: 'column', gap: 0 }}>
        {/* Elapsed Time */}
        <box style={{ flexDirection: 'row' }}>
          <text fg={colors.fg.muted}>{'Total Time:        '}</text>
          <text fg={colors.fg.primary}>{elapsedDisplay}</text>
        </box>
        
        {/* Folders Analyzed */}
        <box style={{ flexDirection: 'row' }}>
          <text fg={colors.fg.muted}>{'Folders Analyzed:  '}</text>
          <text fg={colors.fg.primary}>{summary.foldersAnalyzed.toLocaleString()}</text>
        </box>
        
        {/* Files Processed */}
        <box style={{ flexDirection: 'row' }}>
          <text fg={colors.fg.muted}>{'Files Processed:   '}</text>
          <text fg={colors.fg.primary}>{summary.filesProcessed.toLocaleString()}</text>
        </box>
        
        {/* Worker Stats */}
        <box style={{ flexDirection: 'row' }}>
          <text fg={colors.fg.muted}>{'Workers:           '}</text>
          <text>
            <span fg={colors.status.success}>{summary.workersSucceeded} succeeded</span>
            {summary.workersFailed > 0 && (
              <>
                <span fg={colors.fg.muted}>, </span>
                <span fg={colors.status.error}>{summary.workersFailed} failed</span>
              </>
            )}
          </text>
        </box>
        
        {/* Speedup Factor */}
        {summary.speedupFactor && summary.speedupFactor > 1 && (
          <box style={{ flexDirection: 'row' }}>
            <text fg={colors.fg.muted}>{'Speedup:           '}</text>
            <text fg={colors.status.info}>{summary.speedupFactor.toFixed(2)}x faster than sequential</text>
          </box>
        )}
        
        {/* Resource Usage */}
        {(summary.peakMemoryMB || summary.peakCpuPercent) && (
          <box style={{ flexDirection: 'row' }}>
            <text fg={colors.fg.muted}>{'Peak Resources:    '}</text>
            <text fg={colors.fg.secondary}>
              {summary.peakMemoryMB && `${summary.peakMemoryMB.toFixed(0)} MB memory`}
              {summary.peakMemoryMB && summary.peakCpuPercent && ', '}
              {summary.peakCpuPercent && `${summary.peakCpuPercent.toFixed(0)}% CPU`}
            </text>
          </box>
        )}
      </box>
    </box>
  );
}

/**
 * Output file section showing path and size with confirmation.
 */
function OutputFileInfo({ summary }: { summary: CompletionSummary }): ReactNode {
  if (!summary.outputFilePath) return null;

  const sizeDisplay = summary.outputFileSizeBytes 
    ? formatFileSize(summary.outputFileSizeBytes)
    : 'unknown size';

  return (
    <box
      title="Output"
      style={{
        border: true,
        borderColor: colors.status.success,
        backgroundColor: colors.bg.secondary,
        padding: 1,
        marginBottom: 1,
      }}
    >
      <box style={{ flexDirection: 'column', gap: 0 }}>
        <box style={{ flexDirection: 'row' }}>
          <text fg={colors.status.success}>{'📄 '}</text>
          <text fg={colors.fg.primary}>{summary.outputFilePath}</text>
        </box>
        <box style={{ flexDirection: 'row' }}>
          <text fg={colors.fg.muted}>{'   Size: '}</text>
          <text fg={colors.fg.secondary}>{sizeDisplay}</text>
        </box>
        <box style={{ marginTop: 1 }}>
          <text fg={colors.fg.muted}>Context file generated successfully. AI agents can now understand this project.</text>
        </box>
      </box>
    </box>
  );
}

/**
 * Warnings section showing failed folders, retries, etc.
 */
function WarningsList({ warnings }: { warnings: WorkerWarning[] }): ReactNode {
  if (warnings.length === 0) return null;

  return (
    <box
      title="Warnings"
      style={{
        border: true,
        borderColor: colors.status.warning,
        backgroundColor: colors.bg.secondary,
        padding: 1,
        marginBottom: 1,
      }}
    >
      <scrollbox style={{ maxHeight: 6 }}>
        {warnings.map((warning, index) => (
          <box key={`${warning.workerId}-${index}`} style={{ flexDirection: 'row' }}>
            <text>
              <span fg={warning.type === 'failure' ? colors.status.error : colors.status.warning}>
                {warning.type === 'failure' ? '✗' : warning.type === 'retry' ? '↻' : '⚠'}
              </span>
              <span fg={colors.fg.primary}> {warning.workerName}</span>
              {warning.type === 'retry' && warning.retryCount && (
                <span fg={colors.fg.muted}> (retried {warning.retryCount}x)</span>
              )}
              {warning.type === 'failure' && warning.error && (
                <span fg={colors.fg.muted}> - {warning.error}</span>
              )}
            </text>
          </box>
        ))}
      </scrollbox>
    </box>
  );
}

/**
 * Per-worker statistics table for verbose mode.
 */
function VerboseWorkerStats({ workerStats }: { workerStats: WorkerStatistics[] }): ReactNode {
  if (!workerStats || workerStats.length === 0) return null;

  // Calculate column widths
  const maxNameWidth = Math.min(25, Math.max(10, ...workerStats.map(w => w.name.length)));

  return (
    <box
      title="Worker Statistics (Verbose)"
      style={{
        border: true,
        borderColor: colors.border.normal,
        backgroundColor: colors.bg.tertiary,
        padding: 1,
        marginBottom: 1,
      }}
    >
      {/* Header row */}
      <box style={{ flexDirection: 'row', marginBottom: 1 }}>
        <text fg={colors.fg.muted}>
          <span>{'  '}</span>
          <span>{'Name'.padEnd(maxNameWidth)}</span>
          <span>{' Folders'}</span>
          <span>{'   Files'}</span>
          <span>{'     Time'}</span>
          <span>{'  Retries'}</span>
        </text>
      </box>
      
      <scrollbox style={{ maxHeight: 8 }}>
        {workerStats.map((worker) => {
          const statusIcon = worker.success ? '✓' : '✗';
          const statusColor = worker.success ? colors.status.success : colors.status.error;
          const nameDisplay = worker.name.length > maxNameWidth 
            ? worker.name.slice(0, maxNameWidth - 1) + '…'
            : worker.name.padEnd(maxNameWidth);

          return (
            <box key={worker.id} style={{ flexDirection: 'row' }}>
              <text>
                <span fg={statusColor}>{statusIcon}</span>
                <span fg={colors.fg.primary}> {nameDisplay}</span>
                <span fg={colors.fg.secondary}> {String(worker.folderCount).padStart(7)}</span>
                <span fg={colors.fg.secondary}> {String(worker.fileCount).padStart(7)}</span>
                <span fg={colors.fg.secondary}> {formatWorkerElapsedTime(worker.durationMs).padStart(9)}</span>
                <span fg={worker.retryCount > 0 ? colors.status.warning : colors.fg.muted}>
                  {' '}{String(worker.retryCount).padStart(8)}
                </span>
              </text>
            </box>
          );
        })}
      </scrollbox>
    </box>
  );
}

/**
 * Footer hint about pressing key to exit.
 */
function ExitHint(): ReactNode {
  return (
    <box style={{ marginTop: 1 }}>
      <text fg={colors.fg.muted}>
        Press <span fg={colors.accent.primary}>any key</span> to exit...
      </text>
    </box>
  );
}

/**
 * Completion Summary Screen component.
 * Displays comprehensive analysis summary when all workers complete.
 * 
 * Features:
 * - Total elapsed time
 * - Folders analyzed, files processed counts
 * - Worker success/failure statistics
 * - Output file path with confirmation
 * - Warnings summary (failed folders, retries)
 * - Verbose mode: detailed per-worker statistics
 * - Waits for key press to exit
 */
export function CompletionSummaryScreen({
  summary,
  verboseMode,
  maxHeight: _maxHeight,
}: CompletionSummaryScreenProps): ReactNode {
  return (
    <box
      style={{
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        backgroundColor: colors.bg.primary,
        padding: 1,
      }}
    >
      {/* Status Header */}
      <StatusHeader summary={summary} />

      {/* Summary Statistics */}
      <SummaryStats summary={summary} />

      {/* Output File Info */}
      <OutputFileInfo summary={summary} />

      {/* Warnings List */}
      <WarningsList warnings={summary.warnings} />

      {/* Verbose Worker Stats */}
      {verboseMode && summary.workerStats && (
        <VerboseWorkerStats workerStats={summary.workerStats} />
      )}

      {/* Exit Hint */}
      <ExitHint />
    </box>
  );
}
