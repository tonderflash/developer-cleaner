# Developer Cleaner

Una herramienta para limpiar directorios `node_modules` antiguos y liberar espacio en disco.

## Descripción

Developer Cleaner es una pequeña herramienta de línea de comandos que permite identificar y eliminar directorios `node_modules` antiguos para liberar espacio en disco. Permite filtrar por año de modificación, lo que te ayuda a mantener solo los proyectos recientes y eliminar los que ya no utilizas.

## Características

- Búsqueda de directorios `node_modules` en cualquier ubicación
- Filtrado por año (2023 y anteriores, 2022 y anteriores, etc.)
- Muestra el tamaño de cada directorio encontrado
- Interfaz interactiva para seleccionar qué directorios eliminar
- Confirmación de seguridad antes de eliminar cualquier archivo

## Instalación

### Instalación local

```bash
git clone https://github.com/tu-usuario/developer-cleaner.git
cd developer-cleaner
npm install
npm link
```

### Instalación global (para compartir con amigos)

Para compartir esta herramienta con amigos programadores, puedes publicarla en npm o simplemente compartir el código y que ellos lo instalen localmente.

## Uso

Una vez instalado, puedes ejecutar:

```bash
developer-cleaner
```

Sigue las instrucciones interactivas para:

1. Seleccionar el directorio base donde buscar (por defecto ~/Developer)
2. Elegir qué años de node_modules limpiar
3. Revisar la lista de directorios encontrados
4. Confirmar la eliminación

## Precauciones

- **¡IMPORTANTE!** Esta herramienta elimina directorios. Asegúrate de revisar la lista antes de confirmar.
- Los directorios eliminados no van a la papelera, se eliminan directamente.
- Recomendamos hacer una copia de seguridad antes de usar esta herramienta por primera vez.

## Contribuir

Si quieres mejorar esta herramienta, ¡las contribuciones son bienvenidas!

## Licencia

MIT
