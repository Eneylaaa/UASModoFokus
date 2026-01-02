// ======================================================
// TIMER VARIABLES
// ======================================================
let isRunning = false;
let timerDuration = 25 * 60;
let timerRemaining = timerDuration;
let intervalId = null;

let defaultFocusMinutes = 25; 

let currentTask = null;
let currentTaskElement = null;

// ======================================================
// ELEMENT REFERENCES
// ======================================================
const focusTimer = document.getElementById("focus-timer");
const progressFill = document.getElementById("focus-progress-fill");
const soundToggle = document.getElementById("sound-toggle");

const playPauseBtn = document.getElementById("btn-play-pause");
const endBtn = document.getElementById("btn-stop-focus");

const viewAdd = document.getElementById("view-add-task");
const btnShowAdd = document.getElementById("btn-show-add");
const btnCancelAdd = document.getElementById("btn-cancel-add");

const addTaskForm = document.getElementById("add-task-form");
const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");

const bottomNav = document.querySelectorAll(".nav-item");
const allViews = document.querySelectorAll(".view");

const historyList = document.getElementById("history-list");

const btnSaveSettings = document.getElementById("btn-save-settings");
const inputDefaultFocusTime = document.getElementById("default-focus-time");

// ======================================================
// CHARACTER COUNTER & VALIDATION FOR TASK NAME (40 chars)
// ======================================================
function setupTaskNameValidation() {
  const taskNameInput = document.getElementById('task-name');
  const charCounter = document.getElementById('task-name-counter');
  const charCountSpan = document.getElementById('char-count');
  
  if (!taskNameInput || !charCounter || !charCountSpan) return;
  
  // Fungsi untuk update counter
  function updateCharCounter() {
    const currentLength = this.value.length;
    charCountSpan.textContent = currentLength;
    
    // Update styling berdasarkan jumlah karakter
    if (currentLength >= 38) {
      charCounter.classList.add('danger');
      charCounter.classList.remove('warning');
      taskNameInput.classList.add('danger-border');
      taskNameInput.classList.remove('warning-border');
    } else if (currentLength >= 35) {
      charCounter.classList.add('warning');
      charCounter.classList.remove('danger');
      taskNameInput.classList.add('warning-border');
      taskNameInput.classList.remove('danger-border');
    } else {
      charCounter.classList.remove('warning', 'danger');
      taskNameInput.classList.remove('warning-border', 'danger-border');
    }
  }
  
  // Event listeners
  taskNameInput.addEventListener('input', updateCharCounter);
  taskNameInput.addEventListener('focus', updateCharCounter);
  
  // Reset saat form dibatalkan
  btnCancelAdd.addEventListener('click', function() {
    setTimeout(() => {
      charCountSpan.textContent = "0";
      charCounter.classList.remove('warning', 'danger');
      taskNameInput.classList.remove('warning-border', 'danger-border');
    }, 100);
  });
  
  // Reset saat modal ditutup
  document.querySelector('.modal-bg')?.addEventListener('click', function() {
    setTimeout(() => {
      charCountSpan.textContent = "0";
      charCounter.classList.remove('warning', 'danger');
      taskNameInput.classList.remove('warning-border', 'danger-border');
    }, 100);
  });
}

// ======================================================
// HELPERS
// ======================================================
function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function updateTimerUI() {
  focusTimer.textContent = formatTime(timerRemaining);
  progressFill.style.width = `${100 * (timerDuration - timerRemaining) / timerDuration}%`;
}

function formatIndonesianDate(date) {
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
}

function formatTimeWithDot(date) {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}.${minutes}`;
}

// ======================================================
// NOTIFICATION SOUND SYSTEM - MARIMBA BERNADA
// ======================================================
function playMarimbaSound() {
  const soundSetting = localStorage.getItem("notification_sound") || "on";
  
  if (soundSetting === "off") {
    console.log("Suara notifikasi dimatikan");
    return;
  }
  
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    
    const notes = [
      { time: 0.0, freq: 523.25, duration: 0.35 },
      { time: 0.12, freq: 659.25, duration: 0.35 },
      { time: 0.24, freq: 783.99, duration: 0.35 },
      { time: 0.36, freq: 1046.50, duration: 0.45 }
    ];
    
    notes.forEach((note, index) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode).connect(context.destination);
      oscillator.frequency.value = note.freq;
      oscillator.type = 'sine';
      
      const startTime = context.currentTime + note.time;
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + note.duration);
    });
    
    console.log("🎵 Nada Marimba (C-E-G-C) dimainkan - Harmoni C Mayor");
    
  } catch (error) {
    console.log("Gagal memutar marimba dengan Web Audio API:", error);
    playFallbackMelody();
  }
}

function playFallbackMelody() {
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    
    const notes = [
      { time: 0.0, freq: 523.25, duration: 0.25 },
      { time: 0.3, freq: 783.99, duration: 0.35 }
    ];
    
    notes.forEach(note => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode).connect(context.destination);
      oscillator.frequency.value = note.freq;
      oscillator.type = 'sine';
      
      const startTime = context.currentTime + note.time;
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.18, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + note.duration);
    });
    
    console.log("🎶 Melodi fallback (C-G) dimainkan");
  } catch (error) {
    console.log("❌ Semua metode audio gagal");
  }
}

function playNotificationSound() {
  playMarimbaSound();
}

// ======================================================
// BROWSER NOTIFICATION (OPSIONAL)
// ======================================================
function showBrowserNotification(title, message) {
  if (!("Notification" in window)) return;
  
  if (Notification.permission === "granted") {
    new Notification(title, { 
      body: message, 
      icon: "assets/icon-192.png",
      silent: true
    });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        new Notification(title, { 
          body: message, 
          icon: "assets/icon-192.png",
          silent: true
        });
      }
    });
  }
}

// ======================================================
// TIMER LOGIC DENGAN NOTIFIKASI BERNADA
// ======================================================
function startTimer() {
  clearInterval(intervalId);

  intervalId = setInterval(() => {
    if (timerRemaining > 0) {
      timerRemaining--;
      updateTimerUI();
      
      if (timerRemaining === 5) {
        console.log("⏳ 5 detik lagi!");
      }
    } else {
      clearInterval(intervalId);
      isRunning = false;
      playPauseBtn.querySelector("img").src = "assets/play.svg";

      playNotificationSound();
      showBrowserNotification("ModoFokus", "Waktu fokus telah selesai! 🎉");
      
      if (currentTask) {
        moveTaskToHistory(currentTask, currentTaskElement);
        currentTask = null;
        currentTaskElement = null;
      }

      resetTimer();
    }
  }, 1000);

  isRunning = true;
  playPauseBtn.querySelector("img").src = "assets/pause.svg";
}

function pauseTimer() {
  clearInterval(intervalId);
  isRunning = false;
  playPauseBtn.querySelector("img").src = "assets/play.svg";
}

function resetTimer(newMinutes = null) {
  pauseTimer();
  timerDuration = (newMinutes ?? defaultFocusMinutes) * 60;
  timerRemaining = timerDuration;
  updateTimerUI();
}

// ======================================================
// MOVE TASK TO HISTORY
// ======================================================
function moveTaskToHistory(task, element) {
  if (element) element.remove();

  const now = new Date();
  const endTime = formatTimeWithDot(now);
  const endDate = formatIndonesianDate(now);

  const historyItem = document.createElement("div");
  historyItem.className = "app-card history-style";
  
  historyItem.innerHTML = `
    <div class="task-content">
      <h3>${task.name}</h3>
      <div class="history-details">
        <div class="history-detail-row">
          <span class="history-label">Durasi:</span>
          <span class="history-value history-duration">${task.duration} menit</span>
        </div>
        <div class="history-detail-row">
          <span class="history-label">Selesai:</span>
          <div class="history-value">
            <span class="history-time-complete">
              <span class="history-time">${endTime}</span>
              <span class="history-separator">—</span>
              <span class="history-date">${endDate}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  `;

  historyList.prepend(historyItem);

  if (taskList.children.length === 0) {
    emptyState.style.display = "block";
  }
  
  markTaskAsCompleted(task);
  saveHistory();
}

// ======================================================
// MARK TASK AS COMPLETED IN STORAGE
// ======================================================
function markTaskAsCompleted(completedTask) {
  const savedTasks = JSON.parse(localStorage.getItem("focus_tasks")) || [];
  
  const updatedTasks = savedTasks.map(task => {
    if (task.name === completedTask.name && 
        task.duration === completedTask.duration) {
      return {
        ...task,
        completed: true,
        completedAt: new Date().toISOString()
      };
    }
    return task;
  });
  
  localStorage.setItem("focus_tasks", JSON.stringify(updatedTasks));
}

// ======================================================
// CREATE HISTORY ITEM ELEMENT
// ======================================================
function createHistoryElement(historyData) {
  const historyItem = document.createElement("div");
  historyItem.className = "app-card history-style";
  
  let endTime = "00.00";
  let endDate = formatIndonesianDate(new Date());
  
  if (historyData.time) {
    if (historyData.time.includes(":")) {
      endTime = historyData.time.replace(":", ".");
    } else {
      endTime = historyData.time;
    }
  }
  
  if (historyData.date) {
    endDate = historyData.date;
  } else if (historyData.timestamp) {
    endDate = formatIndonesianDate(new Date(historyData.timestamp));
  }
  
  historyItem.innerHTML = `
    <div class="task-content">
      <h3>${historyData.name}</h3>
      <div class="history-details">
        <div class="history-detail-row">
          <span class="history-label">Durasi:</span>
          <span class="history-value history-duration">${historyData.duration} menit</span>
        </div>
        <div class="history-detail-row">
          <span class="history-label">Selesai:</span>
          <div class="history-value">
            <span class="history-time-complete">
              <span class="history-time">${endTime}</span>
              <span class="history-separator">—</span>
              <span class="history-date">${endDate}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
  
  return historyItem;
}

// ======================================================
// TASK MANAGEMENT - DENGAN PROTEKSI DOUBLE CLICK
// ======================================================
function createTaskElement(task) {
  const item = document.createElement("div");
  item.className = "task-item app-card";
  item.dataset.duration = task.duration;
  item.dataset.taskRunning = "false";

  item.innerHTML = `
    <div class="task-content">
      <h3>${task.name}</h3>
      <p>Durasi: ${task.duration} menit</p>
      ${task.note ? `<p class="task-note">${task.note}</p>` : ""}
      <div class="task-text-actions">
        <span class="text-edit">Edit</span>
        <span class="text-delete">Hapus</span>
      </div>
    </div>
  `;

  const startTaskHandler = () => {
    // CEK: Jika timer sedang berjalan DI TASK INI, jangan lakukan apa-apa
    if (item.dataset.taskRunning === "true") {
      console.log("Timer sudah berjalan, tidak direset");
      return;
    }
    
    // Hentikan timer di task lain jika ada
    document.querySelectorAll(".task-item[data-task-running='true']").forEach(t => {
      t.dataset.taskRunning = "false";
      t.classList.remove("active-task");
    });
    
    document.querySelectorAll(".task-item").forEach(t => t.classList.remove("active-task"));
    item.classList.add("active-task");
    
    currentTask = task;
    currentTaskElement = item;
    resetTimer(task.duration);
    startTimer();
    
    item.dataset.taskRunning = "true";
  };

  item.addEventListener("click", (e) => {
    if (e.target.classList.contains('text-edit') || 
        e.target.classList.contains('text-delete') ||
        e.target.classList.contains('task-text-actions')) {
      return;
    }
    
    // Jangan reset jika timer sedang berjalan
    if (isRunning && currentTaskElement === item) {
      console.log("Timer sedang berjalan di task ini, klik diabaikan");
      return;
    }
    
    startTaskHandler();
  });

  item.querySelector('.text-edit').addEventListener("click", (e) => {
    e.stopPropagation();
    editTask(item, task);
  });

  item.querySelector('.text-delete').addEventListener("click", (e) => {
    e.stopPropagation();
    deleteTask(item, task);
  });

  return item;
}

let editModeActive = false;
let taskBeingEdited = null;

function editTask(taskElement, task) {
  editModeActive = true;
  taskBeingEdited = { element: taskElement, data: task };
  
  document.getElementById("task-name").value = task.name;
  document.getElementById("task-duration").value = task.duration;
  document.getElementById("task-note").value = task.note || "";
  
  // UPDATE COUNTER SAAT EDIT MODE
  setTimeout(() => {
    const currentLength = task.name.length;
    const charCountSpan = document.getElementById('char-count');
    const charCounter = document.getElementById('task-name-counter');
    const taskNameInput = document.getElementById('task-name');
    
    if (charCountSpan) charCountSpan.textContent = currentLength;
    
    if (currentLength >= 38) {
      if (charCounter) charCounter.classList.add('danger');
      if (taskNameInput) taskNameInput.classList.add('danger-border');
    } else if (currentLength >= 35) {
      if (charCounter) charCounter.classList.add('warning');
      if (taskNameInput) taskNameInput.classList.add('warning-border');
    }
  }, 100);
  
  viewAdd.classList.add("active");

  const originalSubmitHandler = normalSubmitHandler;
  
  const editSubmitHandler = (e) => {
    e.preventDefault();

    const name = document.getElementById("task-name").value.trim();
    const duration = parseInt(document.getElementById("task-duration").value);
    const note = document.getElementById("task-note").value;

    // VALIDASI 40 KARAKTER
    if (name.length > 40) {
      alert("❌ Nama tugas terlalu panjang!\n\nMaksimal 40 karakter.\nSaat ini: " + name.length + " karakter");
      document.getElementById("task-name").focus();
      return;
    }
    
    if (name.length === 0) {
      alert("❌ Nama tugas tidak boleh kosong!");
      document.getElementById("task-name").focus();
      return;
    }

    const updatedTask = { name, duration, note };
    const newTaskElement = createTaskElement(updatedTask);

    if (currentTaskElement === taskElement) {
      currentTask = updatedTask;
      currentTaskElement = newTaskElement;
    }

    if (taskElement && taskElement.parentNode) {
      taskElement.replaceWith(newTaskElement);
    }

    addTaskForm.reset();
    viewAdd.classList.remove("active");
    
    // Reset counter
    const charCountSpan = document.getElementById('char-count');
    const charCounter = document.getElementById('task-name-counter');
    const taskNameInput = document.getElementById('task-name');
    
    if (charCountSpan) charCountSpan.textContent = "0";
    if (charCounter) charCounter.classList.remove('warning', 'danger');
    if (taskNameInput) taskNameInput.classList.remove('warning-border', 'danger-border');
    
    saveTasks();
    
    editModeActive = false;
    taskBeingEdited = null;
    
    addTaskForm.removeEventListener("submit", editSubmitHandler);
    addTaskForm.addEventListener("submit", originalSubmitHandler);
  };

  const cancelEditHandler = () => {
    viewAdd.classList.remove("active");
    addTaskForm.reset();
    
    // Reset counter
    const charCountSpan = document.getElementById('char-count');
    const charCounter = document.getElementById('task-name-counter');
    const taskNameInput = document.getElementById('task-name');
    
    if (charCountSpan) charCountSpan.textContent = "0";
    if (charCounter) charCounter.classList.remove('warning', 'danger');
    if (taskNameInput) taskNameInput.classList.remove('warning-border', 'danger-border');
    
    editModeActive = false;
    taskBeingEdited = null;
    
    addTaskForm.removeEventListener("submit", editSubmitHandler);
    addTaskForm.addEventListener("submit", originalSubmitHandler);
  };

  addTaskForm.removeEventListener("submit", normalSubmitHandler);
  addTaskForm.addEventListener("submit", editSubmitHandler);
  btnCancelAdd.addEventListener("click", cancelEditHandler);
}

function deleteTask(taskElement, task) {
  if (confirm(`Apakah Anda yakin ingin menghapus task "${task.name}"?`)) {
    if (currentTaskElement === taskElement) {
      currentTask = null;
      currentTaskElement = null;
      resetTimer();
    }

    taskElement.remove();

    if (taskList.children.length === 0) {
      emptyState.style.display = "block";
    }

    saveTasks();
  }
}

// ======================================================
// ADD TASK (DENGAN VALIDASI 40 KARAKTER)
// ======================================================
const normalSubmitHandler = (e) => {
  e.preventDefault();

  const name = document.getElementById("task-name").value.trim();
  const duration = parseInt(document.getElementById("task-duration").value);
  const note = document.getElementById("task-note").value.trim();

  // VALIDASI 40 KARAKTER
  if (name.length > 40) {
    alert("❌ Nama tugas terlalu panjang!\n\nMaksimal 40 karakter.\nSaat ini: " + name.length + " karakter");
    document.getElementById("task-name").focus();
    return;
  }
  
  if (name.length === 0) {
    alert("❌ Nama tugas tidak boleh kosong!");
    document.getElementById("task-name").focus();
    return;
  }

  emptyState.style.display = "none";

  const task = { name, duration, note };
  const taskElement = createTaskElement(task);

  taskList.appendChild(taskElement);

  // Reset form dan counter
  addTaskForm.reset();
  
  const charCountSpan = document.getElementById('char-count');
  const charCounter = document.getElementById('task-name-counter');
  const taskNameInput = document.getElementById('task-name');
  
  if (charCountSpan) charCountSpan.textContent = "0";
  if (charCounter) charCounter.classList.remove('warning', 'danger');
  if (taskNameInput) taskNameInput.classList.remove('warning-border', 'danger-border');
  
  viewAdd.classList.remove("active");
  
  saveTasks();
};

// ======================================================
// BUTTON EVENTS
// ======================================================
playPauseBtn.addEventListener("click", () => {
  if (!isRunning) {
    if (!currentTask) {
      alert("Pilih task terlebih dahulu!");
      return;
    }
    startTimer();
  } else {
    pauseTimer();
  }
});

endBtn.addEventListener("click", () => {
  if (currentTaskElement) {
    currentTaskElement.dataset.taskRunning = "false";
    currentTaskElement.classList.remove("active-task");
  }
  resetTimer();
});

// ======================================================
// SAVE SETTINGS DENGAN TEST SUARA MARIMBA
// ======================================================
btnSaveSettings.addEventListener("click", () => {
  const newTime = parseInt(inputDefaultFocusTime.value);
  const soundSetting = soundToggle.value;

  if (!isNaN(newTime) && newTime > 0) {
    defaultFocusMinutes = newTime;
    localStorage.setItem("default_focus_time", newTime);
    
    localStorage.setItem("notification_sound", soundSetting);
    
    resetTimer(defaultFocusMinutes);
    
    if (soundSetting === "on") {
      setTimeout(() => {
        playNotificationSound();
        setTimeout(() => {
          alert("✅ Pengaturan berhasil disimpan!\n\nSuara notifikasi 'Marimba' telah diuji.\n\n🎵 Nada: C5 - E5 - G5 - C6 (Akor C Mayor)");
        }, 900);
      }, 300);
    } else {
      alert("✅ Pengaturan berhasil disimpan!\n\nSuara notifikasi dimatikan.");
    }
  }
});

// ======================================================
// NAVIGATION
// ======================================================
bottomNav.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.target;

    bottomNav.forEach(n => n.classList.remove("active"));
    btn.classList.add("active");

    allViews.forEach(v => v.classList.remove("active"));
    document.getElementById(target).classList.add("active");
  });
});

// ======================================================
// MODAL CONTROL
// ======================================================
btnShowAdd.addEventListener("click", () => {
  addTaskForm.reset();
  
  // Reset counter
  const charCountSpan = document.getElementById('char-count');
  const charCounter = document.getElementById('task-name-counter');
  const taskNameInput = document.getElementById('task-name');
  
  if (charCountSpan) charCountSpan.textContent = "0";
  if (charCounter) charCounter.classList.remove('warning', 'danger');
  if (taskNameInput) taskNameInput.classList.remove('warning-border', 'danger-border');
  
  viewAdd.classList.add("active");
});

btnCancelAdd.addEventListener("click", () => {
  viewAdd.classList.remove("active");
  addTaskForm.reset();
  
  // Reset counter
  const charCountSpan = document.getElementById('char-count');
  const charCounter = document.getElementById('task-name-counter');
  const taskNameInput = document.getElementById('task-name');
  
  if (charCountSpan) charCountSpan.textContent = "0";
  if (charCounter) charCounter.classList.remove('warning', 'danger');
  if (taskNameInput) taskNameInput.classList.remove('warning-border', 'danger-border');
});

// ======================================================
// FORM EVENT LISTENER
// ======================================================
addTaskForm.addEventListener("submit", normalSubmitHandler);

// ======================================================
// SAVE TASKS
// ======================================================
function saveTasks() {
  const tasks = [];
  document.querySelectorAll(".task-item").forEach(item => {
    const name = item.querySelector("h3").textContent;
    const duration = parseInt(item.dataset.duration);
    const noteElement = item.querySelector(".task-note");
    const note = noteElement ? noteElement.textContent : "";

    tasks.push({ 
      name, 
      duration, 
      note,
      completed: false
    });
  });

  const existingTasks = JSON.parse(localStorage.getItem("focus_tasks")) || [];
  const completedTasks = existingTasks.filter(task => task.completed === true);
  
  const allTasks = [...tasks, ...completedTasks];
  
  localStorage.setItem("focus_tasks", JSON.stringify(allTasks));
}

// ======================================================
// LOAD TASKS
// ======================================================
function loadTasks() {
  const saved = JSON.parse(localStorage.getItem("focus_tasks")) || [];

  if (saved.length === 0) return;

  const incompleteTasks = saved.filter(task => !task.completed);

  if (incompleteTasks.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  incompleteTasks.forEach(task => {
    const taskElement = createTaskElement(task);
    taskList.appendChild(taskElement);
  });
}

// ======================================================
// SAVE HISTORY
// ======================================================
function saveHistory() {
  const historyItems = [];
  document.querySelectorAll(".app-card.history-style").forEach(h => {
    const name = h.querySelector("h3").textContent;
    const durationText = h.querySelector(".history-duration").textContent;
    const duration = parseInt(durationText.replace(/\D/g, ""));
    const timeElement = h.querySelector(".history-time");
    const dateElement = h.querySelector(".history-date");
    
    const time = timeElement ? timeElement.textContent : "00.00";
    const date = dateElement ? dateElement.textContent : formatIndonesianDate(new Date());
    
    historyItems.push({
      name,
      duration,
      time,
      date,
      timestamp: new Date().toISOString()
    });
  });

  localStorage.setItem("focus_history", JSON.stringify(historyItems));
}

// ======================================================
// LOAD HISTORY
// ======================================================
function loadHistory() {
  const saved = JSON.parse(localStorage.getItem("focus_history")) || [];
  if (saved.length === 0) return;

  saved.forEach(historyData => {
    const historyElement = createHistoryElement(historyData);
    historyList.appendChild(historyElement);
  });
}

// ======================================================
// RESET HISTORY HANDLER
// ======================================================
let resetHistoryInProgress = false;

function handleResetHistory() {
  if (resetHistoryInProgress) return;
  
  resetHistoryInProgress = true;
  console.log("Tombol Hapus Riwayat diklik!");
  
  if (confirm("Apakah Anda yakin ingin menghapus SEMUA riwayat?")) {
    console.log("Mengosongkan history list...");
    
    if (historyList) {
      historyList.innerHTML = "";
    }
    
    localStorage.setItem("focus_history", "[]");
    alert("✅ Semua riwayat telah dihapus!");
    
    console.log("History localStorage setelah dihapus:", localStorage.getItem("focus_history"));
  }
  
  setTimeout(() => {
    resetHistoryInProgress = false;
  }, 300);
}

// ======================================================
// SETUP TOMBOL RESET HISTORY - EVENT DELEGATION
// ======================================================
function setupResetHistoryButton() {
  document.addEventListener('click', function(e) {
    const target = e.target;
    
    if (target.id === 'btn-reset-history' || target.closest('#btn-reset-history')) {
      e.preventDefault();
      e.stopPropagation();
      handleResetHistory();
    }
  });
  
  console.log("Tombol reset history siap!");
}

// ======================================================
// TEST FUNCTION UNTUK DEBUGGING
// ======================================================
function testMarimbaSound() {
  console.log("🔊 Testing Marimba sound (C5-E5-G5-C6)...");
  playNotificationSound();
}

function testAllMelodySounds() {
  console.log("🎵 Testing semua jenis nada...");
  
  const originalSound = playNotificationSound;
  
  console.log("1. Marimba Sound (C-E-G-C):");
  playNotificationSound();
  
  setTimeout(() => {
    console.log("2. Glockenspiel (A-C-E):");
    playNotificationSound = function() {
      const soundSetting = localStorage.getItem("notification_sound") || "on";
      if (soundSetting === "off") return;
      
      try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [
          { time: 0.0, freq: 880.00, duration: 0.4 },
          { time: 0.15, freq: 1046.50, duration: 0.4 },
          { time: 0.3, freq: 1318.51, duration: 0.5 }
        ];
        
        notes.forEach(note => {
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();
          oscillator.connect(gainNode).connect(context.destination);
          oscillator.frequency.value = note.freq;
          oscillator.type = 'triangle';
          const startTime = context.currentTime + note.time;
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration);
          oscillator.start(startTime);
          oscillator.stop(startTime + note.duration);
        });
      } catch (error) {}
    };
    playNotificationSound();
  }, 1500);
  
  setTimeout(() => {
    console.log("3. Happy Tone (G-B-D-G):");
    playNotificationSound = function() {
      const soundSetting = localStorage.getItem("notification_sound") || "on";
      if (soundSetting === "off") return;
      
      try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [
          { time: 0.0, freq: 392.00, duration: 0.2 },
          { time: 0.1, freq: 493.88, duration: 0.2 },
          { time: 0.2, freq: 587.33, duration: 0.3 },
          { time: 0.25, freq: 783.99, duration: 0.4 }
        ];
        
        notes.forEach(note => {
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();
          oscillator.connect(gainNode).connect(context.destination);
          oscillator.frequency.value = note.freq;
          oscillator.type = 'sine';
          const startTime = context.currentTime + note.time;
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.14, startTime + 0.04);
          gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration);
          oscillator.start(startTime);
          oscillator.stop(startTime + note.duration);
        });
      } catch (error) {}
    };
    playNotificationSound();
  }, 3500);
  
  setTimeout(() => {
    playNotificationSound = originalSound;
    console.log("✅ Test selesai. Kembali ke Marimba Sound.");
  }, 5500);
}

// ======================================================
// INITIALIZATION
// ======================================================
updateTimerUI();

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM siap! Inisialisasi dimulai...");
  
  // Load pengaturan waktu
  const savedTime = localStorage.getItem("default_focus_time");
  if (savedTime) {
    defaultFocusMinutes = parseInt(savedTime);
    inputDefaultFocusTime.value = defaultFocusMinutes;
    resetTimer(defaultFocusMinutes);
  }
  
  // Load pengaturan suara
  const savedSound = localStorage.getItem("notification_sound") || "on";
  soundToggle.value = savedSound;

  loadTasks();
  loadHistory();
  
  // Setup character counter & validation
  setupTaskNameValidation();
  
  // Setup tombol reset history
  setupResetHistoryButton();
  
  // Setup tombol reset history ketika navigasi ke halaman history
  bottomNav.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      if (target === "view-history") {
        const resetBtn = document.getElementById("btn-reset-history");
        if (resetBtn) {
          resetBtn.style.cursor = "pointer";
          resetBtn.style.pointerEvents = "auto";
          resetBtn.style.opacity = "1";
        }
      }
    });
  });
  
  // Request permission untuk browser notifications
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
  
  // Untuk testing
  window.testMarimbaSound = testMarimbaSound;
  window.testAllMelodySounds = testAllMelodySounds;
  
  console.log("✅ Aplikasi ModoFokus siap dengan validasi 40 karakter!");
  console.log("🎵 Nada notifikasi: C5 - E5 - G5 - C6 (Akor C Mayor)");
});

// ======================================================
// VALIDASI DURASI MINIMAL 1 MENIT - SIMPLE VERSION
// ======================================================

// 1. Override normalSubmitHandler untuk validasi durasi
const originalHandler = normalSubmitHandler;

normalSubmitHandler = function(e) {
  e.preventDefault();
  
  const duration = parseInt(document.getElementById("task-duration").value);
  
  // Validasi durasi minimal 1 menit
  if (duration < 1) {
    alert("❌ Durasi harus minimal 1 menit!");
    document.getElementById("task-duration").focus();
    document.getElementById("task-duration").select();
    return;
  }
  
  // Panggil handler asli
  originalHandler.call(this, e);
};

// Update event listener
addTaskForm.removeEventListener("submit", originalHandler);
addTaskForm.addEventListener("submit", normalSubmitHandler);

// 2. Validasi di tombol Save Settings
btnSaveSettings.addEventListener("click", function() {
  const newTime = parseInt(inputDefaultFocusTime.value);
  
  // Validasi durasi minimal 1 menit
  if (newTime < 1) {
    alert("❌ Durasi harus minimal 1 menit!");
    inputDefaultFocusTime.focus();
    inputDefaultFocusTime.select();
    return;
  }
  
  // Lanjut ke kode asli
  const soundSetting = soundToggle.value;
  
  if (!isNaN(newTime) && newTime > 0) {
    defaultFocusMinutes = newTime;
    localStorage.setItem("default_focus_time", newTime);
    
    localStorage.setItem("notification_sound", soundSetting);
    
    resetTimer(defaultFocusMinutes);
    
    if (soundSetting === "on") {
      setTimeout(() => {
        playNotificationSound();
        setTimeout(() => {
          alert("✅ Pengaturan berhasil disimpan!\n\nSuara notifikasi 'Marimba' telah diuji.\n\n🎵 Nada: C5 - E5 - G5 - C6 (Akor C Mayor)");
        }, 900);
      }, 300);
    } else {
      alert("✅ Pengaturan berhasil disimpan!\n\nSuara notifikasi dimatikan.");
    }
  }
});

console.log("✅ Validasi durasi minimal 1 menit diaktifkan!");
