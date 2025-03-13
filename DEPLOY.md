# Deployment Guide

This document outlines the steps to deploy a new version of the Context Clipboard VS Code extension.

## Prerequisites

1. Make sure you have a Personal Access Token (PAT) from Azure DevOps
   - Go to https://dev.azure.com/vscode
   - Click on your profile icon
   - Select "Personal access tokens"
   - Create a new token with "Marketplace (publish)" scope
   - Save this token somewhere secure

## Deployment Steps

1. Clean and rebuild:
   ```bash
   rm -rf node_modules
   rm package-lock.json
   npm install
   npm run compile
   ```

2. Login to VS Code marketplace (if not already logged in):
   ```bash
   vsce login contextstudio
   ```
   When prompted, enter your PAT from Azure DevOps.

3. Package the extension (optional, to test):
   ```bash
   npm run package
   ```

4. Publish new version:
   ```bash
   # For bug fixes (0.0.x):
   vsce publish patch
   
   # For new features (0.x.0):
   vsce publish minor
   
   # For major changes (x.0.0):
   vsce publish major
   ```

## Troubleshooting

If you encounter dependency issues:
1. Make sure you're using npm (not pnpm or yarn)
2. Try cleaning the npm cache:
   ```bash
   npm cache clean --force
   ```
3. Delete node_modules and package-lock.json and reinstall

## Notes

- The extension version is automatically incremented in package.json
- A new git tag is created automatically
- The extension will be available in the marketplace after a few minutes 