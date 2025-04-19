// DOM Elements
const taskInput = document.getElementById('task-input');
const prioritySelect = document.getElementById('priority');
const taskDate = document.getElementById('task-date');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const filterBtns = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('search-input');
const totalTasksEl = document.getElementById('total-tasks');
const completedTasksEl = document.getElementById('completed-tasks');
const pendingTasksEl = document.getElementById('pending-tasks');
const currentDateEl = document.getElementById('current-date');
const currentTimeEl = document.getElementById('current-time');
const calendarEl = document.getElementById('calendar');
const currentMonthEl = document.getElementById('current-month');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');

// Global Variables
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let currentSearch = '';
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Initialize App
function init() {
    updateDateTime();
    setInterval(updateDateTime, 60000); // Update time every minute
    
    renderTaskList();
    renderCalendar();
    
    // Set today's date as default
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    taskDate.value = formattedDate;
    
    // Load tasks from localStorage
    loadTasks();
}

// Update current date and time
function updateDateTime() {
    const now = new Date();
    
    // Format date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = now.toLocaleDateString('id-ID', options);
    
    // Format time
    currentTimeEl.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

// Add New Task
function addTask() {
    const title = taskInput.value.trim();
    const priority = prioritySelect.value;
    const dueDate = taskDate.value;
    
    if (!title) {
        alert('Silakan masukkan judul tugas');
        return;
    }
    
    const newTask = {
        id: Date.now(),
        title,
        priority,
        dueDate,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.unshift(newTask);
    saveTasks();
    renderTaskList();
    renderCalendar();
    
    // Reset input
    taskInput.value = '';
    taskInput.focus();
    prioritySelect.value = 'medium';
    
    // Set today's date as default for next task
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    taskDate.value = formattedDate;
}

// Render Task List
function renderTaskList() {
    // Filter tasks based on current filter and search
    let filteredTasks = [...tasks];
    
    // Apply search filter
    if (currentSearch) {
        filteredTasks = filteredTasks.filter(task => 
            task.title.toLowerCase().includes(currentSearch.toLowerCase())
        );
    }
    
    // Apply date filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 6);
    
    switch (currentFilter) {
        case 'today':
            filteredTasks = filteredTasks.filter(task => {
                const taskDate = new Date(task.dueDate);
                return taskDate.toDateString() === today.toDateString();
            });
            break;
        case 'week':
            filteredTasks = filteredTasks.filter(task => {
                const taskDate = new Date(task.dueDate);
                return taskDate >= today && taskDate <= endOfWeek;
            });
            break;
        // 'all' filter - no additional filtering needed
    }
    
    // Update stats
    updateStats(filteredTasks);
    
    // Render tasks
    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <p>Tidak ada tugas yang ditemukan</p>
            </div>
        `;
        return;
    }
    
    taskList.innerHTML = '';
    
    filteredTasks.forEach(task => {
        const taskDate = new Date(task.dueDate);
        const formattedDate = taskDate.toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'short' 
        });
        
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.priority}-priority ${task.completed ? 'completed' : ''}`;
        taskItem.dataset.id = task.id;
        
        taskItem.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <div class="task-title ${task.completed ? 'completed' : ''}">${task.title}</div>
                <div class="task-meta">
                    <span class="task-priority">${getPriorityLabel(task.priority)}</span>
                    <span class="task-date">
                        <i class="far fa-calendar-alt"></i>
                        ${formattedDate}
                    </span>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-btn edit" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-btn delete" title="Hapus">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        
        taskList.appendChild(taskItem);
    });
    
    // Add event listeners to new elements
    addTaskEventListeners();
}

// Get priority label
function getPriorityLabel(priority) {
    const labels = {
        'low': 'Prioritas Rendah',
        'medium': 'Prioritas Sedang',
        'high': 'Prioritas Tinggi',
        'urgent': 'Sangat Urgen'
    };
    return labels[priority];
}

// Update task statistics
function updateStats(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    
    totalTasksEl.textContent = total;
    completedTasksEl.textContent = completed;
    pendingTasksEl.textContent = pending;
}

// Add event listeners to task elements
function addTaskEventListeners() {
    // Checkbox - Toggle completed status
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const taskId = parseInt(this.closest('.task-item').dataset.id);
            const task = tasks.find(t => t.id === taskId);
            
            if (task) {
                task.completed = this.checked;
                saveTasks();
                renderTaskList();
                renderCalendar();
            }
        });
    });
    
    // Delete button
    document.querySelectorAll('.task-btn.delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const taskId = parseInt(this.closest('.task-item').dataset.id);
            
            if (confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
                tasks = tasks.filter(task => task.id !== taskId);
                saveTasks();
                renderTaskList();
                renderCalendar();
            }
        });
    });
    
    // Edit button
    document.querySelectorAll('.task-btn.edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const taskId = parseInt(this.closest('.task-item').dataset.id);
            const task = tasks.find(t => t.id === taskId);
            
            if (task) {
                taskInput.value = task.title;
                prioritySelect.value = task.priority;
                taskDate.value = task.dueDate;
                
                // Remove the task
                tasks = tasks.filter(t => t.id !== taskId);
                saveTasks();
                renderTaskList();
                renderCalendar();
                
                taskInput.focus();
            }
        });
    });
}

// Render Calendar
function renderCalendar() {
    // Clear calendar
    calendarEl.innerHTML = '';
    
    // Create day headers
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendarEl.appendChild(dayHeader);
    });
    
    // Get first day of month and total days
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    
    // Get tasks for this month
    const monthTasks = tasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        return taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear;
    });
    
    // Create calendar days
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarEl.appendChild(emptyDay);
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        // Highlight today
        if (date.toDateString() === today.toDateString() && 
            currentMonth === today.getMonth() && 
            currentYear === today.getFullYear()) {
            dayElement.classList.add('active');
        }
        
        // Check if day has tasks
        const hasTasks = monthTasks.some(task => {
            const taskDate = new Date(task.dueDate);
            return taskDate.getDate() === day;
        });
        
        if (hasTasks) {
            dayElement.classList.add('has-tasks');
        }
        
        dayElement.innerHTML = `
            <span class="calendar-day-number">${day}</span>
        `;
        
        dayElement.addEventListener('click', () => {
            // Filter tasks for this date
            const selectedDate = new Date(currentYear, currentMonth, day);
            const formattedDate = selectedDate.toISOString().split('T')[0];
            taskDate.value = formattedDate;
            
            // Highlight selected day
            document.querySelectorAll('.calendar-day').forEach(el => {
                el.classList.remove('active');
            });
            dayElement.classList.add('active');
            
            // Filter tasks to show only for this date
            currentFilter = 'all'; // Reset filter
            filterBtns.forEach(btn => {
                if (btn.dataset.filter === 'all') {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            // Set search to empty to show all tasks for this date
            currentSearch = '';
            searchInput.value = '';
            
            renderTaskList();
        });
        
        calendarEl.appendChild(dayElement);
    }
    
    // Update month display
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                       'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    currentMonthEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;
}

// Change month
function changeMonth(change) {
    currentMonth += change;
    
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    
    renderCalendar();
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Load tasks from localStorage
function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        renderTaskList();
    }
}

// Event Listeners
addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTaskList();
    });
});

searchInput.addEventListener('input', () => {
    currentSearch = searchInput.value;
    renderTaskList();
});

prevMonthBtn.addEventListener('click', () => changeMonth(-1));
nextMonthBtn.addEventListener('click', () => changeMonth(1));

// Initialize the app
init();