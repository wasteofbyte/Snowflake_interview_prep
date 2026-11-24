/**
 * Snowflake Interview Lab · Notes & Google Spreadsheet Integration
 * Features:
 * - Option to add notes on each topic right next to each topic tag
 * - Single master entry point in the top nav to enter password and enable notes across all modules (Default: snowflake)
 * - Auto-persistence across all modules via localStorage
 * - Google Spreadsheet sync via Google Apps Script Web App
 * - Local offline resilience & CSV export
 */

(function () {
  'use strict';

  // Constants & Storage Keys
  const STORAGE_KEYS = {
    NOTES: 'sf_notes_data',
    DELETED: 'sf_deleted_note_ids',
    SHEET_URL: 'sf_google_sheet_url',
    PW_HASH: 'sf_notes_pw_hash',
    GLOBAL_UNLOCKED: 'sf_notes_global_unlocked'
  };

  // Default password: "snowflake" (SHA-256)
  const DEFAULT_PW_HASH = 'de5a1adf4fedcce1533915edc60177547f1057b61b7119fd130e1f7428705f73';

  // Default Google Spreadsheet Apps Script Web App URL (Active & Deployed)
  const DEFAULT_GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbypxM0ognU_fDqpu7dZnjOFY6rpSfbrSxSt4fS8gIFrT4Nqxje-T1I4aKJTUCHd-Sc/exec';

  // All known course modules & topics for dropdown selection
  const ALL_TOPICS = [
    'Module 01: Architecture',
    'Module 02: Load & Automate',
    'Module 03: Performance Tuning',
    'Module 04: Data Ingestion',
    'Module 05: Dynamic Tables & Transforms',
    'Module 06: Semi-structured Data',
    'Module 07: Data Protection',
    'Module 08: Security & Governance',
    'Module 09: Cost Optimization',
    'Module 10: Data Sharing & Collaboration',
    'Module 11: Snowpark & Cortex AI',
    'Module 12: Advanced SQL',
    'Module 13: Modeling & Tooling',
    'Module 14: Enterprise Architecture & Governance',
    'Module 15: External Integrations',
    'Module 16: IaC, CI/CD & Orchestration',
    'Deep Dive: SnowSQL, Streams & Tasks',
    'Deep Dive: JSON S3 → Snowflake'
  ];

  // Apps Script code template shown in Google Sheet Setup tab
  const APPS_SCRIPT_TEMPLATE = `// -------------------------------------------------------------
// Snowflake Interview Lab · Google Spreadsheet Notes Backend
// Supports: Add, Edit, Delete, and Get Notes
// 1. In Google Sheets: Extensions > Apps Script
// 2. Replace all existing code with this script and Save (💾)
// 3. Click Deploy > Manage deployments > Edit (pencil icon)
// 4. Set Version: "New version", Access: "Anyone", then Deploy
// -------------------------------------------------------------

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    ensureHeader(sheet);

    var data = JSON.parse(e.postData.contents);
    var action = (data.action || "add").toLowerCase();
    var id = data.id || "";
    var timestamp = data.timestamp || new Date().toISOString();
    var topic = data.topic || "General";
    var note = data.note || "";
    var author = data.author || "Saurav Patel";

    if (action === "delete") {
      var deleted = deleteRowById(sheet, id);
      return jsonResponse({ status: "success", message: deleted ? "Note deleted" : "Note not found", id: id });
    }

    if (action === "edit") {
      var edited = editRowById(sheet, id, note, timestamp);
      if (!edited) {
        sheet.appendRow([timestamp, topic, note, author, id || Utilities.getUuid()]);
      }
      return jsonResponse({ status: "success", message: "Note updated", id: id });
    }

    // Default: add
    var newId = id || Utilities.getUuid();
    sheet.appendRow([timestamp, topic, note, author, newId]);
    return jsonResponse({ status: "success", message: "Note appended successfully", id: newId });
  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    ensureHeader(sheet);

    var action = (e.parameter.action || "get").toLowerCase();
    var id = e.parameter.id || "";

    if (action === "delete" && id) {
      var lock = LockService.getScriptLock();
      lock.tryLock(5000);
      try {
        deleteRowById(sheet, id);
        return jsonResponse({ status: "success", message: "Note deleted via GET", id: id });
      } finally {
        lock.releaseLock();
      }
    }

    // Default: get notes
    var rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) {
      return jsonResponse({ status: "success", notes: [] });
    }

    var filterTopic = e.parameter.topic;
    var notes = [];
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (!filterTopic || filterTopic === "all" || r[1] === filterTopic) {
        notes.push({
          timestamp: r[0],
          topic: r[1],
          note: r[2],
          author: r[3],
          id: r[4] || ("row-" + i)
        });
      }
    }
    return jsonResponse({ status: "success", notes: notes });
  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

function ensureHeader(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "Topic", "Note", "Author", "ID"]);
    sheet.getRange(1, 1, 1, 5).setBackground("#0A86C2").setFontColor("#FFFFFF").setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
}

function deleteRowById(sheet, id) {
  if (!id) return false;
  var rows = sheet.getDataRange().getValues();
  var deleted = false;
  for (var i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][4]).trim() === String(id).trim()) {
      sheet.deleteRow(i + 1);
      deleted = true;
    }
  }
  return deleted;
}

function editRowById(sheet, id, newNote, newTimestamp) {
  if (!id) return false;
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][4]).trim() === String(id).trim()) {
      sheet.getRange(i + 1, 1).setValue(newTimestamp || new Date().toISOString());
      sheet.getRange(i + 1, 3).setValue(newNote);
      return true;
    }
  }
  return false;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  // Current active modal topic & pending unlock action
  let currentTopic = ALL_TOPICS[0];
  let filterAllTopics = false;
  let pendingUnlockCallback = null;

  // Secure password hashing using Web Crypto API with lightweight fallback
  async function hashPassword(str) {
    if (window.crypto && window.crypto.subtle) {
      try {
        const buf = new TextEncoder().encode(str);
        const hashBuf = await window.crypto.subtle.digest('SHA-256', buf);
        return Array.from(new Uint8Array(hashBuf))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      } catch (e) {
        // Fall through to fallback
      }
    }
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return 'h_' + h.toString(16);
  }

  // Local storage helpers
  function getStoredNotes() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveStoredNotes(notes) {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
      updateNotesCountBadges();
    } catch (e) {
      console.error('Failed to save notes locally', e);
    }
  }

  function getDeletedNoteIds() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DELETED);
      return new Set(data ? JSON.parse(data) : []);
    } catch (e) {
      return new Set();
    }
  }

  function addDeletedNoteId(id) {
    if (!id) return;
    try {
      const set = getDeletedNoteIds();
      set.add(String(id).trim());
      localStorage.setItem(STORAGE_KEYS.DELETED, JSON.stringify(Array.from(set)));
    } catch (e) {}
  }

  function getGoogleSheetUrl() {
    return localStorage.getItem(STORAGE_KEYS.SHEET_URL) || DEFAULT_GOOGLE_SHEET_URL;
  }

  function setGoogleSheetUrl(url) {
    localStorage.setItem(STORAGE_KEYS.SHEET_URL, url.trim());
  }

  // Global Unlocked State (Persistent across all 16 modules and index.html)
  function isGlobalUnlocked() {
    return localStorage.getItem(STORAGE_KEYS.GLOBAL_UNLOCKED) === 'true';
  }

  function setGlobalUnlocked(unlocked) {
    if (unlocked) {
      localStorage.setItem(STORAGE_KEYS.GLOBAL_UNLOCKED, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.GLOBAL_UNLOCKED);
    }
    updateAllLockStates();
  }

  function updateAllLockStates() {
    updateMasterLockBtnUI();
    refreshAllInlineNotes();
    updateNotesCountBadges();
    const notesBackdrop = document.getElementById('sf-notes-backdrop');
    if (notesBackdrop && notesBackdrop.classList.contains('is-open')) {
      renderSavedNotesView();
    }
  }

  async function verifyPassword(inputPassword) {
    const storedHash = localStorage.getItem(STORAGE_KEYS.PW_HASH);
    if (!storedHash && inputPassword === 'snowflake') {
      return true;
    }
    const inputHash = await hashPassword(inputPassword);
    const targetHash = storedHash || DEFAULT_PW_HASH;
    return inputHash === targetHash;
  }

  async function updatePassword(newPassword) {
    const newHash = await hashPassword(newPassword);
    localStorage.setItem(STORAGE_KEYS.PW_HASH, newHash);
  }

  // Sync note to Google Apps Script Web App (Supports 'add' and 'edit')
  async function syncNoteToGoogleSheet(note, action = 'add') {
    const sheetUrl = getGoogleSheetUrl();
    if (!sheetUrl) return { success: false, reason: 'No sheet URL configured' };

    try {
      const payload = JSON.stringify({
        action: action,
        timestamp: note.timestamp,
        topic: note.topic,
        note: note.text,
        author: note.author || 'Saurav Patel',
        id: note.id
      });

      // Simple Content-Type avoids CORS preflight OPTIONS block
      const response = await fetch(sheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: payload
      });

      if (response.ok) {
        return { success: true };
      }
      return { success: false, reason: 'HTTP ' + response.status };
    } catch (err) {
      // Fallback with no-cors so data still lands safely on Google Sheet
      try {
        await fetch(sheetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: action,
            timestamp: note.timestamp,
            topic: note.topic,
            note: note.text,
            author: note.author || 'Saurav Patel',
            id: note.id
          })
        });
        return { success: true, opaque: true };
      } catch (err2) {
        return { success: false, reason: err2.message };
      }
    }
  }

  // Delete note from Google Apps Script Web App
  async function syncDeleteToGoogleSheet(noteId) {
    const sheetUrl = getGoogleSheetUrl();
    if (!sheetUrl || !noteId) return;

    try {
      // 1. POST delete
      fetch(sheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'delete',
          id: noteId
        })
      }).catch(() => {});

      // 2. GET fallback (handles redirection cleanly without CORS preflight)
      const getUrl = sheetUrl + (sheetUrl.includes('?') ? '&' : '?') + 'action=delete&id=' + encodeURIComponent(noteId);
      fetch(getUrl, { mode: 'no-cors' }).catch(() => {});
    } catch (e) {
      // Ignore background errors
    }
  }

  // Fetch notes from Google Sheet
  async function fetchNotesFromGoogleSheet(topic) {
    const sheetUrl = getGoogleSheetUrl();
    if (!sheetUrl) return { success: false, reason: 'No Google Sheet URL set' };

    try {
      const url = sheetUrl + (sheetUrl.includes('?') ? '&' : '?') + 'action=get' + (topic ? '&topic=' + encodeURIComponent(topic) : '');
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      return { success: true, notes: json.notes || [] };
    } catch (e) {
      return { success: false, reason: e.message };
    }
  }

  // Toast notification
  function showToast(message, duration = 3000) {
    let toast = document.getElementById('sf-notes-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'sf-notes-toast';
      toast.className = 'sf-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('is-visible');
    setTimeout(() => {
      toast.classList.remove('is-visible');
    }, duration);
  }

  // =========================================================================
  // Master Password Unlock Modal (THE SINGLE PLACE TO ENTER PASSWORD)
  // =========================================================================
  function injectMasterModalsHTML() {
    if (document.getElementById('sf-master-unlock-backdrop')) return;

    const masterUnlockHTML = `
      <!-- Single Master Unlock Dialog -->
      <div id="sf-master-unlock-backdrop" class="sf-master-modal-backdrop" aria-hidden="true">
        <div class="sf-master-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="sf-master-title">
          <button type="button" class="sf-notes-close-btn" id="sf-master-unlock-close" title="Close (Esc)" style="position:absolute;top:16px;right:16px;">✕</button>
          <span class="sf-master-modal-icon">🔐</span>
          <h3 id="sf-master-title">Enable Notes Across Modules</h3>
          <p id="sf-master-desc">Enter your password once to view, add, and sync notes for every topic across all 16 modules.</p>
          
          <div style="max-width:320px;margin:0 auto 16px;">
            <div style="position:relative;display:flex;align-items:center;">
              <input type="password" id="sf-master-pw-input" class="sf-input" placeholder="Enter password..." autocomplete="current-password" style="padding-right:40px;font-size:15px;text-align:center;" />
              <button type="button" id="sf-master-pw-toggle" style="position:absolute;right:8px;background:none;border:none;cursor:pointer;font-size:16px;color:var(--ink3);" title="Show/Hide Password">👁️</button>
            </div>
            <div id="sf-master-pw-error" class="sf-pw-error" style="margin-top:8px;"></div>
          </div>
          
          <div style="display:flex;gap:10px;justify-content:center;margin-bottom:14px;">
            <button type="button" class="sf-btn sf-btn-primary" id="sf-master-unlock-submit" style="padding:10px 24px;font-size:14px;font-weight:600;">
              <span>🔓 Enable Notes</span>
            </button>
            <button type="button" class="sf-btn" id="sf-master-unlock-cancel" style="padding:10px 18px;">Cancel</button>
          </div>
          
          <div class="sf-pw-hint" style="font-size:12px;color:var(--ink3);">
            Default password: <code style="font-weight:bold;color:var(--ice);">snowflake</code>
          </div>
        </div>
      </div>

      <!-- Master Menu Dialog (When Notes are Unlocked) -->
      <div id="sf-master-menu-backdrop" class="sf-master-modal-backdrop" aria-hidden="true">
        <div class="sf-master-modal-dialog sf-master-menu-dialog" role="dialog" aria-modal="true" aria-labelledby="sf-menu-title">
          <div class="sf-master-menu-header">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:24px;">🔓</span>
              <div>
                <h4 id="sf-menu-title" style="margin:0;font-size:16px;font-family:var(--f-head);font-weight:700;">Notes Enabled</h4>
                <span style="font-size:11.5px;color:var(--teal);font-family:var(--f-mono);">● Active across all 16 modules</span>
              </div>
            </div>
            <button type="button" class="sf-notes-close-btn" id="sf-master-menu-close" title="Close">✕</button>
          </div>
          
          <p style="font-size:13px;color:var(--ink2);margin-bottom:16px;">
            All topic notes and revision takeaways are unlocked. Cloud sync is connected to your Google Spreadsheet.
          </p>

          <div class="sf-master-menu-list">
            <button type="button" class="sf-master-menu-item" id="sf-menu-sync-sheet-now">
              <span>↻ Sync / Pull Notes from Google Sheet</span>
              <span>☁️</span>
            </button>
            <button type="button" class="sf-master-menu-item" id="sf-menu-open-all-notes">
              <span>📝 View All Notes &amp; Summary</span>
              <span>→</span>
            </button>
            <button type="button" class="sf-master-menu-item" id="sf-menu-open-sheet-setup">
              <span>⚙️ Google Spreadsheet Setup &amp; Sync</span>
              <span>→</span>
            </button>
            <button type="button" class="sf-master-menu-item" id="sf-menu-change-pw">
              <span>🔑 Change Password</span>
              <span>→</span>
            </button>
            <button type="button" class="sf-master-menu-item danger" id="sf-menu-lock-all">
              <span>🔒 Lock Notes Across All Modules</span>
              <span>🔒</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', masterUnlockHTML);
    attachMasterModalsEvents();
  }

  function attachMasterModalsEvents() {
    const unlockBackdrop = document.getElementById('sf-master-unlock-backdrop');
    const unlockClose = document.getElementById('sf-master-unlock-close');
    const unlockCancel = document.getElementById('sf-master-unlock-cancel');
    const unlockSubmit = document.getElementById('sf-master-unlock-submit');
    const pwInput = document.getElementById('sf-master-pw-input');
    const pwToggle = document.getElementById('sf-master-pw-toggle');

    const menuBackdrop = document.getElementById('sf-master-menu-backdrop');
    const menuClose = document.getElementById('sf-master-menu-close');

    // Close actions
    const closeUnlock = () => {
      unlockBackdrop.classList.remove('is-open');
      unlockBackdrop.setAttribute('aria-hidden', 'true');
      pendingUnlockCallback = null;
    };

    const closeMenu = () => {
      menuBackdrop.classList.remove('is-open');
      menuBackdrop.setAttribute('aria-hidden', 'true');
    };

    unlockClose.addEventListener('click', closeUnlock);
    unlockCancel.addEventListener('click', closeUnlock);
    unlockBackdrop.addEventListener('click', (e) => {
      if (e.target === unlockBackdrop) closeUnlock();
    });

    menuClose.addEventListener('click', closeMenu);
    menuBackdrop.addEventListener('click', (e) => {
      if (e.target === menuBackdrop) closeMenu();
    });

    // Esc key closes modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (unlockBackdrop.classList.contains('is-open')) closeUnlock();
        if (menuBackdrop.classList.contains('is-open')) closeMenu();
      }
    });

    // Show/hide password toggle
    pwToggle.addEventListener('click', () => {
      if (pwInput.type === 'password') {
        pwInput.type = 'text';
        pwToggle.textContent = '🔒';
      } else {
        pwInput.type = 'password';
        pwToggle.textContent = '👁️';
      }
    });

    // Submit password verification
    const handleMasterUnlockSubmit = async () => {
      const errorEl = document.getElementById('sf-master-pw-error');
      const dialog = unlockBackdrop.querySelector('.sf-master-modal-dialog');
      const entered = pwInput.value.trim();

      if (!entered) {
        errorEl.textContent = 'Please enter your password.';
        pwInput.focus();
        return;
      }

      unlockSubmit.disabled = true;
      unlockSubmit.innerHTML = '<span>Verifying...</span>';

      const isValid = await verifyPassword(entered);
      unlockSubmit.disabled = false;
      unlockSubmit.innerHTML = '<span>🔓 Enable Notes</span>';

      if (isValid) {
        setGlobalUnlocked(true);
        closeUnlock();
        showToast('🔓 Notes enabled across all modules!');
        autoSyncFromGoogleSheet(false);

        // Run pending action if user clicked an inline note
        if (typeof pendingUnlockCallback === 'function') {
          const cb = pendingUnlockCallback;
          pendingUnlockCallback = null;
          cb();
        }
      } else {
        errorEl.textContent = '❌ Incorrect password. Try again (Default: snowflake)';
        dialog.classList.add('shake');
        setTimeout(() => dialog.classList.remove('shake'), 400);
        pwInput.focus();
        pwInput.select();
      }
    };

    unlockSubmit.addEventListener('click', handleMasterUnlockSubmit);
    pwInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleMasterUnlockSubmit();
    });

    // Menu Actions
    const syncCloudBtn = document.getElementById('sf-menu-sync-sheet-now');
    if (syncCloudBtn) {
      syncCloudBtn.addEventListener('click', async () => {
        closeMenu();
        showToast('↻ Pulling notes from Google Sheet...');
        await autoSyncFromGoogleSheet(true);
      });
    }

    document.getElementById('sf-menu-open-all-notes').addEventListener('click', () => {
      closeMenu();
      openModal(currentTopic);
      setTimeout(() => {
        const tab = document.getElementById('sf-tab-view');
        if (tab) tab.click();
      }, 100);
    });

    document.getElementById('sf-menu-open-sheet-setup').addEventListener('click', () => {
      closeMenu();
      openModal(currentTopic);
      setTimeout(() => {
        const tab = document.querySelector('[data-tab=sheet]');
        if (tab) tab.click();
      }, 100);
    });

    document.getElementById('sf-menu-change-pw').addEventListener('click', () => {
      closeMenu();
      handleChangePasswordPrompt();
    });

    document.getElementById('sf-menu-lock-all').addEventListener('click', () => {
      closeMenu();
      setGlobalUnlocked(false);
      showToast('🔒 Notes locked across all modules.');
    });
  }

  // Open the Single Master Unlock Modal
  function openMasterUnlockModal(pendingAction = null) {
    injectMasterModalsHTML();
    pendingUnlockCallback = pendingAction;

    const backdrop = document.getElementById('sf-master-unlock-backdrop');
    const pwInput = document.getElementById('sf-master-pw-input');
    const pwError = document.getElementById('sf-master-pw-error');

    pwInput.value = '';
    pwInput.type = 'password';
    document.getElementById('sf-master-pw-toggle').textContent = '👁️';
    pwError.textContent = '';

    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');

    setTimeout(() => pwInput.focus(), 120);
  }

  // Open Master Menu when already unlocked
  function openMasterMenuModal() {
    injectMasterModalsHTML();
    const backdrop = document.getElementById('sf-master-menu-backdrop');
    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');
  }

  // =========================================================================
  // Top Nav Master Lock/Unlock Button Management
  // =========================================================================
  function initMasterTopNavButton() {
    const navContainer = document.querySelector('.top, .topbar');
    if (!navContainer) return;

    let lockBtn = document.getElementById('sfMasterLockBtn');
    if (!lockBtn) {
      lockBtn = document.createElement('button');
      lockBtn.type = 'button';
      lockBtn.id = 'sfMasterLockBtn';

      // Insert cleanly before theme button or at end of nav
      const themeBtn = navContainer.querySelector('.theme, #themeBtn, [onclick*="toggleTheme"]');
      if (themeBtn) {
        navContainer.insertBefore(lockBtn, themeBtn);
      } else {
        navContainer.appendChild(lockBtn);
      }
    }

    updateMasterLockBtnUI(lockBtn);

    lockBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isGlobalUnlocked()) {
        openMasterMenuModal();
      } else {
        openMasterUnlockModal();
      }
    };
  }

  function updateMasterLockBtnUI(btn) {
    if (!btn) btn = document.getElementById('sfMasterLockBtn');
    if (!btn) return;

    const unlocked = isGlobalUnlocked();
    if (unlocked) {
      btn.className = 'top-notes-nav-btn sf-master-lock-btn unlocked';
      btn.innerHTML = '<span>🔓 Notes Enabled</span>';
      btn.title = 'Notes are unlocked across all modules. Click for options.';
    } else {
      btn.className = 'top-notes-nav-btn sf-master-lock-btn locked';
      btn.innerHTML = '<span>🔒 Enable Notes</span>';
      btn.title = 'Click to enter password and enable notes across all modules.';
    }
  }

  // =========================================================================
  // Main Notes Modal (Add, View, Google Sheet Setup)
  // =========================================================================
  function injectModalHTML() {
    if (document.getElementById('sf-notes-backdrop')) return;

    const modalHTML = `
      <div id="sf-notes-backdrop" class="sf-notes-backdrop" aria-hidden="true">
        <div class="sf-notes-modal" role="dialog" aria-modal="true" aria-labelledby="sf-modal-title">
          
          <!-- Header -->
          <div class="sf-notes-header">
            <div class="sf-notes-title-group">
              <h3 id="sf-modal-title">📝 Topic Notes</h3>
              <p id="sf-modal-subtitle">Snowflake Interview Lab · Cloud Sheet Sync</p>
            </div>
            <button type="button" class="sf-notes-close-btn" id="sf-notes-close-btn" title="Close (Esc)">✕</button>
          </div>

          <!-- Tabs -->
          <div class="sf-notes-tabs">
            <button type="button" class="sf-notes-tab is-active" data-tab="add">➕ Add Note</button>
            <button type="button" class="sf-notes-tab" data-tab="view" id="sf-tab-view">Saved Notes</button>
            <button type="button" class="sf-notes-tab" data-tab="sheet">⚙️ Google Sheet Setup</button>
          </div>

          <!-- Body -->
          <div class="sf-notes-body">
            
            <!-- Pane 1: Add Note -->
            <div class="sf-pane is-active" id="sf-pane-add">
              <div class="sf-form-group">
                <label class="sf-form-label" for="sf-note-topic">TOPIC / MODULE</label>
                <select id="sf-note-topic" class="sf-topic-select">
                  ${ALL_TOPICS.map((t) => `<option value="${t}">${t}</option>`).join('')}
                </select>
              </div>

              <div class="sf-form-group">
                <label class="sf-form-label" for="sf-note-text">YOUR NOTE / INTERVIEW REVISION POINT</label>
                <textarea id="sf-note-text" class="sf-textarea" placeholder="Write key formulas, Gotchas, SQL snippets, or mental shortcuts for this topic..."></textarea>
              </div>

              <div class="sf-form-actions">
                <div>
                  <span id="sf-sync-status-badge" class="sf-status-badge synced">🟢 Synced to Google Sheet</span>
                </div>
                <div style="display:flex;gap:8px;">
                  <button type="button" class="sf-btn sf-btn-primary" id="sf-save-note-btn">
                    <span>💾 Save Note</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Pane 2: View Saved Notes -->
            <div class="sf-pane" id="sf-pane-view">
              
              <!-- Locked State (Single Master Unlock Trigger) -->
              <div id="sf-view-locked" class="sf-locked-box" style="display:none;">
                <span class="sf-lock-icon">🔒</span>
                <h4>Notes are Locked</h4>
                <p>Enter your password to enable and review your saved notes across all topics.</p>
                <button type="button" class="sf-btn sf-btn-primary" id="sf-modal-unlock-trigger" style="margin-top:10px;padding:8px 20px;">
                  🔑 Enter Password to Enable Notes
                </button>
              </div>

              <!-- Unlocked State -->
              <div id="sf-view-unlocked" style="display:none;">
                <div class="sf-unlocked-toolbar">
                  <div class="sf-filter-group">
                    <button type="button" class="sf-pill-btn is-active" id="sf-filter-topic-btn">This Topic</button>
                    <button type="button" class="sf-pill-btn" id="sf-filter-all-btn">All Topics</button>
                  </div>
                  <div style="display:flex;gap:6px;align-items:center;">
                    <button type="button" class="sf-btn sf-btn-sm" id="sf-refresh-sheet-btn" title="Refresh & pull from Google Sheet">↻ Sync Sheet</button>
                    <button type="button" class="sf-btn sf-btn-sm" id="sf-change-pw-btn" title="Change note password">🔑 Change Password</button>
                    <button type="button" class="sf-btn sf-btn-sm" id="sf-lock-again-btn" title="Lock notes view again">🔒 Lock</button>
                  </div>
                </div>

                <!-- Notes list -->
                <div id="sf-notes-list" class="sf-notes-list"></div>

                <div class="sf-form-actions" style="margin-top:16px;">
                  <span id="sf-total-notes-count" style="font-size:12px;color:var(--ink3);font-family:var(--f-mono);">0 notes</span>
                  <button type="button" class="sf-btn sf-btn-sm" id="sf-export-csv-btn">📥 Export to CSV</button>
                </div>
              </div>

            </div>

            <!-- Pane 3: Google Sheet Setup -->
            <div class="sf-pane" id="sf-pane-sheet">
              <div class="sf-sheet-step">
                <h5>1. Active Google Spreadsheet Integration</h5>
                <p>Notes are automatically sent to your connected Google Sheet Web App:</p>
                <div class="sf-form-group">
                  <input type="url" id="sf-sheet-url-input" class="sf-input" placeholder="https://script.google.com/macros/s/.../exec" />
                </div>
                <div style="display:flex;gap:8px;margin-top:8px;">
                  <button type="button" class="sf-btn sf-btn-primary" id="sf-save-sheet-url-btn">Save &amp; Test Connection</button>
                  <button type="button" class="sf-btn" id="sf-sync-all-notes-btn">☁️ Sync All Unsynced Notes</button>
                </div>
                <div id="sf-sheet-conn-status" style="margin-top:8px;font-size:12.5px;font-family:var(--f-mono);"></div>
              </div>

              <div class="sf-sheet-step">
                <h5>2. Google Apps Script Code (Reference)</h5>
                <p>If configuring a new spreadsheet, paste this in <b>Extensions &gt; Apps Script</b> and deploy as Web App (Access: Anyone):</p>
                <div class="sf-code-container">
                  <button type="button" class="sf-copy-code-btn" id="sf-copy-code-btn">📋 Copy Code</button>
                  <pre class="sf-code-box" id="sf-apps-script-code">${APPS_SCRIPT_TEMPLATE}</pre>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    attachModalEvents();
  }

  function attachModalEvents() {
    const backdrop = document.getElementById('sf-notes-backdrop');
    const closeBtn = document.getElementById('sf-notes-close-btn');
    const tabs = document.querySelectorAll('.sf-notes-tab');
    const panes = document.querySelectorAll('.sf-pane');

    // Close on X
    closeBtn.addEventListener('click', closeModal);

    // Close on backdrop click outside modal
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });

    // Close on Esc key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && backdrop.classList.contains('is-open')) {
        closeModal();
      }
    });

    // Tab switching
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('is-active'));
        panes.forEach((p) => p.classList.remove('is-active'));

        tab.classList.add('is-active');
        const targetPane = document.getElementById('sf-pane-' + tab.dataset.tab);
        if (targetPane) targetPane.classList.add('is-active');

        if (tab.dataset.tab === 'view') {
          renderSavedNotesView();
        } else if (tab.dataset.tab === 'sheet') {
          document.getElementById('sf-sheet-url-input').value = getGoogleSheetUrl();
        }
      });
    });

    // Save Note Button
    document.getElementById('sf-save-note-btn').addEventListener('click', handleSaveNote);

    // Master unlock trigger inside modal View pane
    const modalUnlockTrigger = document.getElementById('sf-modal-unlock-trigger');
    if (modalUnlockTrigger) {
      modalUnlockTrigger.addEventListener('click', () => {
        openMasterUnlockModal(() => {
          renderSavedNotesView();
        });
      });
    }

    // Lock again
    document.getElementById('sf-lock-again-btn').addEventListener('click', () => {
      setGlobalUnlocked(false);
      renderSavedNotesView();
      showToast('🔒 Notes locked.');
    });

    // Filter toggles
    document.getElementById('sf-filter-topic-btn').addEventListener('click', () => {
      filterAllTopics = false;
      document.getElementById('sf-filter-topic-btn').classList.add('is-active');
      document.getElementById('sf-filter-all-btn').classList.remove('is-active');
      renderNotesList();
    });

    document.getElementById('sf-filter-all-btn').addEventListener('click', () => {
      filterAllTopics = true;
      document.getElementById('sf-filter-all-btn').classList.add('is-active');
      document.getElementById('sf-filter-topic-btn').classList.remove('is-active');
      renderNotesList();
    });

    // Change Password
    document.getElementById('sf-change-pw-btn').addEventListener('click', handleChangePasswordPrompt);

    // Refresh from Google Sheet
    document.getElementById('sf-refresh-sheet-btn').addEventListener('click', handleRefreshFromSheet);

    // Copy Apps Script code
    document.getElementById('sf-copy-code-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE).then(() => {
        showToast('📋 Code copied to clipboard!');
      });
    });

    // Save Google Sheet URL
    document.getElementById('sf-save-sheet-url-btn').addEventListener('click', handleSaveSheetUrl);

    // Sync all unsynced notes button
    document.getElementById('sf-sync-all-notes-btn').addEventListener('click', handleSyncAllNotes);

    // Export to CSV
    document.getElementById('sf-export-csv-btn').addEventListener('click', handleExportCSV);
  }

  // Open modal
  function openModal(topicName) {
    injectModalHTML();

    if (topicName) {
      currentTopic = topicName;
      const select = document.getElementById('sf-note-topic');
      if (select) {
        let found = false;
        for (let i = 0; i < select.options.length; i++) {
          if (select.options[i].value === topicName) {
            select.selectedIndex = i;
            found = true;
            break;
          }
        }
        if (!found) {
          const opt = document.createElement('option');
          opt.value = topicName;
          opt.textContent = topicName;
          select.appendChild(opt);
          select.value = topicName;
        }
      }
    }

    document.getElementById('sf-modal-title').textContent = `📝 Notes · ${currentTopic}`;
    document.getElementById('sf-filter-topic-btn').textContent = currentTopic.split(':')[0] || 'This Topic';

    updateSyncStatusBadge();
    document.getElementById('sf-note-text').value = '';

    const backdrop = document.getElementById('sf-notes-backdrop');
    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');

    setTimeout(() => {
      const activeTab = document.querySelector('.sf-notes-tab.is-active');
      if (activeTab && activeTab.dataset.tab === 'add') {
        document.getElementById('sf-note-text').focus();
      } else if (activeTab && activeTab.dataset.tab === 'view') {
        renderSavedNotesView();
      }
    }, 100);
  }

  // Close modal
  function closeModal() {
    const backdrop = document.getElementById('sf-notes-backdrop');
    if (backdrop) {
      backdrop.classList.remove('is-open');
      backdrop.setAttribute('aria-hidden', 'true');
    }
  }

  function updateSyncStatusBadge() {
    const badge = document.getElementById('sf-sync-status-badge');
    const sheetUrl = getGoogleSheetUrl();
    if (badge) {
      if (sheetUrl) {
        badge.className = 'sf-status-badge synced';
        badge.innerHTML = '🟢 Synced to Google Sheet';
      } else {
        badge.className = 'sf-status-badge local';
        badge.innerHTML = '💾 Saved Locally (Sheet not linked)';
      }
    }
  }

  // Handle saving a note
  async function handleSaveNote() {
    const topicSelect = document.getElementById('sf-note-topic');
    const noteTextarea = document.getElementById('sf-note-text');
    const saveBtn = document.getElementById('sf-save-note-btn');

    const topic = topicSelect.value.trim();
    const text = noteTextarea.value.trim();

    if (!text) {
      showToast('⚠️ Please enter a note before saving.');
      noteTextarea.focus();
      return;
    }

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span>⏳ Saving...</span>';

    const newNote = {
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      topic: topic,
      text: text,
      timestamp: new Date().toISOString(),
      author: 'Saurav Patel',
      synced: false
    };

    const notes = getStoredNotes();
    notes.unshift(newNote);
    saveStoredNotes(notes);

    // Auto-enable notes when adding a note
    setGlobalUnlocked(true);

    const sheetUrl = getGoogleSheetUrl();
    if (sheetUrl) {
      const syncRes = await syncNoteToGoogleSheet(newNote);
      if (syncRes.success) {
        newNote.synced = true;
        saveStoredNotes(notes);
        showToast('✅ Note saved and synced to Google Sheet!');
      } else {
        showToast('💾 Note saved locally (Google Sheet sync failed: ' + (syncRes.reason || 'check URL') + ')');
      }
    } else {
      showToast('💾 Note saved locally! (Tip: Link Google Sheet in ⚙️ tab to auto-sync)');
    }

    noteTextarea.value = '';
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<span>💾 Save Note</span>';

    document.getElementById('sf-tab-view').click();
  }

  // Render Saved Notes view depending on locked/unlocked state
  function renderSavedNotesView() {
    const isUnlocked = isGlobalUnlocked();
    const lockedBox = document.getElementById('sf-view-locked');
    const unlockedBox = document.getElementById('sf-view-unlocked');

    if (!isUnlocked) {
      if (lockedBox) lockedBox.style.display = 'block';
      if (unlockedBox) unlockedBox.style.display = 'none';
    } else {
      if (lockedBox) lockedBox.style.display = 'none';
      if (unlockedBox) unlockedBox.style.display = 'block';
      renderNotesList();
    }
  }

  // Render notes cards list
  function renderNotesList() {
    const listContainer = document.getElementById('sf-notes-list');
    const totalCountEl = document.getElementById('sf-total-notes-count');
    const allNotes = getStoredNotes();

    const filtered = filterAllTopics
      ? allNotes
      : allNotes.filter((n) => n.topic === currentTopic);

    totalCountEl.textContent = `${filtered.length} ${filtered.length === 1 ? 'note' : 'notes'} (${filterAllTopics ? 'All topics' : currentTopic})`;

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="sf-empty-notes">
          No notes recorded yet for ${filterAllTopics ? 'any topic' : `<b>${escapeHTML(currentTopic)}</b>`}.<br>
          Click <b>➕ Add Note</b> above or the <b>📝 Note</b> button next to any topic tag to save a revision point!
        </div>
      `;
      return;
    }

    listContainer.innerHTML = filtered
      .map((note) => {
        const dateStr = new Date(note.timestamp).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const syncBadge = note.synced
          ? '<span class="sf-status-badge synced" style="font-size:10px;padding:1px 6px;">☁️ Synced</span>'
          : '<span class="sf-status-badge local" style="font-size:10px;padding:1px 6px;">💾 Local</span>';

        return `
          <div class="sf-note-card" data-id="${note.id}">
            <div class="sf-note-header">
              <span class="sf-note-topic-tag">${escapeHTML(note.topic)}</span>
              <div style="display:flex;align-items:center;gap:6px;">
                ${syncBadge}
                <span class="sf-note-date">${dateStr}</span>
              </div>
            </div>
            <div class="sf-note-content">${escapeHTML(note.text)}</div>
            <div class="sf-note-footer">
              <span style="font-size:11px;color:var(--ink3);font-family:var(--f-mono);">👤 ${escapeHTML(note.author || 'Saurav Patel')}</span>
              <div class="sf-note-actions">
                <button type="button" class="sf-icon-btn copy-btn" title="Copy note text">📋 Copy</button>
                <button type="button" class="sf-icon-btn danger delete-btn" title="Delete note">🗑️ Delete</button>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    // Attach copy & delete handlers
    listContainer.querySelectorAll('.copy-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.sf-note-card');
        const text = card.querySelector('.sf-note-content').textContent;
        navigator.clipboard.writeText(text).then(() => showToast('📋 Copied to clipboard!'));
      });
    });

    listContainer.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.sf-note-card');
        const noteId = card.dataset.id;
        if (confirm('Delete this note?')) {
          deleteNote(noteId);
        }
      });
    });
  }

  function deleteNote(noteId) {
    if (!noteId) return;

    // 1. Mark as tombstoned so auto-sync never restores it
    addDeletedNoteId(noteId);

    // 2. Remove locally
    let notes = getStoredNotes();
    notes = notes.filter((n) => n.id !== noteId);
    saveStoredNotes(notes);
    renderNotesList();
    refreshAllInlineNotes();
    updateNotesCountBadges();
    showToast('🗑️ Note deleted.');

    // 3. Sync deletion to Google Sheet
    syncDeleteToGoogleSheet(noteId);
  }

  async function handleChangePasswordPrompt() {
    const current = prompt('Enter current password:');
    if (current === null) return;

    const isCurrentValid = await verifyPassword(current);
    if (!isCurrentValid) {
      alert('Current password is incorrect.');
      return;
    }

    const newPw = prompt('Enter new password (at least 4 characters):');
    if (!newPw) return;
    if (newPw.trim().length < 4) {
      alert('Password must be at least 4 characters.');
      return;
    }

    const confirmPw = prompt('Confirm new password:');
    if (newPw !== confirmPw) {
      alert('Passwords do not match.');
      return;
    }

    await updatePassword(newPw);
    showToast('🔑 Password updated successfully!');
  }

  async function handleSaveSheetUrl() {
    const input = document.getElementById('sf-sheet-url-input');
    const statusEl = document.getElementById('sf-sheet-conn-status');
    const url = input.value.trim();

    if (!url) {
      setGoogleSheetUrl('');
      statusEl.style.color = 'var(--ink2)';
      statusEl.textContent = 'Cleared Google Sheet URL. Notes will save locally.';
      updateSyncStatusBadge();
      return;
    }

    statusEl.style.color = 'var(--ice)';
    statusEl.textContent = 'Testing connection to Google Sheet...';

    setGoogleSheetUrl(url);
    updateSyncStatusBadge();

    try {
      const res = await fetch(url + (url.includes('?') ? '&' : '?') + 'action=get');
      if (res.ok) {
        statusEl.style.color = 'var(--teal)';
        statusEl.textContent = '✅ Connected successfully! Google Spreadsheet is ready.';
        showToast('✅ Google Sheet connected!');
      } else {
        statusEl.style.color = 'var(--amber)';
        statusEl.textContent = `⚠️ URL saved. (HTTP status: ${res.status}. Ensure "Who has access" is set to "Anyone").`;
      }
    } catch (err) {
      statusEl.style.color = 'var(--amber)';
      statusEl.textContent = '⚠️ URL saved. Test ping had CORS restrictions, but submissions will send via Web App mode.';
    }
  }

  async function handleSyncAllNotes() {
    const sheetUrl = getGoogleSheetUrl();
    if (!sheetUrl) {
      alert('Please save your Google Apps Script Web App URL first.');
      return;
    }

    const notes = getStoredNotes();
    const unsynced = notes.filter((n) => !n.synced);

    if (unsynced.length === 0) {
      showToast('All notes are already synced to Google Sheet!');
      return;
    }

    const syncBtn = document.getElementById('sf-sync-all-notes-btn');
    syncBtn.disabled = true;
    syncBtn.textContent = `Syncing ${unsynced.length} notes...`;

    let successCount = 0;
    for (const note of unsynced) {
      const res = await syncNoteToGoogleSheet(note);
      if (res.success) {
        note.synced = true;
        successCount++;
      }
    }

    saveStoredNotes(notes);
    syncBtn.disabled = false;
    syncBtn.textContent = '☁️ Sync All Unsynced Notes';

    showToast(`✅ Synced ${successCount} notes to Google Sheet!`);
    if (document.getElementById('sf-pane-view').classList.contains('is-active')) {
      renderNotesList();
    }
  }

  async function handleRefreshFromSheet() {
    const sheetUrl = getGoogleSheetUrl();
    if (!sheetUrl) {
      alert('Google Sheet URL is not configured. Go to ⚙️ Google Sheet Setup to connect.');
      return;
    }

    const refreshBtn = document.getElementById('sf-refresh-sheet-btn');
    refreshBtn.disabled = true;
    refreshBtn.textContent = '↻ Syncing...';

    const res = await fetchNotesFromGoogleSheet(filterAllTopics ? '' : currentTopic);
    refreshBtn.disabled = false;
    refreshBtn.textContent = '↻ Sync Sheet';

    if (res.success && res.notes) {
      const localNotes = getStoredNotes();
      let added = 0;

      res.notes.forEach((remote) => {
        const exists = localNotes.some((l) => l.id === remote.id || (l.timestamp === remote.timestamp && l.text === remote.note));
        if (!exists) {
          localNotes.unshift({
            id: remote.id || 'remote_' + Date.now(),
            topic: remote.topic || currentTopic,
            text: remote.note,
            timestamp: remote.timestamp || new Date().toISOString(),
            author: remote.author || 'Saurav Patel',
            synced: true
          });
          added++;
        }
      });

      saveStoredNotes(localNotes);
      renderNotesList();
      showToast(`Pulled ${added} new notes from Google Sheet!`);
    } else {
      showToast('⚠️ Could not pull from sheet: ' + (res.reason || 'Network error'));
    }
  }

  // Automatic background pull & merge from Google Spreadsheet (Handles Edits & Deletions)
  async function autoSyncFromGoogleSheet(showFeedback = false) {
    const sheetUrl = getGoogleSheetUrl();
    if (!sheetUrl) return;

    try {
      const res = await fetchNotesFromGoogleSheet('');
      if (res.success && Array.isArray(res.notes)) {
        const localNotes = getStoredNotes();
        const deletedIds = getDeletedNoteIds();
        let changed = false;

        // 1. Group remote notes by ID keeping the newest version, skip blank/deleted
        const remoteMap = new Map();
        res.notes.forEach((remote) => {
          if (!remote.id || deletedIds.has(String(remote.id).trim())) return;
          if (!remote.note || !String(remote.note).trim()) return;

          const existing = remoteMap.get(remote.id);
          if (!existing || new Date(remote.timestamp) > new Date(existing.timestamp)) {
            remoteMap.set(remote.id, remote);
          }
        });

        // 2. Merge newest remote notes into local storage
        remoteMap.forEach((remote, id) => {
          const localIdx = localNotes.findIndex((l) => String(l.id).trim() === String(id).trim());
          if (localIdx === -1) {
            localNotes.unshift({
              id: id,
              topic: remote.topic || 'General',
              text: remote.note,
              timestamp: remote.timestamp || new Date().toISOString(),
              author: remote.author || 'Saurav Patel',
              synced: true
            });
            changed = true;
          } else {
            // Update if remote timestamp is newer than local or if text changed
            const remoteTime = new Date(remote.timestamp).getTime();
            const localTime = new Date(localNotes[localIdx].timestamp).getTime();
            if (remoteTime >= localTime && localNotes[localIdx].text !== remote.note) {
              localNotes[localIdx].text = remote.note;
              localNotes[localIdx].timestamp = remote.timestamp;
              localNotes[localIdx].synced = true;
              changed = true;
            }
          }
        });

        // 3. Purge notes from local storage that were deleted from Google Sheets by other windows
        const remoteIds = new Set(Array.from(remoteMap.keys()).map((k) => String(k).trim()));
        const cleanNotes = localNotes.filter((n) => {
          const id = String(n.id).trim();
          if (deletedIds.has(id)) return false;
          // If note was synced to cloud, but cloud no longer contains it -> deleted elsewhere!
          if (n.synced && !remoteIds.has(id)) {
            addDeletedNoteId(id);
            return false;
          }
          return true;
        });

        if (cleanNotes.length !== localNotes.length) {
          changed = true;
        }

        if (changed) {
          saveStoredNotes(cleanNotes);
          refreshAllInlineNotes();
          updateNotesCountBadges();
          if (document.getElementById('sf-pane-view') && document.getElementById('sf-pane-view').classList.contains('is-active')) {
            renderNotesList();
          }
          if (showFeedback) {
            showToast('✅ Notes updated and synced from Google Sheet!');
          }
        } else if (showFeedback) {
          showToast('✅ Notes are already up to date with Google Sheet.');
        }
      }
    } catch (e) {
      if (showFeedback) {
        showToast('⚠️ Cloud sync error: ' + e.message);
      }
    }
  }

  function handleExportCSV() {
    const notes = getStoredNotes();
    if (notes.length === 0) {
      alert('No notes to export.');
      return;
    }

    const headers = ['Timestamp', 'Topic', 'Note', 'Author', 'Synced'];
    const rows = notes.map((n) => [
      `"${n.timestamp}"`,
      `"${(n.topic || '').replace(/"/g, '""')}"`,
      `"${(n.text || '').replace(/"/g, '""')}"`,
      `"${(n.author || '').replace(/"/g, '""')}"`,
      `"${n.synced ? 'YES' : 'NO'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `snowflake_prep_notes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📥 Notes exported as CSV!');
  }

  // Update note count badges on topic cards
  function updateNotesCountBadges() {
    const notes = getStoredNotes();
    const topicCounts = {};
    notes.forEach((n) => {
      topicCounts[n.topic] = (topicCounts[n.topic] || 0) + 1;
    });

    document.querySelectorAll('.topic-note-btn[data-topic]').forEach((btn) => {
      const topic = btn.getAttribute('data-topic');
      const count = topicCounts[topic] || 0;
      let badge = btn.querySelector('.note-count-badge');

      if (count > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'note-count-badge';
          btn.appendChild(badge);
        }
        badge.textContent = count;
      } else if (badge) {
        badge.remove();
      }
    });

    refreshAllInlineNotes();
  }

  function getModuleName() {
    const title = document.title || '';
    const match = title.match(/Module\s*(\d+)/i);
    if (match) {
      return `Module ${match[1].padStart(2, '0')}`;
    }
    const pathMatch = window.location.pathname.match(/module(\d+)/i);
    if (pathMatch) {
      return `Module ${pathMatch[1].padStart(2, '0')}`;
    }
    return '';
  }

  // =========================================================================
  // Inline Topic Notes Setup (Placed right next to each topic tag)
  // =========================================================================
  function initInlineTopicNotes() {
    const moduleName = getModuleName();
    if (!moduleName) return;

    // 1. Modules 01-13: Scan .box .tag and .wwh .tag (e.g. "01 · WHAT IS IT")
    const tags = document.querySelectorAll('.box .tag, .wwh .tag');
    tags.forEach((tagEl) => {
      if (tagEl.dataset.notesInitialized) return;
      tagEl.dataset.notesInitialized = 'true';

      const tagText = tagEl.textContent.trim();
      const section = tagEl.closest('section') || tagEl.closest('.section');
      let chapterTitle = '';
      if (section) {
        const eyebrow = section.querySelector('.eyebrow, .section-label');
        const h2 = section.querySelector('h2');
        const chNum = eyebrow ? eyebrow.textContent.trim().split('·')[0].trim() : '';
        const chName = h2 ? h2.textContent.trim().split('·')[0].trim() : '';
        chapterTitle = [chNum, chName].filter(Boolean).join(' - ');
      }

      const topicKey = [moduleName, chapterTitle, tagText].filter(Boolean).join(' · ');

      // Insert button right next to the tag
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'inline-topic-note-btn';
      btn.setAttribute('data-topic', topicKey);
      btn.setAttribute('title', `Add / View note for ${tagText}`);
      btn.innerHTML = '<span>📝 Note</span>';

      tagEl.parentNode.insertBefore(btn, tagEl.nextSibling);

      // Create container for inline note cards / editor inside this box
      const container = document.createElement('div');
      container.className = 'inline-note-wrapper';
      container.setAttribute('data-topic', topicKey);

      btn.parentNode.insertBefore(container, btn.nextSibling);

      // Clicking note button toggles inline editor (or opens single master unlock if locked)
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isGlobalUnlocked()) {
          openMasterUnlockModal(() => {
            toggleInlineEditor(container, topicKey);
          });
          return;
        }
        toggleInlineEditor(container, topicKey);
      });
    });

    // 2. Modules 14-16: Scan .trio-item elements
    const trios = document.querySelectorAll('.trio-item');
    trios.forEach((trioEl) => {
      if (trioEl.dataset.notesInitialized) return;
      trioEl.dataset.notesInitialized = 'true';

      const h4 = trioEl.querySelector('h4');
      const headerText = h4 ? h4.textContent.trim() : 'Topic';
      const section = trioEl.closest('.section') || trioEl.closest('section');
      let chapterTitle = '';
      if (section) {
        const label = section.querySelector('.section-label');
        const h2 = section.querySelector('h2');
        const chNum = label ? label.textContent.trim() : '';
        const chName = h2 ? h2.textContent.trim() : '';
        chapterTitle = [chNum, chName].filter(Boolean).join(' - ');
      }

      const topicKey = [moduleName, chapterTitle, headerText].filter(Boolean).join(' · ');

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'inline-topic-note-btn';
      btn.setAttribute('data-topic', topicKey);
      btn.setAttribute('title', `Add / View note for ${headerText}`);
      btn.innerHTML = '<span>📝 Note</span>';

      if (h4) {
        h4.appendChild(btn);
      } else {
        trioEl.insertBefore(btn, trioEl.firstChild);
      }

      const container = document.createElement('div');
      container.className = 'inline-note-wrapper';
      container.setAttribute('data-topic', topicKey);

      btn.parentNode.insertBefore(container, btn.nextSibling);

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isGlobalUnlocked()) {
          openMasterUnlockModal(() => {
            toggleInlineEditor(container, topicKey);
          });
          return;
        }
        toggleInlineEditor(container, topicKey);
      });
    });

    refreshAllInlineNotes();
  }

  // Refresh all inline note boxes across the page
  function refreshAllInlineNotes() {
    const isUnlocked = isGlobalUnlocked();
    const allNotes = getStoredNotes();

    document.querySelectorAll('.inline-note-wrapper[data-topic]').forEach((wrapper) => {
      const topicKey = wrapper.getAttribute('data-topic');
      const topicNotes = allNotes.filter((n) => n.topic === topicKey);
      const btn = wrapper.previousElementSibling;

      if (topicNotes.length === 0) {
        if (!wrapper.querySelector('.inline-note-editor')) {
          wrapper.innerHTML = '';
        }
        if (btn && btn.classList.contains('inline-topic-note-btn')) {
          btn.classList.remove('has-notes');
          btn.innerHTML = '<span>📝 Note</span>';
          btn.title = isUnlocked ? 'Add note for this topic' : 'Enter password once to enable notes';
        }
        return;
      }

      // Notes exist for this topic!
      if (btn && btn.classList.contains('inline-topic-note-btn')) {
        btn.classList.add('has-notes');
        btn.innerHTML = isUnlocked
          ? `<span>📝 Note (${topicNotes.length})</span>`
          : `<span>🔒 Note (${topicNotes.length})</span>`;
        btn.title = isUnlocked
          ? `Click to edit/add notes (${topicNotes.length} saved)`
          : `Notes locked: Enter password once in top bar to enable (${topicNotes.length} saved)`;
      }

      if (isUnlocked) {
        // UNLOCKED: Display the user's takeaway card right under the topic tag
        if (wrapper.querySelector('.inline-note-editor')) {
          return; // Don't interrupt if user is typing in editor
        }

        const latest = topicNotes[0];
        const dateStr = new Date(latest.timestamp).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric'
        });

        wrapper.innerHTML = `
          <div class="inline-note-card unlocked">
            <div class="inline-note-head">
              <span class="pin-label">📌 Your Key Takeaway:</span>
              <div class="inline-note-actions-row">
                <span>${dateStr}</span>
                <button type="button" class="inline-note-action-btn edit-note-btn" title="Edit note">✏️ Edit</button>
                <button type="button" class="inline-note-action-btn del-note-btn" title="Delete note">🗑️</button>
              </div>
            </div>
            <div class="inline-note-body">${escapeHTML(latest.text)}</div>
          </div>
        `;

        const editBtn = wrapper.querySelector('.edit-note-btn');
        if (editBtn) {
          editBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleInlineEditor(wrapper, topicKey, latest.text, latest.id);
          });
        }

        const delBtn = wrapper.querySelector('.del-note-btn');
        if (delBtn) {
          delBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm('Delete this note?')) {
              deleteNote(latest.id);
              refreshAllInlineNotes();
            }
          });
        }

      } else {
        // LOCKED: Show locked status with ONE button that triggers the Master Unlock Modal
        wrapper.innerHTML = `
          <div class="inline-note-card locked">
            <span style="font-size:12.5px;color:var(--ink2);">🔒 <b>${topicNotes.length} Note saved</b></span>
            <button type="button" class="inline-note-action-btn unlock-inline-btn" style="color:var(--amber);border-color:var(--amber);font-weight:600;">Enable Notes</button>
          </div>
        `;

        const unlockBtn = wrapper.querySelector('.unlock-inline-btn');
        if (unlockBtn) {
          unlockBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openMasterUnlockModal();
          });
        }
      }
    });
  }

  // Toggle inline note editor
  function toggleInlineEditor(container, topicKey, initialText = '', existingId = null) {
    const existingEditor = container.querySelector('.inline-note-editor');
    if (existingEditor) {
      existingEditor.remove();
      refreshAllInlineNotes();
      return;
    }

    const editorEl = document.createElement('div');
    editorEl.className = 'inline-note-editor';
    editorEl.innerHTML = `
      <textarea placeholder="Write what you understood or want to remember for this topic...">${escapeHTML(initialText)}</textarea>
      <div class="inline-note-editor-footer">
        <div style="display:flex;gap:6px;">
          <button type="button" class="sf-btn sf-btn-primary sf-btn-sm save-inline-btn">💾 Save Note</button>
          <button type="button" class="sf-btn sf-btn-sm cancel-inline-btn">Cancel</button>
        </div>
        <span style="font-size:11px;font-family:var(--f-mono);color:var(--ink3);">
          ${getGoogleSheetUrl() ? '🟢 Auto-sync to Google Sheet' : '💾 Saves locally (Link Sheet in ⚙️ nav)'}
        </span>
      </div>
    `;

    container.prepend(editorEl);
    const textarea = editorEl.querySelector('textarea');
    textarea.focus();

    editorEl.querySelector('.cancel-inline-btn').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      editorEl.remove();
      refreshAllInlineNotes();
    });

    editorEl.querySelector('.save-inline-btn').addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const text = textarea.value.trim();
      if (!text) {
        showToast('⚠️ Please write a note before saving.');
        return;
      }

      const saveBtn = editorEl.querySelector('.save-inline-btn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      let notes = getStoredNotes();
      let targetNote = null;
      let isEdit = false;
      if (existingId) {
        const noteIdx = notes.findIndex((n) => n.id === existingId);
        if (noteIdx !== -1) {
          notes[noteIdx].text = text;
          notes[noteIdx].timestamp = new Date().toISOString();
          notes[noteIdx].synced = false;
          targetNote = notes[noteIdx];
          isEdit = true;
        }
      } else {
        targetNote = {
          id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          topic: topicKey,
          text: text,
          timestamp: new Date().toISOString(),
          author: 'Saurav Patel',
          synced: false
        };
        notes.unshift(targetNote);
      }

      saveStoredNotes(notes);

      // Attempt Google Sheet sync with action ('edit' or 'add')
      const sheetUrl = getGoogleSheetUrl();
      if (sheetUrl && targetNote) {
        const syncRes = await syncNoteToGoogleSheet(targetNote, isEdit ? 'edit' : 'add');
        if (syncRes.success) {
          targetNote.synced = true;
          saveStoredNotes(notes);
          showToast(isEdit ? '✅ Note updated and synced to Google Sheet!' : '✅ Note saved and synced to Google Spreadsheet!');
        } else {
          showToast('💾 Note saved locally (Google Sheet sync failed: check URL)');
        }
      } else {
        showToast('💾 Note saved locally! (Link Google Sheet to auto-sync to cloud)');
      }

      // Mark unlocked globally so user immediately sees what they just wrote!
      setGlobalUnlocked(true);

      editorEl.remove();
      refreshAllInlineNotes();
    });
  }

  // HTML escaping helper
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Global exposure
  window.openTopicNotes = function (topicName, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    openModal(topicName);
  };

  window.openMasterUnlockModal = openMasterUnlockModal;
  window.openMasterMenuModal = openMasterMenuModal;
  window.updateNotesCountBadges = updateNotesCountBadges;

  // Auto initialize on DOM ready
  function initAll() {
    injectMasterModalsHTML();
    injectModalHTML();
    initMasterTopNavButton();
    updateNotesCountBadges();
    initInlineTopicNotes();
    autoSyncFromGoogleSheet(false);

    // Listen for storage changes across tabs
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEYS.NOTES || e.key === STORAGE_KEYS.DELETED || e.key === STORAGE_KEYS.GLOBAL_UNLOCKED) {
        refreshAllInlineNotes();
        updateNotesCountBadges();
        updateMasterLockBtnUI();
        const viewPane = document.getElementById('sf-pane-view');
        if (viewPane && viewPane.classList.contains('is-active')) {
          renderNotesList();
        }
      }
    });

    // Attach click listeners to any .topic-note-btn
    document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('.topic-note-btn');
      if (btn && !btn.classList.contains('inline-topic-note-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const topic = btn.getAttribute('data-topic') || currentTopic;
        if (!isGlobalUnlocked()) {
          openMasterUnlockModal(() => openModal(topic));
        } else {
          openModal(topic);
        }
      }
    });
  }

  document.addEventListener('DOMContentLoaded', initAll);
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    initAll();
  }
})();
