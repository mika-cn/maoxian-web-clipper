#/usr/bin/env bash

dir=$(dirname $(realpath "$0"))
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

echo "Native app packed!"
