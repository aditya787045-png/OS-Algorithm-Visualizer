// CPU Scheduling Algorithms
// Pure JavaScript implementation
// All algorithms return: { ganttChart, processes, steps, statistics }

'use strict';

(function(root) {

  /**
   * Helper: Deep clone array of process objects and normalize properties.
   */
  function cloneProcesses(processes) {
    if (!Array.isArray(processes)) return [];
    return processes.map(function(p) {
      return {
        id: String(p.id),
        arrivalTime: Number(p.arrivalTime) || 0,
        burstTime: Math.max(0, Number(p.burstTime) || 0),
        priority: p.priority !== undefined ? Number(p.priority) : 0,
        remainingTime: Math.max(0, Number(p.burstTime) || 0),
        startTime: -1,
        completionTime: 0,
        turnaroundTime: 0,
        waitingTime: 0,
        responseTime: -1
      };
    });
  }

  /**
   * Helper: Build compressed Gantt chart from unit-by-unit timeline.
   * timeline is an array of process IDs (or 'IDLE') for each unit [0..totalTime-1]
   */
  function buildGanttChart(timeline) {
    var ganttChart = [];
    if (!timeline || timeline.length === 0) return ganttChart;

    var currentId = timeline[0];
    var currentStart = 0;

    for (var t = 1; t < timeline.length; t++) {
      if (timeline[t] !== currentId) {
        ganttChart.push({
          processId: currentId,
          start: currentStart,
          end: t
        });
        currentId = timeline[t];
        currentStart = t;
      }
    }

    ganttChart.push({
      processId: currentId,
      start: currentStart,
      end: timeline.length
    });

    return ganttChart;
  }

  /**
   * Helper: Find gantt highlight index for a given time unit t.
   */
  function getGanttHighlight(ganttChart, t) {
    for (var i = 0; i < ganttChart.length; i++) {
      if (t >= ganttChart[i].start && t < ganttChart[i].end) {
        return i;
      }
    }
    return ganttChart.length > 0 ? ganttChart.length - 1 : 0;
  }

  /**
   * Calculate summary statistics for CPU scheduling.
   * @param {Array} processes Process list with calculated times
   * @param {Array} ganttChart Formatted Gantt chart
   */
  function calculateCPUStatistics(processes, ganttChart) {
    var n = processes ? processes.length : 0;
    if (n === 0) {
      return {
        avgWaitingTime: 0,
        avgTurnaroundTime: 0,
        avgResponseTime: 0,
        cpuUtilization: 0,
        throughput: 0
      };
    }

    var totalWT = 0;
    var totalTAT = 0;
    var totalRT = 0;
    var totalBurst = 0;

    processes.forEach(function(p) {
      totalWT += p.waitingTime || 0;
      totalTAT += p.turnaroundTime || 0;
      totalRT += p.responseTime || 0;
      totalBurst += p.burstTime || 0;
    });

    var totalTime = 0;
    if (ganttChart && ganttChart.length > 0) {
      totalTime = ganttChart[ganttChart.length - 1].end;
    } else {
      processes.forEach(function(p) {
        if (p.completionTime > totalTime) totalTime = p.completionTime;
      });
    }

    var cpuUtilization = totalTime > 0 ? (totalBurst / totalTime) * 100 : 0;
    var throughput = totalTime > 0 ? n / totalTime : 0;

    return {
      avgWaitingTime: Number((totalWT / n).toFixed(2)),
      avgTurnaroundTime: Number((totalTAT / n).toFixed(2)),
      avgResponseTime: Number((totalRT / n).toFixed(2)),
      cpuUtilization: Number(cpuUtilization.toFixed(2)),
      throughput: Number(throughput.toFixed(4))
    };
  }

  // =========================================================================
  // 1. FCFS (First-Come, First-Served)
  // =========================================================================
  function runFCFS(processesInput) {
    var procs = cloneProcesses(processesInput);
    if (procs.length === 0) {
      return {
        ganttChart: [],
        processes: [],
        steps: [],
        statistics: calculateCPUStatistics([], [])
      };
    }

    // Sort by arrival time; ties broken by process id string/order
    procs.sort(function(a, b) {
      if (a.arrivalTime !== b.arrivalTime) {
        return a.arrivalTime - b.arrivalTime;
      }
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    });

    var completed = [];
    var timeline = [];
    var steps = [];
    var procMap = {};
    procs.forEach(function(p) {
      procMap[p.id] = p;
    });

    var currentTime = 0;
    var remainingBurstMap = {};
    procs.forEach(function(p) {
      remainingBurstMap[p.id] = p.burstTime;
    });

    // We step time-unit by time-unit until all are completed
    var completedCount = 0;
    var currentRunning = null;
    var currentRunningRemaining = 0;

    while (completedCount < procs.length) {
      // Find arrived and uncompleted processes
      var arrivedUncompleted = procs.filter(function(p) {
        return p.arrivalTime <= currentTime && remainingBurstMap[p.id] > 0;
      });

      if (currentRunning === null || currentRunningRemaining === 0) {
        if (arrivedUncompleted.length > 0) {
          // In FCFS, pick the first in arrival order
          currentRunning = arrivedUncompleted[0];
          currentRunningRemaining = remainingBurstMap[currentRunning.id];
          if (currentRunning.startTime === -1) {
            currentRunning.startTime = currentTime;
            currentRunning.responseTime = currentTime - currentRunning.arrivalTime;
          }
        } else {
          currentRunning = null;
        }
      }

      var runningId = currentRunning ? currentRunning.id : 'IDLE';
      timeline.push(runningId);

      // Ready queue consists of arrived uncompleted processes not currently running
      var readyQueue = [];
      procs.forEach(function(p) {
        if (p.arrivalTime <= currentTime && remainingBurstMap[p.id] > 0) {
          if (!currentRunning || p.id !== currentRunning.id) {
            readyQueue.push(p.id);
          }
        }
      });

      // Execute 1 time unit
      var explanation = '';
      if (currentRunning) {
        remainingBurstMap[currentRunning.id]--;
        currentRunningRemaining--;

        explanation = currentRunning.id + ' is running. Arrived at time ' + currentRunning.arrivalTime +
          ', remaining burst: ' + remainingBurstMap[currentRunning.id] + '.';

        if (remainingBurstMap[currentRunning.id] === 0) {
          currentRunning.completionTime = currentTime + 1;
          currentRunning.turnaroundTime = currentRunning.completionTime - currentRunning.arrivalTime;
          currentRunning.waitingTime = currentRunning.turnaroundTime - currentRunning.burstTime;
          completed.push(currentRunning.id);
          completedCount++;
          currentRunning = null;
          currentRunningRemaining = 0;
        }
      } else {
        explanation = 'CPU is idle. No processes have arrived yet.';
      }

      var stepRemaining = {};
      procs.forEach(function(p) {
        stepRemaining[p.id] = remainingBurstMap[p.id];
      });

      steps.push({
        time: currentTime,
        runningProcess: runningId,
        readyQueue: readyQueue.slice(),
        completedProcesses: completed.slice(),
        remainingBurst: stepRemaining,
        explanation: explanation,
        ganttHighlight: 0
      });

      currentTime++;
    }

    var ganttChart = buildGanttChart(timeline);
    for (var s = 0; s < steps.length; s++) {
      steps[s].ganttHighlight = getGanttHighlight(ganttChart, steps[s].time);
    }

    // Preserve original input order or sorted order for process table
    var resultProcs = processesInput.map(function(inputP) {
      var p = procMap[String(inputP.id)];
      return {
        id: p.id,
        arrivalTime: p.arrivalTime,
        burstTime: p.burstTime,
        priority: p.priority,
        startTime: p.startTime === -1 ? p.arrivalTime : p.startTime,
        completionTime: p.completionTime,
        turnaroundTime: p.turnaroundTime,
        waitingTime: p.waitingTime,
        responseTime: p.responseTime === -1 ? 0 : p.responseTime
      };
    });

    var stats = calculateCPUStatistics(resultProcs, ganttChart);

    return {
      ganttChart: ganttChart,
      processes: resultProcs,
      steps: steps,
      statistics: stats
    };
  }

  // =========================================================================
  // 2. SJF (Shortest Job First - Non-Preemptive)
  // =========================================================================
  function runSJF(processesInput) {
    var procs = cloneProcesses(processesInput);
    if (procs.length === 0) {
      return {
        ganttChart: [],
        processes: [],
        steps: [],
        statistics: calculateCPUStatistics([], [])
      };
    }

    var procMap = {};
    procs.forEach(function(p) {
      procMap[p.id] = p;
    });

    var remainingBurstMap = {};
    procs.forEach(function(p) {
      remainingBurstMap[p.id] = p.burstTime;
    });

    var timeline = [];
    var steps = [];
    var completed = [];
    var currentTime = 0;
    var completedCount = 0;

    var currentRunning = null;
    var currentRunningRemaining = 0;

    while (completedCount < procs.length) {
      // If no process is running, pick one non-preemptively
      if (currentRunning === null || currentRunningRemaining === 0) {
        var candidates = procs.filter(function(p) {
          return p.arrivalTime <= currentTime && remainingBurstMap[p.id] > 0;
        });

        if (candidates.length > 0) {
          candidates.sort(function(a, b) {
            if (a.burstTime !== b.burstTime) {
              return a.burstTime - b.burstTime;
            }
            if (a.arrivalTime !== b.arrivalTime) {
              return a.arrivalTime - b.arrivalTime;
            }
            return a.id.localeCompare(b.id, undefined, { numeric: true });
          });
          currentRunning = candidates[0];
          currentRunningRemaining = remainingBurstMap[currentRunning.id];
          if (currentRunning.startTime === -1) {
            currentRunning.startTime = currentTime;
            currentRunning.responseTime = currentTime - currentRunning.arrivalTime;
          }
        } else {
          currentRunning = null;
        }
      }

      var runningId = currentRunning ? currentRunning.id : 'IDLE';
      timeline.push(runningId);

      var readyQueue = [];
      procs.forEach(function(p) {
        if (p.arrivalTime <= currentTime && remainingBurstMap[p.id] > 0) {
          if (!currentRunning || p.id !== currentRunning.id) {
            readyQueue.push(p.id);
          }
        }
      });
      // Sort ready queue in SJF order for display clarity
      readyQueue.sort(function(a, b) {
        var pa = procMap[a];
        var pb = procMap[b];
        if (pa.burstTime !== pb.burstTime) return pa.burstTime - pb.burstTime;
        if (pa.arrivalTime !== pb.arrivalTime) return pa.arrivalTime - pb.arrivalTime;
        return pa.id.localeCompare(pb.id, undefined, { numeric: true });
      });

      var explanation = '';
      if (currentRunning) {
        remainingBurstMap[currentRunning.id]--;
        currentRunningRemaining--;

        explanation = currentRunning.id + ' is running (Burst Time: ' + currentRunning.burstTime +
          ', remaining: ' + remainingBurstMap[currentRunning.id] + '). Non-preemptive execution.';

        if (remainingBurstMap[currentRunning.id] === 0) {
          currentRunning.completionTime = currentTime + 1;
          currentRunning.turnaroundTime = currentRunning.completionTime - currentRunning.arrivalTime;
          currentRunning.waitingTime = currentRunning.turnaroundTime - currentRunning.burstTime;
          completed.push(currentRunning.id);
          completedCount++;
          currentRunning = null;
          currentRunningRemaining = 0;
        }
      } else {
        explanation = 'CPU is idle. No processes have arrived yet.';
      }

      var stepRemaining = {};
      procs.forEach(function(p) {
        stepRemaining[p.id] = remainingBurstMap[p.id];
      });

      steps.push({
        time: currentTime,
        runningProcess: runningId,
        readyQueue: readyQueue.slice(),
        completedProcesses: completed.slice(),
        remainingBurst: stepRemaining,
        explanation: explanation,
        ganttHighlight: 0
      });

      currentTime++;
    }

    var ganttChart = buildGanttChart(timeline);
    for (var s = 0; s < steps.length; s++) {
      steps[s].ganttHighlight = getGanttHighlight(ganttChart, steps[s].time);
    }

    var resultProcs = processesInput.map(function(inputP) {
      var p = procMap[String(inputP.id)];
      return {
        id: p.id,
        arrivalTime: p.arrivalTime,
        burstTime: p.burstTime,
        priority: p.priority,
        startTime: p.startTime === -1 ? p.arrivalTime : p.startTime,
        completionTime: p.completionTime,
        turnaroundTime: p.turnaroundTime,
        waitingTime: p.waitingTime,
        responseTime: p.responseTime === -1 ? 0 : p.responseTime
      };
    });

    var stats = calculateCPUStatistics(resultProcs, ganttChart);

    return {
      ganttChart: ganttChart,
      processes: resultProcs,
      steps: steps,
      statistics: stats
    };
  }

  // =========================================================================
  // 3. SRTF (Shortest Remaining Time First - Preemptive SJF)
  // =========================================================================
  function runSRTF(processesInput) {
    var procs = cloneProcesses(processesInput);
    if (procs.length === 0) {
      return {
        ganttChart: [],
        processes: [],
        steps: [],
        statistics: calculateCPUStatistics([], [])
      };
    }

    var procMap = {};
    procs.forEach(function(p) {
      procMap[p.id] = p;
    });

    var remainingBurstMap = {};
    procs.forEach(function(p) {
      remainingBurstMap[p.id] = p.burstTime;
    });

    var timeline = [];
    var steps = [];
    var completed = [];
    var currentTime = 0;
    var completedCount = 0;
    var prevRunningId = null;

    while (completedCount < procs.length) {
      // Find all arrived, uncompleted processes
      var candidates = procs.filter(function(p) {
        return p.arrivalTime <= currentTime && remainingBurstMap[p.id] > 0;
      });

      var selected = null;
      if (candidates.length > 0) {
        candidates.sort(function(a, b) {
          if (remainingBurstMap[a.id] !== remainingBurstMap[b.id]) {
            return remainingBurstMap[a.id] - remainingBurstMap[b.id];
          }
          if (a.arrivalTime !== b.arrivalTime) {
            return a.arrivalTime - b.arrivalTime;
          }
          return a.id.localeCompare(b.id, undefined, { numeric: true });
        });
        selected = candidates[0];
      }

      var runningId = selected ? selected.id : 'IDLE';
      timeline.push(runningId);

      if (selected && selected.startTime === -1) {
        selected.startTime = currentTime;
        selected.responseTime = currentTime - selected.arrivalTime;
      }

      var readyQueue = [];
      procs.forEach(function(p) {
        if (p.arrivalTime <= currentTime && remainingBurstMap[p.id] > 0) {
          if (!selected || p.id !== selected.id) {
            readyQueue.push(p.id);
          }
        }
      });
      readyQueue.sort(function(a, b) {
        if (remainingBurstMap[a] !== remainingBurstMap[b]) {
          return remainingBurstMap[a] - remainingBurstMap[b];
        }
        var pa = procMap[a];
        var pb = procMap[b];
        if (pa.arrivalTime !== pb.arrivalTime) return pa.arrivalTime - pb.arrivalTime;
        return pa.id.localeCompare(pb.id, undefined, { numeric: true });
      });

      var explanation = '';
      if (selected) {
        var isPreemption = prevRunningId && prevRunningId !== 'IDLE' && prevRunningId !== selected.id && remainingBurstMap[prevRunningId] > 0;
        if (isPreemption) {
          explanation = selected.id + ' preempted ' + prevRunningId + ' because it has shorter remaining time (' +
            remainingBurstMap[selected.id] + ' < ' + remainingBurstMap[prevRunningId] + ').';
        } else {
          explanation = selected.id + ' has the shortest remaining time (' + remainingBurstMap[selected.id] + ') and gets CPU.';
        }

        remainingBurstMap[selected.id]--;

        if (remainingBurstMap[selected.id] === 0) {
          selected.completionTime = currentTime + 1;
          selected.turnaroundTime = selected.completionTime - selected.arrivalTime;
          selected.waitingTime = selected.turnaroundTime - selected.burstTime;
          completed.push(selected.id);
          completedCount++;
        }
      } else {
        explanation = 'CPU is idle. No processes have arrived yet.';
      }

      prevRunningId = runningId;

      var stepRemaining = {};
      procs.forEach(function(p) {
        stepRemaining[p.id] = remainingBurstMap[p.id];
      });

      steps.push({
        time: currentTime,
        runningProcess: runningId,
        readyQueue: readyQueue.slice(),
        completedProcesses: completed.slice(),
        remainingBurst: stepRemaining,
        explanation: explanation,
        ganttHighlight: 0
      });

      currentTime++;
    }

    var ganttChart = buildGanttChart(timeline);
    for (var s = 0; s < steps.length; s++) {
      steps[s].ganttHighlight = getGanttHighlight(ganttChart, steps[s].time);
    }

    var resultProcs = processesInput.map(function(inputP) {
      var p = procMap[String(inputP.id)];
      return {
        id: p.id,
        arrivalTime: p.arrivalTime,
        burstTime: p.burstTime,
        priority: p.priority,
        startTime: p.startTime === -1 ? p.arrivalTime : p.startTime,
        completionTime: p.completionTime,
        turnaroundTime: p.turnaroundTime,
        waitingTime: p.waitingTime,
        responseTime: p.responseTime === -1 ? 0 : p.responseTime
      };
    });

    var stats = calculateCPUStatistics(resultProcs, ganttChart);

    return {
      ganttChart: ganttChart,
      processes: resultProcs,
      steps: steps,
      statistics: stats
    };
  }

  // =========================================================================
  // 4. Priority Non-Preemptive
  // =========================================================================
  function runPriorityNP(processesInput) {
    var procs = cloneProcesses(processesInput);
    if (procs.length === 0) {
      return {
        ganttChart: [],
        processes: [],
        steps: [],
        statistics: calculateCPUStatistics([], [])
      };
    }

    var procMap = {};
    procs.forEach(function(p) {
      procMap[p.id] = p;
    });

    var remainingBurstMap = {};
    procs.forEach(function(p) {
      remainingBurstMap[p.id] = p.burstTime;
    });

    var timeline = [];
    var steps = [];
    var completed = [];
    var currentTime = 0;
    var completedCount = 0;

    var currentRunning = null;
    var currentRunningRemaining = 0;

    while (completedCount < procs.length) {
      if (currentRunning === null || currentRunningRemaining === 0) {
        var candidates = procs.filter(function(p) {
          return p.arrivalTime <= currentTime && remainingBurstMap[p.id] > 0;
        });

        if (candidates.length > 0) {
          // Lower priority number = higher priority
          candidates.sort(function(a, b) {
            if (a.priority !== b.priority) {
              return a.priority - b.priority;
            }
            if (a.arrivalTime !== b.arrivalTime) {
              return a.arrivalTime - b.arrivalTime;
            }
            return a.id.localeCompare(b.id, undefined, { numeric: true });
          });
          currentRunning = candidates[0];
          currentRunningRemaining = remainingBurstMap[currentRunning.id];
          if (currentRunning.startTime === -1) {
            currentRunning.startTime = currentTime;
            currentRunning.responseTime = currentTime - currentRunning.arrivalTime;
          }
        } else {
          currentRunning = null;
        }
      }

      var runningId = currentRunning ? currentRunning.id : 'IDLE';
      timeline.push(runningId);

      var readyQueue = [];
      procs.forEach(function(p) {
        if (p.arrivalTime <= currentTime && remainingBurstMap[p.id] > 0) {
          if (!currentRunning || p.id !== currentRunning.id) {
            readyQueue.push(p.id);
          }
        }
      });
      readyQueue.sort(function(a, b) {
        var pa = procMap[a];
        var pb = procMap[b];
        if (pa.priority !== pb.priority) return pa.priority - pb.priority;
        if (pa.arrivalTime !== pb.arrivalTime) return pa.arrivalTime - pb.arrivalTime;
        return pa.id.localeCompare(pb.id, undefined, { numeric: true });
      });

      var explanation = '';
      if (currentRunning) {
        remainingBurstMap[currentRunning.id]--;
        currentRunningRemaining--;

        explanation = currentRunning.id + ' is running with priority ' + currentRunning.priority +
          ' (burst remaining: ' + remainingBurstMap[currentRunning.id] + '). Non-preemptive.';

        if (remainingBurstMap[currentRunning.id] === 0) {
          currentRunning.completionTime = currentTime + 1;
          currentRunning.turnaroundTime = currentRunning.completionTime - currentRunning.arrivalTime;
          currentRunning.waitingTime = currentRunning.turnaroundTime - currentRunning.burstTime;
          completed.push(currentRunning.id);
          completedCount++;
          currentRunning = null;
          currentRunningRemaining = 0;
        }
      } else {
        explanation = 'CPU is idle. No processes have arrived yet.';
      }

      var stepRemaining = {};
      procs.forEach(function(p) {
        stepRemaining[p.id] = remainingBurstMap[p.id];
      });

      steps.push({
        time: currentTime,
        runningProcess: runningId,
        readyQueue: readyQueue.slice(),
        completedProcesses: completed.slice(),
        remainingBurst: stepRemaining,
        explanation: explanation,
        ganttHighlight: 0
      });

      currentTime++;
    }

    var ganttChart = buildGanttChart(timeline);
    for (var s = 0; s < steps.length; s++) {
      steps[s].ganttHighlight = getGanttHighlight(ganttChart, steps[s].time);
    }

    var resultProcs = processesInput.map(function(inputP) {
      var p = procMap[String(inputP.id)];
      return {
        id: p.id,
        arrivalTime: p.arrivalTime,
        burstTime: p.burstTime,
        priority: p.priority,
        startTime: p.startTime === -1 ? p.arrivalTime : p.startTime,
        completionTime: p.completionTime,
        turnaroundTime: p.turnaroundTime,
        waitingTime: p.waitingTime,
        responseTime: p.responseTime === -1 ? 0 : p.responseTime
      };
    });

    var stats = calculateCPUStatistics(resultProcs, ganttChart);

    return {
      ganttChart: ganttChart,
      processes: resultProcs,
      steps: steps,
      statistics: stats
    };
  }

  // =========================================================================
  // 5. Priority Preemptive
  // =========================================================================
  function runPriorityP(processesInput) {
    var procs = cloneProcesses(processesInput);
    if (procs.length === 0) {
      return {
        ganttChart: [],
        processes: [],
        steps: [],
        statistics: calculateCPUStatistics([], [])
      };
    }

    var procMap = {};
    procs.forEach(function(p) {
      procMap[p.id] = p;
    });

    var remainingBurstMap = {};
    procs.forEach(function(p) {
      remainingBurstMap[p.id] = p.burstTime;
    });

    var timeline = [];
    var steps = [];
    var completed = [];
    var currentTime = 0;
    var completedCount = 0;
    var prevRunningId = null;

    while (completedCount < procs.length) {
      var candidates = procs.filter(function(p) {
        return p.arrivalTime <= currentTime && remainingBurstMap[p.id] > 0;
      });

      var selected = null;
      if (candidates.length > 0) {
        candidates.sort(function(a, b) {
          if (a.priority !== b.priority) {
            return a.priority - b.priority;
          }
          if (a.arrivalTime !== b.arrivalTime) {
            return a.arrivalTime - b.arrivalTime;
          }
          return a.id.localeCompare(b.id, undefined, { numeric: true });
        });
        selected = candidates[0];
      }

      var runningId = selected ? selected.id : 'IDLE';
      timeline.push(runningId);

      if (selected && selected.startTime === -1) {
        selected.startTime = currentTime;
        selected.responseTime = currentTime - selected.arrivalTime;
      }

      var readyQueue = [];
      procs.forEach(function(p) {
        if (p.arrivalTime <= currentTime && remainingBurstMap[p.id] > 0) {
          if (!selected || p.id !== selected.id) {
            readyQueue.push(p.id);
          }
        }
      });
      readyQueue.sort(function(a, b) {
        var pa = procMap[a];
        var pb = procMap[b];
        if (pa.priority !== pb.priority) return pa.priority - pb.priority;
        if (pa.arrivalTime !== pb.arrivalTime) return pa.arrivalTime - pb.arrivalTime;
        return pa.id.localeCompare(pb.id, undefined, { numeric: true });
      });

      var explanation = '';
      if (selected) {
        var isPreemption = prevRunningId && prevRunningId !== 'IDLE' && prevRunningId !== selected.id && remainingBurstMap[prevRunningId] > 0;
        if (isPreemption) {
          explanation = selected.id + ' (Priority ' + selected.priority + ') preempted ' + prevRunningId +
            ' (Priority ' + procMap[prevRunningId].priority + ') because it has higher priority.';
        } else {
          explanation = selected.id + ' is running with highest priority (' + selected.priority + '). Remaining: ' +
            remainingBurstMap[selected.id] + '.';
        }

        remainingBurstMap[selected.id]--;

        if (remainingBurstMap[selected.id] === 0) {
          selected.completionTime = currentTime + 1;
          selected.turnaroundTime = selected.completionTime - selected.arrivalTime;
          selected.waitingTime = selected.turnaroundTime - selected.burstTime;
          completed.push(selected.id);
          completedCount++;
        }
      } else {
        explanation = 'CPU is idle. No processes have arrived yet.';
      }

      prevRunningId = runningId;

      var stepRemaining = {};
      procs.forEach(function(p) {
        stepRemaining[p.id] = remainingBurstMap[p.id];
      });

      steps.push({
        time: currentTime,
        runningProcess: runningId,
        readyQueue: readyQueue.slice(),
        completedProcesses: completed.slice(),
        remainingBurst: stepRemaining,
        explanation: explanation,
        ganttHighlight: 0
      });

      currentTime++;
    }

    var ganttChart = buildGanttChart(timeline);
    for (var s = 0; s < steps.length; s++) {
      steps[s].ganttHighlight = getGanttHighlight(ganttChart, steps[s].time);
    }

    var resultProcs = processesInput.map(function(inputP) {
      var p = procMap[String(inputP.id)];
      return {
        id: p.id,
        arrivalTime: p.arrivalTime,
        burstTime: p.burstTime,
        priority: p.priority,
        startTime: p.startTime === -1 ? p.arrivalTime : p.startTime,
        completionTime: p.completionTime,
        turnaroundTime: p.turnaroundTime,
        waitingTime: p.waitingTime,
        responseTime: p.responseTime === -1 ? 0 : p.responseTime
      };
    });

    var stats = calculateCPUStatistics(resultProcs, ganttChart);

    return {
      ganttChart: ganttChart,
      processes: resultProcs,
      steps: steps,
      statistics: stats
    };
  }

  // =========================================================================
  // 6. Round Robin (RR)
  // =========================================================================
  function runRoundRobin(processesInput, timeQuantum) {
    var procs = cloneProcesses(processesInput);
    var quantum = Math.max(1, parseInt(timeQuantum, 10) || 2);

    if (procs.length === 0) {
      return {
        ganttChart: [],
        processes: [],
        steps: [],
        statistics: calculateCPUStatistics([], [])
      };
    }

    var procMap = {};
    procs.forEach(function(p) {
      procMap[p.id] = p;
    });

    var remainingBurstMap = {};
    procs.forEach(function(p) {
      remainingBurstMap[p.id] = p.burstTime;
    });

    // Sort initially by arrival time, ties by id
    var unarrived = procs.slice().sort(function(a, b) {
      if (a.arrivalTime !== b.arrivalTime) {
        return a.arrivalTime - b.arrivalTime;
      }
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    });

    var readyQueue = [];
    var timeline = [];
    var steps = [];
    var completed = [];
    var currentTime = 0;
    var completedCount = 0;

    var currentProc = null;
    var currentSliceUsed = 0;

    // Check for initial arrivals at time 0
    while (unarrived.length > 0 && unarrived[0].arrivalTime <= 0) {
      readyQueue.push(unarrived.shift().id);
    }

    while (completedCount < procs.length) {
      // If no process currently running, pick from ready queue
      if (!currentProc) {
        if (readyQueue.length > 0) {
          var nextId = readyQueue.shift();
          currentProc = procMap[nextId];
          currentSliceUsed = 0;
          if (currentProc.startTime === -1) {
            currentProc.startTime = currentTime;
            currentProc.responseTime = currentTime - currentProc.arrivalTime;
          }
        }
      }

      var runningId = currentProc ? currentProc.id : 'IDLE';
      timeline.push(runningId);

      var explanation = '';
      if (currentProc) {
        remainingBurstMap[currentProc.id]--;
        currentSliceUsed++;

        explanation = currentProc.id + ' is running (time quantum: ' + quantum +
          ', slice used: ' + currentSliceUsed + '/' + quantum + ', remaining burst: ' +
          remainingBurstMap[currentProc.id] + ').';

        // Check if finished or quantum expired at end of this unit (time currentTime + 1)
        var nextTime = currentTime + 1;

        // 1. Check for any processes that arrive during/at end of this unit
        while (unarrived.length > 0 && unarrived[0].arrivalTime <= nextTime) {
          readyQueue.push(unarrived.shift().id);
        }

        // 2. Did current process finish?
        if (remainingBurstMap[currentProc.id] === 0) {
          currentProc.completionTime = nextTime;
          currentProc.turnaroundTime = currentProc.completionTime - currentProc.arrivalTime;
          currentProc.waitingTime = currentProc.turnaroundTime - currentProc.burstTime;
          completed.push(currentProc.id);
          completedCount++;
          currentProc = null;
          currentSliceUsed = 0;
        } else if (currentSliceUsed >= quantum) {
          // Time quantum expired -> put back to end of ready queue
          readyQueue.push(currentProc.id);
          currentProc = null;
          currentSliceUsed = 0;
        }
      } else {
        explanation = 'CPU is idle. No processes ready in queue.';
        var nextTimeIdle = currentTime + 1;
        while (unarrived.length > 0 && unarrived[0].arrivalTime <= nextTimeIdle) {
          readyQueue.push(unarrived.shift().id);
        }
      }

      var stepRemaining = {};
      procs.forEach(function(p) {
        stepRemaining[p.id] = remainingBurstMap[p.id];
      });

      steps.push({
        time: currentTime,
        runningProcess: runningId,
        readyQueue: readyQueue.slice(),
        completedProcesses: completed.slice(),
        remainingBurst: stepRemaining,
        explanation: explanation,
        ganttHighlight: 0
      });

      currentTime++;
    }

    var ganttChart = buildGanttChart(timeline);
    for (var s = 0; s < steps.length; s++) {
      steps[s].ganttHighlight = getGanttHighlight(ganttChart, steps[s].time);
    }

    var resultProcs = processesInput.map(function(inputP) {
      var p = procMap[String(inputP.id)];
      return {
        id: p.id,
        arrivalTime: p.arrivalTime,
        burstTime: p.burstTime,
        priority: p.priority,
        startTime: p.startTime === -1 ? p.arrivalTime : p.startTime,
        completionTime: p.completionTime,
        turnaroundTime: p.turnaroundTime,
        waitingTime: p.waitingTime,
        responseTime: p.responseTime === -1 ? 0 : p.responseTime
      };
    });

    var stats = calculateCPUStatistics(resultProcs, ganttChart);

    return {
      ganttChart: ganttChart,
      processes: resultProcs,
      steps: steps,
      statistics: stats
    };
  }

  // =========================================================================
  // Expose on window / root
  // =========================================================================
  root.runFCFS = runFCFS;
  root.runSJF = runSJF;
  root.runSRTF = runSRTF;
  root.runPriorityNP = runPriorityNP;
  root.runPriorityP = runPriorityP;
  root.runRoundRobin = runRoundRobin;
  root.calculateCPUStatistics = calculateCPUStatistics;

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
