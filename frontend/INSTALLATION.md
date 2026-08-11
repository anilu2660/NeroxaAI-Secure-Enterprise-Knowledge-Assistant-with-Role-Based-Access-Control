# Installation & Setup Guide

This guide covers the process for installing dependencies and running the project locally. The project uses Node.js, React, Vite, and TanStack.

## Prerequisites

Before you start, make sure you have the following installed on your machine:

- **Node.js** (v18 or higher is recommended)
- A package manager. We recommend **npm** or **bun** (since a `bun.lock` file is present).

## 1. Installing Dependencies

Depending on your preferred package manager, run one of the following commands in the root directory of the project:

### Using NPM (Default Node Package Manager)

```sh
npm install
```

_Note: This will read the `package.json` and install all required dependencies._

### Using Bun (Faster alternative)

```sh
bun install
```

_Note: This project includes a `bun.lock` file, meaning `bun` is officially supported and will likely install dependencies faster._

## 2. Running the Development Server

Once the dependencies are successfully installed, you can start the local development server.

### Using NPM

```sh
npm run dev
```

### Using Bun

```sh
bun run dev
```

By default, the development server will start on `http://localhost:8080/` (or another port if 8080 is taken). Check your terminal output for the exact local address.

## Troubleshooting

- **Dependencies failing to install?** Ensure your Node version is up-to-date. You can use tools like `nvm` (Node Version Manager) to switch to the LTS version of Node.
- **Port already in use?** If port 8080 is taken by another process, Vite will automatically select the next available port, or you can force it on a specific port like this: `npm run dev -- --port 3000`.
- **Clear cache if issues persist:** Delete your `node_modules` folder and run the install command again.
