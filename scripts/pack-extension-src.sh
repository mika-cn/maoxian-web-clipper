#!/usr/bin/env bash


# AMO requires us to provide source code.

# usage ./pack-extension-src.sh

file_dir=$(dirname $(realpath "$0"))
root_dir=$(dirname $file_dir)

if [ "$PWD" = $root_dir ]; then
  echo "Working Dir OK!"
else
  echo "[EXIT] This script can only be executed in $root_dir"
  exit 1
fi

#================================================
# pack extension source
#================================================

version=$(grep -e \"version\": package.json | cut -d \" -f 4)

echo "Version: $version"

# project root
dir=$root_dir
src=$(realpath "$dir/src")
dist=$(realpath "$dir/dist/extension-src")

extname="maoxian-web-clipper"


echo "Packing extension source"
mkdir -p "$dist/$extname"

for fname in package.json package-lock.json webpack.config.js README.md LICENSE; do
  cp $dir/$fname $dist/$extname/$fname
done
cp -r $dir/src $dist/$extname
rm -f "$dist/$extname/manifest.chrome.json"


archive="${extname}-src-${version}.zip"
rm -f $dist/$archive
cd $dist/$extname
zip -r $dist/$archive *
rm -rf $dist/$extname
echo "Done! ($dist/$archive)"
