/**
 * ABOUTME: Commands module for loopwright CLI commands.
 * Exports all CLI command handlers for the loopwright application.
 */

export {
  listTrackerPlugins,
  printTrackerPlugins,
  listAgentPlugins,
  printAgentPlugins,
  printPluginsHelp,
} from './plugins.js';

export {
  executeRunCommand,
  parseRunArgs,
  printRunHelp,
} from './run.jsx';

export {
  executeStatusCommand,
  printStatusHelp,
} from './status.js';

export {
  executeResumeCommand,
  parseResumeArgs,
  printResumeHelp,
} from './resume.jsx';

export {
  executeConfigCommand,
  executeConfigShowCommand,
  printConfigHelp,
} from './config.js';

export {
  executeSetupCommand,
  parseSetupArgs,
  printSetupHelp,
} from './setup.js';

export {
  executeLogsCommand,
  parseLogsArgs,
  printLogsHelp,
} from './logs.js';

export {
  executeTemplateCommand,
  printTemplateHelp,
} from './template.js';

export {
  executeCreatePrdCommand,
  parseCreatePrdArgs,
  printCreatePrdHelp,
} from './create-prd.jsx';

export {
  executeConvertCommand,
  parseConvertArgs,
  printConvertHelp,
} from './convert.js';

export {
  executeDocsCommand,
  parseDocsArgs,
  printDocsHelp,
} from './docs.js';

export {
  executeJiraPrdCommand,
  parseJiraPrdArgs,
  printJiraPrdHelp,
  fetchLinkedIssues,
  fetchJiraIssues,
} from './jira-prd.js';

export type { JiraIssue, JiraPrdArgs, JiraLinkedIssue, JiraLinkType, FetchIssuesResult } from './jira-prd.js';

export {
  selectIssue,
  selectIssueInteractive,
} from './select-issue.jsx';

export type { IssueSelectionResult, SelectIssueOptions } from './select-issue.jsx';

export {
  executeLearnCommand,
  parseLearnArgs,
  printLearnHelp,
  analyzeProject,
  invokeMasterAgentAnalysis,
} from './learn.js';

export type { LearnResult, LearnArgs, DependencyInfo, FolderGrouping, MasterAgentPlan, MasterAgentResult } from './learn.js';
