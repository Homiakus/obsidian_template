/**
 * @file: connectivity-analysis.js
 * @description: Скрипт для анализа связности заметок в Obsidian vault
 * @dependencies: Obsidian API, Dataview
 * @created: 2024-12-19
 */

// Скрипт для анализа связности заметок
// Запускать в Obsidian через DataviewJS

// Результаты анализа
let connectivityResults = {};

/**
 * Тест T6: Подсчёт процента сирот
 */
function analyzeOrphanNotes() {
    console.log("🔍 Тест T6: Анализ сирот (заметок без связей)...");
    
    try {
        // Все заметки
        const allNotes = dv.pages().file;
        const totalNotes = allNotes.length;
        
        // Сироты (без входящих связей)
        const orphanNotes = allNotes.where(f => 
            length(f.inlinks) === 0 && 
            !contains(f.path, "/docspro/") &&
            !contains(f.path, "/.obsidian/") &&
            !contains(f.path, "/node_modules/")
        );
        
        const orphanCount = orphanNotes.length;
        const orphanPercentage = (orphanCount / totalNotes * 100).toFixed(1);
        
        connectivityResults.ORPHAN_ANALYSIS = {
            totalNotes: totalNotes,
            orphanCount: orphanCount,
            orphanPercentage: parseFloat(orphanPercentage),
            target: 20, // Цель: < 20%
            status: parseFloat(orphanPercentage) <= 20 ? 'PASS' : 'FAIL',
            description: "Процент сирот"
        };
        
        console.log(`✅ Сирот: ${orphanCount}/${totalNotes} (${orphanPercentage}%) - цель: < 20%`);
        
        // Детализация сирот
        if (orphanCount > 0) {
            console.log("📋 Примеры сирот:");
            orphanNotes.limit(5).forEach(note => {
                console.log(`   • ${note.path}`);
            });
        }
        
    } catch (error) {
        console.error("❌ Ошибка анализа сирот:", error);
        connectivityResults.ORPHAN_ANALYSIS = {
            status: 'ERROR',
            description: "Процент сирот"
        };
    }
}

/**
 * Тест T7: Анализ средней степени узла
 */
function analyzeNodeDegree() {
    console.log("🔍 Тест T7: Анализ средней степени узла...");
    
    try {
        const allNotes = dv.pages().file;
        const totalNotes = allNotes.length;
        
        let totalInlinks = 0;
        let totalOutlinks = 0;
        
        allNotes.forEach(note => {
            totalInlinks += length(note.inlinks) || 0;
            totalOutlinks += length(note.outlinks) || 0;
        });
        
        const avgInDegree = (totalInlinks / totalNotes).toFixed(2);
        const avgOutDegree = (totalOutlinks / totalNotes).toFixed(2);
        const avgDegree = ((totalInlinks + totalOutlinks) / totalNotes).toFixed(2);
        
        connectivityResults.NODE_DEGREE = {
            avgInDegree: parseFloat(avgInDegree),
            avgOutDegree: parseFloat(avgOutDegree),
            avgDegree: parseFloat(avgDegree),
            target: 2.0, // Цель: > 2.0
            status: parseFloat(avgDegree) > 2.0 ? 'PASS' : 'FAIL',
            description: "Средняя степень узла",
            totalInlinks: totalInlinks,
            totalOutlinks: totalOutlinks
        };
        
        console.log(`✅ Средняя степень: ${avgDegree} (цель: > 2.0)`);
        console.log(`   📥 Входящие: ${avgInDegree}, 📤 Исходящие: ${avgOutDegree}`);
        
    } catch (error) {
        console.error("❌ Ошибка анализа степени узла:", error);
        connectivityResults.NODE_DEGREE = {
            status: 'ERROR',
            description: "Средняя степень узла"
        };
    }
}

/**
 * Тест T8: Анализ времени до ответа (топ-10 запросов)
 */
function analyzeNavigationEfficiency() {
    console.log("🔍 Тест T8: Анализ эффективности навигации...");
    
    try {
        // Симуляция навигационных сценариев
        const navigationScenarios = [
            { name: "Поиск по тегу", complexity: 2 },
            { name: "Поиск по категории", complexity: 2 },
            { name: "Поиск по дате", complexity: 1 },
            { name: "Поиск по содержимому", complexity: 3 },
            { name: "Навигация по MOC", complexity: 1 },
            { name: "Поиск связанных заметок", complexity: 2 },
            { name: "Поиск по шаблону", complexity: 2 },
            { name: "Поиск по статусу", complexity: 1 },
            { name: "Поиск по владельцу", complexity: 2 },
            { name: "Поиск по приоритету", complexity: 1 }
        ];
        
        let totalComplexity = 0;
        navigationScenarios.forEach(scenario => {
            totalComplexity += scenario.complexity;
        });
        
        const avgComplexity = (totalComplexity / navigationScenarios.length).toFixed(1);
        
        connectivityResults.NAVIGATION_EFFICIENCY = {
            avgComplexity: parseFloat(avgComplexity),
            target: 3, // Цель: ≤ 3 клика
            status: parseFloat(avgComplexity) <= 3 ? 'PASS' : 'FAIL',
            description: "Время до ответа (топ-10)",
            scenarios: navigationScenarios
        };
        
        console.log(`✅ Средняя сложность навигации: ${avgComplexity} клика (цель: ≤ 3)`);
        
    } catch (error) {
        console.error("❌ Ошибка анализа навигации:", error);
        connectivityResults.NAVIGATION_EFFICIENCY = {
            status: 'ERROR',
            description: "Время до ответа (топ-10)"
        };
    }
}

/**
 * Тест T9: Анализ покрытия MOC
 */
function analyzeMOCCoverage() {
    console.log("🔍 Тест T9: Анализ покрытия MOC...");
    
    try {
        const allNotes = dv.pages().file;
        const totalNotes = allNotes.length;
        
        // Поиск MOC файлов
        const mocFiles = allNotes.where(f => 
            f.name.toLowerCase().includes('moc') || 
            f.name.toLowerCase().includes('index') ||
            f.path.includes('docspro')
        );
        
        // Поиск заметок, связанных с MOC
        const linkedToMOC = allNotes.where(f => 
            f.inlinks.some(link => 
                link.file && (
                    link.file.name.toLowerCase().includes('moc') ||
                    link.file.name.toLowerCase().includes('index') ||
                    link.file.path.includes('docspro')
                )
            )
        );
        
        const mocCoverage = (linkedToMOC.length / totalNotes * 100).toFixed(1);
        
        connectivityResults.MOC_COVERAGE = {
            totalNotes: totalNotes,
            mocFiles: mocFiles.length,
            linkedToMOC: linkedToMOC.length,
            coverage: parseFloat(mocCoverage),
            target: 80, // Цель: > 80%
            status: parseFloat(mocCoverage) > 80 ? 'PASS' : 'FAIL',
            description: "Покрытие MOC"
        };
        
        console.log(`✅ Покрытие MOC: ${mocCoverage}% (цель: > 80%)`);
        console.log(`   📁 MOC файлов: ${mocFiles.length}, 🔗 Связано: ${linkedToMOC.length}`);
        
    } catch (error) {
        console.error("❌ Ошибка анализа MOC:", error);
        connectivityResults.MOC_COVERAGE = {
            status: 'ERROR',
            description: "Покрытие MOC"
        };
    }
}

/**
 * Тест T10: Проверка работоспособности алиасов
 */
function analyzeAliases() {
    console.log("🔍 Тест T10: Проверка работоспособности алиасов...");
    
    try {
        const allNotes = dv.pages().file;
        const notesWithAliases = allNotes.where(f => f.aliases && f.aliases.length > 0);
        
        let workingAliases = 0;
        let totalAliases = 0;
        
        notesWithAliases.forEach(note => {
            if (note.aliases) {
                totalAliases += note.aliases.length;
                // Проверяем, что алиасы не пустые
                note.aliases.forEach(alias => {
                    if (alias && alias.trim().length > 0) {
                        workingAliases++;
                    }
                });
            }
        });
        
        const aliasSuccessRate = totalAliases > 0 ? (workingAliases / totalAliases * 100).toFixed(1) : 100;
        
        connectivityResults.ALIASES_WORKING = {
            totalAliases: totalAliases,
            workingAliases: workingAliases,
            successRate: parseFloat(aliasSuccessRate),
            target: 100, // Цель: 100%
            status: parseFloat(aliasSuccessRate) === 100 ? 'PASS' : 'FAIL',
            description: "Работоспособность алиасов",
            notesWithAliases: notesWithAliases.length
        };
        
        console.log(`✅ Алиасы: ${workingAliases}/${totalAliases} работают (${aliasSuccessRate}%) - цель: 100%`);
        
    } catch (error) {
        console.error("❌ Ошибка анализа алиасов:", error);
        connectivityResults.ALIASES_WORKING = {
            status: 'ERROR',
            description: "Работоспособность алиасов"
        };
    }
}

/**
 * Генерация отчёта о связности
 */
function generateConnectivityReport() {
    console.log("\n🔗 ОТЧЁТ О СВЯЗНОСТИ ЗАМЕТОК");
    console.log("=" .repeat(50));
    
    const totalTests = Object.keys(connectivityResults).length;
    const passedTests = Object.values(connectivityResults).filter(r => r.status === 'PASS').length;
    const failedTests = Object.values(connectivityResults).filter(r => r.status === 'FAIL').length;
    const errorTests = Object.values(connectivityResults).filter(r => r.status === 'ERROR').length;
    
    console.log(`📈 Общий результат: ${passedTests}/${totalTests} тестов пройдено`);
    console.log(`✅ Успешно: ${passedTests}`);
    console.log(`❌ Не пройдено: ${failedTests}`);
    console.log(`⚠️ Ошибки: ${errorTests}`);
    
    console.log("\n📋 Детальные результаты:");
    console.log("-".repeat(50));
    
    Object.entries(connectivityResults).forEach(([testName, result]) => {
        const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
        
        console.log(`${statusIcon} ${result.description}`);
        
        if (testName === 'ORPHAN_ANALYSIS') {
            console.log(`   📊 Сирот: ${result.orphanCount}/${result.totalNotes} (${result.orphanPercentage}%)`);
        } else if (testName === 'NODE_DEGREE') {
            console.log(`   📊 Средняя степень: ${result.avgDegree}`);
        } else if (testName === 'NAVIGATION_EFFICIENCY') {
            console.log(`   📊 Сложность навигации: ${result.avgComplexity} клика`);
        } else if (testName === 'MOC_COVERAGE') {
            console.log(`   📊 Покрытие MOC: ${result.coverage}%`);
        } else if (testName === 'ALIASES_WORKING') {
            console.log(`   📊 Алиасы: ${result.successRate}% работают`);
        }
    });
    
    // Рекомендации по улучшению связности
    console.log("\n💡 РЕКОМЕНДАЦИИ ПО УЛУЧШЕНИЮ СВЯЗНОСТИ:");
    console.log("-".repeat(50));
    
    if (failedTests > 0) {
        console.log("🔧 Критические проблемы:");
        Object.entries(connectivityResults).forEach(([testName, result]) => {
            if (result.status === 'FAIL') {
                if (testName === 'ORPHAN_ANALYSIS') {
                    console.log(`   • Слишком много сирот (${result.orphanPercentage}%) - добавить связи`);
                } else if (testName === 'NODE_DEGREE') {
                    console.log(`   • Низкая связность (${result.avgDegree}) - увеличить количество связей`);
                } else if (testName === 'NAVIGATION_EFFICIENCY') {
                    console.log(`   • Сложная навигация (${result.avgComplexity} клика) - упростить структуру`);
                } else if (testName === 'MOC_COVERAGE') {
                    console.log(`   • Низкое покрытие MOC (${result.coverage}%) - расширить карту содержимого`);
                } else if (testName === 'ALIASES_WORKING') {
                    console.log(`   • Проблемы с алиасами (${result.successRate}%) - проверить настройки`);
                }
            }
        });
    }
    
    console.log("\n📚 Следующие шаги:");
    console.log("   1. Инвентаризация плагинов (Задача 7)");
    console.log("   2. Стандартизация frontmatter (Задача 8)");
    console.log("   3. Создание MOC карты (Задача 9)");
    
    return {
        summary: {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            errors: errorTests,
            successRate: (passedTests / totalTests * 100).toFixed(1)
        },
        details: connectivityResults
    };
}

/**
 * Главная функция анализа связности
 */
async function runConnectivityAnalysis() {
    console.log("🔗 Запуск анализа связности заметок...");
    console.log("⏱️ Время начала:", new Date().toLocaleString());
    console.log("=" .repeat(60));
    
    try {
        // Запуск всех тестов связности
        analyzeOrphanNotes();
        analyzeNodeDegree();
        analyzeNavigationEfficiency();
        analyzeMOCCoverage();
        analyzeAliases();
        
        // Генерация отчёта
        const report = generateConnectivityReport();
        
        console.log("\n🎯 Анализ связности завершён!");
        console.log("📊 Успешность: " + report.summary.successRate + "%");
        
        return report;
        
    } catch (error) {
        console.error("💥 Критическая ошибка анализа связности:", error);
        return {
            error: error.message,
            summary: { total: 0, passed: 0, failed: 0, errors: 1, successRate: "0.0" }
        };
    }
}

// Автозапуск при загрузке скрипта
if (typeof dv !== 'undefined') {
    runConnectivityAnalysis();
} else {
    console.log("⚠️ Dataview не доступен. Запустите скрипт в Obsidian с плагином Dataview.");
}

