#!/bin/bash

# Exit on any error
set -e

# Echo commands before executing
set -x

# Cleanup any existing temp worktree from failed previous runs
if [ -d "temp" ]; then
    git worktree remove -f temp 2>/dev/null || rm -rf temp
fi

# Remove previous build
rm -rf out

# Build the project using npm
npm run build || { echo "Build failed"; exit 1; }

# Check if build output exists and is not empty
if [ ! -d "out" ] || [ -z "$(ls -A out)" ]; then
    echo "Error: Build output is empty or missing"
    exit 1
fi

# Check if critical directories exist
if [ ! -d "out/_next" ] || [ ! -d "out/_next/static" ]; then
    echo "Error: Critical Next.js build directories are missing"
    exit 1
fi

# Check if we have at least one chunk file
if [ -z "$(find out/_next/static/chunks -name '*.js' 2>/dev/null)" ]; then
    echo "Error: No JavaScript chunks found in build output"
    exit 1
fi

# Add .nojekyll
touch out/.nojekyll

# Make sure we have the latest gh-pages
git fetch origin gh-pages

# Create a temporary directory and checkout gh-pages there
git worktree add temp gh-pages

# Clear existing files in gh-pages but keep .git
rm -rf temp/*

# Copy new build files
cp -r out/* temp/ || { echo "Copy failed"; exit 1; }

# Verify content was copied
if [ -z "$(ls -A temp)" ]; then
    echo "Error: No files were copied to deployment directory"
    cd ..
    git worktree remove temp
    exit 1
fi

# Commit and push
cd temp
git add .
git commit -m "Deploy to gh-pages"

echo "Pushing to gh-pages branch..."
git push origin gh-pages


# Cleanup
echo ""
echo "======================================"
echo "🔨 Cleaning up deployment resources..."
echo "======================================"
cd ..
git worktree remove -f temp

echo ""
echo "======================================"
echo "✅ Deployment completed successfully!"
echo "======================================"


# Improve cleanup at the end
cleanup() {
    if [ -d "temp" ]; then
        cd ..
        git worktree remove -f temp 2>/dev/null || rm -rf temp
    fi
}

# Set up trap to ensure cleanup runs even if script fails
trap cleanup EXIT

echo "Deployment completed successfully!"