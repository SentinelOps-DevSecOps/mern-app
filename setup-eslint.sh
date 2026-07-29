#!/usr/bin/env bash

set -e

# Setup script for configuring ESLint v9 in client and server folders

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "🚀 Setting up ESLint for MERN App at: $PROJECT_ROOT"

# ==========================================
# 1. SETUP CLIENT ESLINT
# ==========================================
echo ""
echo "📦 [1/3] Setting up ESLint in client..."
cd "$PROJECT_ROOT/client"

npm i -D eslint@^9.20.0 @eslint/js globals eslint-plugin-react

cat << 'EOF' > eslint.config.mjs
import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";

export default [
  js.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },
];
EOF

node -e '
const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
pkg.scripts = pkg.scripts || {};
pkg.scripts["lint"] = "eslint .";
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
'

echo "✅ Client ESLint setup complete!"

# ==========================================
# 2. SETUP SERVER ESLINT
# ==========================================
echo ""
echo "📦 [2/3] Setting up ESLint in server..."
cd "$PROJECT_ROOT/server"

npm i -D eslint@^9.39.4 @eslint/js globals

cat << 'EOF' > eslint.config.mjs
import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
];
EOF

node -e '
const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
pkg.scripts = pkg.scripts || {};
pkg.scripts["lint"] = "eslint .";
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
'

echo "✅ Server ESLint setup complete!"

# ==========================================
# 3. VERIFY SETUP
# ==========================================
echo ""
echo "🔍 [3/3] Verifying ESLint execution..."
echo "Running client lint..."
cd "$PROJECT_ROOT/client"
npm run lint

echo "Running server lint..."
cd "$PROJECT_ROOT/server"
npm run lint

echo ""
echo "🎉 ESLint setup completed successfully for both client and server!"
