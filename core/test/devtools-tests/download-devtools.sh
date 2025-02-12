#!/usr/bin/env bash

set -euxo pipefail

##
# @license
# Copyright 2020 Google LLC
# SPDX-License-Identifier: Apache-2.0
##

BUILD_FOLDER="${BUILD_FOLDER:-LighthouseIntegration}"

if [ -d "$DEVTOOLS_PATH" ]
then
  echo "Directory $DEVTOOLS_PATH already exists."
  cd "$DEVTOOLS_PATH"

  git status
  git --no-pager log -1

  # Update to keep current.
  git reset --hard
  git clean -fd
  git pull --ff-only -f origin main
  gclient sync --delete_unversioned_trees --reset

  exit 0
fi

echo "Downloading DevTools frontend at $DEVTOOLS_PATH"
mkdir -p `dirname $DEVTOOLS_PATH`
cd `dirname $DEVTOOLS_PATH`

fetch --nohooks --no-history devtools-frontend
cd devtools-frontend
gclient sync
if git config user.email | grep -q '@google.com'; then
  gn gen "out/$BUILD_FOLDER" --args='devtools_dcheck_always_on=true is_debug=false use_goma=true'
else
  gn gen "out/$BUILD_FOLDER" --args='devtools_dcheck_always_on=true is_debug=false'
fi
