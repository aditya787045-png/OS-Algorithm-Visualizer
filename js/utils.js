'use strict';

// Generate a color for a process based on its index or id
window.getProcessColor = function(processId, index) {
  if (processId === 'IDLE' || processId === 'Idle') {
    return '#64748b';
  }
  const colors = [
    '#4f8ef7', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
    '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#a855f7'
  ];
  if (typeof index === 'number') return colors[index % colors.length];
  // Hash the processId to get consistent color
  let hash = 0;
  for (let c of String(processId)) hash = (hash * 31 + c.charCodeAt(0)) % colors.length;
  return colors[Math.abs(hash)];
};

// Format time to fixed 2 decimal places
window.formatTime = function(t) { return Number(t).toFixed(2); };

// Generate sample CPU processes
window.getSampleCPUProcesses = function() {
  return [
    { id: 'P1', arrivalTime: 0, burstTime: 5, priority: 3 },
    { id: 'P2', arrivalTime: 1, burstTime: 3, priority: 1 },
    { id: 'P3', arrivalTime: 2, burstTime: 8, priority: 4 },
    { id: 'P4', arrivalTime: 3, burstTime: 6, priority: 2 },
    { id: 'P5', arrivalTime: 4, burstTime: 4, priority: 5 },
  ];
};

// Generate random CPU processes
window.getRandomCPUProcesses = function(n = 4) {
  const result = [];
  for (let i = 0; i < n; i++) {
    result.push({
      id: `P${i+1}`,
      arrivalTime: Math.floor(Math.random() * 5),
      burstTime: Math.floor(Math.random() * 8) + 1,
      priority: Math.floor(Math.random() * 5) + 1
    });
  }
  return result;
};

// Validate CPU processes input
window.validateCPUProcesses = function(processes) {
  const errors = [];
  if (!processes || processes.length === 0) {
    errors.push('Please add at least one process.');
    return errors;
  }
  const ids = new Set();
  processes.forEach((p, i) => {
    if (!p.id || p.id.trim() === '') errors.push(`Process ${i+1}: ID cannot be empty.`);
    else if (ids.has(p.id)) errors.push(`Process ${i+1}: Duplicate ID '${p.id}'.`);
    else ids.add(p.id);
    if (isNaN(p.arrivalTime) || p.arrivalTime < 0) errors.push(`${p.id}: Arrival time must be >= 0.`);
    if (isNaN(p.burstTime) || p.burstTime <= 0) errors.push(`${p.id}: Burst time must be > 0.`);
  });
  return errors;
};

// Validate page replacement input
window.validatePageInput = function(refString, numFrames) {
  const errors = [];
  if (!refString || refString.trim() === '') errors.push('Reference string cannot be empty.');
  if (isNaN(numFrames) || numFrames <= 0) errors.push('Number of frames must be > 0.');
  const pages = refString.trim().split(/\s+/).map(Number);
  if (pages.some(isNaN)) errors.push('Reference string must contain only numbers.');
  return errors;
};

// Validate disk input
window.validateDiskInput = function(head, requests, diskSize) {
  const errors = [];
  if (isNaN(head) || head < 0) errors.push('Initial head position must be >= 0.');
  if (!requests || requests.trim() === '') errors.push('Request queue cannot be empty.');
  if (isNaN(diskSize) || diskSize <= 0) errors.push('Disk size must be > 0.');
  const reqs = requests.trim().split(/[,\s]+/).map(Number);
  if (reqs.some(isNaN) || reqs.some(r => r < 0 || r >= diskSize)) {
    errors.push(`All requests must be between 0 and ${diskSize - 1}.`);
  }
  return errors;
};

// Sample data helpers
window.getSamplePageRef = function() { return '7 0 1 2 0 3 0 4 2 3 0 3 2'; };
window.getSampleDiskRequests = function() { return '98 183 37 122 14 124 65 67'; };
window.getSampleMemoryBlocks = function() { return [100, 500, 200, 300, 600]; };
window.getSampleMemoryProcesses = function() { return [212, 417, 112, 426]; };

// Local storage helpers
window.saveToStorage = function(key, value) {
  try { localStorage.setItem('os-viz-' + key, JSON.stringify(value)); } catch(e) {}
};
window.loadFromStorage = function(key, defaultValue) {
  try {
    const v = localStorage.getItem('os-viz-' + key);
    return v ? JSON.parse(v) : defaultValue;
  } catch(e) { return defaultValue; }
};
