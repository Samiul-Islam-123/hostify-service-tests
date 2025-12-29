from flask import Flask, jsonify
import threading
import time
import random
import psutil
import math

app = Flask(__name__)

memory_holder = []

# ---------------- BACKGROUND MEMORY + CPU ----------------
def background_stress():
    while True:
        memory_holder.append(bytearray(40 * 1024 * 1024))  # +40MB
        start = time.time()
        while time.time() - start < 0.4:
            math.sqrt(random.random() * 1e9)

        mem = psutil.Process().memory_info().rss / 1024 / 1024
        print(f"[PYTHON] RSS: {mem:.2f} MB")
        time.sleep(2)

# ---------------- HEAVY CALCULATION ----------------
def heavy_calculation():
    result = 0
    for _ in range(7_000_000):
        result += math.sqrt(random.random() * 1e6)
    return result

# ---------------- ROUTES ----------------
@app.route("/")
def root():
    result = heavy_calculation()
    random_numbers = [random.randint(1, 100000) for _ in range(10000)]

    return jsonify({
        "message": "Python heavy computation completed",
        "calculationResult": result,
        "sampleRandomNumbers": random_numbers[:20],
        "pid": psutil.Process().pid
    })

@app.route("/health")
def health():
    return "OK"

@app.route("/stats")
def stats():
    process = psutil.Process()
    return jsonify({
        "memoryMB": round(process.memory_info().rss / 1024 / 1024, 2),
        "cpuPercent": process.cpu_percent(interval=0.1),
        "uptimeSeconds": time.time() - process.create_time()
    })

# ---------------- MAIN ----------------
if __name__ == "__main__":
    t = threading.Thread(target=background_stress, daemon=True)
    t.start()
    app.run(host="0.0.0.0", port=5000)
