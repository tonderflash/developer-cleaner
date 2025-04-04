#!/usr/bin/env node

const inquirer = require("inquirer");
const chalk = require("chalk");
const figlet = require("figlet");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Handle command line arguments
if (process.argv.includes("--version")) {
  const packageJson = require("./package.json");
  console.log(packageJson.version);
  process.exit(0);
}

// Function to show title
const showTitle = () => {
  console.log("\n");
  console.log(
    chalk.cyan(
      figlet.textSync("Dev Cleaner", {
        font: "ANSI Shadow",
        horizontalLayout: "fitted",
        verticalLayout: "default",
      })
    )
  );
  console.log(
    chalk.yellow("\n🧹 ") +
      chalk.blue(
        "A powerful tool to clean up old node_modules and free up disk space"
      ) +
      chalk.yellow(" 🚀\n")
  );
  console.log(
    chalk.dim("Version: " + require("./package.json").version + "\n")
  );
};

// Function to get common development directories
const getCommonDevDirectories = () => {
  const home = process.env.HOME;
  const commonDirs = [
    path.join(home, "Developer"),
    path.join(home, "Projects"),
    path.join(home, "workspace"),
    path.join(home, "git"),
    path.join(home, "repos"),
    path.join(home, "Documents/Projects"),
    path.join(home, "Desktop/Projects"),
  ];

  return commonDirs.filter((dir) => fs.existsSync(dir));
};

// Function to find node_modules by year
const findNodeModulesByYear = (basePath, year) => {
  let dateFilter = "";

  if (year === "all") {
    dateFilter = "";
  } else {
    const startDate = `${year}-01-01`;
    const endDate = `${parseInt(year) + 1}-01-01`;
    dateFilter = `-newermt "${startDate}" -not -newermt "${endDate}"`;
  }

  try {
    if (!fs.existsSync(basePath)) {
      console.error(chalk.red(`Error: Directory "${basePath}" does not exist`));
      return [];
    }

    const excludeNestedFilter = '-not -path "*/node_modules/*/node_modules*"';
    const command = `find "${basePath}" -name "node_modules" -type d ${dateFilter} ${excludeNestedFilter} 2>/dev/null`;

    const result = execSync(command, { encoding: "utf-8" }).trim();
    return result.split("\n").filter((line) => line.trim() !== "");
  } catch (error) {
    console.error(
      chalk.yellow(
        `Warning: Error searching in "${basePath}": ${error.message}`
      )
    );
    return [];
  }
};

// Function to get directory size
const getDirectorySize = (dirPath) => {
  try {
    const command = `du -sh "${dirPath}" 2>/dev/null`;
    return execSync(command, { encoding: "utf-8" }).trim().split("\t")[0];
  } catch (error) {
    return "N/A";
  }
};

// Function to remove directory
const removeDirectory = (dirPath) => {
  try {
    const command = `rm -rf "${dirPath}"`;
    execSync(command);
    return true;
  } catch (error) {
    console.error(chalk.red(`Error deleting ${dirPath}: ${error.message}`));
    return false;
  }
};

// Main function
const main = async () => {
  showTitle();

  // Get common development directories
  const commonDirs = getCommonDevDirectories();
  const customOption = { name: "📁 Custom directory...", value: "custom" };

  let basePath;

  if (commonDirs.length > 0) {
    const { selectedPath } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedPath",
        message: "Select directory to search for node_modules:",
        choices: [
          ...commonDirs.map((dir) => ({
            name: `📂 ${dir}`,
            value: dir,
          })),
          new inquirer.Separator(),
          customOption,
        ],
      },
    ]);

    if (selectedPath === "custom") {
      const { customPath } = await inquirer.prompt([
        {
          type: "input",
          name: "customPath",
          message: "Enter the directory path:",
          default: process.env.HOME,
          validate: (input) => {
            if (!input.trim()) return "Please enter a valid directory path";
            if (!fs.existsSync(input)) return "Directory does not exist";
            return true;
          },
        },
      ]);
      basePath = customPath;
    } else {
      basePath = selectedPath;
    }
  } else {
    const { customPath } = await inquirer.prompt([
      {
        type: "input",
        name: "customPath",
        message: "Enter the directory path to search:",
        default: process.env.HOME,
        validate: (input) => {
          if (!input.trim()) return "Please enter a valid directory path";
          if (!fs.existsSync(input)) return "Directory does not exist";
          return true;
        },
      },
    ]);
    basePath = customPath;
  }

  const currentYear = new Date().getFullYear();
  const { year } = await inquirer.prompt([
    {
      type: "list",
      name: "year",
      message: "Which node_modules do you want to clean?",
      choices: [
        { name: "🔍 All node_modules", value: "all" },
        {
          name: `📅 Only ${currentYear} and earlier`,
          value: currentYear.toString(),
        },
        {
          name: `📅 Only ${currentYear - 1} and earlier`,
          value: (currentYear - 1).toString(),
        },
        {
          name: `📅 Only ${currentYear - 2} and earlier`,
          value: (currentYear - 2).toString(),
        },
        new inquirer.Separator(),
        { name: "📆 Custom year...", value: "custom" },
      ],
    },
  ]);

  let yearToClean = year;

  if (year === "custom") {
    const { customYear } = await inquirer.prompt([
      {
        type: "input",
        name: "customYear",
        message: "Enter the year (e.g., 2023):",
        validate: (input) => {
          const year = parseInt(input);
          if (isNaN(year) || year < 2000 || year > currentYear) {
            return `Please enter a valid year between 2000 and ${currentYear}`;
          }
          return true;
        },
      },
    ]);
    yearToClean = customYear;
  }

  console.log(
    chalk.yellow(
      `\n🔍 Searching for node_modules ${
        yearToClean === "all" ? "" : `from ${yearToClean}`
      } in ${basePath}...`
    )
  );

  // Find node_modules
  let nodeModulesDirectories = [];

  if (yearToClean === "all") {
    nodeModulesDirectories = findNodeModulesByYear(basePath, "all");
  } else {
    const year = parseInt(yearToClean);
    for (let y = 2000; y <= year; y++) {
      const dirs = findNodeModulesByYear(basePath, y.toString());
      nodeModulesDirectories = [...nodeModulesDirectories, ...dirs];
    }
  }

  if (nodeModulesDirectories.length === 0) {
    console.log(chalk.red("\n❌ No node_modules directories found."));
    return;
  }

  // Calculate sizes and show information
  const directoriesWithSize = nodeModulesDirectories.map((dirPath) => ({
    path: dirPath,
    size: getDirectorySize(dirPath),
  }));

  console.log(
    chalk.green(
      `\n✨ Found ${directoriesWithSize.length} node_modules directories:\n`
    )
  );

  directoriesWithSize.forEach((dir, index) => {
    console.log(
      `${chalk.blue(index + 1)}. ${chalk.cyan(dir.path)} ${chalk.dim(
        "→"
      )} ${chalk.yellow(dir.size)}`
    );
  });

  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: "🗑️  Do you want to delete these node_modules directories?",
      default: false,
    },
  ]);

  if (confirm) {
    console.log(chalk.yellow("\n🧹 Cleaning node_modules directories...\n"));

    let success = 0;
    let failed = 0;

    for (const dir of directoriesWithSize) {
      process.stdout.write(
        `${chalk.dim("Deleting")} ${chalk.cyan(dir.path)}... `
      );

      if (removeDirectory(dir.path)) {
        console.log(chalk.green("✓"));
        success++;
      } else {
        console.log(chalk.red("✗"));
        failed++;
      }
    }

    console.log(
      chalk.green(`\n✨ Successfully deleted: ${success} directories`)
    );

    if (failed > 0) {
      console.log(chalk.red(`❌ Failed: ${failed} directories`));
    }
  } else {
    console.log(
      chalk.blue("\n👋 Operation cancelled. No directories were deleted.")
    );
  }
};

// Run main function
main().catch((error) => {
  console.error(chalk.red("\n❌ Error:", error.message));
  process.exit(1);
});
