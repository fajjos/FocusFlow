// DOM Elements
const startButton = document.getElementById('start-btn');
const resetButton = document.getElementById('reset-btn');
const timerDisplay = document.getElementById('timer-display');
const addTaskButton = document.getElementById('add-task-btn');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const themeToggle = document.getElementById('theme-toggle');
const githubLink = document.getElementById('github-link');
const focusToggleBtn = document.getElementById('focus-toggle-btn');
const dailyProgressBar = document.getElementById('daily-progress');
const dailyCountDisplay = document.getElementById('daily-count');

// Variables
let isTimerRunning = false;
let timeLeft = 25 * 60; // 25 minutes in seconds
let timer;
let totalTasks = 0;
let completedTasks = 0;
let pomodoroCount = 0;
let streakCount = 0;
let lastCompletedDate = null;
let longBreakInterval = 4; // Long break after 4 pomodoros
let isBreakTime = false;
let workDuration = 25; // default work duration in minutes
let breakDuration = 5; // default break duration in minutes
let isFocusModeEnabled = false;

// Basic Timer Functions
function startTimer() {
    if (!isTimerRunning) {
        isTimerRunning = true;
        startButton.textContent = 'Pause';
        timer = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) {
                clearInterval(timer);
                isTimerRunning = false;
                startButton.textContent = 'Start';
            }
        }, 1000);
    } else {
        clearInterval(timer);
        isTimerRunning = false;
        startButton.textContent = 'Start';
    }
}

function resetTimer() {
    clearInterval(timer);
    isTimerRunning = false;
    timeLeft = workDuration * 60; // Use workDuration instead of hard-coded 25
    updateTimerDisplay();
    startButton.textContent = 'Start';
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Task Management
function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText !== '') {
        totalTasks++;
        
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="task-content">
                <input type="checkbox" class="task-checkbox">
                <span class="task-text">${taskText}</span>
            </div>
            <button class="delete-task-btn">×</button>
        `;

        // Add checkbox event listener
        const checkbox = li.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                completedTasks++;
                li.classList.add('completed');
            } else {
                completedTasks--;
                li.classList.remove('completed');
            }
            updateProgress();
        });

        // Add delete button event listener
        const deleteBtn = li.querySelector('.delete-task-btn');
        deleteBtn.addEventListener('click', () => {
            if (li.classList.contains('completed')) {
                completedTasks--;
            }
            totalTasks--;
            li.remove();
            updateProgress();
        });

        taskList.appendChild(li);
        taskInput.value = '';
        updateProgress();
    }
}

function updateProgress() {
    dailyCountDisplay.textContent = `${completedTasks}/${totalTasks}`;
    const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    dailyProgressBar.style.width = `${progressPercentage}%`;
}

// Theme Toggle
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    themeToggle.textContent = newTheme === 'light' ? '🌙' : '☀️';
    localStorage.setItem('theme', newTheme);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Timer buttons
    startButton.addEventListener('click', startTimer);
    resetButton.addEventListener('click', resetTimer);

    // Task input
    addTaskButton.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // GitHub link
    githubLink.addEventListener('click', () => {
        window.open('https://github.com/fajjos', '_blank');
    });

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'light' ? '🌙' : '☀️';

    // Initial display update
    updateTimerDisplay();
    updateProgress();

    // Request notification permission
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }
    
    // Load saved progress
    loadProgress();
    
    // Add drag and drop for tasks
    new Sortable(taskList, {
        animation: 150,
        ghostClass: 'sortable-ghost'
    });

    // Initialize settings
    updateTimerDurations();
    loadSettings();
    
    // Initialize drag and drop
    initializeDragAndDrop();

    // Add focus mode button listener
    if (focusToggleBtn) {
        focusToggleBtn.addEventListener('click', toggleFocusMode);
        
        // Load saved focus mode state
        const savedFocusMode = localStorage.getItem('focusModeEnabled') === 'true';
        if (savedFocusMode) {
            toggleFocusMode();
        }
    }

    // Prevent double-tap zoom on mobile
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) { // Ctrl or Cmd key
        switch(e.key) {
            case 's':
                e.preventDefault();
                startTimer();
                break;
            case 'r':
                e.preventDefault();
                resetTimer();
                break;
            case 'n':
                e.preventDefault();
                taskInput.focus();
                break;
        }
    }
});

function updatePomodoroCount() {
    pomodoroCount++;
    document.getElementById('pomodoro-count').textContent = pomodoroCount;
    
    // Check for long break
    if (pomodoroCount % longBreakInterval === 0) {
        showNotification("Time for a long break! You've completed 4 pomodoros!");
        timeLeft = 15 * 60; // 15 minute long break
    } else {
        timeLeft = 5 * 60; // 5 minute short break
    }
    
    updateStreak();
    saveProgress();
}

function updateStreak() {
    const today = new Date().toLocaleDateString();
    
    if (lastCompletedDate !== today) {
        streakCount++;
        lastCompletedDate = today;
        document.getElementById('streak-count').textContent = streakCount;
    }
}

function showNotification(message) {
    if (Notification.permission === "granted") {
        new Notification("Pomodoro Timer", { body: message });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification("Pomodoro Timer", { body: message });
            }
        });
    }
}

function saveProgress() {
    const progress = {
        pomodoroCount,
        streakCount,
        lastCompletedDate,
        tasks: Array.from(taskList.children).map(li => ({
            text: li.querySelector('.task-text').textContent,
            completed: li.classList.contains('completed')
        }))
    };
    localStorage.setItem('pomodoroProgress', JSON.stringify(progress));
}

function loadProgress() {
    const savedProgress = localStorage.getItem('pomodoroProgress');
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        pomodoroCount = progress.pomodoroCount;
        streakCount = progress.streakCount;
        lastCompletedDate = progress.lastCompletedDate;
        
        document.getElementById('pomodoro-count').textContent = pomodoroCount;
        document.getElementById('streak-count').textContent = streakCount;
        
        // Restore saved tasks
        progress.tasks.forEach(task => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="task-content">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="task-text">${task.text}</span>
                </div>
                <button class="delete-task-btn">×</button>
            `;
            if (task.completed) {
                li.classList.add('completed');
                completedTasks++;
            }
            totalTasks++;
            taskList.appendChild(li);
            
            // Add event listeners to restored tasks
            addTaskEventListeners(li);
        });
        
        updateProgress();
    }
}

function addTaskEventListeners(li) {
    const checkbox = li.querySelector('.task-checkbox');
    const deleteBtn = li.querySelector('.delete-task-btn');
    
    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            completedTasks++;
            li.classList.add('completed');
        } else {
            completedTasks--;
            li.classList.remove('completed');
        }
        updateProgress();
        saveProgress();
    });
    
    deleteBtn.addEventListener('click', () => {
        if (li.classList.contains('completed')) {
            completedTasks--;
        }
        totalTasks--;
        li.remove();
        updateProgress();
        saveProgress();
    });
}

// Add this function to handle duration changes
function updateTimerDurations() {
    const workInput = document.getElementById('work-duration');
    const breakInput = document.getElementById('break-duration');
    
    workInput.addEventListener('change', () => {
        workDuration = parseInt(workInput.value);
        if (!isBreakTime) {
            timeLeft = workDuration * 60;
            updateTimerDisplay();
        }
        saveSettings();
    });
    
    breakInput.addEventListener('change', () => {
        breakDuration = parseInt(breakInput.value);
        if (isBreakTime) {
            timeLeft = breakDuration * 60;
            updateTimerDisplay();
        }
        saveSettings();
    });
}

// Add function to save settings
function saveSettings() {
    const settings = {
        workDuration,
        breakDuration
    };
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
}

// Add function to load settings
function loadSettings() {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        workDuration = settings.workDuration;
        breakDuration = settings.breakDuration;
        
        // Update input fields
        document.getElementById('work-duration').value = workDuration;
        document.getElementById('break-duration').value = breakDuration;
        
        // Update timer if it's not running
        if (!isTimerRunning) {
            timeLeft = workDuration * 60;
            updateTimerDisplay();
        }
    }
}

// Add Sortable.js for drag and drop functionality
function initializeDragAndDrop() {
    new Sortable(taskList, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: () => {
            saveProgress(); // Save the new order of tasks
        }
    });
}

// Add this function for focus mode toggle
function toggleFocusMode() {
    isFocusModeEnabled = !isFocusModeEnabled;
    const container = document.querySelector('.container');
    const focusBtn = document.getElementById('focus-toggle-btn');
    const nonEssentialElements = document.querySelectorAll('.quotes, .stats, .settings, .daily-goal');
    
    if (isFocusModeEnabled) {
        // Enable focus mode
        container.classList.add('focus-mode-active');
        focusBtn.textContent = '🎯 Disable Focus Mode';
        focusBtn.classList.add('active');
        
        // Hide non-essential elements
        nonEssentialElements.forEach(element => {
            element.style.display = 'none';
        });
        
        // Enlarge timer and tasks
        document.querySelector('.timer').classList.add('timer-focused');
        document.querySelector('.tasks').classList.add('tasks-focused');
    } else {
        // Disable focus mode
        container.classList.remove('focus-mode-active');
        focusBtn.textContent = '🎯 Enable Focus Mode';
        focusBtn.classList.remove('active');
        
        // Show all elements
        nonEssentialElements.forEach(element => {
            element.style.display = 'block';
        });
        
        // Reset timer and tasks size
        document.querySelector('.timer').classList.remove('timer-focused');
        document.querySelector('.tasks').classList.remove('tasks-focused');
    }
    
    // Save focus mode state
    localStorage.setItem('focusModeEnabled', isFocusModeEnabled);
}
