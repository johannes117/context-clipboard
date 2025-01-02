import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class ContextClipboardProvider implements vscode.TreeDataProvider<FileItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined | null | void> = new vscode.EventEmitter<FileItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<FileItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private selectedItems: Set<string> = new Set();
    private ignoredExtensions: string[] = ['.pyc', '.pyo', '.pyd', '.dll', '.exe', '.so', '.dylib', '.db', '.lock'];
    private ignoredDirectories: string[] = ['.next', 'venv', 'node_modules', '.vite', '.yarn', '.git'];

    constructor(private context: vscode.ExtensionContext) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: FileItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: FileItem): Promise<FileItem[]> {
        if (!element) {
            // Root of the workspace
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                return [];
            }
            
            return workspaceFolders.map(folder => new FileItem(
                folder.uri,
                folder.name,
                vscode.TreeItemCollapsibleState.Collapsed,
                this.selectedItems.has(folder.uri.fsPath)
            ));
        }

        // Get children of the element
        const children: FileItem[] = [];
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

            children.push(new FileItem(
                resourceUri,
                entry.name,
                collapsibleState,
                this.selectedItems.has(resourcePath)
            ));
        }

        return children.sort((a, b) => {
            // Directories first, then files
            const aIsDir = a.collapsibleState === vscode.TreeItemCollapsibleState.Collapsed;
            const bIsDir = b.collapsibleState === vscode.TreeItemCollapsibleState.Collapsed;
            if (aIsDir && !bIsDir) {return -1;}
            if (!aIsDir && bIsDir) {return 1;}
            return a.label!.toString().localeCompare(b.label!.toString());
        });
    }

    private shouldIgnore(resourcePath: string, isDirectory: boolean): boolean {
        const basename = path.basename(resourcePath);
        
        if (isDirectory) {
            return this.ignoredDirectories.includes(basename);
        }

        const ext = path.extname(resourcePath);
        return this.ignoredExtensions.includes(ext);
    }

    toggleSelection(item: FileItem) {
        const path = item.resourceUri.fsPath;
        if (this.selectedItems.has(path)) {
            this.selectedItems.delete(path);
        } else {
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
            output += `├── ${path.relative(vscode.workspace.workspaceFolders![0].uri.fsPath, filePath)}\n`;

            // Add file contents
            try {
                const content = await fs.promises.readFile(filePath, 'utf8');
                const relativePath = path.relative(vscode.workspace.workspaceFolders![0].uri.fsPath, filePath);
                fileContents += `File: ${relativePath}\n\`\`\`\n${content}\n\`\`\`\n\n`;
            } catch (error) {
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

class FileItem extends vscode.TreeItem {
    constructor(
        public readonly resourceUri: vscode.Uri,
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        private selected: boolean
    ) {
        super(resourceUri, collapsibleState);
        this.tooltip = this.label;
        this.description = selected ? '✓' : '';
    }

    contextValue = 'fileItem';
}
