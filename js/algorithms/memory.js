/**
 * Memory Allocation Algorithms: First Fit, Best Fit, Worst Fit, Next Fit
 * Exports pure functions attached to window:
 * - window.runFirstFit(blocks, processes)
 * - window.runBestFit(blocks, processes)
 * - window.runWorstFit(blocks, processes)
 * - window.runNextFit(blocks, processes)
 */

(function () {
  'use strict';

  function parseInput(blocksInput, processesInput) {
    let rawBlocks = [];
    if (Array.isArray(blocksInput)) {
      rawBlocks = blocksInput;
    } else if (typeof blocksInput === 'string') {
      rawBlocks = blocksInput
        .trim()
        .split(/[\s,]+/)
        .map(v => parseInt(v, 10))
        .filter(v => !isNaN(v));
    }

    const blocks = rawBlocks.map((b, idx) => {
      const size = typeof b === 'object' && b !== null ? parseInt(b.size || b.originalSize, 10) : parseInt(b, 10);
      return {
        index: idx,
        originalSize: Math.max(0, size || 0),
        remainingSize: Math.max(0, size || 0),
        allocatedProcess: null
      };
    });

    let rawProcesses = [];
    if (Array.isArray(processesInput)) {
      rawProcesses = processesInput;
    } else if (typeof processesInput === 'string') {
      rawProcesses = processesInput
        .trim()
        .split(/[\s,]+/)
        .map(v => parseInt(v, 10))
        .filter(v => !isNaN(v));
    }

    const processes = rawProcesses.map((p, idx) => {
      let processId = `P${idx + 1}`;
      let processSize = 0;
      if (typeof p === 'object' && p !== null) {
        processId = p.processId || p.id || `P${idx + 1}`;
        processSize = parseInt(p.processSize || p.size, 10) || 0;
      } else {
        processSize = parseInt(p, 10) || 0;
      }
      return {
        processId,
        processSize
      };
    });

    return { blocks, processes };
  }

  function finalizeMemoryResult(blocksState, allocations, steps) {
    let totalAllocated = 0;
    let totalUnallocated = 0;
    let totalInternalFragmentation = 0;
    let allocatedProcessesSize = 0;
    let totalMemory = 0;

    blocksState.forEach(b => {
      totalMemory += b.originalSize;
    });

    allocations.forEach(alloc => {
      if (alloc.blockIndex !== -1) {
        totalAllocated++;
        totalInternalFragmentation += alloc.internalFragmentation;
        allocatedProcessesSize += alloc.processSize;
      } else {
        totalUnallocated++;
      }
    });

    const memoryUtilization = totalMemory > 0
      ? Number(((allocatedProcessesSize / totalMemory) * 100).toFixed(1))
      : 0;

    return {
      allocations,
      blocks: blocksState.map(b => ({
        index: b.index,
        originalSize: b.originalSize,
        remainingSize: b.remainingSize,
        allocatedProcess: b.allocatedProcess
      })),
      steps,
      statistics: {
        totalAllocated,
        totalUnallocated,
        totalInternalFragmentation,
        memoryUtilization
      }
    };
  }

  /**
   * First Fit Memory Allocation
   */
  window.runFirstFit = function (blocksInput, processesInput) {
    const { blocks, processes } = parseInput(blocksInput, processesInput);
    const allocations = [];
    const steps = [];

    processes.forEach(proc => {
      let chosenBlockIndex = -1;

      for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].allocatedProcess === null && blocks[i].originalSize >= proc.processSize) {
          chosenBlockIndex = i;
          break;
        }
      }

      if (chosenBlockIndex !== -1) {
        const b = blocks[chosenBlockIndex];
        const frag = b.originalSize - proc.processSize;
        b.allocatedProcess = proc.processId;
        b.remainingSize = frag;

        allocations.push({
          processId: proc.processId,
          processSize: proc.processSize,
          blockIndex: chosenBlockIndex,
          blockSize: b.originalSize,
          internalFragmentation: frag
        });

        steps.push({
          processId: proc.processId,
          processSize: proc.processSize,
          allocated: true,
          blockIndex: chosenBlockIndex,
          internalFragmentation: frag,
          explanation: `${proc.processId} (${proc.processSize} KB) allocated to Block ${chosenBlockIndex + 1} (${b.originalSize} KB) using First Fit. Internal fragmentation: ${frag} KB.`
        });
      } else {
        allocations.push({
          processId: proc.processId,
          processSize: proc.processSize,
          blockIndex: -1,
          blockSize: null,
          internalFragmentation: -1
        });

        steps.push({
          processId: proc.processId,
          processSize: proc.processSize,
          allocated: false,
          blockIndex: -1,
          internalFragmentation: -1,
          explanation: `${proc.processId} (${proc.processSize} KB) could not be allocated. No available block has sufficient capacity.`
        });
      }
    });

    return finalizeMemoryResult(blocks, allocations, steps);
  };

  /**
   * Best Fit Memory Allocation
   * Selects the smallest free block that is large enough.
   */
  window.runBestFit = function (blocksInput, processesInput) {
    const { blocks, processes } = parseInput(blocksInput, processesInput);
    const allocations = [];
    const steps = [];

    processes.forEach(proc => {
      let bestBlockIndex = -1;
      let minDifference = Infinity;

      for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].allocatedProcess === null && blocks[i].originalSize >= proc.processSize) {
          const diff = blocks[i].originalSize - proc.processSize;
          if (diff < minDifference) {
            minDifference = diff;
            bestBlockIndex = i;
          }
        }
      }

      if (bestBlockIndex !== -1) {
        const b = blocks[bestBlockIndex];
        const frag = b.originalSize - proc.processSize;
        b.allocatedProcess = proc.processId;
        b.remainingSize = frag;

        allocations.push({
          processId: proc.processId,
          processSize: proc.processSize,
          blockIndex: bestBlockIndex,
          blockSize: b.originalSize,
          internalFragmentation: frag
        });

        steps.push({
          processId: proc.processId,
          processSize: proc.processSize,
          allocated: true,
          blockIndex: bestBlockIndex,
          internalFragmentation: frag,
          explanation: `${proc.processId} (${proc.processSize} KB) allocated to Block ${bestBlockIndex + 1} (${b.originalSize} KB) using Best Fit (smallest sufficient block). Internal fragmentation: ${frag} KB.`
        });
      } else {
        allocations.push({
          processId: proc.processId,
          processSize: proc.processSize,
          blockIndex: -1,
          blockSize: null,
          internalFragmentation: -1
        });

        steps.push({
          processId: proc.processId,
          processSize: proc.processSize,
          allocated: false,
          blockIndex: -1,
          internalFragmentation: -1,
          explanation: `${proc.processId} (${proc.processSize} KB) could not be allocated. No available block has sufficient capacity.`
        });
      }
    });

    return finalizeMemoryResult(blocks, allocations, steps);
  };

  /**
   * Worst Fit Memory Allocation
   * Selects the largest free block.
   */
  window.runWorstFit = function (blocksInput, processesInput) {
    const { blocks, processes } = parseInput(blocksInput, processesInput);
    const allocations = [];
    const steps = [];

    processes.forEach(proc => {
      let worstBlockIndex = -1;
      let maxDifference = -1;

      for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].allocatedProcess === null && blocks[i].originalSize >= proc.processSize) {
          const diff = blocks[i].originalSize - proc.processSize;
          if (diff > maxDifference) {
            maxDifference = diff;
            worstBlockIndex = i;
          }
        }
      }

      if (worstBlockIndex !== -1) {
        const b = blocks[worstBlockIndex];
        const frag = b.originalSize - proc.processSize;
        b.allocatedProcess = proc.processId;
        b.remainingSize = frag;

        allocations.push({
          processId: proc.processId,
          processSize: proc.processSize,
          blockIndex: worstBlockIndex,
          blockSize: b.originalSize,
          internalFragmentation: frag
        });

        steps.push({
          processId: proc.processId,
          processSize: proc.processSize,
          allocated: true,
          blockIndex: worstBlockIndex,
          internalFragmentation: frag,
          explanation: `${proc.processId} (${proc.processSize} KB) allocated to Block ${worstBlockIndex + 1} (${b.originalSize} KB) using Worst Fit (largest available block). Internal fragmentation: ${frag} KB.`
        });
      } else {
        allocations.push({
          processId: proc.processId,
          processSize: proc.processSize,
          blockIndex: -1,
          blockSize: null,
          internalFragmentation: -1
        });

        steps.push({
          processId: proc.processId,
          processSize: proc.processSize,
          allocated: false,
          blockIndex: -1,
          internalFragmentation: -1,
          explanation: `${proc.processId} (${proc.processSize} KB) could not be allocated. No available block has sufficient capacity.`
        });
      }
    });

    return finalizeMemoryResult(blocks, allocations, steps);
  };

  /**
   * Next Fit Memory Allocation
   * Starts searching from the last allocated block index.
   */
  window.runNextFit = function (blocksInput, processesInput) {
    const { blocks, processes } = parseInput(blocksInput, processesInput);
    const allocations = [];
    const steps = [];
    let searchStartIdx = 0;

    processes.forEach(proc => {
      let chosenBlockIndex = -1;
      const totalBlocks = blocks.length;

      for (let offset = 0; offset < totalBlocks; offset++) {
        const currentIdx = (searchStartIdx + offset) % totalBlocks;
        if (blocks[currentIdx].allocatedProcess === null && blocks[currentIdx].originalSize >= proc.processSize) {
          chosenBlockIndex = currentIdx;
          break;
        }
      }

      if (chosenBlockIndex !== -1) {
        const b = blocks[chosenBlockIndex];
        const frag = b.originalSize - proc.processSize;
        b.allocatedProcess = proc.processId;
        b.remainingSize = frag;
        // Next Fit continues next search from the allocated block (or next position)
        searchStartIdx = chosenBlockIndex;

        allocations.push({
          processId: proc.processId,
          processSize: proc.processSize,
          blockIndex: chosenBlockIndex,
          blockSize: b.originalSize,
          internalFragmentation: frag
        });

        steps.push({
          processId: proc.processId,
          processSize: proc.processSize,
          allocated: true,
          blockIndex: chosenBlockIndex,
          internalFragmentation: frag,
          explanation: `${proc.processId} (${proc.processSize} KB) allocated to Block ${chosenBlockIndex + 1} (${b.originalSize} KB) starting search from index ${searchStartIdx}. Internal fragmentation: ${frag} KB.`
        });
      } else {
        allocations.push({
          processId: proc.processId,
          processSize: proc.processSize,
          blockIndex: -1,
          blockSize: null,
          internalFragmentation: -1
        });

        steps.push({
          processId: proc.processId,
          processSize: proc.processSize,
          allocated: false,
          blockIndex: -1,
          internalFragmentation: -1,
          explanation: `${proc.processId} (${proc.processSize} KB) could not be allocated. Completed full circular traversal without finding a suitable free block.`
        });
      }
    });

    return finalizeMemoryResult(blocks, allocations, steps);
  };
})();
