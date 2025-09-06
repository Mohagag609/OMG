import { persist } from './data.js';

let nav;

export function initState(navFunc) {
    nav = navFunc;
}

/* ===== GLOBAL STATE & CONFIG ===== */
export let state = {};
export let historyStack = [];
export let historyIndex = -1;
export let currentView = 'dash';
export let currentParam = null;

export function setCurrentView(view, param) {
    currentView = view;
    currentParam = param;
}

/* ===== UNDO/REDO ===== */
export async function undo() { if (historyIndex > 0) { historyIndex--; const restoredState = JSON.parse(JSON.stringify(historyStack[historyIndex])); Object.keys(state).forEach(key => delete state[key]); Object.assign(state, restoredState); await persist(); nav(currentView, currentParam); updateUndoRedoButtons(); } }
export async function redo() { if (historyIndex < historyStack.length - 1) { historyIndex++; const restoredState = JSON.parse(JSON.stringify(historyStack[historyIndex])); Object.keys(state).forEach(key => delete state[key]); Object.assign(state, restoredState); await persist(); nav(currentView, currentParam); updateUndoRedoButtons(); } }
export function saveState() { historyStack = historyStack.slice(0, historyIndex + 1); historyStack.push(JSON.parse(JSON.stringify(state))); if (historyStack.length > 50) { historyStack.shift(); } historyIndex = historyStack.length - 1; updateUndoRedoButtons(); }
export function updateUndoRedoButtons() { const undoBtn = document.getElementById('undoBtn'); const redoBtn = document.getElementById('redoBtn'); if (undoBtn) undoBtn.disabled = historyIndex <= 0; if (redoBtn) redoBtn.disabled = historyIndex >= historyStack.length - 1; }
