#!/bin/sh

test_paths=$(ls test/*/test-*.js 2>/dev/null)
if [ -n "$test_paths" ]; then
  for test_path in $test_paths ; do
    node test/runner.js $test_path
  done
fi

exit 0
