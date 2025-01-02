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
exports.ContextClipboardProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class ContextClipboardProvider {
    context;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    selectedItems = new Set();
    ignoredExtensions = ['.pyc', '.pyo', '.pyd', '.dll', '.exe', '.so', '.dylib', '.db', '.lock'];
    ignoredDirectories = ['.next', 'venv', 'node_modules', '.vite', '.yarn', '.git'];
    constructor(context) {
        this.context = context;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        if (!element) {
            // Root of the workspace
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                return [];
            }
            return workspaceFolders.map(folder => new FileItem(folder.uri, folder.name, vscode.TreeItemCollapsibleState.Collapsed, this.selectedItems.has(folder.uri.fsPath)));
        }
        // Get children of the element
        const children = [];
        const dirEntries = await fs.promises.readdir(element.resourceUri.fsPath, { withFileTypes: true });
        for (const entry of dirEntries) {
            const resourcePath = path.join(element.resourceUri.fsPath, entry.name);
            const resourceUri = vscode.Uri.file(resourcePath);
            // Skip ignored items
            if (this.shouldIgnore(resourcePath, entry.isDirectory())) {
                continue;
            }
            const collapsibleState = entry.isDirectory()
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None;
            children.push(new FileItem(resourceUri, entry.name, collapsibleState, this.selectedItems.has(resourcePath)));
        }
        return children.sort((a, b) => {
            // Directories first, then files
            const aIsDir = a.collapsibleState === vscode.TreeItemCollapsibleState.Collapsed;
            const bIsDir = b.collapsibleState === vscode.TreeItemCollapsibleState.Collapsed;
            if (aIsDir && !bIsDir) {
                return -1;
            }
            if (!aIsDir && bIsDir) {
                return 1;
            }
            return a.label.toString().localeCompare(b.label.toString());
        });
    }
    shouldIgnore(resourcePath, isDirectory) {
        const basename = path.basename(resourcePath);
        if (isDirectory) {
            return this.ignoredDirectories.includes(basename);
        }
        const ext = path.extname(resourcePath);
        return this.ignoredExtensions.includes(ext);
    }
    toggleSelection(item) {
        const path = item.resourceUri.fsPath;
        if (this.selectedItems.has(path)) {
            this.selectedItems.delete(path);
        }
        else {
            this.selectedItems.add(path);
        }
        this.refresh();
    }
    async copySelectedToClipboard() {
        if (this.selectedItems.size === 0) {
            vscode.window.showInformationMessage('No files selected');
            return;
        }
        let output = '<file_tree>\n';
        let fileContents = '<file_contents>\n';
        for (const filePath of this.selectedItems) {
            // Add to file tree
            output += `├── ${path.relative(vscode.workspace.workspaceFolders[0].uri.fsPath, filePath)}\n`;
            // Add file contents
            try {
                const content = await fs.promises.readFile(filePath, 'utf8');
                const relativePath = path.relative(vscode.workspace.workspaceFolders[0].uri.fsPath, filePath);
                fileContents += `File: ${relativePath}\n\`\`\`\n${content}\n\`\`\`\n\n`;
            }
            catch (error) {
                console.error(`Error reading file ${filePath}:`, error);
            }
        }
        output += '</file_tree>\n\n';
        fileContents += '</file_contents>';
        const finalOutput = output + fileContents;
        await vscode.env.clipboard.writeText(finalOutput);
        vscode.window.showInformationMessage('Selected files copied to clipboard');
    }
    clearSelection() {
        this.selectedItems.clear();
        this.refresh();
    }
}
exports.ContextClipboardProvider = ContextClipboardProvider;
class FileItem extends vscode.TreeItem {
    resourceUri;
    label;
    collapsibleState;
    selected;
    constructor(resourceUri, label, collapsibleState, selected) {
        super(resourceUri, collapsibleState);
        this.resourceUri = resourceUri;
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.selected = selected;
        this.tooltip = this.label;
        this.description = selected ? '✓' : '';
    }
    contextValue = 'fileItem';
}
//# sourceMappingURL=contextClipboardProvider.js.map