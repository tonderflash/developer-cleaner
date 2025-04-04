#!/usr/bin/env node

const inquirer = require("inquirer");
const chalk = require("chalk");
const figlet = require("figlet");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Function to show title
const showTitle = () => {
  console.log(
    chalk.green(
      figlet.textSync("Developer Cleaner", { horizontalLayout: "full" })
    )
  );
  console.log(chalk.blue("A tool to clean up old node_modules"));
};

// Función para encontrar node_modules por año
const findNodeModulesByYear = (basePath, year) => {
  let dateFilter = "";

  if (year === "all") {
    dateFilter = "";
  } else {
    // Para años específicos, buscamos los node_modules modificados en ese año
    const startDate = `${year}-01-01`;
    const endDate = `${parseInt(year) + 1}-01-01`;
    dateFilter = `-newermt "${startDate}" -not -newermt "${endDate}"`;
  }

  try {
    const excludeNestedFilter = '-not -path "*/node_modules/*/node_modules*"';
    const command = `find ${basePath} -name "node_modules" -type d ${dateFilter} ${excludeNestedFilter} 2>/dev/null`;

    const result = execSync(command, { encoding: "utf-8" }).trim();
    return result.split("\n").filter((line) => line.trim() !== "");
  } catch (error) {
    console.error(
      chalk.red("Error al buscar directorios node_modules:"),
      error.message
    );
    return [];
  }
};

// Función para obtener el tamaño de un directorio
const getDirectorySize = (dirPath) => {
  try {
    const command = `du -sh "${dirPath}" 2>/dev/null`;
    return execSync(command, { encoding: "utf-8" }).trim().split("\t")[0];
  } catch (error) {
    return "N/A";
  }
};

// Función para eliminar un directorio
const removeDirectory = (dirPath) => {
  try {
    const command = `rm -rf "${dirPath}"`;
    execSync(command);
    return true;
  } catch (error) {
    console.error(chalk.red(`Error al eliminar ${dirPath}:`), error.message);
    return false;
  }
};

// Main function
const main = async () => {
  showTitle();

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "basePath",
      message: "In which directory do you want to search for node_modules?",
      default: process.env.HOME + "/Developer",
    },
    {
      type: "list",
      name: "year",
      message: "Which node_modules do you want to clean?",
      choices: [
        { name: "All node_modules", value: "all" },
        { name: "Only 2023 and earlier", value: "2023" },
        { name: "Only 2022 and earlier", value: "2022" },
        { name: "Only 2021 and earlier", value: "2021" },
        { name: "Custom", value: "custom" },
      ],
    },
    {
      type: "input",
      name: "customYear",
      message: "Enter the year (e.g., 2023):",
      when: (answers) => answers.year === "custom",
      validate: (input) => {
        const year = parseInt(input);
        if (isNaN(year) || year < 2000 || year > new Date().getFullYear()) {
          return "Please enter a valid year";
        }
        return true;
      },
    },
  ]);

  const basePath = answers.basePath;
  const yearToClean =
    answers.year === "custom" ? answers.customYear : answers.year;

  console.log(
    chalk.yellow(
      `\nSearching for node_modules ${
        yearToClean === "all" ? "" : `from ${yearToClean}`
      } in ${basePath}...`
    )
  );

  // Find node_modules
  let nodeModulesDirectories = [];

  if (yearToClean === "all") {
    nodeModulesDirectories = findNodeModulesByYear(basePath, "all");
  } else {
    // If it's a specific year, get that year and earlier
    const year = parseInt(yearToClean);
    for (let y = 2000; y <= year; y++) {
      const dirs = findNodeModulesByYear(basePath, y.toString());
      nodeModulesDirectories = [...nodeModulesDirectories, ...dirs];
    }
  }

  if (nodeModulesDirectories.length === 0) {
    console.log(chalk.red("No node_modules directories found."));
    return;
  }

  // Calculate sizes and show information
  const directoriesWithSize = nodeModulesDirectories.map((dirPath) => ({
    path: dirPath,
    size: getDirectorySize(dirPath),
  }));

  console.log(
    chalk.green(
      `\nFound ${directoriesWithSize.length} node_modules directories:\n`
    )
  );

  directoriesWithSize.forEach((dir, index) => {
    console.log(
      `${index + 1}. ${chalk.cyan(dir.path)} (${chalk.yellow(dir.size)})`
    );
  });

  // Ask if they want to clean
  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: "Do you want to delete these node_modules directories?",
      default: false,
    },
  ]);

  if (confirm) {
    console.log(chalk.yellow("\nDeleting node_modules directories...\n"));

    let success = 0;
    let failed = 0;

    for (const dir of directoriesWithSize) {
      process.stdout.write(`Deleting ${chalk.cyan(dir.path)}... `);

      if (removeDirectory(dir.path)) {
        console.log(chalk.green("OK"));
        success++;
      } else {
        console.log(chalk.red("ERROR"));
        failed++;
      }
    }

    console.log(
      chalk.green(`\n✓ Successfully deleted: ${success} directories`)
    );

    if (failed > 0) {
      console.log(chalk.red(`✗ Failed: ${failed} directories`));
    }
  } else {
    console.log(
      chalk.blue("\nOperation cancelled. No directories were deleted.")
    );
  }
};

// Ejecutar función principal
main().catch((error) => {
  console.error(chalk.red("Error:", error));
});
