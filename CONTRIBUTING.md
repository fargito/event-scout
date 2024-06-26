# Contributing

## Install the project

Get the correct NodeJS version:

```bash
nvm use
```

Install pnpm:

```bash
npm install -g pnpm
```

Install dependencies:

```bash
pnpm install
```

## Release

Prepare:

```bash
pnpm install
pnpm package --skip-nx-cache
pnpm build --skip-nx-cache
```

Version & publish:

```bash
pnpm lerna version --force-publish
pnpm publish --recursive --access public
```
