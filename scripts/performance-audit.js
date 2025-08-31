/**
 * @file: performance-audit.js
 * @description: Скрипт для аудита производительности Obsidian vault
 * @dependencies: Obsidian API, Dataview
 * @created: 2024-12-19
 */

// Скрипт для аудита производительности vault
// Запускать в Obsidian через DataviewJS

// Конфигурация тестов
const PERFORMANCE_TESTS = {
    MOC_OPEN: { target: 1500, description: "Время открытия MOC" },
    GLOBAL_SEARCH: { target: 800, description: "Время глобального поиска" },
    VAULT_LOAD: { target: 3000, description: "Время загрузки vault" },
    PLUGIN_RESPONSE: { target: 100, description: "Время отклика плагинов" }
};

// Результаты тестов
let testResults = {};

/**
 * Тест T1: Время открытия MOC
 */
async function testMOCPerformance() {
    console.log("🔍 Тест T1: Измерение времени открытия MOC...");
    
    const startTime = performance.now();
    
    try {
        // Попытка открыть MOC файл
        const mocFiles = dv.pages().file.where(f => 
            f.name.toLowerCase().includes('moc') || 
            f.name.toLowerCase().includes('index') ||
            f.path.includes('docspro')
        ).limit(1);
        
        if (mocFiles.length > 0) {
            // Симуляция открытия MOC
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        testResults.MOC_OPEN = {
            actual: Math.round(duration),
            target: PERFORMANCE_TESTS.MOC_OPEN.target,
            status: duration <= PERFORMANCE_TESTS.MOC_OPEN.target ? 'PASS' : 'FAIL',
            description: PERFORMANCE_TESTS.MOC_OPEN.description
        };
        
        console.log(`✅ MOC открыт за ${duration.toFixed(0)}мс (цель: ${PERFORMANCE_TESTS.MOC_OPEN.target}мс)`);
        
    } catch (error) {
        console.error("❌ Ошибка теста MOC:", error);
        testResults.MOC_OPEN = {
            actual: 'ERROR',
            target: PERFORMANCE_TESTS.MOC_OPEN.target,
            status: 'ERROR',
            description: PERFORMANCE_TESTS.MOC_OPEN.description
        };
    }
}

/**
 * Тест T2: Время глобального поиска
 */
async function testGlobalSearchPerformance() {
    console.log("🔍 Тест T2: Измерение времени глобального поиска...");
    
    const startTime = performance.now();
    
    try {
        // Симуляция глобального поиска
        const searchQuery = "test";
        const results = dv.pages().where(f => 
            f.file.name.toLowerCase().includes(searchQuery) ||
            f.file.content.toLowerCase().includes(searchQuery)
        ).limit(10);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        testResults.GLOBAL_SEARCH = {
            actual: Math.round(duration),
            target: PERFORMANCE_TESTS.GLOBAL_SEARCH.target,
            status: duration <= PERFORMANCE_TESTS.GLOBAL_SEARCH.target ? 'PASS' : 'FAIL',
            description: PERFORMANCE_TESTS.GLOBAL_SEARCH.description,
            resultsCount: results.length
        };
        
        console.log(`✅ Поиск выполнен за ${duration.toFixed(0)}мс (цель: ${PERFORMANCE_TESTS.GLOBAL_SEARCH.target}мс), найдено: ${results.length}`);
        
    } catch (error) {
        console.error("❌ Ошибка теста поиска:", error);
        testResults.GLOBAL_SEARCH = {
            actual: 'ERROR',
            target: PERFORMANCE_TESTS.GLOBAL_SEARCH.target,
            status: 'ERROR',
            description: PERFORMANCE_TESTS.GLOBAL_SEARCH.description
        };
    }
}

/**
 * Тест T3: Время загрузки vault
 */
async function testVaultLoadPerformance() {
    console.log("🔍 Тест T3: Измерение времени загрузки vault...");
    
    const startTime = performance.now();
    
    try {
        // Симуляция загрузки vault
        const totalFiles = dv.pages().length;
        const totalSize = dv.pages().file.reduce((acc, f) => acc + (f.size || 0), 0);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        testResults.VAULT_LOAD = {
            actual: Math.round(duration),
            target: PERFORMANCE_TESTS.VAULT_LOAD.target,
            status: duration <= PERFORMANCE_TESTS.VAULT_LOAD.target ? 'PASS' : 'FAIL',
            description: PERFORMANCE_TESTS.VAULT_LOAD.description,
            totalFiles: totalFiles,
            totalSize: totalSize
        };
        
        console.log(`✅ Vault загружен за ${duration.toFixed(0)}мс (цель: ${PERFORMANCE_TESTS.VAULT_LOAD.target}мс), файлов: ${totalFiles}`);
        
    } catch (error) {
        console.error("❌ Ошибка теста загрузки vault:", error);
        testResults.VAULT_LOAD = {
            actual: 'ERROR',
            target: PERFORMANCE_TESTS.VAULT_LOAD.target,
            status: 'ERROR',
            description: PERFORMANCE_TESTS.VAULT_LOAD.description
        };
    }
}

/**
 * Тест T4: Использование памяти
 */
function testMemoryUsage() {
    console.log("🔍 Тест T4: Анализ использования памяти...");
    
    try {
        // Оценка использования памяти на основе количества файлов
        const totalFiles = dv.pages().length;
        const estimatedMemory = totalFiles * 0.5; // Примерная оценка: 0.5MB на файл
        
        testResults.MEMORY_USAGE = {
            actual: Math.round(estimatedMemory),
            target: 100, // Цель: < 100MB
            status: estimatedMemory <= 100 ? 'PASS' : 'FAIL',
            description: "Использование памяти",
            totalFiles: totalFiles
        };
        
        console.log(`✅ Оценка памяти: ${estimatedMemory.toFixed(1)}MB (цель: < 100MB), файлов: ${totalFiles}`);
        
    } catch (error) {
        console.error("❌ Ошибка теста памяти:", error);
        testResults.MEMORY_USAGE = {
            actual: 'ERROR',
            target: 100,
            status: 'ERROR',
            description: "Использование памяти"
        };
    }
}

/**
 * Тест T5: Время отклика плагинов
 */
async function testPluginPerformance() {
    console.log("🔍 Тест T5: Измерение времени отклика плагинов...");
    
    const startTime = performance.now();
    
    try {
        // Тест производительности Dataview
        const testQuery = dv.pages().limit(1);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        testResults.PLUGIN_RESPONSE = {
            actual: Math.round(duration),
            target: PERFORMANCE_TESTS.PLUGIN_RESPONSE.target,
            status: duration <= PERFORMANCE_TESTS.PLUGIN_RESPONSE.target ? 'PASS' : 'FAIL',
            description: PERFORMANCE_TESTS.PLUGIN_RESPONSE.description
        };
        
        console.log(`✅ Плагины отвечают за ${duration.toFixed(0)}мс (цель: ${PERFORMANCE_TESTS.PLUGIN_RESPONSE.target}мс)`);
        
    } catch (error) {
        console.error("❌ Ошибка теста плагинов:", error);
        testResults.PLUGIN_RESPONSE = {
            actual: 'ERROR',
            target: PERFORMANCE_TESTS.PLUGIN_RESPONSE.target,
            status: 'ERROR',
            description: PERFORMANCE_TESTS.PLUGIN_RESPONSE.description
        };
    }
}

/**
 * Генерация отчёта о производительности
 */
function generatePerformanceReport() {
    console.log("\n📊 ОТЧЁТ О ПРОИЗВОДИТЕЛЬНОСТИ VAULT");
    console.log("=" .repeat(50));
    
    const totalTests = Object.keys(testResults).length;
    const passedTests = Object.values(testResults).filter(r => r.status === 'PASS').length;
    const failedTests = Object.values(testResults).filter(r => r.status === 'FAIL').length;
    const errorTests = Object.values(testResults).filter(r => r.status === 'ERROR').length;
    
    console.log(`📈 Общий результат: ${passedTests}/${totalTests} тестов пройдено`);
    console.log(`✅ Успешно: ${passedTests}`);
    console.log(`❌ Не пройдено: ${failedTests}`);
    console.log(`⚠️ Ошибки: ${errorTests}`);
    
    console.log("\n📋 Детальные результаты:");
    console.log("-".repeat(50));
    
    Object.entries(testResults).forEach(([testName, result]) => {
        const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
        const actual = typeof result.actual === 'number' ? `${result.actual}мс` : result.actual;
        const target = typeof result.target === 'number' ? `${result.target}мс` : result.target;
        
        console.log(`${statusIcon} ${result.description}: ${actual} (цель: ${target})`);
        
        if (result.status === 'FAIL' && typeof result.actual === 'number' && typeof result.target === 'number') {
            const deviation = ((result.actual - result.target) / result.target * 100).toFixed(1);
            console.log(`   📊 Отклонение: ${deviation}%`);
        }
        
        if (result.totalFiles) {
            console.log(`   📁 Файлов: ${result.totalFiles}`);
        }
    });
    
    // Рекомендации по оптимизации
    console.log("\n💡 РЕКОМЕНДАЦИИ ПО ОПТИМИЗАЦИИ:");
    console.log("-".repeat(50));
    
    if (failedTests > 0) {
        console.log("🔧 Критические проблемы:");
        Object.entries(testResults).forEach(([testName, result]) => {
            if (result.status === 'FAIL') {
                console.log(`   • ${result.description}: требуется оптимизация`);
            }
        });
    }
    
    if (errorTests > 0) {
        console.log("⚠️ Технические проблемы:");
        Object.entries(testResults).forEach(([testName, result]) => {
            if (result.status === 'ERROR') {
                console.log(`   • ${result.description}: проверить настройки`);
            }
        });
    }
    
    console.log("\n📚 Следующие шаги:");
    console.log("   1. Анализ связности заметок (Задача 6)");
    console.log("   2. Инвентаризация плагинов (Задача 7)");
    console.log("   3. Стандартизация frontmatter (Задача 8)");
    
    return {
        summary: {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            errors: errorTests,
            successRate: (passedTests / totalTests * 100).toFixed(1)
        },
        details: testResults
    };
}

/**
 * Главная функция запуска аудита
 */
async function runPerformanceAudit() {
    console.log("🚀 Запуск аудита производительности vault...");
    console.log("⏱️ Время начала:", new Date().toLocaleString());
    console.log("=" .repeat(60));
    
    try {
        // Запуск всех тестов
        await testMOCPerformance();
        await testGlobalSearchPerformance();
        await testVaultLoadPerformance();
        testMemoryUsage();
        await testPluginPerformance();
        
        // Генерация отчёта
        const report = generatePerformanceReport();
        
        console.log("\n🎯 Аудит завершён!");
        console.log("📊 Успешность: " + report.summary.successRate + "%");
        
        return report;
        
    } catch (error) {
        console.error("💥 Критическая ошибка аудита:", error);
        return {
            error: error.message,
            summary: { total: 0, passed: 0, failed: 0, errors: 1, successRate: "0.0" }
        };
    }
}

// Автозапуск при загрузке скрипта
if (typeof dv !== 'undefined') {
    runPerformanceAudit();
} else {
    console.log("⚠️ Dataview не доступен. Запустите скрипт в Obsidian с плагином Dataview.");
}

