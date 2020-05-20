#!/usr/bin/env bash


# AMO requires us to provide source code.

# usage ./pack-extension-src.sh 0.0.1


version=$1

# project root
dir=$(dirname $(realpath "$0"))
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

