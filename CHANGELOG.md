# Change Log

All notable changes to the "context-clipboard" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

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