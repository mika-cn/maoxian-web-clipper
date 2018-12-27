#!/usr/bin/env bash
# usage ./pack-offline-page 0.0.1

version=$1
page="history"


dir=$(dirname $(realpath "$0"))
src=$(realpath "$dir/offline-pages")
dist=$(realpath "$dir/dist/offline-pages")

rm -rf $dist/tmp

mkdir -p $dist/tmp

archive="${page}-${version}.zip"

cp -r $src/history $dist/tmp/
cd $dist/tmp
zip -r $dist/$archive history

echo "Done: ${page} ${version}!"

