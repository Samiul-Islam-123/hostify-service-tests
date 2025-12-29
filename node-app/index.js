const http = require("http");

const PORT = process.env.PORT || 3000;
const memoryLeak = [];

/* ---------------- BACKGROUND MEMORY + CPU LOAD ---------------- */
setInterval(() => {
  const sizeMB = 15;
  memoryLeak.push(Buffer.alloc(sizeMB * 1024 * 1024));
  
  const start = Date.now();
  while (Date.now() - start < 200) {
    Math.sqrt(Math.random() * 1e9);
  }

  console.log(
    `[NODE] RSS: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`
  );
}, 2000);

/* ---------------- HEAVY CALCULATION ---------------- */
function heavyCalculation(iterations = 5e6) {
  let result = 0;
  for (let i = 0; i < iterations; i++) {
    result += Math.sqrt(Math.random() * i);
  }
  return result;
}

/* ---------------- HTTP SERVER ---------------- */
const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.end("OK");
    return;
  }

  if (req.url === "/stats") {
    res.end(
      JSON.stringify(
        {
          memoryMB: (process.memoryUsage().rss / 1024 / 1024).toFixed(2),
          uptime: process.uptime(),
          pid: process.pid
        },
        null,
        2
      )
    );
    return;
  }

  if (req.url === "/") {
    const result = heavyCalculation();
    const randomNumbers = Array.from({ length: 10000 }, () =>
      Math.floor(Math.random() * 100000)
    );

    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        message: "Node heavy computation completed",
        calculationResult: result,
        sampleRandomNumbers: randomNumbers.slice(0, 20),
        timestamp: new Date().toISOString()
      })
    );
    return;
  }

  res.statusCode = 404;
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`🔥 Node HTTP Hog running on port ${PORT}`);
});
