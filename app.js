// ========================================
// Store - localStorage 管理
// ========================================

class Store {
  static getTasks() {
    var saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : null;
  }

  static saveTasks(tasks) {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  static getLastResetDate() {
    return localStorage.getItem('lastResetDate');
  }

  static setLastResetDate(date) {
    localStorage.setItem('lastResetDate', date);
  }

  static getLog(date) {
    var saved = localStorage.getItem('log-' + date);
    return saved ? JSON.parse(saved) : null;
  }

  static saveLog(date, log) {
    localStorage.setItem('log-' + date, JSON.stringify(log));
  }

  static removeLog(date) {
    localStorage.removeItem('log-' + date);
  }

  static getAllLogs() {
    var logs = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key.startsWith('log-')) {
        logs.push(JSON.parse(localStorage.getItem(key)));
      }
    }
    return logs;
  }

}

// ========================================
// DateUtils - 日付ユーティリティ
// ========================================

class DateUtils {
  static getTodayDate() {
    var now = new Date();
    if (now.getHours() < 3) {
      var yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return this.formatDate(yesterday);
    }
    return this.formatDate(now);
  }

  static formatDate(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  static getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  static getWeekday(dateStr) {
    var date = new Date(dateStr + 'T12:00:00');
    var weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return weekdays[date.getDay()];
  }

  static parseDate(dateStr) {
    var parts = dateStr.split('-');
    return {
      year: parseInt(parts[0]),
      month: parseInt(parts[1]),
      day: parseInt(parts[2])
    };
  }

  static getFirstDayOfMonth(year, month) {
    return new Date(year, month - 1, 1).getDay();
  }
}

// ========================================
// HabitTracker - メインアプリケーション
// ========================================

class HabitTracker {
  constructor() {
    this.tasks = [];
    this.calendarYear = 0;
    this.calendarMonth = 0;
    this.selectedDate = null;
    this.celebratedToday = false;
    this.init();
  }

  init() {
    this.loadTasks();
    this.checkAndResetIfNeeded();
    this.renderSummary();
    this.renderTasks();
    this.updateProgress();
    this.renderStreak();
    this.setupEventListeners();
  }

  // ========================================
  // データ管理
  // ========================================

  loadTasks() {
    var savedTasks = Store.getTasks();
    if (savedTasks) {
      this.tasks = savedTasks;
    } else {
      this.tasks = [
        { id: this.generateId(), name: '英語動画', order: 0, done: false, memo: '' },
        { id: this.generateId(), name: '高速音読', order: 1, done: false, memo: '' },
        { id: this.generateId(), name: '数学ガール', order: 2, done: false, memo: '' },
        { id: this.generateId(), name: '筋トレ', order: 3, done: false, memo: '' }
      ];
      this.saveTasks();
    }
  }

  saveTasks() {
    Store.saveTasks(this.tasks);
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  checkAndResetIfNeeded() {
    var lastResetDate = Store.getLastResetDate();
    var todayDate = DateUtils.getTodayDate();

    if (lastResetDate !== todayDate) {
      if (lastResetDate) {
        this.saveLog(lastResetDate);
      }
      this.tasks.forEach(function(task) {
        task.done = false;
        task.memo = '';
      });
      this.saveTasks();
      Store.setLastResetDate(todayDate);
    }
  }

  saveLog(date) {
    var log = {
      date: date,
      entries: this.tasks.map(function(task) {
        return {
          taskId: task.id,
          taskName: task.name,
          done: task.done,
          memo: task.memo
        };
      })
    };
    Store.saveLog(date, log);
  }

  getSummary() {
    var tasks = this.tasks;
    var summary = {};
    tasks.forEach(function(task) {
      summary[task.id] = { name: task.name, count: 0 };
    });

    var allLogs = Store.getAllLogs();
    allLogs.forEach(function(log) {
      log.entries.forEach(function(entry) {
        if (entry.done && summary[entry.taskId]) {
          summary[entry.taskId].count++;
        }
      });
    });

    // 今日の未保存分も加算
    var today = DateUtils.getTodayDate();
    var todayLog = Store.getLog(today);
    if (!todayLog) {
      tasks.forEach(function(task) {
        if (task.done && summary[task.id]) {
          summary[task.id].count++;
        }
      });
    }

    return summary;
  }

  // ========================================
  // レンダリング
  // ========================================

  renderSummary() {
    var container = document.querySelector('.monthly-summary');
    var titleEl = container.querySelector('.summary-title');
    var itemsEl = container.querySelector('.summary-items');

    var summary = this.getSummary();

    titleEl.textContent = '達成サマリー';
    itemsEl.innerHTML = '';

    var sortedTasks = this.getSortedTasks();
    sortedTasks.forEach(function(task) {
      var data = summary[task.id];
      if (!data) return;

      var itemEl = document.createElement('div');
      itemEl.className = 'summary-item';

      var nameSpan = document.createElement('span');
      nameSpan.className = 'summary-item-name';
      nameSpan.textContent = data.name;

      var countSpan = document.createElement('span');
      countSpan.className = 'summary-item-count';
      countSpan.textContent = data.count + '日';

      itemEl.appendChild(nameSpan);
      itemEl.appendChild(countSpan);
      itemsEl.appendChild(itemEl);
    });
  }

  renderTasks() {
    var self = this;
    var taskList = document.getElementById('task-list');
    taskList.innerHTML = '';

    var sortedTasks = this.getSortedTasks();

    sortedTasks.forEach(function(task) {
      var taskEl = document.createElement('div');
      taskEl.className = task.done ? 'task-item done' : 'task-item';

      var headerEl = document.createElement('div');
      headerEl.className = 'task-header';

      var checkboxEl = document.createElement('div');
      checkboxEl.className = 'task-checkbox';

      var nameEl = document.createElement('div');
      nameEl.className = 'task-name';
      nameEl.textContent = task.name;

      headerEl.appendChild(checkboxEl);
      headerEl.appendChild(nameEl);

      headerEl.addEventListener('click', function() {
        self.toggleTask(task.id);
      });

      var memoEl = document.createElement('div');
      memoEl.className = 'task-memo';

      var memoInput = document.createElement('input');
      memoInput.type = 'text';
      memoInput.placeholder = 'メモ（任意）';
      memoInput.value = task.memo;

      memoInput.addEventListener('input', function(e) {
        self.updateTaskMemo(task.id, e.target.value);
      });

      memoInput.addEventListener('click', function(e) {
        e.stopPropagation();
      });

      memoEl.appendChild(memoInput);
      taskEl.appendChild(headerEl);
      taskEl.appendChild(memoEl);
      taskList.appendChild(taskEl);
    });
  }

  renderLog() {
    var self = this;
    var logContent = document.getElementById('log-content');
    logContent.innerHTML = '';

    var allLogs = Store.getAllLogs();
    allLogs.sort(function(a, b) { return b.date.localeCompare(a.date); });

    if (allLogs.length === 0) {
      var emptyEl = document.createElement('div');
      emptyEl.className = 'log-empty';
      emptyEl.textContent = 'まだログがありません';
      logContent.appendChild(emptyEl);
      return;
    }

    allLogs.forEach(function(log) {
      var dayEl = self.createLogDayElement(log);
      logContent.appendChild(dayEl);
    });
  }

  createLogDayElement(log) {
    var self = this;
    var parsed = DateUtils.parseDate(log.date);
    var weekday = DateUtils.getWeekday(log.date);

    var doneCount = log.entries.filter(function(e) { return e.done; }).length;
    var totalCount = log.entries.length;

    var dayEl = document.createElement('div');
    dayEl.className = 'log-day';

    var headerEl = document.createElement('div');
    headerEl.className = 'log-day-header';

    var dateSpan = document.createElement('span');
    dateSpan.className = 'log-day-date';
    dateSpan.textContent = parsed.month + '/' + parsed.day + '（' + weekday + '）';

    var rightEl = document.createElement('div');
    rightEl.className = 'log-day-right';

    var progressSpan = document.createElement('span');
    progressSpan.className = 'log-day-progress';
    progressSpan.textContent = doneCount + '/' + totalCount + ' 完了';

    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'log-delete-button';
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', function() {
      self.deleteLog(log.date);
    });

    rightEl.appendChild(progressSpan);
    rightEl.appendChild(deleteBtn);

    headerEl.appendChild(dateSpan);
    headerEl.appendChild(rightEl);
    dayEl.appendChild(headerEl);

    var tasksEl = document.createElement('div');
    tasksEl.className = 'log-day-tasks';

    log.entries.forEach(function(entry) {
      var taskEl = document.createElement('div');
      taskEl.className = 'log-task';

      var iconSpan = document.createElement('span');
      iconSpan.className = entry.done ? 'log-task-icon' : 'log-task-icon undone';
      iconSpan.textContent = entry.done ? '✓' : '✗';

      var contentEl = document.createElement('div');
      contentEl.className = 'log-task-content';

      var nameEl = document.createElement('div');
      nameEl.className = 'log-task-name';
      nameEl.textContent = entry.taskName;
      contentEl.appendChild(nameEl);

      if (entry.memo) {
        var memoEl = document.createElement('div');
        memoEl.className = 'log-task-memo';
        memoEl.textContent = entry.memo;
        contentEl.appendChild(memoEl);
      }

      taskEl.appendChild(iconSpan);
      taskEl.appendChild(contentEl);
      tasksEl.appendChild(taskEl);
    });

    dayEl.appendChild(tasksEl);
    return dayEl;
  }

  updateProgress() {
    var doneCount = this.tasks.filter(function(t) { return t.done; }).length;
    var totalCount = this.tasks.length;
    document.getElementById('progress-text').textContent = '今日 ' + doneCount + '/' + totalCount + ' 完了';
  }

  getSortedTasks() {
    return this.tasks.slice().sort(function(a, b) { return a.order - b.order; });
  }

  // ========================================
  // タスク操作
  // ========================================

  toggleTask(taskId) {
    var task = this.tasks.find(function(t) { return t.id === taskId; });
    if (!task) return;

    task.done = !task.done;
    this.saveTasks();
    this.saveLog(DateUtils.getTodayDate());
    this.renderTasks();
    this.updateProgress();
    this.renderSummary();
    this.renderStreak();
    this.checkAndCelebrate();
  }

  updateTaskMemo(taskId, memo) {
    var task = this.tasks.find(function(t) { return t.id === taskId; });
    if (!task) return;

    task.memo = memo;
    this.saveTasks();
    this.saveLog(DateUtils.getTodayDate());
  }

  addTask(name) {
    if (!name || !name.trim()) return;

    var maxOrder = this.tasks.length > 0
      ? Math.max.apply(null, this.tasks.map(function(t) { return t.order; }))
      : -1;

    this.tasks.push({
      id: this.generateId(),
      name: name.trim(),
      order: maxOrder + 1,
      done: false,
      memo: ''
    });
    this.saveTasks();
    this.renderTasks();
    this.renderSummary();
    this.updateProgress();
    this.renderTaskManager();
  }

  deleteTask(taskId) {
    this.tasks = this.tasks.filter(function(t) { return t.id !== taskId; });
    this.saveTasks();
    this.renderTasks();
    this.renderSummary();
    this.updateProgress();
    this.renderTaskManager();
  }

  moveTaskUp(taskId) {
    var sorted = this.getSortedTasks();
    var index = sorted.findIndex(function(t) { return t.id === taskId; });
    if (index <= 0) return;

    var temp = sorted[index].order;
    sorted[index].order = sorted[index - 1].order;
    sorted[index - 1].order = temp;

    this.saveTasks();
    this.renderTasks();
    this.renderSummary();
    this.renderTaskManager();
  }

  moveTaskDown(taskId) {
    var sorted = this.getSortedTasks();
    var index = sorted.findIndex(function(t) { return t.id === taskId; });
    if (index < 0 || index >= sorted.length - 1) return;

    var temp = sorted[index].order;
    sorted[index].order = sorted[index + 1].order;
    sorted[index + 1].order = temp;

    this.saveTasks();
    this.renderTasks();
    this.renderSummary();
    this.renderTaskManager();
  }

  // ========================================
  // 設定画面
  // ========================================

  renderTaskManager() {
    var self = this;
    var taskManager = document.getElementById('task-manager');
    taskManager.innerHTML = '';

    var sorted = this.getSortedTasks();

    sorted.forEach(function(task, index) {
      var itemEl = document.createElement('div');
      itemEl.className = 'task-manager-item';

      var nameEl = document.createElement('span');
      nameEl.className = 'task-manager-name';
      nameEl.textContent = task.name;

      var controlsEl = document.createElement('div');
      controlsEl.className = 'task-controls';

      var upBtn = document.createElement('button');
      upBtn.className = 'move-button';
      upBtn.textContent = '↑';
      upBtn.disabled = index === 0;
      upBtn.addEventListener('click', function() { self.moveTaskUp(task.id); });

      var downBtn = document.createElement('button');
      downBtn.className = 'move-button';
      downBtn.textContent = '↓';
      downBtn.disabled = index === sorted.length - 1;
      downBtn.addEventListener('click', function() { self.moveTaskDown(task.id); });

      controlsEl.appendChild(upBtn);
      controlsEl.appendChild(downBtn);

      var deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-task-button';
      deleteBtn.textContent = '×';
      deleteBtn.addEventListener('click', function() {
        if (confirm('「' + task.name + '」を削除しますか？')) {
          self.deleteTask(task.id);
        }
      });

      itemEl.appendChild(nameEl);
      itemEl.appendChild(controlsEl);
      itemEl.appendChild(deleteBtn);
      taskManager.appendChild(itemEl);
    });
  }

  exportData() {
    var data = {
      tasks: this.tasks,
      logs: Store.getAllLogs()
    };

    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'habit-tracker-' + DateUtils.formatDate(new Date()) + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  deleteLog(dateStr) {
    var parsed = DateUtils.parseDate(dateStr);
    if (!confirm(parsed.month + '/' + parsed.day + ' のログを削除しますか？')) return;
    Store.removeLog(dateStr);
    this.renderSummary();
    this.renderCalendar();
    this.renderLog();
  }

  // ========================================
  // カレンダー（ログタブ内インライン）
  // ========================================

  initCalendar() {
    var todayParts = DateUtils.parseDate(DateUtils.getTodayDate());
    this.calendarYear = todayParts.year;
    this.calendarMonth = todayParts.month;
    this.selectedDate = null;
    document.getElementById('day-edit-inline').style.display = 'none';
    this.renderCalendar();
  }

  renderCalendar() {
    var self = this;
    var year = this.calendarYear;
    var month = this.calendarMonth;
    var today = DateUtils.getTodayDate();

    document.getElementById('calendar-title').textContent = year + '年' + month + '月';

    var grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    // 曜日ヘッダー
    var weekdaysEl = document.createElement('div');
    weekdaysEl.className = 'calendar-weekdays';
    var weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    weekdays.forEach(function(wd) {
      var wdEl = document.createElement('div');
      wdEl.className = 'calendar-weekday';
      wdEl.textContent = wd;
      weekdaysEl.appendChild(wdEl);
    });
    grid.appendChild(weekdaysEl);

    // 日付グリッド
    var daysEl = document.createElement('div');
    daysEl.className = 'calendar-days';

    var firstDay = DateUtils.getFirstDayOfMonth(year, month);
    var daysInMonth = DateUtils.getDaysInMonth(year, month);

    // 空セル
    for (var i = 0; i < firstDay; i++) {
      var emptyEl = document.createElement('button');
      emptyEl.className = 'calendar-day empty';
      daysEl.appendChild(emptyEl);
    }

    // 日付セル
    for (var day = 1; day <= daysInMonth; day++) {
      var dateStr = year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      var dayBtn = document.createElement('button');
      dayBtn.className = 'calendar-day';
      dayBtn.textContent = day;

      var log = Store.getLog(dateStr);
      if (log) {
        var hasDone = log.entries.some(function(e) { return e.done; });
        if (hasDone) {
          dayBtn.classList.add('has-log');
        }
      }

      if (dateStr === today) {
        dayBtn.classList.add('today');
      }

      if (dateStr === self.selectedDate) {
        dayBtn.classList.add('selected');
      }

      if (dateStr > today) {
        dayBtn.classList.add('future');
      } else {
        (function(ds) {
          dayBtn.addEventListener('click', function() {
            self.openDayEdit(ds);
          });
        })(dateStr);
      }

      daysEl.appendChild(dayBtn);
    }

    grid.appendChild(daysEl);
  }

  changeCalendarMonth(delta) {
    this.calendarMonth += delta;
    if (this.calendarMonth > 12) {
      this.calendarMonth = 1;
      this.calendarYear++;
    } else if (this.calendarMonth < 1) {
      this.calendarMonth = 12;
      this.calendarYear--;
    }
    this.closeDayEdit();
    this.renderCalendar();
  }

  // ========================================
  // 日付編集（インラインパネル）
  // ========================================

  openDayEdit(dateStr) {
    var self = this;
    this.selectedDate = dateStr;

    var parsed = DateUtils.parseDate(dateStr);
    var weekday = DateUtils.getWeekday(dateStr);

    document.getElementById('day-edit-title').textContent =
      parsed.month + '/' + parsed.day + '（' + weekday + '）';

    var tasksEl = document.getElementById('day-edit-tasks');
    tasksEl.innerHTML = '';

    // 既存ログを取得、なければ空のエントリーを作る
    var log = Store.getLog(dateStr);
    var entries;
    if (log) {
      entries = log.entries;
    } else {
      entries = this.tasks.map(function(task) {
        return {
          taskId: task.id,
          taskName: task.name,
          done: false,
          memo: ''
        };
      });
    }

    entries.forEach(function(entry) {
      var taskEl = document.createElement('div');
      taskEl.className = entry.done ? 'day-edit-task done' : 'day-edit-task';

      var checkboxEl = document.createElement('div');
      checkboxEl.className = 'day-edit-checkbox';

      var nameEl = document.createElement('span');
      nameEl.className = 'day-edit-name';
      nameEl.textContent = entry.taskName;

      taskEl.appendChild(checkboxEl);
      taskEl.appendChild(nameEl);

      taskEl.addEventListener('click', function() {
        entry.done = !entry.done;
        taskEl.className = entry.done ? 'day-edit-task done' : 'day-edit-task';

        // 完了タスクが1つもなければログを削除、あれば保存
        var hasDone = entries.some(function(e) { return e.done; });
        if (hasDone) {
          Store.saveLog(dateStr, { date: dateStr, entries: entries });
        } else {
          Store.removeLog(dateStr);
        }

        self.renderSummary();
        self.renderCalendar();
        self.renderLog();
      });

      tasksEl.appendChild(taskEl);
    });

    var panel = document.getElementById('day-edit-inline');
    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    this.renderCalendar();
  }

  closeDayEdit() {
    this.selectedDate = null;
    document.getElementById('day-edit-inline').style.display = 'none';
    this.renderCalendar();
  }

  // ========================================
  // ご褒美システム
  // ========================================

  calculateStreak() {
    var self = this;
    var today = DateUtils.getTodayDate();

    // 今日の全完了チェック（保存済みログ or 現在のタスク状態）
    var todayLog = Store.getLog(today);
    var todayAllDone;
    if (todayLog) {
      todayAllDone = todayLog.entries.length > 0 && todayLog.entries.every(function(e) { return e.done; });
    } else {
      todayAllDone = self.tasks.length > 0 && self.tasks.every(function(t) { return t.done; });
    }

    var streak = 0;
    var checkDate = new Date(today + 'T12:00:00');

    if (todayAllDone) {
      streak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // 今日未達成なら昨日から遡る
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // 過去ログを遡ってストリーク計算
    while (true) {
      var dateStr = DateUtils.formatDate(checkDate);
      var log = Store.getLog(dateStr);
      if (!log || log.entries.length === 0) break;
      var allDone = log.entries.every(function(e) { return e.done; });
      if (!allDone) break;
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  }

  renderStreak() {
    var streakEl = document.getElementById('streak-display');
    var streak = this.calculateStreak();

    if (streak === 0) {
      streakEl.style.display = 'none';
      return;
    }

    var emoji, label;
    if (streak >= 30) {
      emoji = '🏆';
      label = streak + '日連続！伝説！';
    } else if (streak >= 14) {
      emoji = '💎';
      label = streak + '日連続！本物だ！';
    } else if (streak >= 7) {
      emoji = '⭐';
      label = streak + '日連続！週間完璧！';
    } else if (streak >= 3) {
      emoji = '🔥';
      label = streak + '日連続達成中！';
    } else {
      emoji = '✨';
      label = streak + '日連続達成中！';
    }

    streakEl.style.display = 'flex';
    streakEl.innerHTML = '<span class="streak-emoji">' + emoji + '</span><span class="streak-text">' + label + '</span>';
  }

  checkAndCelebrate() {
    var allDone = this.tasks.length > 0 && this.tasks.every(function(t) { return t.done; });
    if (allDone && !this.celebratedToday) {
      this.celebratedToday = true;
      this.showCelebration();
    }
    if (!allDone) {
      this.celebratedToday = false;
    }
  }

  showCelebration() {
    this.fireConfetti();
    this.showToast('全部達成！🎉 最高！');
  }

  fireConfetti() {
    var container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    var colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bdb', '#ff9f43'];
    var shapes = ['square', 'circle'];

    for (var i = 0; i < 60; i++) {
      (function(idx) {
        var particle = document.createElement('div');
        var shape = shapes[Math.floor(Math.random() * shapes.length)];
        particle.className = 'confetti-particle ' + shape;
        particle.style.left = (Math.random() * 100) + 'vw';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.animationDelay = (Math.random() * 0.6) + 's';
        particle.style.animationDuration = (Math.random() * 1.5 + 1.5) + 's';
        particle.style.width = (Math.random() * 8 + 6) + 'px';
        particle.style.height = (Math.random() * 8 + 6) + 'px';
        container.appendChild(particle);
      })(i);
    }

    setTimeout(function() {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }, 3500);
  }

  showToast(message) {
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(function() {
      toast.classList.add('toast-show');
    }, 10);

    setTimeout(function() {
      toast.classList.remove('toast-show');
      setTimeout(function() {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 400);
    }, 2800);
  }

  // ========================================
  // イベントリスナー
  // ========================================

  setupEventListeners() {
    var self = this;

    // タブ切り替え
    document.querySelectorAll('.tab-button').forEach(function(btn) {
      btn.addEventListener('click', function() {
        self.switchTab(btn.dataset.tab);
      });
    });

    // 設定
    document.getElementById('settings-button').addEventListener('click', function() {
      self.openSettings();
    });

    document.getElementById('close-settings').addEventListener('click', function() {
      self.closeSettings();
    });

    document.getElementById('settings-modal').addEventListener('click', function(e) {
      if (e.target.id === 'settings-modal') {
        self.closeSettings();
      }
    });

    // タスク追加
    document.getElementById('add-task-form').addEventListener('submit', function(e) {
      e.preventDefault();
      var input = document.getElementById('add-task-input');
      var name = input.value.trim();
      if (name) {
        self.addTask(name);
        input.value = '';
      }
    });

    // エクスポート
    document.getElementById('export-button').addEventListener('click', function() {
      self.exportData();
    });

    // カレンダー月移動
    document.getElementById('calendar-prev').addEventListener('click', function() {
      self.changeCalendarMonth(-1);
    });

    document.getElementById('calendar-next').addEventListener('click', function() {
      self.changeCalendarMonth(1);
    });

    // 日付編集パネルを閉じる
    document.getElementById('day-edit-close').addEventListener('click', function() {
      self.closeDayEdit();
    });
  }

  switchTab(tab) {
    document.querySelectorAll('.tab-button').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    document.querySelectorAll('.tab-content').forEach(function(content) {
      content.classList.toggle('active', content.id === tab + '-tab');
    });

    if (tab === 'log') {
      this.initCalendar();
      this.renderLog();
    }
  }

  openSettings() {
    this.renderTaskManager();
    document.getElementById('settings-modal').classList.add('active');
  }

  closeSettings() {
    document.getElementById('settings-modal').classList.remove('active');
  }
}

// ========================================
// アプリ起動
// ========================================

var app = new HabitTracker();

// Service Worker 登録
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./sw.js')
      .then(function(registration) {
        console.log('Service Worker registered:', registration);
      })
      .catch(function(error) {
        console.log('Service Worker registration failed:', error);
      });
  });
}
