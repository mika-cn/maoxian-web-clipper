#/usr/bin/env bash

# You should install web-ext-native-app-packer first.
# run `gem install web-ext-native-app-packer` to install it.
#
# Usage: ./scripts/pack-native-app.sh

file_dir=$(dirname $(realpath "$0"))
root_dir=$(dirname $file_dir)

if [ "$PWD" = $root_dir ]; then
  echo "Working Dir OK!"
else
  echo "[EXIT] This script can only be executed in $root_dir"
  exit 1
fi

#================================================
# pack native app
#================================================

dir=$root_dir
src=$(realpath "$dir/native-app")
dist=$(realpath "$dir/dist/native-app")

rm -rf $dist/tmp
rm -f $dist/*.zip

mkdir -p $dist/tmp
cp -r $src/* $dist/tmp

echo "Remove useless file"
rm -f $dist/tmp/README.md
rm -f $dist/tmp/config.yaml
rm -f $dist/tmp/config.yaml.example
rm -f $dist/tmp/pack.yaml
rm -f $dist/tmp/pack.yaml.example
rm -f $dist/tmp/tmp/*.log*
rm -f $dist/tmp/Rakefile
rm -r $dist/tmp/test

echo "Create production file"
mv $dist/tmp/config.yaml.production $dist/tmp/config.yaml
mv $dist/tmp/pack.yaml.production $dist/tmp/pack.yaml

echo "Native app folder ready"

web-ext-native-app-packer $dist/tmp $dist
rm -rf $dist/tmp

echo "Native app packed!"
