// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
// Add import for the provider
import { ContextClipboardProvider } from './contextClipboardProvider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Context Clipboard is now active');

	// Add provider registration
	const contextClipboardProvider = new ContextClipboardProvider(context);
	vscode.window.registerTreeDataProvider(
		'contextClipboardView',
		contextClipboardProvider
	);

	// Replace the hello world command with new commands
	let toggleSelection = vscode.commands.registerCommand(
		'contextClipboard.toggleSelection',
		(item) => {
			contextClipboardProvider.toggleSelection(item);
		}
	);

	let copyToClipboard = vscode.commands.registerCommand(
		'contextClipboard.copyToClipboard',
		() => {
			contextClipboardProvider.copySelectedToClipboard();
		}
	);

	let clearSelection = vscode.commands.registerCommand(
		'contextClipboard.clearSelection',
		() => {
			contextClipboardProvider.clearSelection();
		}
	);

	let refreshCommand = vscode.commands.registerCommand(
		'contextClipboard.refresh',
		async () => {
			await contextClipboardProvider.refresh();
			vscode.window.showInformationMessage('Context Clipboard refreshed');
		}
	);

	let selectComparisonBranchCommand = vscode.commands.registerCommand(
		'contextClipboard.selectComparisonBranch',
		async () => {
			await contextClipboardProvider.selectComparisonBranch();
		}
	);

	let toggleGitDiffCommand = vscode.commands.registerCommand(
		'contextClipboard.toggleGitDiff',
		async () => {
			await contextClipboardProvider.toggleGitDiff();
		}
	);

	let toggleFileTreeCommand = vscode.commands.registerCommand(
		'contextClipboard.toggleFileTree',
		async () => {
			await contextClipboardProvider.toggleFileTree();
		}
	);

	let toggleUserPromptCommand = vscode.commands.registerCommand(
		'contextClipboard.toggleUserPrompt',
		async () => {
			await contextClipboardProvider.toggleUserPrompt();
		}
	);

	// Register all commands
	context.subscriptions.push(toggleSelection);
	context.subscriptions.push(copyToClipboard);
	context.subscriptions.push(clearSelection);
	context.subscriptions.push(refreshCommand);
	context.subscriptions.push(selectComparisonBranchCommand);
	context.subscriptions.push(toggleGitDiffCommand);
	context.subscriptions.push(toggleFileTreeCommand);
	context.subscriptions.push(toggleUserPromptCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
