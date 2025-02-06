# Context Clipboard for VS Code

A Visual Studio Code extension that streamlines the process of selecting and extracting code files and directories for use in Large Language Model (LLM) chat interfaces. Context Clipboard integrates seamlessly with VS Code's explorer view, providing an intuitive way to manage and format code context for LLM interactions.

## Features

- 📁 **Visual File Selection**: Easily select multiple files and directories directly from VS Code's explorer view
- 🎯 **Smart Context Management**: Exclude irrelevant files and directories to maintain focused context
- 📊 **Token Tracking**: Monitor token consumption with real-time feedback using js-tiktoken
- ⚡ **Performance Optimized**: Efficiently handles large codebases with asynchronous processing
- 🔄 **Universal Compatibility**: Supports all file types that VS Code can open
- 🎨 **Native Integration**: Follows VS Code's UI patterns for a seamless experience
- 🛠️ **Configurable Output**: Customize context format with file trees and custom prompts

## Installation

1. Open VS Code
2. Press `Ctrl+P` / `Cmd+P` to open the Quick Open dialog
3. Type `ext install context-clipboard`
4. Press Enter

## Usage

1. Open your project in VS Code
2. In the explorer view, use the checkbox icons to select files and directories
3. Monitor token usage in real-time as you select files
4. Click the "Copy Context" button in the explorer view toolbar
5. Paste the formatted content into your preferred LLM chat interface

## Extension Settings

This extension contributes the following settings:

* `contextClipboard.maxTokens`: Maximum number of tokens to include in copied context
* `contextClipboard.excludePatterns`: Glob patterns for files to exclude from selection
* `contextClipboard.formatTemplate`: Custom template for context output formatting
* `contextClipboard.tokenModel`: Token counting model to use (default: 'gpt-4o')
* `contextClipboard.includeFileTree`: Toggle inclusion of file tree structure in output
* `contextClipboard.includeUserPrompt`: Enable custom prompts in context output
* `contextClipboard.userPromptText`: Define custom prompt text for context

### Accessing Settings

You can configure Context Clipboard settings in several ways:

1. Command Palette:
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
   - Type "Settings" and select "Preferences: Open Settings (UI)"
   - Search for "Context Clipboard"

2. Settings UI:
   - Click the gear icon (⚙️) in the lower left corner
   - Select "Settings"
   - Search for "Context Clipboard"

3. Settings File (settings.json):
   - Open Command Palette
   - Type "Settings" and select "Preferences: Open User Settings (JSON)"
   - Add your settings:
   ```json
   {
     "contextClipboard.includeFileTree": true,
     "contextClipboard.includeUserPrompt": true,
     "contextClipboard.userPromptText": "Your custom prompt here"
   }
   ```

All settings changes take effect immediately without requiring a restart.

## Requirements

- Visual Studio Code version 1.60.0 or higher

## Known Issues

Please report any issues on our [GitHub repository](https://github.com/yourusername/context-clipboard/issues).

## Release Notes

### 0.0.4
- Added configurable context output formatting
- Implemented view management commands (refresh, clear)
- Enhanced navigation menu with optimized command grouping
- Improved async file processing and error handling

### 0.0.3
- Initial release of Context Clipboard
- Added real-time token counting with js-tiktoken
- Basic file and directory selection functionality
- Enhanced directory processing with async handling
- Token usage tracking with 'gpt-4o' encoding
- Context formatting for LLM consumption

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This extension is licensed under the [MIT License](LICENSE).

---

**Context Clipboard** is built with ❤️ for developers who work with LLMs.