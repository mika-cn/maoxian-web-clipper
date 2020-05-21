#!/usr/bin/env bash

# This script will checkout a new branch from current branch
# and bump version.
# Usage: ./scripts/bump-version.sh new_version

file_dir=$(dirname $(realpath "$0"))
root_dir=$(dirname $file_dir)

if [ "$PWD" = $root_dir ]; then
  echo "Working Dir OK!"
else
  echo "[EXIT] This script can only be executed in $root_dir"
  exit 1
fi

#================================================
# bump version
#================================================

old_version=$(grep -e \"version\": package.json | cut -d \" -f 4)
echo "Current version: $old_version"

new_version=$1
if [ "$new_version" = "" ]; then
  read -p "Input new version(e.g. 1.0.0) > " new_version
fi

echo "Specify new version: $new_version"

curr_branch=$(git status | grep "On branch" | cut -d " " -f 3)
echo "Current branch $curr_branch"

new_branch=release/$new_version
if [ "$curr_branch" = "$new_branch" ]; then
  echo "[EXIT] Already on $new_branch"
  exit 1
fi

echo "Create new branch: $new_branch"
git checkout -b $new_branch || exit 1


echo "Bump version from $old_version to $new_version"
cat package.json | sed -E "s/\"version\": \"[[:digit:]]+.[[:digit:]]+.[[:digit:]]+\"/\"version\": \"${new_version}\"/" > new-package.json
mv new-package.json package.json

echo "Commit"
git add package.json
git commit -m "RELEASE bump version ${new_version}"

echo "Done! bump version to ${new_version}."
exit 0
