# Change Log

All notable changes to the "context-clipboard" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.1.0] - 2025-02-06

### Added
- Configurable context output format with granular control:
  - `contextClipboard.includeFileTree`: Toggle file tree structure inclusion
  - `contextClipboard.includeUserPrompt`: Enable custom prompts in context
  - `contextClipboard.userPromptText`: Define prompt text, defaults to terse technical communication style
- View management commands:
  - `refresh`: Verify file existence and update token counts
  - `clear`: Reset all selections efficiently
- Streamlined navigation menu with optimized command grouping and icons:
  - Files icon for context copying
  - Clear-all icon for selection reset
  - Refresh icon for view updates

### Enhanced
- Async file verification in refresh operation
- Token count updates after file system changes
- Directory processing optimization
- UI/UX improvements with simplified command titles

### Technical Details
- Implemented async/await pattern for file system operations
- Added configuration schema validation
- Enhanced error handling for file access operations
- Optimized view state management

## [0.0.3] - 2025-01-06

### Added
- Token counting feature in ContextClipboardProvider
- Real-time token count feedback for selected files
- Integration with js-tiktoken for accurate token counting
- Basic file and directory selection functionality
- Context formatting for LLM consumption

### Changed
- Updated token encoding to 'gpt-4o' for improved accuracy
- Optimized token count updates after directory selection
- Enhanced directory processing with asynchronous handling
- Modified tree view properties for better user feedback

### Dependencies
- Added js-tiktoken dependency
- Updated pnpm-lock.yaml

## [Unreleased]

- Initial release