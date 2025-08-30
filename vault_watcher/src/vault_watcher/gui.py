"""GUI for Vault Watcher using PyQt6."""

import sys
import threading
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from PyQt6.QtCore import QThread, pyqtSignal, Qt, QTimer
from PyQt6.QtGui import QAction, QFont, QIcon, QPalette, QPixmap
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QSplitter, QTreeWidget, QTreeWidgetItem, QTextEdit, QPushButton,
    QLabel, QStatusBar, QMenuBar, QToolBar, QFileDialog, QMessageBox,
    QProgressBar, QTabWidget, QTableWidget, QTableWidgetItem,
    QGroupBox, QFormLayout, QLineEdit, QCheckBox, QSpinBox,
    QComboBox, QTextBrowser, QFrame, QScrollArea
)

from .config import Config
from .core import VaultWatcher
from .logging import get_logger


class VaultWatcherThread(QThread):
    """Thread for running vault watcher."""
    
    log_signal = pyqtSignal(str)
    status_signal = pyqtSignal(str)
    error_signal = pyqtSignal(str)
    
    def __init__(self, config: Config):
        super().__init__()
        self.config = config
        self.watcher = VaultWatcher(config)
        self.running = False
    
    def run(self):
        """Run the vault watcher."""
        try:
            self.running = True
            self.status_signal.emit("Запуск наблюдателя...")
            self.watcher.start()
            self.status_signal.emit("Наблюдатель запущен")
            
            while self.running:
                time.sleep(1)
        
        except Exception as e:
            self.error_signal.emit(f"Ошибка: {str(e)}")
        finally:
            self.watcher.stop()
            self.status_signal.emit("Наблюдатель остановлен")
    
    def stop(self):
        """Stop the vault watcher."""
        self.running = False


class FileTreeWidget(QTreeWidget):
    """File tree widget for displaying vault structure."""
    
    def __init__(self, config: Config):
        super().__init__()
        self.config = config
        self.setup_ui()
    
    def setup_ui(self):
        """Setup the UI."""
        self.setHeaderLabels(["Файлы", "Размер", "Тип"])
        self.setColumnWidth(0, 300)
        self.setColumnWidth(1, 100)
        self.setColumnWidth(2, 100)
        
        # Enable sorting
        self.setSortingEnabled(True)
        
        # Context menu
        self.setContextMenuPolicy(Qt.ContextMenuPolicy.CustomContextMenu)
        self.customContextMenuRequested.connect(self.show_context_menu)
    
    def refresh_tree(self):
        """Refresh the file tree."""
        self.clear()
        vault_path = self.config.get_vault_path()
        
        if not vault_path.exists():
            return
        
        # Add root item
        root_item = QTreeWidgetItem(self, [vault_path.name, "", "Папка"])
        root_item.setIcon(0, self.style().standardIcon(self.style().StandardPixmap.SP_DirIcon))
        
        # Add main folders
        folders = [
            (self.config.folders.inbox, "Входящие"),
            (self.config.folders.ongoing, "В работе"),
            (self.config.folders.projects, "Проекты"),
            (self.config.folders.categories, "Категории"),
            (self.config.folders.resources, "Ресурсы"),
            (self.config.folders.admin, "Администрирование"),
        ]
        
        for folder_name, display_name in folders:
            folder_path = vault_path / folder_name
            if folder_path.exists():
                folder_item = QTreeWidgetItem(root_item, [display_name, "", "Папка"])
                folder_item.setIcon(0, self.style().standardIcon(self.style().StandardPixmap.SP_DirIcon))
                self._populate_folder(folder_item, folder_path)
        
        self.expandItem(root_item)
    
    def _populate_folder(self, parent_item: QTreeWidgetItem, folder_path: Path):
        """Populate folder with files and subfolders."""
        try:
            for item_path in sorted(folder_path.iterdir()):
                if item_path.is_dir():
                    item = QTreeWidgetItem(parent_item, [item_path.name, "", "Папка"])
                    item.setIcon(0, self.style().standardIcon(self.style().StandardPixmap.SP_DirIcon))
                    self._populate_folder(item, item_path)
                else:
                    size = item_path.stat().st_size
                    size_str = self._format_size(size)
                    file_type = self._get_file_type(item_path)
                    
                    item = QTreeWidgetItem(parent_item, [item_path.name, size_str, file_type])
                    item.setIcon(0, self._get_file_icon(item_path))
        except PermissionError:
            pass
    
    def _format_size(self, size_bytes: int) -> str:
        """Format file size."""
        if size_bytes == 0:
            return "0 B"
        
        size_names = ["B", "KB", "MB", "GB", "TB"]
        i = 0
        while size_bytes >= 1024 and i < len(size_names) - 1:
            size_bytes /= 1024.0
            i += 1
        
        return f"{size_bytes:.1f} {size_names[i]}"
    
    def _get_file_type(self, file_path: Path) -> str:
        """Get file type description."""
        if self.config.is_model_file(file_path):
            return "3D Модель"
        elif self.config.is_note_file(file_path):
            return "Заметка"
        elif self.config.is_document_file(file_path):
            return "Документ"
        elif self.config.is_image_file(file_path):
            return "Изображение"
        else:
            return "Файл"
    
    def _get_file_icon(self, file_path: Path) -> QIcon:
        """Get file icon."""
        if self.config.is_model_file(file_path):
            return self.style().standardIcon(self.style().StandardPixmap.SP_ComputerIcon)
        elif self.config.is_note_file(file_path):
            return self.style().standardIcon(self.style().StandardPixmap.SP_FileDialogDetailedView)
        elif self.config.is_document_file(file_path):
            return self.style().standardIcon(self.style().StandardPixmap.SP_FileDialogContentsView)
        elif self.config.is_image_file(file_path):
            return self.style().standardIcon(self.style().StandardPixmap.SP_FileDialogInfoView)
        else:
            return self.style().standardIcon(self.style().StandardPixmap.SP_FileIcon)
    
    def show_context_menu(self, position):
        """Show context menu."""
        item = self.itemAt(position)
        if not item:
            return
        
        menu = QMenuBar(self)
        
        # Add actions based on item type
        if item.text(2) == "Папка":
            open_action = QAction("Открыть папку", self)
            open_action.triggered.connect(lambda: self._open_folder(item))
            menu.addAction(open_action)
        else:
            open_action = QAction("Открыть файл", self)
            open_action.triggered.connect(lambda: self._open_file(item))
            menu.addAction(open_action)
        
        menu.exec(self.mapToGlobal(position))
    
    def _open_folder(self, item: QTreeWidgetItem):
        """Open folder in file manager."""
        # Implementation for opening folder
        pass
    
    def _open_file(self, item: QTreeWidgetItem):
        """Open file with default application."""
        # Implementation for opening file
        pass


class LogWidget(QTextEdit):
    """Log display widget."""
    
    def __init__(self):
        super().__init__()
        self.setup_ui()
    
    def setup_ui(self):
        """Setup the UI."""
        self.setReadOnly(True)
        self.setMaximumHeight(200)
        
        # Set font
        font = QFont("Consolas", 9)
        self.setFont(font)
    
    def add_log(self, message: str, level: str = "INFO"):
        """Add log message."""
        timestamp = time.strftime("%H:%M:%S")
        color = {
            "INFO": "black",
            "WARNING": "orange",
            "ERROR": "red",
            "DEBUG": "gray"
        }.get(level, "black")
        
        html = f'<span style="color: {color}">[{timestamp}] {level}: {message}</span><br>'
        self.append(html)
        
        # Auto-scroll to bottom
        scrollbar = self.verticalScrollBar()
        scrollbar.setValue(scrollbar.maximum())


class StatusWidget(QWidget):
    """Status widget showing vault watcher status."""
    
    def __init__(self, config: Config):
        super().__init__()
        self.config = config
        self.setup_ui()
    
    def setup_ui(self):
        """Setup the UI."""
        layout = QVBoxLayout(self)
        
        # Status group
        status_group = QGroupBox("Статус")
        status_layout = QFormLayout(status_group)
        
        self.vault_path_label = QLabel(self.config.general.vault_path)
        self.watcher_status_label = QLabel("Остановлен")
        self.file_count_label = QLabel("0")
        self.last_activity_label = QLabel("Нет активности")
        
        status_layout.addRow("Путь к хранилищу:", self.vault_path_label)
        status_layout.addRow("Статус наблюдателя:", self.watcher_status_label)
        status_layout.addRow("Файлов обработано:", self.file_count_label)
        status_layout.addRow("Последняя активность:", self.last_activity_label)
        
        layout.addWidget(status_group)
        
        # Progress bar
        self.progress_bar = QProgressBar()
        self.progress_bar.setVisible(False)
        layout.addWidget(self.progress_bar)
    
    def update_status(self, status: str):
        """Update watcher status."""
        self.watcher_status_label.setText(status)
    
    def update_file_count(self, count: int):
        """Update file count."""
        self.file_count_label.setText(str(count))
    
    def update_last_activity(self, activity: str):
        """Update last activity."""
        self.last_activity_label.setText(activity)
    
    def show_progress(self, visible: bool):
        """Show/hide progress bar."""
        self.progress_bar.setVisible(visible)


class ConfigurationWidget(QWidget):
    """Configuration widget."""
    
    def __init__(self, config: Config):
        super().__init__()
        self.config = config
        self.setup_ui()
    
    def setup_ui(self):
        """Setup the UI."""
        layout = QVBoxLayout(self)
        
        # Create tabs
        tab_widget = QTabWidget()
        
        # General settings tab
        general_tab = self._create_general_tab()
        tab_widget.addTab(general_tab, "Общие")
        
        # Processing settings tab
        processing_tab = self._create_processing_tab()
        tab_widget.addTab(processing_tab, "Обработка")
        
        # GUI settings tab
        gui_tab = self._create_gui_tab()
        tab_widget.addTab(gui_tab, "Интерфейс")
        
        layout.addWidget(tab_widget)
        
        # Buttons
        button_layout = QHBoxLayout()
        
        save_button = QPushButton("Сохранить")
        save_button.clicked.connect(self.save_configuration)
        
        reload_button = QPushButton("Перезагрузить")
        reload_button.clicked.connect(self.reload_configuration)
        
        button_layout.addWidget(save_button)
        button_layout.addWidget(reload_button)
        button_layout.addStretch()
        
        layout.addLayout(button_layout)
    
    def _create_general_tab(self) -> QWidget:
        """Create general settings tab."""
        widget = QWidget()
        layout = QFormLayout(widget)
        
        self.vault_path_edit = QLineEdit(self.config.general.vault_path)
        self.log_level_combo = QComboBox()
        self.log_level_combo.addItems(["DEBUG", "INFO", "WARNING", "ERROR"])
        self.log_level_combo.setCurrentText(self.config.general.log_level)
        
        self.dry_run_checkbox = QCheckBox()
        self.dry_run_checkbox.setChecked(self.config.general.dry_run)
        
        layout.addRow("Путь к хранилищу:", self.vault_path_edit)
        layout.addRow("Уровень логирования:", self.log_level_combo)
        layout.addRow("Режим тестирования:", self.dry_run_checkbox)
        
        return widget
    
    def _create_processing_tab(self) -> QWidget:
        """Create processing settings tab."""
        widget = QWidget()
        layout = QFormLayout(widget)
        
        self.enable_3d_conversion = QCheckBox()
        self.enable_3d_conversion.setChecked(self.config.processing.enable_3d_conversion)
        
        self.enable_hash_deduplication = QCheckBox()
        self.enable_hash_deduplication.setChecked(self.config.processing.enable_hash_deduplication)
        
        self.enable_auto_categorization = QCheckBox()
        self.enable_auto_categorization.setChecked(self.config.processing.enable_auto_categorization)
        
        layout.addRow("Конвертация 3D моделей:", self.enable_3d_conversion)
        layout.addRow("Дедупликация по хешу:", self.enable_hash_deduplication)
        layout.addRow("Автокатегоризация:", self.enable_auto_categorization)
        
        return widget
    
    def _create_gui_tab(self) -> QWidget:
        """Create GUI settings tab."""
        widget = QWidget()
        layout = QFormLayout(widget)
        
        self.theme_combo = QComboBox()
        self.theme_combo.addItems(["light", "dark", "system"])
        self.theme_combo.setCurrentText(self.config.general.gui_theme)
        
        self.language_combo = QComboBox()
        self.language_combo.addItems(["ru", "en"])
        self.language_combo.setCurrentText(self.config.general.gui_language)
        
        self.auto_refresh_spinbox = QSpinBox()
        self.auto_refresh_spinbox.setRange(1, 60)
        self.auto_refresh_spinbox.setValue(self.config.general.gui_auto_refresh_interval)
        
        layout.addRow("Тема:", self.theme_combo)
        layout.addRow("Язык:", self.language_combo)
        layout.addRow("Интервал обновления (сек):", self.auto_refresh_spinbox)
        
        return widget
    
    def save_configuration(self):
        """Save configuration."""
        # Implementation for saving configuration
        pass
    
    def reload_configuration(self):
        """Reload configuration."""
        # Implementation for reloading configuration
        pass


class VaultWatcherGUI(QMainWindow):
    """Main GUI window for Vault Watcher."""
    
    def __init__(self, config: Config):
        super().__init__()
        self.config = config
        self.logger = get_logger("VaultWatcherGUI")
        self.watcher_thread = None
        self.setup_ui()
        self.setup_menu()
        self.setup_toolbar()
        self.setup_status_bar()
        self.apply_theme()
    
    def setup_ui(self):
        """Setup the main UI."""
        self.setWindowTitle("Vault Watcher")
        self.setGeometry(100, 100, 1400, 900)
        
        # Central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # Main layout
        main_layout = QHBoxLayout(central_widget)
        
        # Create splitter
        splitter = QSplitter(Qt.Orientation.Horizontal)
        
        # Left panel - File tree
        self.file_tree = FileTreeWidget(self.config)
        splitter.addWidget(self.file_tree)
        
        # Right panel - Tabs
        right_panel = QTabWidget()
        
        # Status tab
        self.status_widget = StatusWidget(self.config)
        right_panel.addTab(self.status_widget, "Статус")
        
        # Configuration tab
        self.config_widget = ConfigurationWidget(self.config)
        right_panel.addTab(self.config_widget, "Настройки")
        
        # Log tab
        self.log_widget = LogWidget()
        right_panel.addTab(self.log_widget, "Логи")
        
        splitter.addWidget(right_panel)
        
        # Set splitter proportions
        splitter.setSizes([600, 800])
        
        main_layout.addWidget(splitter)
        
        # Refresh file tree
        self.file_tree.refresh_tree()
    
    def setup_menu(self):
        """Setup menu bar."""
        menubar = self.menuBar()
        
        # File menu
        file_menu = menubar.addMenu("Файл")
        
        open_vault_action = QAction("Открыть хранилище", self)
        open_vault_action.setShortcut("Ctrl+O")
        open_vault_action.triggered.connect(self.open_vault)
        file_menu.addAction(open_vault_action)
        
        file_menu.addSeparator()
        
        exit_action = QAction("Выход", self)
        exit_action.setShortcut("Ctrl+Q")
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)
        
        # Watcher menu
        watcher_menu = menubar.addMenu("Наблюдатель")
        
        start_action = QAction("Запустить", self)
        start_action.setShortcut("Ctrl+S")
        start_action.triggered.connect(self.start_watcher)
        watcher_menu.addAction(start_action)
        
        stop_action = QAction("Остановить", self)
        stop_action.setShortcut("Ctrl+X")
        stop_action.triggered.connect(self.stop_watcher)
        watcher_menu.addAction(stop_action)
        
        # Tools menu
        tools_menu = menubar.addMenu("Инструменты")
        
        refresh_action = QAction("Обновить дерево файлов", self)
        refresh_action.setShortcut("F5")
        refresh_action.triggered.connect(self.refresh_file_tree)
        tools_menu.addAction(refresh_action)
        
        # Help menu
        help_menu = menubar.addMenu("Помощь")
        
        about_action = QAction("О программе", self)
        about_action.triggered.connect(self.show_about)
        help_menu.addAction(about_action)
    
    def setup_toolbar(self):
        """Setup toolbar."""
        toolbar = self.addToolBar("Основная панель")
        
        # Start/Stop button
        self.start_stop_button = QPushButton("Запустить")
        self.start_stop_button.clicked.connect(self.toggle_watcher)
        toolbar.addWidget(self.start_stop_button)
        
        toolbar.addSeparator()
        
        # Refresh button
        refresh_button = QPushButton("Обновить")
        refresh_button.clicked.connect(self.refresh_file_tree)
        toolbar.addWidget(refresh_button)
    
    def setup_status_bar(self):
        """Setup status bar."""
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.status_bar.showMessage("Готов")
    
    def apply_theme(self):
        """Apply theme to the application."""
        if self.config.general.gui_theme == "dark":
            self.setStyleSheet("""
                QMainWindow {
                    background-color: #2b2b2b;
                    color: #ffffff;
                }
                QTreeWidget {
                    background-color: #3c3f41;
                    color: #ffffff;
                    border: 1px solid #555555;
                }
                QTextEdit {
                    background-color: #3c3f41;
                    color: #ffffff;
                    border: 1px solid #555555;
                }
                QTabWidget::pane {
                    border: 1px solid #555555;
                    background-color: #3c3f41;
                }
                QTabBar::tab {
                    background-color: #4c4c4c;
                    color: #ffffff;
                    padding: 8px 16px;
                }
                QTabBar::tab:selected {
                    background-color: #5c5c5c;
                }
            """)
    
    def open_vault(self):
        """Open vault directory."""
        directory = QFileDialog.getExistingDirectory(
            self, "Выберите папку хранилища", self.config.general.vault_path
        )
        if directory:
            self.config.general.vault_path = directory
            self.refresh_file_tree()
    
    def start_watcher(self):
        """Start the vault watcher."""
        if self.watcher_thread and self.watcher_thread.isRunning():
            return
        
        self.watcher_thread = VaultWatcherThread(self.config)
        self.watcher_thread.log_signal.connect(self.log_widget.add_log)
        self.watcher_thread.status_signal.connect(self.status_widget.update_status)
        self.watcher_thread.error_signal.connect(self.show_error)
        
        self.watcher_thread.start()
        self.start_stop_button.setText("Остановить")
        self.status_bar.showMessage("Наблюдатель запущен")
    
    def stop_watcher(self):
        """Stop the vault watcher."""
        if self.watcher_thread and self.watcher_thread.isRunning():
            self.watcher_thread.stop()
            self.watcher_thread.wait()
            self.start_stop_button.setText("Запустить")
            self.status_bar.showMessage("Наблюдатель остановлен")
    
    def toggle_watcher(self):
        """Toggle watcher start/stop."""
        if self.watcher_thread and self.watcher_thread.isRunning():
            self.stop_watcher()
        else:
            self.start_watcher()
    
    def refresh_file_tree(self):
        """Refresh the file tree."""
        self.file_tree.refresh_tree()
        self.status_bar.showMessage("Дерево файлов обновлено")
    
    def show_error(self, message: str):
        """Show error message."""
        QMessageBox.critical(self, "Ошибка", message)
    
    def show_about(self):
        """Show about dialog."""
        QMessageBox.about(
            self,
            "О программе",
            "Vault Watcher v0.1.0\n\n"
            "Система управления файлами с функционалом Obsidian\n"
            "Поддержка автоматической категоризации и конвертации 3D моделей"
        )
    
    def closeEvent(self, event):
        """Handle application close event."""
        self.stop_watcher()
        event.accept()


def main():
    """Main function for GUI application."""
    try:
        # Load configuration
        config = Config.from_default()
        
        # Create application
        app = QApplication(sys.argv)
        app.setApplicationName("Vault Watcher")
        app.setApplicationVersion("0.1.0")
        
        # Create and show main window
        window = VaultWatcherGUI(config)
        window.show()
        
        # Run application
        sys.exit(app.exec())
    
    except Exception as e:
        print(f"Error starting GUI: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()