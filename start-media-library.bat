@echo off
setlocal EnableDelayedExpansion
title Unified Media Library

REM ========================================
REM Unified Media Library Startup Script
REM ========================================

REM Container names
set POSTGRES_CONTAINER=media-library-postgres
set CHROMADB_CONTAINER=media-library-chromadb
set APP_CONTAINER=media-library-app
set APP_PORT=3000

REM Colors (using PowerShell for colored output)
set "PS_CMD=powershell -NoProfile -Command"

REM ========================================
REM MAIN SCRIPT
REM ========================================

cls
echo.
echo =======================================================
echo        UNIFIED MEDIA LIBRARY STARTUP SCRIPT
echo =======================================================
echo.

REM Step 1: Check if Docker is running
echo === CHECKING DOCKER DESKTOP ===
echo.
docker ps >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] Docker Desktop is not running
    echo [i] Starting Docker Desktop...
    echo.
    
    REM Try to find and start Docker Desktop
    if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
        start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
    ) else if exist "%ProgramFiles(x86)%\Docker\Docker\Docker Desktop.exe" (
        start "" "%ProgramFiles(x86)%\Docker\Docker\Docker Desktop.exe"
    ) else if exist "%LOCALAPPDATA%\Docker\Docker Desktop.exe" (
        start "" "%LOCALAPPDATA%\Docker\Docker Desktop.exe"
    ) else (
        echo [X] Docker Desktop not found! Please install it first.
        echo.
        pause
        exit /b 1
    )
    
    echo [i] Waiting for Docker Desktop to start...
    :WAIT_DOCKER
    timeout /t 2 /nobreak >nul
    docker ps >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo . 
        goto WAIT_DOCKER
    )
    echo.
    echo [OK] Docker Desktop is ready!
) else (
    echo [OK] Docker Desktop is running
)
echo.

REM Step 2: Check and Start Ollama (required for embeddings)
echo === CHECKING OLLAMA ===
echo.

REM Check if Ollama is installed
ollama --version >nul 2>&1
if !ERRORLEVEL! NEQ 0 (
    echo [!] Ollama is not installed
    echo [i] Semantic search will not work without Ollama
    echo [i] Download from: https://ollama.com/download
    echo.
    goto OLLAMA_DONE
)

echo [OK] Ollama is installed

REM Check if Ollama is already running
curl -s http://localhost:11434/api/tags >nul 2>&1
if !ERRORLEVEL! NEQ 0 (
    echo [i] Starting Ollama...
    start /min "Ollama" ollama serve
    timeout /t 3 /nobreak >nul
    echo [OK] Ollama started
) else (
    echo [OK] Ollama is already running
)

REM Check for embedding model
ollama list 2>nul | findstr /i "embed" >nul
if !ERRORLEVEL! EQU 0 (
    echo [OK] Embedding model available
) else (
    echo [!] Embedding model not found
    echo [i] Run: ollama pull embeddinggemma:300m
)

:OLLAMA_DONE
echo.

REM Step 3: Start PostgreSQL
echo === STARTING DATABASE ===
echo.
echo [i] Starting %POSTGRES_CONTAINER%...
docker start %POSTGRES_CONTAINER% >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] PostgreSQL started
    echo [i] Waiting for PostgreSQL to be ready...
    timeout /t 5 /nobreak >nul
    echo [OK] PostgreSQL is ready!
) else (
    echo [X] Failed to start PostgreSQL
    goto CLEANUP
)
echo.

REM Step 4: Start ChromaDB
echo === STARTING VECTOR DATABASE ===
echo.
echo [i] Starting %CHROMADB_CONTAINER%...
docker start %CHROMADB_CONTAINER% >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] ChromaDB started
    echo [i] Waiting for ChromaDB to be ready...
    timeout /t 5 /nobreak >nul
    echo [OK] ChromaDB is ready!
) else (
    echo [X] Failed to start ChromaDB
    goto CLEANUP
)
echo.

REM Step 5: Start Next.js App
echo === STARTING APPLICATION ===
echo.
echo [i] Starting %APP_CONTAINER%...
docker start %APP_CONTAINER% >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Application started
    echo [i] Waiting for application to be ready...
    timeout /t 10 /nobreak >nul
    echo [OK] Application is ready!
) else (
    echo [X] Failed to start application
    goto CLEANUP
)
echo.



REM Step 6: Display URL
echo === APPLICATION READY ===
echo.
echo   Your Media Library is now running at:
echo   http://localhost:%APP_PORT%
echo.

REM Step 7: Open browser
echo [i] Opening browser...
start http://localhost:%APP_PORT%
timeout /t 1 /nobreak >nul
echo [OK] Browser opened!
echo.

REM Step 8: Status message
echo =======================================================
echo.
echo   [OK] All services are running!
echo   [OK] Browser opened
echo.
echo   Access your library at: http://localhost:%APP_PORT%
echo.
echo =======================================================
echo.

REM Keep running until user input
echo.
echo Type 'stop' or 'exit' and press Enter to shutdown (or just close this window)
echo.
set /p "USER_INPUT=Enter command (stop/exit to shutdown): "

if /i "%USER_INPUT%"=="stop" goto CLEANUP
if /i "%USER_INPUT%"=="exit" goto CLEANUP
if /i "%USER_INPUT%"=="quit" goto CLEANUP

REM Invalid input, go back to waiting
echo.
echo [!] Invalid command. Type 'stop' or 'exit' to shutdown.
echo.
goto MONITOR_LOOP

:MONITOR_LOOP
set /p "USER_INPUT=Enter command (stop/exit to shutdown): "
if /i "%USER_INPUT%"=="stop" goto CLEANUP
if /i "%USER_INPUT%"=="exit" goto CLEANUP
if /i "%USER_INPUT%"=="quit" goto CLEANUP
goto MONITOR_LOOP

REM ========================================
REM CLEANUP
REM ========================================
:CLEANUP
echo.
echo.
echo === SHUTTING DOWN ===
echo.

REM Stop containers in reverse order
echo [i] Stopping %APP_CONTAINER%...
docker stop %APP_CONTAINER% --time 10 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Application stopped
) else (
    echo [!] Application was not running
)

echo [i] Stopping %CHROMADB_CONTAINER%...
docker stop %CHROMADB_CONTAINER% --time 10 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] ChromaDB stopped
) else (
    echo [!] ChromaDB was not running
)

echo [i] Stopping %POSTGRES_CONTAINER%...
docker stop %POSTGRES_CONTAINER% --time 10 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] PostgreSQL stopped
) else (
    echo [!] PostgreSQL was not running
)

echo.
echo [OK] All containers stopped!
echo.

REM Stop Ollama
echo [i] Stopping Ollama...
taskkill /F /IM "ollama app.exe" >nul 2>&1
taskkill /F /IM "ollama.exe" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Ollama stopped
) else (
    echo [!] Ollama was not running
)
echo.

REM Stop Docker Desktop
echo [i] Closing Docker Desktop...
timeout /t 2 /nobreak >nul

REM Try multiple process names
taskkill /F /IM "Docker Desktop.exe" >nul 2>&1
taskkill /F /IM "Docker for Windows.exe" >nul 2>&1
taskkill /F /IM "Docker.exe" >nul 2>&1
taskkill /F /IM "com.docker.backend.exe" >nul 2>&1

REM Also stop WSL/Docker backend
wsl --shutdown >nul 2>&1

echo [OK] Docker Desktop shutdown requested

echo.
echo [OK] Cleanup complete!
echo.
pause
exit /b 0
