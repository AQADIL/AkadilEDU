@echo off
echo ================================================
echo   МИГРАЦИЯ ПОЛЬЗОВАТЕЛЕЙ
echo   Authentication --^> Realtime Database
echo ================================================
echo.
echo Запуск миграции...
echo.

node scripts/migrateAuthUsers.js

echo.
echo ================================================
echo   МИГРАЦИЯ ЗАВЕРШЕНА!
echo ================================================
echo.
pause
