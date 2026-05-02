#!/bin/bash
# Run concurrent race condition tests

set -e

echo "Installing dependencies..."
cd packages/api

if ! grep -q '"uuid"' package.json; then
  echo "Adding uuid to dependencies..."
  npm install uuid
fi

echo ""
echo "Running concurrent race condition tests..."
echo ""

npx ts-node -O '{"module":"commonjs"}' src/tests/concurrent-race-tests.ts

echo ""
echo "Tests completed."
