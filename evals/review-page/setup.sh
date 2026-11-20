#!/usr/bin/env bash
# Copy this case's fixture site into the run workspace.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
cp -R "$here/fixtures/site" ./site
