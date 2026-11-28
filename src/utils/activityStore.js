// LocalStorage helpers for 26-week Learning Heatmap, Wrong-Question Book, and Cross-Device Backup

export const STORAGE_ACTIVITY_LOG_KEY = 'silicon-note-activity-log-v1';
export const STORAGE_WRONG_BOOK_KEY = 'silicon-note-wrong-book-v1';

export function getTodayIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function loadActivityLog() {
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVITY_LOG_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function recordDailyActivity(weight = 1) {
  try {
    const log = loadActivityLog();
    const today = getTodayIso();
    log[today] = (Number(log[today]) || 0) + weight;
    localStorage.setItem(STORAGE_ACTIVITY_LOG_KEY, JSON.stringify(log));
    window.dispatchEvent(new Event('silicon-note-activity-updated'));
    return log;
  } catch {
    return {};
  }
}

export function loadWrongBook() {
  try {
    const raw = localStorage.getItem(STORAGE_WRONG_BOOK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveWrongBook(items) {
  try {
    localStorage.setItem(STORAGE_WRONG_BOOK_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('silicon-note-wrongbook-updated'));
  } catch {
    // ignore
  }
}

export function upsertWrongQuestion(entry) {
  if (!entry || !entry.uid) return;
  const list = loadWrongBook();
  const idx = list.findIndex((item) => item.uid === entry.uid);
  const nextItem = {
    ...entry,
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...nextItem };
  } else {
    list.unshift(nextItem);
  }
  saveWrongBook(list);
}

export function removeWrongQuestion(uid) {
  const list = loadWrongBook().filter((item) => item.uid !== uid);
  saveWrongBook(list);
}

export function exportAllSiliconNoteData() {
  const dump = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('silicon-note-')) {
        dump[k] = localStorage.getItem(k);
      }
    }
  } catch {
    // ignore
  }
  return {
    app: 'SiliconNote',
    exportedAt: new Date().toISOString(),
    data: dump,
  };
}

export function importAllSiliconNoteData(jsonPayload) {
  if (!jsonPayload || typeof jsonPayload !== 'object' || !jsonPayload.data) {
    throw new Error('无效的 SiliconNote 备份 JSON 文件');
  }
  let count = 0;
  Object.entries(jsonPayload.data).forEach(([k, v]) => {
    if (k.startsWith('silicon-note-') && typeof v === 'string') {
      localStorage.setItem(k, v);
      count++;
    }
  });
  return count;
}
