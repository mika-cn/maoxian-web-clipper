#!/usr/bin/env bash

# This script will bump version and pack extension
# Usage: ./scripts/release.sh

file_dir=$(dirname $(realpath "$0"))
root_dir=$(dirname $file_dir)

if [ "$PWD" = $root_dir ]; then
  echo "Working Dir OK!"
else
  echo "[EXIT] This script can only be executed in $root_dir"
  exit 1
fi

#================================================
# release
#================================================

if ./scripts/bump-version.sh ; then
  if ./scripts/pack-extension.sh; then
    echo "Done!"
  else
    echo "Failed: pack-extension"
  fi
else
  echo "Failed: bump version"
  exit 1
fi
