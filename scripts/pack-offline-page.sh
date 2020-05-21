#!/usr/bin/env bash
# Usage ./scripts/pack-offline-page 0.0.1

file_dir=$(dirname $(realpath "$0"))
root_dir=$(dirname $file_dir)

if [ "$PWD" = $root_dir ]; then
  echo "Working Dir OK!"
else
  echo "[EXIT] This script can only be executed in $root_dir"
  exit 1
fi

#================================================
# pack offline page
#================================================

version=$1
page="history"

dir=$root_dir
src=$(realpath "$dir/offline-pages")
dist=$(realpath "$dir/dist/offline-pages")

rm -rf $dist/tmp
mkdir -p $dist/tmp

archive="${page}-${version}.zip"

cp -r $src/history $dist/tmp/
cd $dist/tmp
zip -r $dist/$archive history

rm -rf $dist/tmp

echo "Done: ${page} ${version}!"

