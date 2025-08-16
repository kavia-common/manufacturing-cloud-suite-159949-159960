#!/bin/bash
cd /home/kavia/workspace/code-generation/manufacturing-cloud-suite-159949-159960/manufacturing_frontend
npx eslint
ESLINT_EXIT_CODE=$?
npm run build
BUILD_EXIT_CODE=$?
 if [ $ESLINT_EXIT_CODE -ne 0 ] || [ $BUILD_EXIT_CODE -ne 0 ]; then
   exit 1
fi

