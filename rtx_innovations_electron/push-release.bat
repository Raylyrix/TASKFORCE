@echo off
echo Pushing new release v1.6.24...

echo Adding package.json...
git add package.json

echo Committing version change...
git commit -m "v1.6.24: Release new build with enhanced features"

echo Pushing to origin main...
git push origin main

echo Creating and pushing tag v1.6.24...
git tag -a v1.6.24 -m "Release v1.6.24: Enhanced email automation with improved UI/UX"
git push origin v1.6.24

echo Release v1.6.24 pushed successfully!
pause
