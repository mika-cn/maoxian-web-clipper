#!/usr/bin/env bash
#usage ./pack-extension.sh 0.0.1

version=$1
dir=$(dirname $(realpath "$0"))
src=$(realpath "$dir/src")
dist=$(realpath "$dir/dist/extension")

extname="maoxian-web-clipper"


echo "Package firefox extension"
mkdir -p "$dist/$extname"
cp -r $src/* $dist/$extname
rm -f "$dist/$extname/manifest.chrome.json"
rm -f "$dist/$extname/js/env.js"
mv "$dist/$extname/js/env.production.js" "$dist/$extname/js/env.js"
archive="${extname}-firefox-${version}.zip"
rm -f $dist/$archive
cd $dist/$extname
zip -r $dist/$archive *
rm -rf $dist/$extname
echo "Done! Firefox"


echo "Package chrome extension"
mkdir -p "$dist/$extname"
cp -r $src/* $dist/$extname
rm -f "$dist/$extname/manifest.json"
mv "$dist/$extname/manifest.chrome.json" "$dist/$extname/manifest.json"
rm -f "$dist/$extname/js/env.js"
mv "$dist/$extname/js/env.production.js" "$dist/$extname/js/env.js"
archive="${extname}-chrome-${version}.zip"
rm -f $dist/$archive
cd $dist/$extname
zip -r $dist/$archive *
rm -rf $dist/$extname
echo "Done! Chrome"
