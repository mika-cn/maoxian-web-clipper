#!/usr/bin/env bash

# This script will pack extension to zip file
# Required environment variables are:
#   MX_CHROME_ID (public key of MaoXian)
#   MX_FIREFOX_ID (extension id of MaoXian)
#
# Usage: ./scripts/pack-extension.sh

file_dir=$(dirname $(realpath "$0"))
root_dir=$(dirname $file_dir)

if [ "$PWD" = $root_dir ]; then
  echo "Working Dir OK!"
else
  echo "[EXIT] This script can only be executed in $root_dir"
  exit 1
fi

#================================================
# pack extension
#================================================

if [ "$MX_CHROME_ID" = "" ]; then
  echo "Environment variable MX_CHROME_ID is empty"
  exit 1
fi

if [ "$MX_FIREFOX_ID" = "" ]; then
  echo "Environment variable MX_FIREFOX_ID is empty"
  exit 1
fi

npm run build-all

exit 0
