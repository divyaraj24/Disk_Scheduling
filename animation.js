// Import algorithm
import { runAlgorithm } from './algorithm.js';

// Canvas setup
const canvas = document.getElementById('diskCanvas');
const ctx = canvas.getContext('2d');
const MAX_CANVAS_WIDTH = 1000;
const PADDING = 50;

// Draw grid
function drawGrid(maxCylinder, xPointsCount) {
    const parentWidth = canvas.parentElement.clientWidth;
    canvas.width = Math.min(parentWidth, MAX_CANVAS_WIDTH);
    canvas.height = 500;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const plotWidth = canvas.width - 2 * PADDING;
    const plotHeight = canvas.height - 2 * PADDING;

    // Y-axis
    ctx.strokeStyle = '#9ca3af';
    ctx.fillStyle = '#1f2937';
    ctx.font = '12px Inter';
    ctx.textAlign = 'right';

    const steps = 5;
    for (let i = 0; i < steps; i++) {
        const cylinder = Math.round((i / (steps - 1)) * maxCylinder);
        const y = PADDING + plotHeight * (1 - (cylinder / maxCylinder));
        ctx.beginPath();
        ctx.moveTo(PADDING, y);
        ctx.lineTo(PADDING + plotWidth, y);
        ctx.stroke();
        ctx.fillText(cylinder, PADDING - 10, y + 4);
    }

    // X-axis
    ctx.textAlign = 'center';
    for (let i = 0; i <= xPointsCount; i++) {
        const x = PADDING + (i / xPointsCount) * plotWidth;
        ctx.beginPath();
        ctx.moveTo(x, canvas.height - PADDING);
        ctx.lineTo(x, canvas.height - PADDING + 5);
        ctx.stroke();
        ctx.fillText(i, x, canvas.height - PADDING + 20);
    }

    // Labels
    ctx.textAlign = 'left';
    ctx.fillText('Cylinder Number', 10, 15);
    ctx.textAlign = 'center';
    ctx.fillText('Access Sequence Index', canvas.width / 2, canvas.height - 10);
}

// Map cylinder → Y
function getY(cylinder, maxCylinder) {
    const plotHeight = canvas.height - 2 * PADDING;
    return PADDING + plotHeight * (1 - (cylinder / maxCylinder));
}

// Map index → X
function getX(index, xPointsCount) {
    const plotWidth = canvas.width - 2 * PADDING;
    return PADDING + (index / xPointsCount) * plotWidth;
}

// Visualizer
class DiskSchedulerVisualizer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.animationFrameId = null;
        this.isRunning = false;
        this.currentStep = 0;
        this.maxSteps = 0;
        this.sequence = [];
        this.maxCylinder = 0;
       	this.totalMovement = 0;
        this.animationDelay = 500;
    }

    load(sequence, movement, maxCylinder) {
        this.sequence = sequence;
        this.totalMovement = movement;
        this.maxCylinder = maxCylinder;
        this.currentStep = 0;
        this.maxSteps = sequence.length - 1;
        this.updateStatistics();
        this.resetAnimation();
        this.enableControls();
    }

    updateStatistics() {
        document.getElementById('stat-algo').textContent = document.getElementById('algorithm').value;
        document.getElementById('stat-movement').textContent = this.totalMovement.toLocaleString();
        document.getElementById('stat-sequence').textContent = this.sequence.join(' → ');
        document.getElementById('stat-step').textContent = `${this.currentStep} / ${this.maxSteps}`;

        const currentHead = this.sequence[this.currentStep] ?? 'N/A';
        document.getElementById('stat-head').textContent = currentHead;

        const remaining = this.sequence.slice(this.currentStep + 1);
        document.getElementById('stat-remaining').textContent = remaining.join(', ') || 'DONE';
    }

    enableControls() {
        document.getElementById('play-pause-btn').disabled = false;
        document.getElementById('step-forward-btn').disabled = (this.currentStep >= this.maxSteps);
        document.getElementById('step-backward-btn').disabled = (this.currentStep <= 0);
        document.getElementById('reset-btn').disabled = false;
    }

    resetAnimation() {
        this.pause();
        this.currentStep = 0;
        this.draw(this.currentStep);
        this.updateStatistics();
        this.enableControls();
        document.getElementById('play-pause-btn').textContent = 'Play';
    }

    draw(step) {
        if (this.sequence.length < 2) {
            drawGrid(this.maxCylinder, 0);
            this.ctx.fillText("Not enough data.", this.canvas.width / 2, this.canvas.height / 2);
            return;
        }

        const xPointsCount = this.sequence.length - 1;
        drawGrid(this.maxCylinder, xPointsCount);

        // Path
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#2563eb';
        this.ctx.beginPath();
        for (let i = 0; i <= step; i++) {
            const x = getX(i, xPointsCount);
            const y = getY(this.sequence[i], this.maxCylinder);
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();

        // --- Show movement difference labels ---
        this.ctx.fillStyle = '#111827';
        this.ctx.font = '13px Inter';
        this.ctx.textAlign = 'center';
        for (let i = 1; i <= step; i++) {
            const prevX = getX(i - 1, xPointsCount);
            const prevY = getY(this.sequence[i - 1], this.maxCylinder);
            const currX = getX(i, xPointsCount);
            const currY = getY(this.sequence[i], this.maxCylinder);

            const diff = Math.abs(this.sequence[i] - this.sequence[i - 1]);

            // Position label at midpoint of line
            const midX = (prevX + currX) / 2;
            const midY = (prevY + currY) / 2 - 10;

            this.ctx.fillStyle = 'rgba(81, 255, 0, 0.8)';
            const text = `${diff}`;
            const textWidth = this.ctx.measureText(text).width;
            this.ctx.fillRect(midX - textWidth / 2 - 3, midY - 10, textWidth + 6, 16);

            // Draw the text
            this.ctx.fillStyle = '#111827';
            this.ctx.fillText(text, midX, midY);
        }

        // Points
        for (let i = 0; i < this.sequence.length; i++) {
            const x = getX(i, xPointsCount);
            const y = getY(this.sequence[i], this.maxCylinder);

            const isCurrent = i === step;
            const isPassed = i < step;
            this.ctx.fillStyle = isCurrent ? '#ef4444' : (isPassed ? '#10b981' : '#f59e0b');
            this.ctx.beginPath();
            this.ctx.arc(x, y, isCurrent ? 6 : 4, 0, 2 * Math.PI);
            this.ctx.fill();

            this.ctx.fillStyle = '#1f2937';
            this.ctx.textAlign = 'center';
            this.ctx.font = '14px Inter';
            this.ctx.fillText(this.sequence[i], x, y - 10);
        }
        this.updateStatistics();
    }

    stepForward() {
        if (this.currentStep < this.maxSteps) {
            this.currentStep++;
            this.draw(this.currentStep);
        } else this.pause();
        this.enableControls();
    }

    stepBackward() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.draw(this.currentStep);
        }
        this.enableControls();
    }

    play() {
        if (this.currentStep >= this.maxSteps) this.currentStep = 0;
        this.isRunning = true;
        document.getElementById('play-pause-btn').textContent = 'Pause';
        this.loop();
    }

    pause() {
        this.isRunning = false;
        if (this.animationFrameId) {
            clearTimeout(this.animationFrameId);
            this.animationFrameId = null;
        }
        document.getElementById('play-pause-btn').textContent = 'Play';
    }

    loop() {
        if (!this.isRunning || this.currentStep >= this.maxSteps) {
            this.pause();
            return;
        }
        this.stepForward();
        this.animationFrameId = setTimeout(() => this.loop(), this.animationDelay);
    }
}

// Instance
const visualizer = new DiskSchedulerVisualizer(canvas, ctx);

// Initialise at the start and add values to the graph
window.onload = () => {
    document.getElementById('calculate-btn').click();
    window.addEventListener('resize', () => {
        visualizer.draw(visualizer.currentStep);
    });
};

// Calculate
document.getElementById('calculate-btn').addEventListener('click', () => {
    const queueStr = document.getElementById('queue').value;
    const head = parseInt(document.getElementById('head').value);
    const diskSize = parseInt(document.getElementById('diskSize').value);
    const algorithm = document.getElementById('algorithm').value;
    const direction = document.getElementById('direction').value;

    if (isNaN(head) || isNaN(diskSize) || diskSize <= 0) {
        console.error("Invalid input");
        return;
    }

    const { sequence, movement } = runAlgorithm(queueStr, head, diskSize, algorithm, direction);

    if (sequence.length < 1) {
        drawGrid(diskSize, 0);
        ctx.fillText("No valid requests.", canvas.width / 2, canvas.height / 2);
        return;
    }

    document.getElementById('visualization-title').textContent = `Disk Scheduling - ${algorithm}`;
    visualizer.load(sequence, movement, diskSize);
});

// Controls
document.getElementById('play-pause-btn').addEventListener('click', () => {
    visualizer.isRunning ? visualizer.pause() : visualizer.play();
});
document.getElementById('step-forward-btn').addEventListener('click', () => {
    visualizer.pause();
    visualizer.stepForward();
});
document.getElementById('step-backward-btn').addEventListener('click', () => {
    visualizer.pause();
    visualizer.stepBackward();
});
document.getElementById('reset-btn').addEventListener('click', () => {
    visualizer.resetAnimation();
});

// Speed Adjustment
const speedInput = document.getElementById('speed');
const speedValueDisplay = document.getElementById('speed-value');
speedInput.addEventListener('input', () => {
    visualizer.animationDelay = parseInt(speedInput.value);
    speedValueDisplay.textContent = `${speedInput.value} ms`;
    if (visualizer.isRunning) {
        visualizer.pause();
        visualizer.play();
    }
});

// Export Screenshot
document.getElementById('export-btn').addEventListener('click', () => {
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `DiskScheduling_${document.getElementById('algorithm').value}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Enter to calculate
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('calculate-btn').click();
        }
    });
});
