// LearnSection.js
// Expose as window.LearnSection React component
(function() {
  'use strict';

  const { useState, useMemo } = React;

  // Comprehensive knowledge database for all algorithms
  const ALGORITHM_KNOWLEDGE = {
    // -------------------------------------------------------------------------
    // CPU Scheduling
    // -------------------------------------------------------------------------
    FCFS: {
      categoryKey: 'CPU',
      name: 'FCFS',
      fullName: 'First Come First Serve',
      category: 'CPU Scheduling',
      description: 'First Come First Serve (FCFS) is the simplest, non-preemptive CPU scheduling algorithm where the process that requests the CPU first is allocated the CPU first. Processes are managed in a strict FIFO queue according to their arrival times.',
      howItWorks: 'The CPU scheduler dispatches processes strictly in arrival order. Once a process gets the CPU, it runs to completion (or until it blocks for I/O) without interruption.',
      steps: [
        'Place incoming processes into a FIFO ready queue as they arrive.',
        'Select the process at the head of the queue when the CPU becomes idle.',
        'Execute the selected process non-preemptively until completion.',
        'Calculate completion, turnaround, and waiting times before dispatching the next process.'
      ],
      advantages: [
        'Very simple to understand, implement, and maintain.',
        'Zero scheduling overhead since no dynamic priorities or remaining times need re-evaluation.',
        'Guarantees fairness in arrival order; starvation is impossible.'
      ],
      disadvantages: [
        'Convoy Effect: Short processes must wait behind long CPU-burst processes.',
        'High and unpredictable average waiting time compared to shortest-job alternatives.',
        'Not suitable for interactive or time-sharing operating systems.'
      ],
      timeComplexity: 'O(n log n)',
      spaceComplexity: 'O(n)',
      realWorldUse: 'Used in batch processing systems, basic FIFO job queues, and printer spooling buffers where turnaround predictability is secondary.',
      whenToUse: 'Ideal for simple embedded microcontrollers, background batch jobs with uniform execution times, or systems with minimal compute overhead.'
    },

    SJF: {
      categoryKey: 'CPU',
      name: 'SJF',
      fullName: 'Shortest Job First (Non-Preemptive)',
      category: 'CPU Scheduling',
      description: 'Shortest Job First (SJF) is a non-preemptive scheduling policy that selects the process with the smallest CPU burst time from the ready queue. When CPU bursts are identical, FCFS is used as a tie-breaker.',
      howItWorks: 'Whenever the CPU becomes idle, the scheduler scans all arrived processes in the ready queue, identifies the one with the shortest expected burst, and executes it to completion.',
      steps: [
        'Track all arrived processes waiting in the ready pool.',
        'Pick the process with the minimum CPU burst time.',
        'Allocate the CPU non-preemptively to this process until it completes.',
        'Repeat the selection process for remaining uncompleted processes.'
      ],
      advantages: [
        'Provably optimal for minimizing the average waiting time among non-preemptive algorithms.',
        'Provides rapid throughput for collections of short tasks.',
        'Simple logic once burst times are known.'
      ],
      disadvantages: [
        'Future CPU burst duration cannot generally be predicted in advance for interactive systems.',
        'Risk of starvation for long processes if a continuous stream of short processes arrives.',
        'Lack of preemption means a long job starting right before a short job cannot be paused.'
      ],
      timeComplexity: 'O(n log n)',
      spaceComplexity: 'O(n)',
      realWorldUse: 'Long-term job scheduling in supercomputing clusters where users explicitly declare estimated computation runtimes with job submissions.',
      whenToUse: 'Use in batch workflows or compile servers where execution lengths are known beforehand or can be accurately estimated using exponential averaging.'
    },

    SRTF: {
      categoryKey: 'CPU',
      name: 'SRTF',
      fullName: 'Shortest Remaining Time First',
      category: 'CPU Scheduling',
      description: 'Shortest Remaining Time First (SRTF) is the preemptive counterpart of Shortest Job First. At every time unit or process arrival, the process with the least remaining execution time preempts the currently running job.',
      howItWorks: 'The scheduler continually evaluates the remaining burst of the active process against new arrivals. If any arrived process has a shorter remaining burst than what remains on the current job, context switching occurs.',
      steps: [
        'Track the remaining execution time of each active process.',
        'When a new process arrives, compare its burst time against the running process\'s remaining burst.',
        'If the incoming process has a shorter burst, preempt the current process and place it back in the ready queue.',
        'Dispatch the process with the minimum remaining execution time.',
        'Repeat at every clock tick or arrival event until all processes finish.'
      ],
      advantages: [
        'Produces the absolute minimal average waiting time among all scheduling algorithms.',
        'Short interactive processes receive immediate responsiveness without waiting behind long background jobs.',
        'Dynamically adapts to newly arriving urgent bursts.'
      ],
      disadvantages: [
        'Higher context switching overhead due to frequent preemption.',
        'Starvation of long jobs can persist indefinitely under high load.',
        'Requires real-time tracking of remaining burst times.'
      ],
      timeComplexity: 'O(n log n)',
      spaceComplexity: 'O(n)',
      realWorldUse: 'Real-time event loops, network packet schedulers, and high-frequency dispatchers prioritizing short control packets over bulk transfers.',
      whenToUse: 'Best when low latency for short jobs is critical and context switching costs are negligible.'
    },

    'Priority NP': {
      categoryKey: 'CPU',
      name: 'Priority NP',
      fullName: 'Priority Scheduling (Non-Preemptive)',
      category: 'CPU Scheduling',
      description: 'Non-Preemptive Priority Scheduling assigns a priority rank to each process. The CPU is allocated to the ready process with the highest priority (conventionally smallest numerical rank) until completion.',
      howItWorks: 'When the CPU becomes available, the scheduler selects the waiting process with the highest priority rank. Once granted the CPU, the process executes without interruption.',
      steps: [
        'Assign numeric priority levels to each incoming process.',
        'Filter the ready queue for processes that have arrived.',
        'Select the process with highest priority (lowest integer value).',
        'Run the chosen process to completion before re-evaluating priority queue.'
      ],
      advantages: [
        'Provides deterministic control over task execution order based on application importance.',
        'Well-suited for systems where certain mission-critical processes must take precedence.',
        'Zero preemption overhead during task execution.'
      ],
      disadvantages: [
        'Indefinite blocking (starvation): Low-priority processes may never execute if high-priority processes keep arriving.',
        'A high-priority process arriving just after a low-priority task begins must wait until that task finishes.',
        'Requires aging mechanisms to prevent indefinite starvation.'
      ],
      timeComplexity: 'O(n log n)',
      spaceComplexity: 'O(n)',
      realWorldUse: 'Automotive and avionics control units where safety-critical telemetry loops run ahead of diagnostic logging.',
      whenToUse: 'When processes have static, well-defined importance levels and tasks run short, bounded bursts.'
    },

    'Priority P': {
      categoryKey: 'CPU',
      name: 'Priority P',
      fullName: 'Priority Scheduling (Preemptive)',
      category: 'CPU Scheduling',
      description: 'Preemptive Priority Scheduling immediately interrupts the running process if a newly arrived process possesses a higher priority (lower priority number).',
      howItWorks: 'Whenever a process arrives, its priority is compared to the currently running process. If higher, the running process is suspended and returned to the ready queue, granting the CPU to the new arrival.',
      steps: [
        'Maintain a prioritized ready queue of arrived processes.',
        'Run the highest priority process on the CPU.',
        'On every new arrival, check if its priority exceeds the current process\'s priority.',
        'If yes, preempt the CPU immediately, save state, and dispatch the higher-priority job.',
        'Resume preempted jobs when higher-priority work finishes.'
      ],
      advantages: [
        'Instantaneous responsiveness for mission-critical or emergency tasks.',
        'Guarantees high-priority jobs never wait for lower-priority jobs to finish.',
        'Supports strict real-time deadline guarantees.'
      ],
      disadvantages: [
        'Increased context-switch frequency leads to CPU performance overhead.',
        'Severe risk of starvation for low-priority processes without aging.',
        'Susceptible to priority inversion when synchronization locks are involved.'
      ],
      timeComplexity: 'O(n log n)',
      spaceComplexity: 'O(n)',
      realWorldUse: 'Real-Time Operating Systems (RTOS) like FreeRTOS, VxWorks, and QNX for industrial automation, medical equipment, and flight control.',
      whenToUse: 'Mandatory in hard real-time systems where deadline guarantees override fairness considerations.'
    },

    'Round Robin': {
      categoryKey: 'CPU',
      name: 'Round Robin',
      fullName: 'Round Robin Scheduling (RR)',
      category: 'CPU Scheduling',
      description: 'Round Robin (RR) is a classic preemptive scheduling algorithm designed for time-sharing systems. Each process is allocated a fixed slice of CPU time called a Time Quantum (q) in a cyclic FIFO order.',
      howItWorks: 'Processes take turns on the CPU for up to one time quantum. If a process does not finish within its quantum, it is interrupted, moved to the tail of the ready queue, and the next process is dispatched.',
      steps: [
        'Initialize a circular FIFO queue of ready processes.',
        'Dispatch the head process and start a hardware timer set to the Time Quantum (q).',
        'If the process finishes within the quantum, remove it and calculate completion statistics.',
        'If the timer expires before the process finishes, preempt it and place it at the back of the ready queue.',
        'Repeat continually until all processes complete execution.'
      ],
      advantages: [
        'Inherently fair; starvation is impossible because every process gets a guaranteed CPU slice.',
        'Excellent response time for interactive GUI applications and terminal shells.',
        'Does not require prior knowledge of burst times.'
      ],
      disadvantages: [
        'High context switching overhead if the time quantum is chosen too small.',
        'Degrades to FCFS if the time quantum is larger than the longest burst time.',
        'Average turnaround time can be higher than SJF/SRTF.'
      ],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      realWorldUse: 'Standard time-sharing multi-user operating systems including Linux CFS base slices, Windows interactive desktop scheduling, and web servers.',
      whenToUse: 'General-purpose computing, desktop operating systems, and any environment where equitable response time is paramount.'
    },

    // -------------------------------------------------------------------------
    // Page Replacement
    // -------------------------------------------------------------------------
    FIFO: {
      categoryKey: 'Page',
      name: 'FIFO',
      fullName: 'First-In, First-Out Page Replacement',
      category: 'Page Replacement',
      description: 'FIFO is the simplest page replacement algorithm. The operating system maintains a queue of all pages in memory; when a page fault occurs and frames are full, the oldest page (the one loaded earliest) is evicted.',
      howItWorks: 'A FIFO queue tracks the residency order of resident frames. When a page must be replaced, the frame at the head of the queue is replaced, and the new page enters at the tail.',
      steps: [
        'On memory access, check if the requested page is already resident in any physical frame (Page Hit).',
        'If not resident (Page Fault), check if an empty frame is available.',
        'If frames are full, evict the page that entered physical memory earliest.',
        'Load the incoming page into the vacated frame and update the FIFO pointer/queue.'
      ],
      advantages: [
        'Extremely easy to understand and implement with low algorithmic overhead.',
        'Minimal hardware assistance required (standard FIFO queue or circular array).',
        'Deterministic replacement behavior.'
      ],
      disadvantages: [
        'Suffers from Belady\'s Anomaly: allocating more physical frames can actually cause more page faults.',
        'Ignores page usage frequency and recency; may repeatedly evict heavily accessed shared libraries.',
        'Poor hit ratio in real-world access patterns.'
      ],
      timeComplexity: 'O(1) per reference',
      spaceComplexity: 'O(f) where f = number of frames',
      realWorldUse: 'Basic memory managers in embedded systems with strict hardware constraints, secondary buffer caches.',
      whenToUse: 'When memory overhead for page bookkeeping must be strictly minimal and access patterns are strictly sequential.'
    },

    LRU: {
      categoryKey: 'Page',
      name: 'LRU',
      fullName: 'Least Recently Used Page Replacement',
      category: 'Page Replacement',
      description: 'LRU replaces the page that has not been referenced for the longest period of time. It exploits the principle of temporal locality: pages accessed recently are very likely to be accessed again soon.',
      howItWorks: 'The operating system monitors references using timestamps or stack manipulation. When eviction is necessary, the page with the oldest last-access timestamp is replaced.',
      steps: [
        'Check if the target page resides in the frame buffer (Hit).',
        'On a hit, update the page\'s recency record (move to most recent position or record timestamp).',
        'On a fault, if frames are filled, identify the page whose last reference is oldest.',
        'Evict that least recently used page and load the requested page in its place.'
      ],
      advantages: [
        'Does NOT suffer from Belady\'s Anomaly (belongs to the class of stack algorithms).',
        'Consistently delivers superior hit ratios matching real software locality characteristics.',
        'Widely considered the golden standard for practical cache replacement.'
      ],
      disadvantages: [
        'Requires specialized hardware support (counters or shift registers) to track access recency efficiently.',
        'Pure LRU software stack updates incur non-trivial overhead on every memory reference.',
        'Pathological performance on loop references that exceed frame capacity.'
      ],
      timeComplexity: 'O(1) with hash-map + doubly linked list',
      spaceComplexity: 'O(f) frames',
      realWorldUse: 'CPU L1/L2/L3 caches, database buffer pools (PostgreSQL/MySQL), browser memory caches, and OS virtual memory approximations (Clock algorithm).',
      whenToUse: 'Ideal for typical desktop and server workloads where temporal locality governs memory references.'
    },

    Optimal: {
      categoryKey: 'Page',
      name: 'Optimal',
      fullName: 'Belady\'s Optimal Page Replacement (OPT / MIN)',
      category: 'Page Replacement',
      description: 'The Optimal algorithm (also known as MIN or Belady\'s algorithm) replaces the page that will not be used for the longest duration of time in the future. It provides the theoretical upper bound on replacement efficiency.',
      howItWorks: 'When eviction is needed, the algorithm inspects future page references. It identifies which resident page has its next reference farthest into the future (or never again) and replaces it.',
      steps: [
        'Detect page hit if reference is in memory.',
        'On a page fault with full frames, look ahead along the entire remaining reference stream.',
        'For each frame in memory, compute the distance until its next future access.',
        'Select the page with the maximum future distance (or one never referenced again) for eviction.',
        'Replace that page with the requested page.'
      ],
      advantages: [
        'Provably guarantees the absolute lowest number of page faults for any fixed number of frames.',
        'Free from Belady\'s Anomaly.',
        'Serves as the universal benchmark to measure how close real-world heuristics come to theoretical perfection.'
      ],
      disadvantages: [
        'Impossible to implement in general-purpose operating systems because future references cannot be known in advance.',
        'High computational cost to scan ahead in simulation environments.'
      ],
      timeComplexity: 'O(f * r) where r = remaining reference string length',
      spaceComplexity: 'O(f) frames',
      realWorldUse: 'Benchmark comparisons in research papers, compiler optimization traces, and offline video/data prefetching where complete playback paths are known.',
      whenToUse: 'In offline analytical studies, post-mortem workload analysis, and deterministic media stream buffering.'
    },

    // -------------------------------------------------------------------------
    // Disk Scheduling
    // -------------------------------------------------------------------------
    'Disk-FCFS': {
      categoryKey: 'Disk',
      name: 'FCFS',
      fullName: 'First Come First Serve (Disk)',
      category: 'Disk Scheduling',
      description: 'Disk FCFS services I/O track requests strictly in the order they arrive in the disk request queue, regardless of current head position or mechanical seek distance.',
      howItWorks: 'The disk arm moves directly from its current track to the cylinder requested by the head item in the queue. Total head movement is the cumulative sum of absolute differences.',
      steps: [
        'Receive disk track read/write requests in queue order.',
        'Move the read/write head from current track to next requested track.',
        'Add absolute seek difference: |target - current| to total head movement.',
        'Repeat until all requests are serviced.'
      ],
      advantages: [
        'Complete fairness: every request is serviced in arrival order; zero starvation.',
        'Trivially easy to implement without queue sorting or repositioning logic.',
        'No computational overhead on the disk controller.'
      ],
      disadvantages: [
        'Produces excessive mechanical head swings across disk platters (wild seek patterns).',
        'Suboptimal total seek time and poor overall disk throughput.',
        'Severely degrades performance under heavy multi-threaded workloads.'
      ],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      realWorldUse: 'Simple embedded flash/SD drivers where physical seek penalties do not exist, and legacy low-throughput storage devices.',
      whenToUse: 'When I/O queue depths are very low (1-2 items) or when mechanical seek latency is absent.'
    },

    SSTF: {
      categoryKey: 'Disk',
      name: 'SSTF',
      fullName: 'Shortest Seek Time First',
      category: 'Disk Scheduling',
      description: 'Shortest Seek Time First selects the request that requires the least head movement from the current position, minimizing mechanical arm seek time for each consecutive step.',
      howItWorks: 'At each step, the disk controller inspects all pending cylinder requests and picks the one with minimum absolute distance |request - currentHead|.',
      steps: [
        'Examine all pending requests remaining in the queue.',
        'Calculate head seek distance for each: |cyl - currentHead|.',
        'Move the head to the closest requested cylinder.',
        'Update total head movement and set current head to the serviced track.',
        'Repeat until all queue items are fulfilled.'
      ],
      advantages: [
        'Substantially reduces total head movement compared to FCFS.',
        'Improves average response time and overall I/O throughput.',
        'Greedy approach is intuitive and efficient.'
      ],
      disadvantages: [
        'Prone to starvation: requests situated at extreme inner or outer tracks may wait indefinitely if local clusters keep arriving.',
        'High variance in response times makes guarantees difficult.',
        'Slightly higher computation per seek step.'
      ],
      timeComplexity: 'O(n²)',
      spaceComplexity: 'O(n)',
      realWorldUse: 'Used in early disk operating systems and localized disk defragmentation scheduling.',
      whenToUse: 'When reducing mechanical wear and seek latency is important and request bursts are short enough to prevent edge starvation.'
    },

    SCAN: {
      categoryKey: 'Disk',
      name: 'SCAN',
      fullName: 'SCAN (Elevator Algorithm)',
      category: 'Disk Scheduling',
      description: 'In the SCAN algorithm, the disk arm starts at one end and moves toward the opposite end, servicing requests as it reaches each cylinder until it hits the physical disk boundary, then reverses direction.',
      howItWorks: 'Behaves exactly like a building elevator: travels in a single direction servicing all pending calls along the way until reaching the bottom/top, then reverses direction and services requests on the return trip.',
      steps: [
        'Sort requests into cylinders.',
        'Determine current travel direction (e.g., towards higher cylinders).',
        'Service requests in ascending order until reaching the physical maximum cylinder (e.g. track 199).',
        'Reverse direction and service remaining requests in descending order.'
      ],
      advantages: [
        'Eliminates starvation: the disk arm sweeps across all cylinders periodically.',
        'Much lower variance in response time compared to SSTF.',
        'High throughput with smooth, unidirectional mechanical sweeping.'
      ],
      disadvantages: [
        'Longer wait for requests just behind the arm\'s current direction of travel.',
        'Unnecessary travel to the extreme edge cylinder (0 or diskSize-1) even if no requests reside there.',
        'Favors middle tracks over boundary tracks.'
      ],
      timeComplexity: 'O(n log n)',
      spaceComplexity: 'O(n)',
      realWorldUse: 'Traditional hard drive firmware (NCQ) and storage array controllers handling heavy mixed sequential/random traffic.',
      whenToUse: 'High-load hard disk environments requiring both high throughput and bounded wait times.'
    },

    'C-SCAN': {
      categoryKey: 'Disk',
      name: 'C-SCAN',
      fullName: 'Circular SCAN',
      category: 'Disk Scheduling',
      description: 'C-SCAN (Circular SCAN) is a variation of SCAN designed to provide a more uniform waiting time. The arm moves in one direction only, servicing requests until the end, then rapidly returns to the beginning without servicing requests on the return trip.',
      howItWorks: 'The disk arm treats cylinders as a circular list. It sweeps from lowest to highest servicing requests, and once it hits the outer boundary, jumps directly back to track 0 and begins sweeping upwards again.',
      steps: [
        'Move the head in a fixed forward direction (e.g., toward max cylinder).',
        'Service all requests encountered along the way.',
        'Upon reaching the disk limit, immediately seek to cylinder 0 without servicing requests during return.',
        'Resume servicing remaining requests in the same forward direction.'
      ],
      advantages: [
        'Provides significantly more uniform waiting times than standard SCAN.',
        'Does not unfairly favor center tracks over outer tracks.',
        'Predictable, consistent response cycle across the entire platter.'
      ],
      disadvantages: [
        'Incurs seek time during the full return stroke across the disk platter.',
        'Still moves all the way to disk boundaries regardless of request boundaries.'
      ],
      timeComplexity: 'O(n log n)',
      spaceComplexity: 'O(n)',
      realWorldUse: 'Enterprise database spindle storage where query response latency must be statistically consistent.',
      whenToUse: 'When uniform response time distribution across all cylinder ranges is mandatory under heavy load.'
    },

    LOOK: {
      categoryKey: 'Disk',
      name: 'LOOK',
      fullName: 'LOOK Disk Scheduling',
      category: 'Disk Scheduling',
      description: 'LOOK is an optimization of the SCAN algorithm. Instead of travelling all the way to the physical boundary (0 or diskSize-1), the disk arm travels only as far as the final request in each direction before reversing.',
      howItWorks: 'The arm looks ahead in the current direction. If no further requests exist ahead, it immediately reverses direction without continuing to the edge of the physical platter.',
      steps: [
        'Sort requests and inspect the highest and lowest cylinder numbers in the queue.',
        'Sweep in current direction servicing requests up to the extreme request in that direction.',
        'Reverse direction immediately without seeking all the way to track 0 or diskSize - 1.',
        'Service remaining requests in reverse direction.'
      ],
      advantages: [
        'Prevents wasted mechanical movement to empty disk boundaries.',
        'Lower total seek time than SCAN.',
        'Maintains SCAN\'s resistance to starvation.'
      ],
      disadvantages: [
        'Slightly more complex controller logic to inspect the queue extrema.',
        'Requests behind the current head direction still experience a round-trip wait.'
      ],
      timeComplexity: 'O(n log n)',
      spaceComplexity: 'O(n)',
      realWorldUse: 'Standard hard disk drive microcode (Western Digital, Seagate Native Command Queuing implementations).',
      whenToUse: 'Preferred default over SCAN for almost all mechanical magnetic storage applications.'
    },

    'C-LOOK': {
      categoryKey: 'Disk',
      name: 'C-LOOK',
      fullName: 'Circular LOOK',
      category: 'Disk Scheduling',
      description: 'C-LOOK combines the unidirectional consistency of C-SCAN with the boundary optimization of LOOK. The arm sweeps only as far as the last request in the forward direction, then returns directly to the lowest requested cylinder.',
      howItWorks: 'Services requests exclusively in one direction up to the highest pending request. It then resets the arm directly to the lowest pending request and resumes forward servicing.',
      steps: [
        'Identify min and max request cylinders in the current queue.',
        'Sweep forward, servicing requests up to the highest requested cylinder.',
        'Jump directly back to the lowest requested cylinder without going to cylinder 0.',
        'Resume servicing remaining requests in the forward direction.'
      ],
      advantages: [
        'Eliminates wasted travel to empty platter edges.',
        'Provides uniform waiting time like C-SCAN with lower total seek movement than both SCAN and C-SCAN.',
        'Highly efficient for high-density I/O traffic.'
      ],
      disadvantages: [
        'Requires continuous evaluation of minimum and maximum queued cylinder positions.',
        'Return seek stroke still expends movement without servicing requests.'
      ],
      timeComplexity: 'O(n log n)',
      spaceComplexity: 'O(n)',
      realWorldUse: 'Modern SAN / NAS array storage schedulers and Linux I/O elevators (Deadline and BFQ schedulers).',
      whenToUse: 'Optimal for multi-tenant server workloads on magnetic media requiring consistent latency and high throughput.'
    },

    // -------------------------------------------------------------------------
    // Memory Allocation
    // -------------------------------------------------------------------------
    'First Fit': {
      categoryKey: 'Memory',
      name: 'First Fit',
      fullName: 'First Fit Memory Allocation',
      category: 'Memory Allocation',
      description: 'First Fit allocates the first available free memory block from the beginning of memory that is large enough to satisfy the process\'s size requirement.',
      howItWorks: 'The memory manager scans memory blocks starting from the very first partition. As soon as it encounters an unallocated block with size >= process size, it places the process in that block.',
      steps: [
        'Start scan at block 0.',
        'Check if the current block is free and its capacity >= process size.',
        'If yes, allocate the process to this block and record internal fragmentation.',
        'If no, move to the next block and repeat until a fit is found or all blocks are exhausted.'
      ],
      advantages: [
        'Fastest search speed among allocation strategies; halts on the first valid block.',
        'Simple logic with low allocator runtime overhead.',
        'Generally produces lower overall external fragmentation than Worst Fit.'
      ],
      disadvantages: [
        'Tends to cluster small fragmented partitions near the beginning of physical memory.',
        'Later allocations must search through numerous small unusable fragments before finding a fit.',
        'Causes internal fragmentation in fixed-partition setups.'
      ],
      timeComplexity: 'O(n) worst case, very fast average case',
      spaceComplexity: 'O(1) auxiliary',
      realWorldUse: 'Kernel heap allocators, basic embedded OS memory pool managers (RTOS), and initial partition allocators.',
      whenToUse: 'When allocation speed and low processor overhead are higher priorities than partition compaction.'
    },

    'Best Fit': {
      categoryKey: 'Memory',
      name: 'Best Fit',
      fullName: 'Best Fit Memory Allocation',
      category: 'Memory Allocation',
      description: 'Best Fit searches the entire list of free blocks and allocates the smallest available partition that is large enough to accommodate the process, minimizing leftover unused space in that block.',
      howItWorks: 'The allocator examines every free partition in memory, computing (blockSize - processSize). It selects the block with the minimum non-negative difference.',
      steps: [
        'Search the entire list of available free memory blocks.',
        'Filter for blocks where blockSize >= processSize.',
        'Identify the block among these with the minimum capacity.',
        'Allocate the process into this optimal block, leaving the smallest possible internal fragmentation.'
      ],
      advantages: [
        'Minimizes internal fragmentation within the chosen individual block.',
        'Preserves larger free blocks for subsequent large process requests.',
        'Memory utilization can be high when requests closely match partition sizes.'
      ],
      disadvantages: [
        'Slower allocation speed because the entire block list must be scanned unless indexed in balanced search trees.',
        'Creates tiny, unusable leftover fragments scattered throughout memory (external fragmentation in dynamic systems).',
        'Fragments created are often too minuscule for any practical subsequent allocation.'
      ],
      timeComplexity: 'O(n) sequential scan (or O(log n) with AVL/red-black trees)',
      spaceComplexity: 'O(1) auxiliary',
      realWorldUse: 'Standard C library heap allocators (dlmalloc / ptmalloc) utilizing segregated free lists organized by size.',
      whenToUse: 'When available block sizes vary widely and preserving massive blocks for rare, huge jobs is vital.'
    },

    'Worst Fit': {
      categoryKey: 'Memory',
      name: 'Worst Fit',
      fullName: 'Worst Fit Memory Allocation',
      category: 'Memory Allocation',
      description: 'Worst Fit allocates the largest available free memory block to the process. The design rationale is that allocating from the largest block will leave behind a remainder partition large enough to remain useful.',
      howItWorks: 'The allocator scans all free memory blocks and chooses the one with the maximum available capacity that satisfies the process requirement.',
      steps: [
        'Scan the full set of free memory blocks.',
        'Identify the block possessing the largest total capacity.',
        'Check if this largest block is >= requested process size.',
        'If yes, allocate the process to this block; if not, declare allocation failure.'
      ],
      advantages: [
        'Leftover remainder space in the allocated block is maximized, increasing the chance it can accommodate another process.',
        'Reduces the emergence of tiny unusable memory slivers characteristic of Best Fit.'
      ],
      disadvantages: [
        'Quickly destroys large contiguous memory blocks needed by subsequent large processes.',
        'Must search through the entire block list on every allocation.',
        'Empirical studies demonstrate it performs worse in overall memory utilization than First Fit and Best Fit.'
      ],
      timeComplexity: 'O(n) full scan (or O(log n) using max-heaps)',
      spaceComplexity: 'O(1) auxiliary',
      realWorldUse: 'Theoretical academic comparisons and specialized memory pools where processes share relatively uniform, medium size footprints.',
      whenToUse: 'Only when workload consists of mostly medium-sized processes and fragmentation into tiny holes must be actively avoided.'
    },

    'Next Fit': {
      categoryKey: 'Memory',
      name: 'Next Fit',
      fullName: 'Next Fit Memory Allocation',
      category: 'Memory Allocation',
      description: 'Next Fit is a modified version of First Fit that begins searching for a free block starting from the location where the previous allocation occurred, rather than restarting from the beginning of memory.',
      howItWorks: 'Maintains a roving pointer to the last allocated partition. Subsequent allocations search sequentially forward from that point in a circular ring, wrapping back to the beginning if necessary.',
      steps: [
        'Resume search from the block index of the last successful allocation.',
        'Check each subsequent block in circular order for sufficient free space.',
        'Allocate into the first block found that fits the process.',
        'Update the pointer position for the next allocation request.'
      ],
      advantages: [
        'Evenly distributes allocations across physical memory space rather than concentrating at the beginning.',
        'Often faster than First Fit on later allocations because it skips over earlier, already-occupied blocks.',
        'Very simple circular pointer logic.'
      ],
      disadvantages: [
        'Breaks up large blocks situated near the end of memory that First Fit would have left untouched.',
        'Can lead to higher overall fragmentation than First Fit in long-running systems.',
        'Does not perform as well as First Fit under varied process size workloads.'
      ],
      timeComplexity: 'O(n) worst case, fast average search',
      spaceComplexity: 'O(1) auxiliary',
      realWorldUse: 'Ring-buffer allocators, high-speed packet buffer pool allocators in network interface controllers (NICs).',
      whenToUse: 'When allocations and deallocations occur in quick succession and scanning through early memory addresses wastes CPU cycles.'
    }
  };

  const CATEGORIES = [
    { key: 'CPU', label: 'CPU Scheduling' },
    { key: 'Page', label: 'Page Replacement' },
    { key: 'Disk', label: 'Disk Scheduling' },
    { key: 'Memory', label: 'Memory Allocation' }
  ];

  window.LearnSection = function LearnSection(props) {
    const [selectedCategory, setSelectedCategory] = useState('CPU');
    const [selectedAlgorithm, setSelectedAlgorithm] = useState('FCFS');

    // Filter algorithm keys belonging to active category
    const algorithmsInCategory = useMemo(() => {
      return Object.keys(ALGORITHM_KNOWLEDGE).filter(
        key => ALGORITHM_KNOWLEDGE[key].categoryKey === selectedCategory
      );
    }, [selectedCategory]);

    // Ensure selectedAlgorithm belongs to current category when category changes
    const handleCategorySelect = (catKey) => {
      setSelectedCategory(catKey);
      const firstInCat = Object.keys(ALGORITHM_KNOWLEDGE).find(
        k => ALGORITHM_KNOWLEDGE[k].categoryKey === catKey
      );
      if (firstInCat) {
        setSelectedAlgorithm(firstInCat);
      }
    };

    const currentAlgo = ALGORITHM_KNOWLEDGE[selectedAlgorithm] || ALGORITHM_KNOWLEDGE['FCFS'];

    return (
      <div className="page" style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div className="page-header" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Operating Systems Knowledge Reference
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Deep-dive theoretical guide, mechanics, complexity trade-offs, and industrial use cases for core OS algorithms.
            </p>
          </div>
        </div>

        {/* Category Selector Tabs */}
        <div className="tab-list" style={{ marginBottom: '1.5rem' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              type="button"
              className={`tab ${selectedCategory === cat.key ? 'active' : ''}`}
              onClick={() => handleCategorySelect(cat.key)}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Main Content: Left Nav + Right Explanation */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 300px) 1fr',
            gap: '1.5rem',
            alignItems: 'start'
          }}
        >
          {/* Left Panel: Algorithm Selector */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <h3>
                <span>Algorithms</span>
              </h3>
              <span className="badge blue">
                {algorithmsInCategory.length} Available
              </span>
            </div>
            <div className="card-body" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {algorithmsInCategory.map(key => {
                const item = ALGORITHM_KNOWLEDGE[key];
                const isSelected = selectedAlgorithm === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedAlgorithm(key)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'transparent'}`,
                      backgroundColor: isSelected ? 'rgba(79, 142, 247, 0.15)' : 'transparent',
                      color: isSelected ? 'var(--accent-blue)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: isSelected ? '#ffffff' : 'inherit' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {item.fullName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Comprehensive Algorithm Explanation */}
          <div className="card" style={{ marginBottom: 0 }}>
            {/* Header / Badges */}
            <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                    {currentAlgo.name}
                  </h3>
                  <span className="badge blue">{currentAlgo.category}</span>
                </div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {currentAlgo.fullName}
                </div>
              </div>

              {/* Complexity Badges */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge purple" title="Time Complexity">
                  Time: {currentAlgo.timeComplexity}
                </span>
                <span className="badge orange" title="Space Complexity">
                  Space: {currentAlgo.spaceComplexity}
                </span>
              </div>
            </div>

            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {/* Description */}
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Overview
                </h4>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  {currentAlgo.description}
                </p>
              </div>

              {/* How it Works & Numbered Steps */}
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  How It Works
                </h4>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem', marginBottom: '1rem' }}>
                  {currentAlgo.howItWorks}
                </p>

                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    padding: '1.25rem'
                  }}
                >
                  <ol style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {currentAlgo.steps.map((step, idx) => (
                      <li key={idx} style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Advantages & Disadvantages Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {/* Advantages */}
                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: 'var(--radius)',
                    padding: '1.25rem'
                  }}
                >
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                    Advantages
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {currentAlgo.advantages.map((adv, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>+</span>
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Disadvantages */}
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: 'var(--radius)',
                    padding: '1.25rem'
                  }}
                >
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-red)', display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                    Disadvantages
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {currentAlgo.disadvantages.map((dis, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        <span style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>-</span>
                        <span>{dis}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Real World Use Case */}
              <div
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '1.25rem'
                }}
              >
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center' }}>
                  Real-World Application
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                  {currentAlgo.realWorldUse}
                </p>
              </div>

              {/* When To Use Tip Box */}
              <div
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  borderLeft: '4px solid var(--accent-orange)',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                  padding: '1rem 1.25rem'
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--accent-orange)', marginBottom: '0.25rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
                  When To Use
                </div>
                <div style={{ color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  {currentAlgo.whenToUse}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
})();
