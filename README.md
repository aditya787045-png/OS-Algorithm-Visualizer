# OS Algorithm Visualizer

**Interactive Step-by-Step Visualization of Operating System Algorithms**

The OS Algorithm Visualizer is a web-based educational project designed to help students understand Operating System (OS) algorithms through interactive, step-by-step simulations. It visualizes algorithm execution, explains decisions, and calculates performance metrics to make complex OS concepts easier to understand.

## 📌 Problem Statement

Operating System algorithms are often taught theoretically, making it difficult for students to understand how algorithms make decisions during execution. Traditional learning methods may focus on final results without showing the intermediate steps.

This project addresses the problem by providing an interactive platform that visualizes major OS algorithm categories and explains their execution process.

## 🎯 Objectives

- Visualize 19 OS algorithms across four major categories.
- Display algorithm execution step by step.
- Provide dynamic explanations for algorithm decisions.
- Generate Gantt charts, page-frame tables, disk-head movement paths, and memory allocation visualizations.
- Calculate relevant performance metrics.
- Compare algorithms using user-provided input.
- Provide a learning section containing algorithm descriptions, complexity, advantages, disadvantages, and use cases.

## ✨ Features

- **Step-by-Step Simulation:** Understand how algorithms execute at each step.
- **Interactive Controls:** Play, pause, move forward or backward, and adjust simulation speed.
- **Dynamic Explanations:** Understand why an algorithm makes a particular decision.
- **Visual Gantt Charts:** View CPU scheduling timelines.
- **Page Replacement Visualization:** Track page hits, page faults, and page replacements.
- **Disk Scheduling Visualization:** Observe disk-head movement and request servicing order.
- **Memory Allocation Visualization:** See how processes are allocated to memory blocks.
- **Performance Metrics:** Calculate relevant metrics for each algorithm.
- **Algorithm Comparison:** Compare the performance of selected algorithms.
- **Input Validation:** Detect invalid or incomplete input.
- **Sample and Random Input:** Test algorithms using example or generated data.
- **Learn Section:** Explore algorithm theory, complexity, advantages, limitations, and applications.
- **Dark-Themed Interface:** A modern, developer-friendly user interface.

## 🧠 Algorithms Implemented

The project covers **19 algorithms in four categories**.

### 1. CPU Scheduling — 6 Algorithms

| Algorithm | Description |
|---|---|
| First Come, First Served (FCFS) | Executes processes in arrival order. |
| Shortest Job First (SJF) | Selects the available process with the shortest burst time. |
| Shortest Remaining Time First (SRTF) | Selects the process with the shortest remaining execution time. |
| Non-Preemptive Priority | Selects the available process with the highest priority. |
| Preemptive Priority | Allows a higher-priority process to interrupt the running process. |
| Round Robin (RR) | Allocates CPU time using a fixed time quantum. |

### 2. Page Replacement — 3 Algorithms

- **FIFO (First In, First Out):** Replaces the page that entered memory first.
- **LRU (Least Recently Used):** Replaces the page that has not been used for the longest time.
- **Optimal Page Replacement:** Replaces the page whose next use is farthest in the future.

### 3. Disk Scheduling — 6 Algorithms

- First Come, First Served (FCFS)
- Shortest Seek Time First (SSTF)
- SCAN
- Circular SCAN (C-SCAN)
- LOOK
- Circular LOOK (C-LOOK)

### 4. Memory Allocation — 4 Algorithms

- **First Fit:** Allocates the first suitable memory block.
- **Best Fit:** Allocates the smallest suitable memory block.
- **Worst Fit:** Allocates the largest suitable memory block.
- **Next Fit:** Continues searching from the position of the previous allocation.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Web page structure |
| CSS3 | Styling and responsive interface |
| JavaScript (ES6+) | Algorithm implementation and application logic |
| React 18 | Component-based user interface |
| Babel Standalone | In-browser JSX transpilation |
| Custom SVG / Recharts | Data visualization |
| Lucide Icons | Interface icons |
| localStorage | Storing user preferences |

**Architecture:** Client-side application without a dedicated backend.

## 🏗️ System Architecture

The application follows a modular architecture that separates algorithm logic from user interface components.

```text
                 User Input
                     |
                     v
              React User Interface
                     |
                     v
              Algorithm Engine
                     |
          +----------+----------+
          |          |          |
          v          v          v
       CPU.js    Page Replace   Disk.js
                     |
                     v
                 Memory.js
                     |
                     v
          Simulation Results
                     |
                     v
         Charts, Tables, Metrics
```

Each algorithm processes user input and returns simulation information for visualization. Shared components display results and provide interactive simulation controls.

## 📂 Project Structure

```text
OS/
├── index.html
├── css/
│   └── style.css
└── js/
    ├── app.js
    ├── utils.js
    ├── bundle.js
    ├── algorithms/
    │   ├── cpu.js
    │   ├── pageReplacement.js
    │   ├── disk.js
    │   └── memory.js
    └── components/
        ├── Dashboard.js
        ├── CPUScheduling.js
        ├── PageReplacement.js
        ├── DiskScheduling.js
        ├── MemoryAllocation.js
        ├── Compare.js
        ├── LearnSection.js
        ├── GanttChart.js
        ├── StepPanel.js
        └── SimulationControls.js
```

*Note: This structure reflects the planned project organization. Adjust the file names if your actual repository differs.*

## 🚀 Getting Started

### Prerequisites

- A modern web browser such as Google Chrome, Microsoft Edge, or Firefox.
- The project source files.

### Run Locally

1. Clone the repository:

   ```bash
   git clone https://github.com/aditya787045-png/OS-Algorithm-Visualizer.git
   ```

2. Open the project folder:

   ```bash
   cd OS-Algorithm-Visualizer
   ```

3. Open `index.html` in your browser.

The project is designed to run as a static web application without requiring a separate backend server or a build step.

> If the application uses external CDN resources, an internet connection may be required for those resources to load.

## 📊 Performance Metrics

### CPU Scheduling

- Completion Time (CT)
- Turnaround Time (TAT)
- Waiting Time (WT)
- Response Time (RT)
- Average Waiting Time
- Average Turnaround Time
- Average Response Time
- CPU Utilization
- Throughput

### Page Replacement

- Total Page Faults
- Total Page Hits
- Hit Ratio
- Fault Ratio

### Disk Scheduling

- Total Head Movement
- Average Seek Distance
- Service Order

### Memory Allocation

- Allocated and unallocated processes
- Internal fragmentation
- Memory utilization

## 🧪 Testing and Verification

The project includes example inputs and supports testing across its algorithm categories.

Testing can be performed by:

1. Entering process, page-reference, disk-request, or memory-block data.
2. Selecting an algorithm.
3. Running the simulation.
4. Checking the execution visualization and calculated metrics.
5. Comparing results with manually calculated examples.

Invalid inputs, such as negative burst times, invalid time quantum values, and out-of-range disk requests, should be tested to verify input validation.

## ⚠️ Limitations

- The current architecture is client-side and does not use a dedicated backend.
- The application simulates OS algorithms rather than interacting with a live operating system.
- A synchronization module is not included in the documented scope.
- Some external resources may require an internet connection.

## 🔮 Future Enhancements

- Add synchronization algorithms, including Producer–Consumer, Reader–Writer, and Dining Philosophers.
- Add backend integration for accounts and simulation history.
- Allow exporting charts and results as PDF or PNG.
- Introduce a dark/light theme toggle.
- Extend support to additional algorithms, including Multilevel Queue and Multilevel Feedback Queue scheduling.
- Add quiz mode for interactive learning.
- Explore a Progressive Web App (PWA) or mobile application.

## 📚 References

1. Abraham Silberschatz, Peter B. Galvin, and Greg Gagne, *Operating System Concepts*, 10th Edition.
2. William Stallings, *Operating Systems: Internals and Design Principles*, 9th Edition.
3. Andrew S. Tanenbaum, *Modern Operating Systems*, 4th Edition.
4. [React Documentation](https://react.dev/)
5. [MDN Web Docs](https://developer.mozilla.org/)

## 👥 Team

- **Team Member 1: Aditya Kumar Sahu -[24BAI0128]
- **Team Member 2: Rishav Kumar Manjhi - [24BAI0001]
- **Team Member 3: Priyanshu Raj

## 📄 License

No license has been specified yet. Add an appropriate license if you intend to permit others to reuse, modify, or distribute the project.

---

**OS Algorithm Visualizer — Learn Operating System Algorithms Visually.**
