import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';
import { promisify } from 'util';

export class ContextClipboardProvider implements vscode.TreeDataProvider<FileItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined | null | void> = new vscode.EventEmitter<FileItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<FileItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private selectedItems: Set<string> = new Set();
    private ignoredExtensions: string[] = ['.pyc', '.pyo', '.pyd', '.dll', '.exe', '.so', '.dylib', '.db', '.lock'];
    private ignoredDirectories: string[] = ['.next', 'venv', 'node_modules', '.vite', '.yarn', '.git'];

    private view?: vscode.TreeView<FileItem>;

    private tokenCount: number = 0;
    private encoder: any;

    constructor(private context: vscode.ExtensionContext) {
        console.log('Creating tree view...');
        this.view = vscode.window.createTreeView('contextClipboardView', {
            treeDataProvider: this,
            showCollapseAll: true
        });

        console.log('Setting view properties...');
        this.view.title = "Context Clipboard";
        this.view.description = "Select files to copy";
        this.view.message = "Tokens Selected: 0";
        console.log('View message set to:', this.view.message);

        // Update the command icons based on current settings
        this.updateCommandIcons();

        try {
            console.log('Initializing tiktoken encoder...');
            import('js-tiktoken').then(tiktoken => {
                this.encoder = tiktoken.encodingForModel('gpt-4o');
                console.log('Encoder initialized successfully');
                this.updateTokenCount();
            }).catch(error => {
                console.error('Failed to initialize tiktoken encoder:', error);
            });
        } catch (error) {
            console.error('Failed to import tiktoken:', error);
        }
    }

    async refresh(): Promise<void> {
        // Verify all selected files still exist and remove any that don't
        for (const filePath of this.selectedItems) {
            try {
                await fs.promises.access(filePath);
            } catch (error) {
                // File no longer exists, remove it from selection
                this.selectedItems.delete(filePath);
            }
        }

        // Update token count with remaining valid files
        await this.updateTokenCount();
        
        // Refresh the tree view
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
                // Create a message item when no workspace is open
                return [new FileItem(
                    vscode.Uri.parse(''),
                    'Open a folder or workspace to get started...',
                    vscode.TreeItemCollapsibleState.None,
                    false,
                    true // new parameter to indicate this is a message item
                )];
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

    async toggleSelection(item: FileItem) {
        const path = item.resourceUri.fsPath;
        const isSelected = this.selectedItems.has(path);
        
        // If it's a directory, handle recursive selection
        if (item.collapsibleState === vscode.TreeItemCollapsibleState.Collapsed) {
            await this.toggleDirectorySelection(item, !isSelected);
            await this.updateTokenCount(); // Only update tokens after directory selection is complete
        } else {
            // For single files, just toggle their selection
            if (isSelected) {
                this.selectedItems.delete(path);
            } else {
                this.selectedItems.add(path);
            }
            await this.updateTokenCount();
        }
        
        this.refresh();
    }

    private async toggleDirectorySelection(item: FileItem, select: boolean) {
        const dirPath = item.resourceUri.fsPath;
        
        // Toggle the directory itself
        if (select) {
            this.selectedItems.add(dirPath);
        } else {
            this.selectedItems.delete(dirPath);
        }

        try {
            const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
            const processEntries = async () => {
                const promises = entries.map(async (entry) => {
                    const entryPath = path.join(dirPath, entry.name);
                    
                    if (this.shouldIgnore(entryPath, entry.isDirectory())) {
                        return;
                    }

                    if (entry.isDirectory()) {
                        await this.toggleDirectorySelection(
                            new FileItem(
                                vscode.Uri.file(entryPath),
                                entry.name,
                                vscode.TreeItemCollapsibleState.Collapsed,
                                select
                            ),
                            select
                        );
                    } else {
                        if (select) {
                            this.selectedItems.add(entryPath);
                        } else {
                            this.selectedItems.delete(entryPath);
                        }
                    }
                });

                await Promise.all(promises);
            };

            await processEntries();
            
        } catch (error) {
            console.error(`Error processing directory ${dirPath}:`, error);
            vscode.window.showErrorMessage(`Failed to process directory: ${dirPath}`);
        }
    }

    async copySelectedToClipboard() {
        if (this.selectedItems.size === 0) {
            vscode.window.showInformationMessage('No files selected');
            return;
        }

        const config = vscode.workspace.getConfiguration('contextClipboard');
        let output = '';

        // Add user prompt if enabled
        const includeUserPrompt = config.get('includeUserPrompt', false);
        if (includeUserPrompt) {
            const promptText = config.get('userPromptText', '');
            if (promptText) {
                output += '<user_prompt>\n';
                output += promptText + '\n';
                output += '</user_prompt>\n\n';
            }
        }

        // Add file tree if enabled
        const includeFileTree = config.get('includeFileTree', false);
        if (includeFileTree) {
            output += '<file_tree>\n';
            for (const filePath of this.selectedItems) {
                output += `├── ${path.relative(vscode.workspace.workspaceFolders![0].uri.fsPath, filePath)}\n`;
            }
            output += '</file_tree>\n\n';
        }

        // Add Git diff if enabled
        const includeGitDiff = config.get('includeGitDiff', false);
        if (includeGitDiff && vscode.workspace.workspaceFolders) {
            const gitDiff = await this.getGitDiff();
            if (gitDiff) {
                const comparisonBranch = config.get('gitComparisonBranch', 'main');
                output += `<git_diff branch="${comparisonBranch}">\n`;
                output += gitDiff;
                output += '</git_diff>\n\n';
            }
        }

        // Add file contents
        let fileContents = '<file_contents>\n';
        for (const filePath of this.selectedItems) {
            try {
                const content = await fs.promises.readFile(filePath, 'utf8');
                const relativePath = path.relative(vscode.workspace.workspaceFolders![0].uri.fsPath, filePath);
                fileContents += `File: ${relativePath}\n\`\`\`\n${content}\n\`\`\`\n\n`;
            } catch (error) {
                console.error(`Error reading file ${filePath}:`, error);
            }
        }
        fileContents += '</file_contents>';

        const finalOutput = output + fileContents;
        await vscode.env.clipboard.writeText(finalOutput);
        vscode.window.showInformationMessage('Selected files copied to clipboard');
    }

    clearSelection() {
        this.selectedItems.clear();
        this.tokenCount = 0;
        if (this.view) {
            this.updateCommandIcons();
        }
        this.refresh();
    }

    async toggleGitDiff() {
        const config = vscode.workspace.getConfiguration('contextClipboard');
        const currentValue = config.get('includeGitDiff', false);
        await config.update('includeGitDiff', !currentValue, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Include Git Diff: ${!currentValue ? 'Enabled' : 'Disabled'}`);
        this.updateCommandIcons();
    }

    async toggleFileTree() {
        const config = vscode.workspace.getConfiguration('contextClipboard');
        const currentValue = config.get('includeFileTree', false);
        await config.update('includeFileTree', !currentValue, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Include File Tree: ${!currentValue ? 'Enabled' : 'Disabled'}`);
        this.updateCommandIcons();
    }

    async toggleUserPrompt() {
        const config = vscode.workspace.getConfiguration('contextClipboard');
        const currentValue = config.get('includeUserPrompt', false);
        await config.update('includeUserPrompt', !currentValue, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Include User Prompt: ${!currentValue ? 'Enabled' : 'Disabled'}`);
        this.updateCommandIcons();
    }

    private async updateTokenCount() {
        let totalTokens = 0;
        
        for (const filePath of this.selectedItems) {
            try {
                const content = await fs.promises.readFile(filePath, 'utf8');
                const tokens = this.encoder.encode(content);
                totalTokens += tokens.length;
            } catch (error) {
                console.error(`Error counting tokens for ${filePath}:`, error);
            }
        }
        
        this.tokenCount = totalTokens;
        
        // Update the view message with both token count and enabled options
        if (this.view) {
            this.updateCommandIcons();
            console.log('Updated token count to:', this.tokenCount);
        } else {
            console.warn('View is undefined when trying to update token count');
        }
    }

    async selectComparisonBranch() {
        try {
            const branches = await this.getGitBranches();
            if (!branches || branches.length === 0) {
                vscode.window.showErrorMessage('No Git branches found');
                return;
            }

            const selectedBranch = await vscode.window.showQuickPick(branches, {
                placeHolder: 'Select a branch to compare with',
                canPickMany: false
            });

            if (selectedBranch) {
                const config = vscode.workspace.getConfiguration('contextClipboard');
                await config.update('gitComparisonBranch', selectedBranch, vscode.ConfigurationTarget.Workspace);
                vscode.window.showInformationMessage(`Git comparison branch set to: ${selectedBranch}`);
            }
        } catch (error) {
            console.error('Error selecting comparison branch:', error);
            vscode.window.showErrorMessage('Failed to get Git branches');
        }
    }

    private async getGitBranches(): Promise<string[] | undefined> {
        if (!vscode.workspace.workspaceFolders) {
            return undefined;
        }

        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const exec = promisify(cp.exec);

        try {
            const { stdout } = await exec('git branch --format="%(refname:short)"', { cwd: workspaceRoot });
            return stdout.split('\n')
                .map(branch => branch.trim())
                .filter(branch => branch.length > 0);
        } catch (error) {
            console.error('Error getting Git branches:', error);
            return undefined;
        }
    }

    private async getGitDiff(): Promise<string | undefined> {
        if (!vscode.workspace.workspaceFolders) {
            return undefined;
        }

        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const config = vscode.workspace.getConfiguration('contextClipboard');
        const comparisonBranch = config.get('gitComparisonBranch', 'main');
        const exec = promisify(cp.exec);

        try {
            // Get the diff in a format that's readable for LLMs
            const { stdout } = await exec(`git diff ${comparisonBranch} --unified=3 --no-color`, { 
                cwd: workspaceRoot,
                maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large diffs
            });
            
            if (!stdout.trim()) {
                vscode.window.showInformationMessage(`No changes detected compared to ${comparisonBranch}`);
                return undefined;
            }
            
            return stdout;
        } catch (error) {
            console.error('Error getting Git diff:', error);
            vscode.window.showErrorMessage(`Failed to get Git diff with ${comparisonBranch}`);
            return undefined;
        }
    }

    private async updateCommandIcons() {
        const config = vscode.workspace.getConfiguration('contextClipboard');
        const gitDiffEnabled = config.get('includeGitDiff', false);
        const fileTreeEnabled = config.get('includeFileTree', false);
        const userPromptEnabled = config.get('includeUserPrompt', false);

        // Update command titles to show current state
        await vscode.commands.executeCommand(
            'setContext', 
            'contextClipboard.gitDiffEnabled', 
            gitDiffEnabled
        );
        await vscode.commands.executeCommand(
            'setContext', 
            'contextClipboard.fileTreeEnabled', 
            fileTreeEnabled
        );
        await vscode.commands.executeCommand(
            'setContext', 
            'contextClipboard.userPromptEnabled', 
            userPromptEnabled
        );

        // Update command titles
        const gitDiffCommand = await vscode.commands.getCommands(true).then(
            cmds => cmds.find(c => c === 'contextClipboard.toggleGitDiff')
        );
        if (gitDiffCommand) {
            vscode.commands.executeCommand(
                'setTitle', 
                gitDiffCommand, 
                `Include Git Diff ${gitDiffEnabled ? '✓' : ''}`
            ).then(undefined, err => console.error(err));
        }

        // Update view description to show enabled options
        const enabledOptions = [];
        if (gitDiffEnabled) {enabledOptions.push('Git Diff');}
        if (fileTreeEnabled) {enabledOptions.push('File Tree');}
        if (userPromptEnabled) {enabledOptions.push('User Prompt');}

        if (this.view) {
            if (enabledOptions.length > 0) {
                this.view.description = `Includes: ${enabledOptions.join(', ')}`;
            } else {
                this.view.description = "Select files to copy";
            }
            
            // Update the view message to include indicators for enabled options
            const indicators = [];
            indicators.push(`Tokens: ${this.tokenCount.toLocaleString()}`);
            indicators.push(`Git: ${gitDiffEnabled ? '🟢' : '⚪'}`);
            indicators.push(`Tree: ${fileTreeEnabled ? '🟢' : '⚪'}`);
            indicators.push(`Prompt: ${userPromptEnabled ? '🟢' : '⚪'}`);
            
            this.view.message = indicators.join(' | ');
        }
    }
}

class FileItem extends vscode.TreeItem {
    constructor(
        public readonly resourceUri: vscode.Uri,
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        private selected: boolean,
        private isMessage: boolean = false
    ) {
        super(resourceUri, collapsibleState);
        this.tooltip = this.label;
        this.contextValue = 'fileItem';
        
        if (this.isMessage) {
            // Style for message item
            this.iconPath = new vscode.ThemeIcon('info');
        } else {
            // Use VSCode's built-in icons with proper codicon names
            this.iconPath = new vscode.ThemeIcon(
                selected ? 'check' : 'debug-stop',
                selected ? undefined : new vscode.ThemeColor('foreground')
            );
            
            this.command = {
                command: 'contextClipboard.toggleSelection',
                title: 'Toggle Selection',
                arguments: [this]
            };
        }
    }

    contextValue = 'fileItem';
}
