/**
 * Page Replacement Algorithms: FIFO, LRU, Optimal
 * Exports pure functions attached to window:
 * - window.runFIFO(referenceString, numFrames)
 * - window.runLRU(referenceString, numFrames)
 * - window.runOptimal(referenceString, numFrames)
 */

(function () {
  'use strict';

  function parseInputs(referenceString, numFrames) {
    let refs = [];
    if (Array.isArray(referenceString)) {
      refs = referenceString.map(v => (typeof v === 'string' ? v.trim() : v)).filter(v => v !== '');
    } else if (typeof referenceString === 'string') {
      refs = referenceString
        .trim()
        .split(/[\s,]+/)
        .filter(v => v.length > 0)
        .map(v => (isNaN(Number(v)) ? v : Number(v)));
    }
    const framesCount = Math.max(1, parseInt(numFrames, 10) || 3);
    return { refs, framesCount };
  }

  function createResultTemplate() {
    return {
      steps: [],
      totalFaults: 0,
      totalHits: 0,
      hitRatio: 0,
      faultRatio: 0
    };
  }

  function finalizeResult(result, totalRefs) {
    if (totalRefs > 0) {
      result.hitRatio = Number((result.totalHits / totalRefs).toFixed(4));
      result.faultRatio = Number((result.totalFaults / totalRefs).toFixed(4));
    } else {
      result.hitRatio = 0;
      result.faultRatio = 0;
    }
    return result;
  }

  /**
   * First-In, First-Out (FIFO) Page Replacement
   */
  window.runFIFO = function (referenceString, numFrames) {
    const { refs, framesCount } = parseInputs(referenceString, numFrames);
    const result = createResultTemplate();
    const frames = Array(framesCount).fill(-1);
    const fifoQueue = []; // tracks frame indices in insertion order

    let faultCount = 0;
    let hitCount = 0;

    refs.forEach((page, stepIndex) => {
      const existingFrameIndex = frames.indexOf(page);
      let isHit = false;
      let isFault = false;
      let replacedPage = null;
      let explanation = '';

      if (existingFrameIndex !== -1) {
        // Page Hit
        isHit = true;
        hitCount++;
        explanation = `Page ${page} is already present in Frame ${existingFrameIndex + 1} (Hit). No page replacement needed.`;
      } else {
        // Page Fault
        isFault = true;
        faultCount++;

        const emptyFrameIndex = frames.indexOf(-1);
        if (emptyFrameIndex !== -1) {
          // Empty frame available
          frames[emptyFrameIndex] = page;
          fifoQueue.push(emptyFrameIndex);
          explanation = `Page ${page} is not in any frame. Loaded into empty Frame ${emptyFrameIndex + 1} (Fault).`;
        } else {
          // Frames are full: replace oldest frame
          const victimFrameIndex = fifoQueue.shift();
          replacedPage = frames[victimFrameIndex];
          frames[victimFrameIndex] = page;
          fifoQueue.push(victimFrameIndex);
          explanation = `Page ${page} caused a Fault. Frames are full; replacing oldest loaded Page ${replacedPage} in Frame ${victimFrameIndex + 1} (FIFO).`;
        }
      }

      result.steps.push({
        stepIndex,
        page,
        frames: [...frames],
        isHit,
        isFault,
        replacedPage,
        explanation,
        faultCount,
        hitCount
      });
    });

    result.totalFaults = faultCount;
    result.totalHits = hitCount;
    return finalizeResult(result, refs.length);
  };

  /**
   * Least Recently Used (LRU) Page Replacement
   */
  window.runLRU = function (referenceString, numFrames) {
    const { refs, framesCount } = parseInputs(referenceString, numFrames);
    const result = createResultTemplate();
    const frames = Array(framesCount).fill(-1);
    // Maps page -> last accessed step index
    const lastAccessMap = new Map();

    let faultCount = 0;
    let hitCount = 0;

    refs.forEach((page, stepIndex) => {
      const existingFrameIndex = frames.indexOf(page);
      let isHit = false;
      let isFault = false;
      let replacedPage = null;
      let explanation = '';

      if (existingFrameIndex !== -1) {
        // Hit
        isHit = true;
        hitCount++;
        lastAccessMap.set(page, stepIndex);
        explanation = `Page ${page} is already in Frame ${existingFrameIndex + 1} (Hit). Updated its last used time to step ${stepIndex + 1}.`;
      } else {
        // Fault
        isFault = true;
        faultCount++;

        const emptyFrameIndex = frames.indexOf(-1);
        if (emptyFrameIndex !== -1) {
          frames[emptyFrameIndex] = page;
          lastAccessMap.set(page, stepIndex);
          explanation = `Page ${page} is not present in memory. Loaded into empty Frame ${emptyFrameIndex + 1} (Fault).`;
        } else {
          // Full: pick frame with smallest last accessed step index
          let lruFrameIndex = 0;
          let minLastAccess = Infinity;

          frames.forEach((p, idx) => {
            const lastUsed = lastAccessMap.has(p) ? lastAccessMap.get(p) : -1;
            if (lastUsed < minLastAccess) {
              minLastAccess = lastUsed;
              lruFrameIndex = idx;
            }
          });

          replacedPage = frames[lruFrameIndex];
          frames[lruFrameIndex] = page;
          lastAccessMap.set(page, stepIndex);
          explanation = `Page ${page} caused a Fault. Page ${replacedPage} in Frame ${lruFrameIndex + 1} was least recently used (last accessed at step ${minLastAccess + 1}) and was replaced.`;
        }
      }

      result.steps.push({
        stepIndex,
        page,
        frames: [...frames],
        isHit,
        isFault,
        replacedPage,
        explanation,
        faultCount,
        hitCount
      });
    });

    result.totalFaults = faultCount;
    result.totalHits = hitCount;
    return finalizeResult(result, refs.length);
  };

  /**
   * Optimal Page Replacement (Belady's Min)
   * Replaces the page that will not be used for the longest period of time in the future.
   */
  window.runOptimal = function (referenceString, numFrames) {
    const { refs, framesCount } = parseInputs(referenceString, numFrames);
    const result = createResultTemplate();
    const frames = Array(framesCount).fill(-1);

    let faultCount = 0;
    let hitCount = 0;

    refs.forEach((page, stepIndex) => {
      const existingFrameIndex = frames.indexOf(page);
      let isHit = false;
      let isFault = false;
      let replacedPage = null;
      let explanation = '';

      if (existingFrameIndex !== -1) {
        // Hit
        isHit = true;
        hitCount++;
        explanation = `Page ${page} found in Frame ${existingFrameIndex + 1} (Hit). Memory frames remain unchanged.`;
      } else {
        // Fault
        isFault = true;
        faultCount++;

        const emptyFrameIndex = frames.indexOf(-1);
        if (emptyFrameIndex !== -1) {
          frames[emptyFrameIndex] = page;
          explanation = `Page ${page} is not in any frame. Loaded into empty Frame ${emptyFrameIndex + 1} (Fault).`;
        } else {
          // Find page in frames that won't be used for the longest period in the future
          let victimFrameIndex = -1;
          let furthestUse = -1;
          let victimNextUseDesc = '';

          for (let i = 0; i < frames.length; i++) {
            const currentFramePage = frames[i];
            let nextUseIndex = -1;

            for (let futureIdx = stepIndex + 1; futureIdx < refs.length; futureIdx++) {
              if (refs[futureIdx] === currentFramePage) {
                nextUseIndex = futureIdx;
                break;
              }
            }

            if (nextUseIndex === -1) {
              // Not used again in the future - optimal candidate!
              victimFrameIndex = i;
              furthestUse = Infinity;
              victimNextUseDesc = 'never referenced again';
              break;
            } else if (nextUseIndex > furthestUse) {
              furthestUse = nextUseIndex;
              victimFrameIndex = i;
              victimNextUseDesc = `next referenced at step ${nextUseIndex + 1}`;
            }
          }

          replacedPage = frames[victimFrameIndex];
          frames[victimFrameIndex] = page;
          explanation = `Page ${page} caused a Fault. Page ${replacedPage} in Frame ${victimFrameIndex + 1} selected for replacement (${victimNextUseDesc}).`;
        }
      }

      result.steps.push({
        stepIndex,
        page,
        frames: [...frames],
        isHit,
        isFault,
        replacedPage,
        explanation,
        faultCount,
        hitCount
      });
    });

    result.totalFaults = faultCount;
    result.totalHits = hitCount;
    return finalizeResult(result, refs.length);
  };
})();
