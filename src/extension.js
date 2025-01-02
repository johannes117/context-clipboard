"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
// Add import for the provider
const contextClipboardProvider_1 = require("./contextClipboardProvider");
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Context Clipboard is now active');
    // Add provider registration
    const contextClipboardProvider = new contextClipboardProvider_1.ContextClipboardProvider(context);
    vscode.window.registerTreeDataProvider('contextClipboardView', contextClipboardProvider);
    // Replace the hello world command with new commands
    let toggleSelection = vscode.commands.registerCommand('contextClipboard.toggleSelection', (item) => {
        contextClipboardProvider.toggleSelection(item);
    });
    let copyToClipboard = vscode.commands.registerCommand('contextClipboard.copyToClipboard', () => {
        contextClipboardProvider.copySelectedToClipboard();
    });
    let clearSelection = vscode.commands.registerCommand('contextClipboard.clearSelection', () => {
        contextClipboardProvider.clearSelection();
    });
    // Register all commands
    context.subscriptions.push(toggleSelection);
    context.subscriptions.push(copyToClipboard);
    context.subscriptions.push(clearSelection);
}
// This method is called when your extension is deactivated
function deactivate() { }
//# sourceMappingURL=extension.js.map