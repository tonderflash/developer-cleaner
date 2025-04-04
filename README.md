# Developer Cleaner

A tool to clean up old `node_modules` directories and free up disk space.

## Description

Developer Cleaner is a small command-line tool that helps you identify and remove old `node_modules` directories to free up disk space. It allows filtering by modification year, helping you keep only recent projects and remove those you no longer use.

## Features

- Search for `node_modules` directories in any location
- Filter by year (2023 and earlier, 2022 and earlier, etc.)
- Display size of each found directory
- Interactive interface to select which directories to remove
- Safety confirmation before deleting any files

## Installation

### Local Installation

```bash
git clone https://github.com/tonderflash/developer-cleaner.git
cd developer-cleaner
npm install
npm link
```

### Global Installation (to share with friends)

You can install this tool globally via npm:

```bash
npm install -g developer-cleaner
```

## Usage

Once installed, you can run:

```bash
developer-cleaner
```

Follow the interactive prompts to:

1. Select the base directory to search (defaults to ~/Developer)
2. Choose which years of node_modules to clean
3. Review the list of found directories
4. Confirm deletion

## Precautions

- **IMPORTANT!** This tool deletes directories. Make sure to review the list before confirming.
- Deleted directories do not go to the trash, they are removed directly.
- We recommend making a backup before using this tool for the first time.

## Contributing

If you want to improve this tool, contributions are welcome!

## Language Support

- [Readme en Español](README.es.md)

## License

MIT
