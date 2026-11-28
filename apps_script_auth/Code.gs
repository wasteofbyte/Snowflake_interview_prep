/**
 * Saurav Patel Academy — Google Sheets Authentication & Progress Sync Backend
 * Deploy as: Web App -> Execute as: Me -> Who has access: Anyone
 *
 * Tabs auto-created on first run:
 * 1. Users:    email | name | password_hash | role | allowed_tracks | status | created_at | last_login
 * 2. Progress: email | completed_ids | bookmarks | streak_days | last_active | updated_at
 */

const USERS_SHEET = 'Users';
const PROGRESS_SHEET = 'Progress';

function getOrCreateSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let users = ss.getSheetByName(USERS_SHEET);
  if (!users) {
    users = ss.insertSheet(USERS_SHEET);
    users.appendRow([
      'email', 'name', 'password_hash', 'role',
      'allowed_tracks', 'status', 'created_at', 'last_login'
    ]);
    users.setFrozenRows(1);
    // Seed default owner account (password: 100rav -> SHA-256)
    users.appendRow([
      'owner@wasteofbyte.dev',
      'Saurav Patel',
      'c67b76bacce3b722211897bca5db625c3a63cb3551b496cd968ccee85694babb',
      'admin',
      'ALL',
      'ACTIVE',
      new Date().toISOString(),
      ''
    ]);
  }

  let progress = ss.getSheetByName(PROGRESS_SHEET);
  if (!progress) {
    progress = ss.insertSheet(PROGRESS_SHEET);
    progress.appendRow([
      'email', 'completed_ids', 'bookmarks', 'streak_days', 'last_active', 'updated_at'
    ]);
    progress.setFrozenRows(1);
  }

  return { users, progress };
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return jsonResponse({ ok: true, service: 'Saurav Academy Google Sheets Auth' });
}

function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const body = JSON.parse(raw);
    const action = String(body.action || '').trim();
    const { users, progress } = getOrCreateSheets();

    if (action === 'login') {
      return handleLogin(users, progress, body);
    }
    if (action === 'register') {
      return handleRegister(users, body);
    }
    if (action === 'syncProgress') {
      return handleSyncProgress(users, progress, body);
    }
    if (action === 'getProgress') {
      return handleGetProgress(progress, body);
    }

    return jsonResponse({ ok: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message || String(err) });
  }
}

function findUserRow(usersSheet, emailNorm) {
  const data = usersSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0] || '').trim().toLowerCase() === emailNorm) {
      return { rowIndex: i + 1, row: data[i] };
    }
  }
  return null;
}

function getProgressForEmail(progressSheet, emailNorm) {
  const data = progressSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0] || '').trim().toLowerCase() === emailNorm) {
      return {
        rowIndex: i + 1,
        completedIds: safeParseArray(data[i][1]),
        bookmarks: safeParseArray(data[i][2]),
        streakDays: Number(data[i][3] || 1),
        lastActive: String(data[i][4] || '')
      };
    }
  }
  return { rowIndex: -1, completedIds: [], bookmarks: [], streakDays: 1, lastActive: '' };
}

function safeParseArray(val) {
  try {
    const parsed = JSON.parse(String(val || '[]'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function handleLogin(usersSheet, progressSheet, body) {
  const email = String(body.email || '').trim().toLowerCase();
  const pwHash = String(body.passwordHash || '').trim().toLowerCase();
  if (!email || !pwHash) {
    return jsonResponse({ ok: false, error: 'Email and password are required.' });
  }

  const found = findUserRow(usersSheet, email);
  if (!found) {
    return jsonResponse({ ok: false, error: 'No account found for this email.' });
  }

  const storedHash = String(found.row[2] || '').trim().toLowerCase();
  const status = String(found.row[5] || '').trim().toUpperCase();

  if (storedHash !== pwHash) {
    return jsonResponse({ ok: false, error: 'Incorrect password.' });
  }
  if (status === 'PENDING') {
    return jsonResponse({ ok: false, error: 'Your account is pending approval by Saurav Patel.' });
  }
  if (status !== 'ACTIVE') {
    return jsonResponse({ ok: false, error: 'Account is disabled (' + status + ').' });
  }

  usersSheet.getRange(found.rowIndex, 8).setValue(new Date().toISOString());
  const prog = getProgressForEmail(progressSheet, email);

  return jsonResponse({
    ok: true,
    user: {
      email: email,
      name: String(found.row[1] || email),
      role: String(found.row[3] || 'learner'),
      allowedTracks: String(found.row[4] || 'ALL')
    },
    progress: {
      completedIds: prog.completedIds,
      bookmarks: prog.bookmarks,
      streakDays: prog.streakDays,
      lastActive: prog.lastActive
    }
  });
}

function handleRegister(usersSheet, body) {
  const email = String(body.email || '').trim().toLowerCase();
  const name = String(body.name || '').trim();
  const pwHash = String(body.passwordHash || '').trim().toLowerCase();

  if (!email || !name || !pwHash) {
    return jsonResponse({ ok: false, error: 'Name, email, and password are required.' });
  }

  const existing = findUserRow(usersSheet, email);
  if (existing) {
    return jsonResponse({ ok: false, error: 'An account with this email already exists.' });
  }

  usersSheet.appendRow([
    email,
    name,
    pwHash,
    'learner',
    'ALL',
    'PENDING',
    new Date().toISOString(),
    ''
  ]);

  return jsonResponse({
    ok: true,
    status: 'PENDING',
    message: 'Access requested! Once Saurav sets your status to ACTIVE in the Google Sheet, you can sign in.'
  });
}

function handleSyncProgress(usersSheet, progressSheet, body) {
  const email = String(body.email || '').trim().toLowerCase();
  const pwHash = String(body.passwordHash || '').trim().toLowerCase();
  if (!email || !pwHash) {
    return jsonResponse({ ok: false, error: 'Unauthorized.' });
  }

  const found = findUserRow(usersSheet, email);
  if (!found || String(found.row[2] || '').trim().toLowerCase() !== pwHash) {
    return jsonResponse({ ok: false, error: 'Invalid credentials.' });
  }

  const completedIds = Array.isArray(body.completedIds) ? body.completedIds : [];
  const bookmarks = Array.isArray(body.bookmarks) ? body.bookmarks : [];
  const streakDays = Number(body.streakDays || 1);
  const lastActive = String(body.lastActive || '');
  const now = new Date().toISOString();

  const prog = getProgressForEmail(progressSheet, email);
  if (prog.rowIndex > 0) {
    progressSheet.getRange(prog.rowIndex, 2, 1, 5).setValues([[
      JSON.stringify(completedIds),
      JSON.stringify(bookmarks),
      streakDays,
      lastActive,
      now
    ]]);
  } else {
    progressSheet.appendRow([
      email,
      JSON.stringify(completedIds),
      JSON.stringify(bookmarks),
      streakDays,
      lastActive,
      now
    ]);
  }

  return jsonResponse({ ok: true, syncedAt: now });
}

function handleGetProgress(progressSheet, body) {
  const email = String(body.email || '').trim().toLowerCase();
  const prog = getProgressForEmail(progressSheet, email);
  return jsonResponse({ ok: true, progress: prog });
}
