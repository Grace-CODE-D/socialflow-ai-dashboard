@echo off
REM Wallet Service Implementation Verification Script (Windows)
REM This script verifies that all files are in place and tests pass

echo.
echo Verifying Wallet Service Implementation...
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo Error: package.json not found. Please run this script from the project root.
    exit /b 1
)

echo Checking file structure...
echo.

set missing_files=0

REM Check required files
call :check_file "src\blockchain\types\wallet.ts"
call :check_file "src\blockchain\services\providers\FreighterProvider.ts"
call :check_file "src\blockchain\services\providers\AlbedoProvider.ts"
call :check_file "src\blockchain\services\WalletService.ts"
call :check_file "src\blockchain\services\__tests__\WalletService.test.ts"
call :check_file "src\blockchain\index.ts"
call :check_file "src\blockchain\examples\WalletConnectExample.tsx"
call :check_file "src\blockchain\README.md"
call :check_file "src\blockchain\QUICK_START.md"
call :check_file "jest.config.js"
call :check_file "jest.setup.js"
call :check_file "WALLET_IMPLEMENTATION_GUIDE.md"
call :check_file "IMPLEMENTATION_SUMMARY.md"

echo.

if %missing_files% gtr 0 (
    echo %missing_files% file(s) missing!
    exit /b 1
) else (
    echo All required files present!
)

echo.
echo Checking dependencies...

if not exist "node_modules" (
    echo node_modules not found. Installing dependencies...
    call npm install
) else (
    echo node_modules exists
)

echo.
echo Compiling TypeScript...

call npx tsc --noEmit
if errorlevel 1 (
    echo TypeScript compilation failed!
    exit /b 1
) else (
    echo TypeScript compilation successful!
)

echo.
echo Running tests...

call npm test -- --passWithNoTests
if errorlevel 1 (
    echo Tests failed!
    exit /b 1
) else (
    echo All tests passed!
)

echo.
echo Generating test coverage...
call npm run test:coverage -- --passWithNoTests

echo.
echo Verification Summary:
echo.
echo File structure: Complete
echo Dependencies: Installed
echo TypeScript: Compiles
echo Tests: Passing
echo.
echo Wallet Service implementation verified successfully!
echo.
echo Next steps:
echo 1. Review the code
echo 2. Run 'git add .' to stage changes
echo 3. Run 'git commit -m "feat: implement Stellar wallet service"'
echo 4. Run 'git push origin features/issue-1-wallet-service'
echo 5. Create a pull request against the develop branch
echo.

exit /b 0

:check_file
if exist %1 (
    echo [OK] %~1
) else (
    echo [MISSING] %~1
    set /a missing_files+=1
)
exit /b 0
