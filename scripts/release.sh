#!/bin/bash

# Ockham Release Script
# Usage: ./scripts/release.sh

set -e

echo "🔍 Checking ESLint..."
pnpm lint
echo "✅ ESLint passed!"

echo "🔨 Building @ockham/codescan..."
pnpm --filter @ockham/codescan build

echo "🔨 Building @ockham/shared..."
pnpm --filter @ockham/shared build

echo "🔨 Building @ockham/desktop..."
pnpm --filter @ockham/desktop build

echo "📦 Packaging with electron-builder..."
cd packages/desktop
npx electron-builder --mac

echo "✅ Release complete! Check packages/desktop/release/"
