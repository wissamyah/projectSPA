@echo off
echo Installing Supabase CLI for Windows...
echo.

echo Downloading Supabase CLI...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.zip' -OutFile 'supabase.zip'"

echo Extracting...
powershell -Command "Expand-Archive -Path 'supabase.zip' -DestinationPath '.' -Force"

echo Moving to system path...
move supabase.exe C:\Windows\System32\

echo Cleaning up...
del supabase.zip

echo.
echo Supabase CLI installed successfully!
echo.
echo Now run: setup-google-calendar-v2.bat
pause