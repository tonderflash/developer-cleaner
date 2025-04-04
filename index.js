#!/usr/bin/env node

const inquirer = require("inquirer");
const chalk = require("chalk");
const figlet = require("figlet");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Función para mostrar el título
const showTitle = () => {
  console.log(
    chalk.green(
      figlet.textSync("Developer Cleaner", { horizontalLayout: "full" })
    )
  );
  console.log(chalk.blue("Una herramienta para limpiar node_modules antiguos"));
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

// Función principal
const main = async () => {
  showTitle();

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "basePath",
      message: "¿En qué directorio quieres buscar node_modules?",
      default: process.env.HOME + "/Developer",
    },
    {
      type: "list",
      name: "year",
      message: "¿Qué node_modules quieres limpiar?",
      choices: [
        { name: "Todos los node_modules", value: "all" },
        { name: "Solo los del 2023 y anteriores", value: "2023" },
        { name: "Solo los del 2022 y anteriores", value: "2022" },
        { name: "Solo los del 2021 y anteriores", value: "2021" },
        { name: "Personalizado", value: "custom" },
      ],
    },
    {
      type: "input",
      name: "customYear",
      message: "Ingresa el año (por ejemplo, 2023):",
      when: (answers) => answers.year === "custom",
      validate: (input) => {
        const year = parseInt(input);
        if (isNaN(year) || year < 2000 || year > new Date().getFullYear()) {
          return "Por favor, ingresa un año válido";
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
      `\nBuscando node_modules ${
        yearToClean === "all" ? "" : `del ${yearToClean}`
      } en ${basePath}...`
    )
  );

  // Encontrar node_modules
  let nodeModulesDirectories = [];

  if (yearToClean === "all") {
    nodeModulesDirectories = findNodeModulesByYear(basePath, "all");
  } else {
    // Si es un año específico, obtenemos los de ese año y anteriores
    const year = parseInt(yearToClean);
    for (let y = 2000; y <= year; y++) {
      const dirs = findNodeModulesByYear(basePath, y.toString());
      nodeModulesDirectories = [...nodeModulesDirectories, ...dirs];
    }
  }

  if (nodeModulesDirectories.length === 0) {
    console.log(chalk.red("No se encontraron directorios node_modules."));
    return;
  }

  // Calcular tamaños y mostrar información
  const directoriesWithSize = nodeModulesDirectories.map((dirPath) => ({
    path: dirPath,
    size: getDirectorySize(dirPath),
  }));

  console.log(
    chalk.green(
      `\nSe encontraron ${directoriesWithSize.length} directorios node_modules:\n`
    )
  );

  directoriesWithSize.forEach((dir, index) => {
    console.log(
      `${index + 1}. ${chalk.cyan(dir.path)} (${chalk.yellow(dir.size)})`
    );
  });

  // Preguntar si quiere limpiar
  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: "¿Quieres eliminar estos directorios node_modules?",
      default: false,
    },
  ]);

  if (confirm) {
    console.log(chalk.yellow("\nEliminando directorios node_modules...\n"));

    let success = 0;
    let failed = 0;

    for (const dir of directoriesWithSize) {
      process.stdout.write(`Eliminando ${chalk.cyan(dir.path)}... `);

      if (removeDirectory(dir.path)) {
        console.log(chalk.green("OK"));
        success++;
      } else {
        console.log(chalk.red("ERROR"));
        failed++;
      }
    }

    console.log(
      chalk.green(`\n✓ Eliminados con éxito: ${success} directorios`)
    );

    if (failed > 0) {
      console.log(chalk.red(`✗ Fallidos: ${failed} directorios`));
    }
  } else {
    console.log(
      chalk.blue("\nOperación cancelada. No se eliminó ningún directorio.")
    );
  }
};

// Ejecutar función principal
main().catch((error) => {
  console.error(chalk.red("Error:", error));
});
