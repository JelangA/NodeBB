#!/bin/bash
set -e

# Default values
SCRIPT_PATH="/scripts/load-test.js"
OUTPUT_FORMAT=""
RESULTS_DIR="./results"
CONTAINER_RESULTS_DIR="/results"

# Buat folder hasil utama kalau belum ada (host)
if [ ! -d "$RESULTS_DIR" ]; then
  mkdir "$RESULTS_DIR"
  echo "Folder $RESULTS_DIR dibuat"
else
  echo "Folder $RESULTS_DIR sudah ada"
fi

# Argumen 1 = path ke test script
if [ ! -z "$1" ]; then
  SCRIPT_PATH="$1"
fi

# Argumen 2 = format output (json/csv/txt)
if [ ! -z "$2" ]; then
  TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
  OUTPUT_FILE="$CONTAINER_RESULTS_DIR/result-$TIMESTAMP.$2"
  OUTPUT_FORMAT="--out $2=$OUTPUT_FILE"
fi

# Jalankan k6 dengan Docker Compose
echo "▶️ Running k6 with script: $SCRIPT_PATH"
if [ -z "$OUTPUT_FORMAT" ]; then
  docker compose run --rm k6 run "$SCRIPT_PATH"
else
  docker compose run --rm k6 run "$SCRIPT_PATH" $OUTPUT_FORMAT
fi

