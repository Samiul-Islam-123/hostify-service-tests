const http = require("http");

const PORT = process.env.PORT || 3000;
let memoryLeak = [];

/* ---------------- EXPONENTIAL MEMORY + CPU HOG ---------------- */
function expand() {
  // 1. Exponential growth: We don't just add, we double the existing leak + a base
  // This will hit GBs of usage extremely fast.
  const currentLen = memoryLeak.length;
  const growthFactor = currentLen === 0 ? 1 : currentLen * 2;
  
  for (let i = 0; i < growthFactor; i++) {
    // Allocating large Buffers outside of the V8 Heap (RSS growth)
    memoryLeak.push(Buffer.alloc(10 * 1024 * 1024)); // 10MB chunks
  }

  // 2. Event Loop Blocking (CPU Hog)
  // We use a while loop that scales with the memory leak to ensure 100% CPU
  const end = Date.now() + (500 + (currentLen * 100)); 
  while (Date.now() < end) {
    Math.pow(Math.random(), Math.random());
  }

  console.log(`[HOG] RSS: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB | Chunks: ${memoryLeak.length}`);
  
  // Exponentially decrease the interval time to create a "death spiral"
  const nextDelay = Math.max(10, 2000 - (currentLen * 500));
  setTimeout(expand, nextDelay);
}

// Start the spiral
expand();

/* ---------------- UPDATED HEAVY CALCULATION ---------------- */
function heavyCalculation() {
  // Create massive local objects that pressure the Garbage Collector
  return Array.from({ length: 1e6 }, () => ({
    data: Math.random(),
    ref: new Array(100).fill("🚀")
  }));
}

/* ---------------- HTTP SERVER ---------------- */
const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.end("STILL ALIVE");
    return;
  }

  // Every request now contributes to the global leak
  if (req.url === "/") {
    const context = heavyCalculation();
    memoryLeak.push(context); // Leak the request data globally

    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ 
        status: "Memory consumed", 
        current_rss: process.memoryUsage().rss 
    }));
    return;
  }

  res.statusCode = 404;
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`💀 Chaos Server running on port ${PORT}`);
  console.log(`[!] Warning: This will consume all available RAM rapidly.`);
});