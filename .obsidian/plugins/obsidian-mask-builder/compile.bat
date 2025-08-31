@echo off
echo 🔄 Компиляция Obsidian Mask Builder...

REM Проверяем наличие TypeScript
tsc --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ TypeScript не установлен!
    echo 💡 Установите TypeScript глобально:
    echo    npm install -g typescript
    pause
    exit /b 1
)

echo ✅ TypeScript найден, начинаем компиляцию...

REM Компилируем основной файл
tsc src/main.ts --outDir . --target es2018 --module commonjs --lib es2018,dom --strict --esModuleInterop --skipLibCheck

if %errorlevel% equ 0 (
    echo ✅ Компиляция завершена успешно!
    echo 📁 Создан файл: main.js
    echo 🎉 Плагин готов к использованию!
) else (
    echo ❌ Ошибка компиляции!
)

pause
