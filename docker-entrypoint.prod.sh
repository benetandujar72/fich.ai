#!/bin/sh

# Salir inmediatamente si un comando falla
set -e

echo "Running database migrations..."
# Usamos 'npx' para ejecutar drizzle-kit desde las dependencias del proyecto
npx drizzle-kit push

echo "Starting the application..."
# El comando 'exec "$@"' ejecuta el comando que se pasó originalmente al contenedor
# En nuestro caso (del Dockerfile), es "node dist/index.js"
exec "$@"
