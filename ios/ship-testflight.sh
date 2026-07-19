#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

PBXPROJ="ios/App/App.xcodeproj/project.pbxproj"
CURRENT_BUILD=$(grep -m1 "CURRENT_PROJECT_VERSION" "$PBXPROJ" | grep -o '[0-9]\+')
NEXT_BUILD=$((CURRENT_BUILD + 1))
echo "Bumping build number: $CURRENT_BUILD -> $NEXT_BUILD"
sed -i '' "s/CURRENT_PROJECT_VERSION = $CURRENT_BUILD;/CURRENT_PROJECT_VERSION = $NEXT_BUILD;/g" "$PBXPROJ"

echo "Syncing Capacitor config..."
npx cap sync ios

ARCHIVE_PATH="ios/build/MyMoney.xcarchive"
echo "Archiving..."
xcodebuild -project ios/App/App.xcodeproj -scheme App \
  -destination 'generic/platform=iOS' -configuration Release \
  archive -archivePath "$ARCHIVE_PATH"

echo "Exporting and uploading to TestFlight..."
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportOptionsPlist ios/ExportOptions.plist \
  -exportPath ios/build/export \
  -authenticationKeyPath ~/.appstoreconnect/private_keys/AuthKey_8FP9V6HWMA.p8 \
  -authenticationKeyID 8FP9V6HWMA \
  -authenticationKeyIssuerID c39a2666-fd15-4d12-aa7f-fe18f7cf399f

echo "Done. Build $NEXT_BUILD uploaded to TestFlight."
