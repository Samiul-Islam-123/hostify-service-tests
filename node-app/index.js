const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Global array to prevent Garbage Collection (The "Black Hole")
const memoryBlackHole = [];
let iteration = 0;

/* ---------------- THE EXPONENTIAL HOG ---------------- */
// Runs every second, doubling the pressure each time
setInterval(() => {
    iteration++;
    
    // 1. Exponential Memory Growth: 2^iteration
    // We allocate chunks of 50MB, increasing the count exponentially
    const chunksToAllocate = Math.pow(2, iteration); 
    console.log(`[!] Cycle ${iteration}: Allocating ${chunksToAllocate} new 50MB chunks...`);

    try {
        for (let i = 0; i < chunksToAllocate; i++) {
            // Using Buffer.alloc targets Resident Set Size (RSS) directly
            memoryBlackHole.push(Buffer.alloc(50 * 1024 * 1024)); 
        }
    } catch (e) {
        console.error("FATAL: Out of system memory!");
    }

    // 2. CPU Saturation (Blocking the Event Loop)
    // Synchronous loop that runs longer every cycle
    const end = Date.now() + (100 * iteration); 
    while (Date.now() < end) {
        Math.sqrt(Math.random() * Math.random()) / Math.random();
    }

    const usage = process.memoryUsage();
    console.log(`[STATUS] RSS: ${(usage.rss / 1024 / 1024).toFixed(2)} MB | Heap: ${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
}, 1000);

/* ---------------- HEAVY COMPUTATION FUNCTION ---------------- */
function performBruteForceCalc() {
    let result = 0;
    // Massive array creation to stress the V8 Heap
    const data = Array.from({ length: 1000000 }, (_, i) => {
        result += Math.atan(i) * Math.tan(i);
        return result;
    });
    return { 
        sum: result, 
        sample: data.slice(-5),
        loadSize: data.length 
    };
}

/* ---------------- EXPRESS ENDPOINTS ---------------- */

app.get("/", (req, res) => {
    // Every request triggers a heavy calculation
    const calculation = performBruteForceCalc();
    
    // Every request also leaks the calculation result into global memory
    memoryBlackHole.push(calculation);

    res.json({
        message: "High computation complete & memory leaked.",
        result: calculation.sum,
        system_rss_mb: (process.memoryUsage().rss / 1024 / 1024).toFixed(2)
    });
});

app.get("/health", (req, res) => {
    res.send("If you see this, the Event Loop isn't fully dead yet.");
});

app.listen(PORT, () => {
    console.log(`💀 Exponential Hog listening on port ${PORT}`);
    console.log(`WARNING: System instability expected within seconds.`);
});