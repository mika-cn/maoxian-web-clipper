#!/usr/bin/env bash

# This script will pack extension to zip file
# Required environment variables are:
#   MX_CHROME_ID (public key of MaoXian)
#   MX_FIREFOX_ID (extension id of MaoXian)
#
# Usage: ./scripts/pack-extension.sh

if [ -z "$(command -v zip)" ]; then
  echo "ERROR: zip is not installed"
  exit 1
fi

file_dir=$(dirname $(realpath "$0"))
root_dir=$(dirname $file_dir)

if [ "$PWD" = $root_dir ]; then
  echo "Working Dir OK!"
else
  echo "[EXIT] This script can only be executed in $root_dir"
  exit 1
fi

#================================================
# Check environment variables
#================================================

if [ "$MX_CHROMIUM_ID" = "" ]; then
  echo "Environment variable MX_CHROME_ID is empty"
  exit 1
fi

if [ "$MX_CHROMIUM_UPDATE_URL" = "" ]; then
  echo "Environment variable MX_CHROME_UPDATE_URL is empty"
  exit 1
fi

if [ "$MX_FIREFOX_ID" = "" ]; then
  echo "Environment variable MX_FIREFOX_ID is empty"
  exit 1
fi


extname="maoxian-web-clipper"
dist=$root_dir/dist/extension
build_dir=$dist/$extname
json_path=$root_dir/package.json

# get version
version=$(grep -e \"version\": $json_path | cut -d \" -f 4)
echo "Version: $version"

echo "================================================"
echo " build and pack for Chromium"
echo "================================================"

echo "Building for Chromium"
npm run build-chromium-production
echo "Built!"

# Just for sure, check build_dir
if [ ! -d "$build_dir" ]; then
  echo "Error, Build_dir $build_dir must exist, before zip it!"
  exit 1
fi

# pack extension
archive="${extname}-chromium-${version}.zip"
archive_path=$dist/$archive

if [ -f $archive_path ]; then
  echo "Target archive $archive_path exist!"
  echo "removing it..."
  rm -f $archive_path
  echo "removed!"
fi

echo "Packing..."
cd $build_dir
zip --quiet -r $archive_path *
echo "Done packed: $archive_path"
cd $root_dir


echo "================================================"
echo " build and pack for Firefox"
echo "================================================"

echo "Building for firefox"
npm run build-firefox-production
echo "Built!"

# Just for sure, check build_dir
if [ ! -d "$build_dir" ]; then
  echo "Error, Build_dir $build_dir must exist, before zip it!"
  exit 1
fi

# pack extension
archive="${extname}-firefox-${version}.zip"
archive_path=$dist/$archive

if [ -f $archive_path ]; then
  echo "Target archive $archive_path exist!"
  echo "removing it..."
  rm -f $archive_path
  echo "removed!"
fi

echo "Packing..."
cd $build_dir
zip --quiet -r $archive_path *
echo "Done packed: $archive_path"
cd $root_dir

#================================================

echo "All done!"
exit 0
