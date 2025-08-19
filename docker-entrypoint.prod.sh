#!/bin/sh

# Salir inmediatamente si un comando falla
set -e

echo "Running database migrations..."
# Apuntamos al archivo de esquema transpilado en su ubicación final dentro del nuevo 'dist'
npx drizzle-kit push --dialect=postgresql --schema=./dist/shared/schema.js --url=$DATABASE_URL

echo "Starting the application..."
# El comando 'exec "$@"' ejecuta el comando que se pasó originalmente al contenedor
# En nuestro caso (del Dockerfile), es "node dist/server/index.js"
exec "$@"
