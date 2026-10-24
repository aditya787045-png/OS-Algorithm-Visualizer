/**
 * Disk Scheduling Algorithms: FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK
 * Exports pure functions attached to window:
 * - window.runDiskFCFS(initialHead, requests, diskSize)
 * - window.runDiskSSTF(initialHead, requests, diskSize)
 * - window.runDiskSCAN(initialHead, requests, diskSize, direction)
 * - window.runDiskCSCAN(initialHead, requests, diskSize, direction)
 * - window.runDiskLOOK(initialHead, requests, diskSize, direction)
 * - window.runDiskCLOOK(initialHead, requests, diskSize, direction)
 */

(function () {
  'use strict';

  function parseInputs(initialHead, requests, diskSize) {
    const head = parseInt(initialHead, 10) || 0;
    const maxCylinders = Math.max(1, parseInt(diskSize, 10) || 200);

    let reqList = [];
    if (Array.isArray(requests)) {
      reqList = requests
        .map(r => parseInt(r, 10))
        .filter(r => !isNaN(r) && r >= 0 && r < maxCylinders);
    } else if (typeof requests === 'string') {
      reqList = requests
        .trim()
        .split(/[\s,]+/)
        .map(r => parseInt(r, 10))
        .filter(r => !isNaN(r) && r >= 0 && r < maxCylinders);
    }

    return { head, reqList, maxCylinders };
  }

  function normalizeDirection(direction) {
    const dir = String(direction || '').toLowerCase().trim();
    if (dir === 'left' || dir === 'down' || dir === 'decrement' || dir === 'low') {
      return 'left';
    }
    return 'right'; // default is right / high
  }

  function buildSimulationResult(head, pathNodes) {
    // pathNodes: array of objects { to: number, isBoundary: boolean, isJump: boolean, customExplanation?: string }
    const serviceOrder = [head];
    const movements = [];
    const steps = [];
    let totalMovement = 0;
    let currentHead = head;

    // Track remaining unserviced requests
    let remainingRequests = pathNodes
      .filter(node => !node.isBoundary && !node.isJump)
      .map(node => node.to);

    pathNodes.forEach((node) => {
      const target = node.to;
      const dist = Math.abs(target - currentHead);

      serviceOrder.push(target);
      movements.push(dist);
      totalMovement += dist;

      if (!node.isBoundary && !node.isJump) {
        const foundIndex = remainingRequests.indexOf(target);
        if (foundIndex !== -1) {
          remainingRequests.splice(foundIndex, 1);
        }
      }

      let explanation = node.customExplanation;
      if (!explanation) {
        if (node.isBoundary) {
          explanation = `Head moves from ${currentHead} to disk boundary ${target}. Distance: ${dist} cylinders.`;
        } else if (node.isJump) {
          explanation = `Head jumps from ${currentHead} to ${target} without servicing. Distance: ${dist} cylinders.`;
        } else {
          explanation = `Head moves from ${currentHead} to ${target} (serviced). Distance: ${dist} cylinders.`;
        }
      }

      steps.push({
        from: currentHead,
        to: target,
        movement: dist,
        remaining: [...remainingRequests],
        explanation
      });

      currentHead = target;
    });

    const avgMovement = movements.length > 0 ? Number((totalMovement / movements.length).toFixed(2)) : 0;

    return {
      serviceOrder,
      movements,
      totalMovement,
      avgMovement,
      steps
    };
  }

  /**
   * First-Come, First-Served (FCFS)
   */
  window.runDiskFCFS = function (initialHead, requests, diskSize) {
    const { head, reqList } = parseInputs(initialHead, requests, diskSize);
    const pathNodes = reqList.map(req => ({
      to: req,
      isBoundary: false,
      isJump: false,
      customExplanation: `Head moves from {FROM} to ${req} (next request in queue). Distance: {DIST} cylinders.`
    }));

    // Post-format explanation placeholders
    const result = buildSimulationResult(head, pathNodes);
    result.steps.forEach(step => {
      step.explanation = `Head moves from ${step.from} to ${step.to} (next in arrival queue). Distance: ${step.movement} cylinders.`;
    });
    return result;
  };

  /**
   * Shortest Seek Time First (SSTF)
   */
  window.runDiskSSTF = function (initialHead, requests, diskSize) {
    const { head, reqList } = parseInputs(initialHead, requests, diskSize);
    const pending = [...reqList];
    const pathNodes = [];
    let current = head;

    while (pending.length > 0) {
      let closestIdx = 0;
      let minDistance = Math.abs(pending[0] - current);

      for (let i = 1; i < pending.length; i++) {
        const d = Math.abs(pending[i] - current);
        if (d < minDistance) {
          minDistance = d;
          closestIdx = i;
        }
      }

      const nextTrack = pending.splice(closestIdx, 1)[0];
      pathNodes.push({
        to: nextTrack,
        isBoundary: false,
        isJump: false,
        customExplanation: `Head moves from ${current} to ${nextTrack} (nearest request). Distance: ${minDistance} cylinders.`
      });
      current = nextTrack;
    }

    return buildSimulationResult(head, pathNodes);
  };

  /**
   * SCAN (Elevator Algorithm)
   */
  window.runDiskSCAN = function (initialHead, requests, diskSize, direction) {
    const { head, reqList, maxCylinders } = parseInputs(initialHead, requests, diskSize);
    const dir = normalizeDirection(direction);
    const maxTrack = maxCylinders - 1;

    const leftTracks = reqList.filter(r => r < head).sort((a, b) => b - a); // descending
    const rightTracks = reqList.filter(r => r >= head).sort((a, b) => a - b); // ascending

    const pathNodes = [];

    if (dir === 'right') {
      rightTracks.forEach(t => pathNodes.push({ to: t, isBoundary: false, isJump: false }));
      if (leftTracks.length > 0) {
        // Move to right boundary then reverse
        if (pathNodes.length === 0 || pathNodes[pathNodes.length - 1].to !== maxTrack) {
          pathNodes.push({ to: maxTrack, isBoundary: true, isJump: false, customExplanation: `Head reaches disk end boundary at cylinder ${maxTrack} and reverses direction to left.` });
        }
        leftTracks.forEach(t => pathNodes.push({ to: t, isBoundary: false, isJump: false }));
      }
    } else {
      // dir === 'left'
      leftTracks.forEach(t => pathNodes.push({ to: t, isBoundary: false, isJump: false }));
      if (rightTracks.length > 0) {
        // Move to left boundary (0) then reverse
        if (pathNodes.length === 0 || pathNodes[pathNodes.length - 1].to !== 0) {
          pathNodes.push({ to: 0, isBoundary: true, isJump: false, customExplanation: `Head reaches disk start boundary at cylinder 0 and reverses direction to right.` });
        }
        rightTracks.forEach(t => pathNodes.push({ to: t, isBoundary: false, isJump: false }));
      }
    }

    return buildSimulationResult(head, pathNodes);
  };

  /**
   * C-SCAN (Circular SCAN)
   */
  window.runDiskCSCAN = function (initialHead, requests, diskSize, direction) {
    const { head, reqList, maxCylinders } = parseInputs(initialHead, requests, diskSize);
    const dir = normalizeDirection(direction);
    const maxTrack = maxCylinders - 1;

    const leftTracks = reqList.filter(r => r < head).sort((a, b) => a - b); // ascending
    const rightTracks = reqList.filter(r => r >= head).sort((a, b) => a - b); // ascending
    const pathNodes = [];

    if (dir === 'right') {
      rightTracks.forEach(t => pathNodes.push({ to: t, isBoundary: false, isJump: false }));
      if (leftTracks.length > 0) {
        if (pathNodes.length === 0 || pathNodes[pathNodes.length - 1].to !== maxTrack) {
          pathNodes.push({ to: maxTrack, isBoundary: true, isJump: false, customExplanation: `Head reaches high boundary ${maxTrack}.` });
        }
        // Jump to boundary 0
        pathNodes.push({ to: 0, isBoundary: true, isJump: true, customExplanation: `Head returns directly to cylinder 0 (circular wrap) without servicing.` });
        leftTracks.forEach(t => pathNodes.push({ to: t, isBoundary: false, isJump: false }));
      }
    } else {
      // left direction
      const leftDesc = reqList.filter(r => r <= head).sort((a, b) => b - a);
      const rightDesc = reqList.filter(r => r > head).sort((a, b) => b - a);

      leftDesc.forEach(t => pathNodes.push({ to: t, isBoundary: false, isJump: false }));
      if (rightDesc.length > 0) {
        if (pathNodes.length === 0 || pathNodes[pathNodes.length - 1].to !== 0) {
          pathNodes.push({ to: 0, isBoundary: true, isJump: false, customExplanation: `Head reaches cylinder 0.` });
        }
        pathNodes.push({ to: maxTrack, isBoundary: true, isJump: true, customExplanation: `Head wraps around to highest cylinder ${maxTrack} without servicing.` });
        rightDesc.forEach(t => pathNodes.push({ to: t, isBoundary: false, isJump: false }));
      }
    }

    return buildSimulationResult(head, pathNodes);
  };

  /**
   * LOOK Algorithm
   */
  window.runDiskLOOK = function (initialHead, requests, diskSize, direction) {
    const { head, reqList } = parseInputs(initialHead, requests, diskSize);
    const dir = normalizeDirection(direction);

    const leftTracks = reqList.filter(r => r < head).sort((a, b) => b - a); // descending
    const rightTracks = reqList.filter(r => r >= head).sort((a, b) => a - b); // ascending
    const pathNodes = [];

    if (dir === 'right') {
      rightTracks.forEach(t => pathNodes.push({ to: t, isBoundary: false, isJump: false }));
      if (leftTracks.length > 0 && rightTracks.length > 0) {
        leftTracks.forEach((t, idx) => {
          pathNodes.push({
            to: t,
            isBoundary: false,
            isJump: false,
            customExplanation: idx === 0 ? `Head reached last request going right, reverses toward remaining requests on the left at cylinder ${t}.` : undefined
          });
        });
      } else if (leftTracks.length > 0) {
        leftTracks.forEach(t => pathNodes.push({ to: t, isBoundary: false, isJump: false }));
      }
    } else {
      // dir === 'left'
      leftTracks.forEach(t => pathNodes.push({ to: t, isBoundary: false, isJump: false }));
      if (rightTracks.length > 0 && leftTracks.length > 0) {
        rightTracks.forEach((t, idx) => {
          pathNodes.push({
            to: t,
            isBoundary: false,
            isJump: false,
            customExplanation: idx === 0 ? `Head reached last request going left, reverses toward remaining requests on the right at cylinder ${t}.` : undefined
          });
        });
      } else if (rightTracks.length > 0) {
        rightTracks.forEach(t => pathNodes.push({ to: t, isBoundary: false, isJump: false }));
      }
    }

    return buildSimulationResult(head, pathNodes);
  };

  /**
   * C-LOOK Algorithm
   */
  window.runDiskCLOOK = function (initialHead, requests, diskSize, direction) {
    const { head, reqList } = parseInputs(initialHead, requests, diskSize);
    const dir = normalizeDirection(direction);

    const leftTracks = reqList.filter(r => r < head).sort((a, b) => a - b); // ascending
    const rightTracks = reqList.filter(r => r >= head).sort((a, b) => a - b); // ascending
    const pathNodes = [];

    if (dir === 'right') {
      rightTracks.forEach(t => pathNodes.push({ to: t, isBoundary: false, isJump: false }));
      if (leftTracks.length > 0) {
        leftTracks.forEach((t, idx) => {
          pathNodes.push({
            to: t,
            isBoundary: false,
            isJump: idx === 0,
            customExplanation: idx === 0 ? `Head reached end of right scan, jumps directly to lowest request at cylinder ${t} (C-LOOK wrap).` : undefined
          });
        });
      }
    } else {
      // left direction
      const leftDesc = reqList.filter(r => r <= head).sort((a, b) => b - a);
      const rightDesc = reqList.filter(r => r > head).sort((a, b) => b - a);

      leftDesc.forEach(t => pathNodes.push({ to: t, isBoundary: false, isJump: false }));
      if (rightDesc.length > 0) {
        rightDesc.forEach((t, idx) => {
          pathNodes.push({
            to: t,
            isBoundary: false,
            isJump: idx === 0,
            customExplanation: idx === 0 ? `Head reached end of left scan, jumps directly to highest request at cylinder ${t} (C-LOOK wrap).` : undefined
          });
        });
      }
    }

    return buildSimulationResult(head, pathNodes);
  };
})();
