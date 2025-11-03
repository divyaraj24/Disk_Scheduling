// --- Disk Scheduling Algorithms ---

/** FCFS: Serve requests in given order */
function fcfs(queue, head) {
    return [head, ...queue];
}

/** SSTF: Always pick the closest pending cylinder */
function sstf(queue, head) {
    const sequence = [head];
    let currentHead = head;

    while (queue.length > 0) {
        // Find request with minimum distance from current head
        let shortestDistance = Infinity;
        let nextRequestIndex = -1;

        for (let i = 0; i < queue.length; i++) {
            const distance = Math.abs(queue[i] - currentHead);
            if (distance < shortestDistance) {
                shortestDistance = distance;
                nextRequestIndex = i;
            }
        }

        // Move head to selected request
        currentHead = queue[nextRequestIndex];
        sequence.push(currentHead);

        // Remove served request
        queue.splice(nextRequestIndex, 1);
    }
    return sequence;
}

/**
 * Direction-based algorithms: SCAN, C-SCAN, LOOK, C-LOOK
 */
function runDirectionalAlgorithm(algorithm, queue, head, maxCylinder, direction) {
    const sequence = [head];
    let requests = [...new Set(queue)].sort((a, b) => a - b);    // Unique + sorted list

    const goingUp = direction === 'up';

    // Split requests above and below head
    let upper = requests.filter(r => r >= head).sort((a, b) => a - b);
    let lower = requests.filter(r => r < head).sort((a, b) => b - a);

    // First direction pass
    let firstPass = goingUp ? upper : lower;

    // Second direction pass (reverse direction afterwards)
    let secondPass = goingUp ? lower : upper.sort((a, b) => a - b);

    sequence.push(...firstPass);  // Serve first direction

    // SCAN / C-SCAN — move to physical end
    if ((algorithm === 'SCAN' || algorithm === 'C-SCAN') && queue.length > 0) {
        const limit = goingUp ? maxCylinder : 0;
        if (sequence.at(-1) !== limit) sequence.push(limit);
    }

    // SCAN / LOOK — serve opposite direction
    if (algorithm === 'SCAN' || algorithm === 'LOOK') {
        sequence.push(...secondPass);
    }
    // C-SCAN / C-LOOK — jump to other end, then continue
    else if (algorithm === 'C-SCAN' || algorithm === 'C-LOOK') {
        if (secondPass.length > 0) {

            // C-SCAN — jump to opposite boundary
            if (algorithm === 'C-SCAN') {
                const jump = goingUp ? 0 : maxCylinder;
                if (sequence.at(-1) !== jump) sequence.push(jump);
            }

            // Circular serve next direction
            const circular = goingUp
                ? secondPass.sort((a, b) => a - b)
                : secondPass.sort((a, b) => b - a);

            sequence.push(...circular);
        }
    }

    return [...new Set(sequence)]; // Remove duplicates
}

/** Main runner */
export function runAlgorithm(queueStr, head, diskSize, algorithm, direction) {

    // Parse + sanitize queue (within disk bounds)
    const rawQueue = queueStr.split(',')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n) && n >= 0 && n <= diskSize);

    let sequence = [head];
    if (rawQueue.length === 0) return { sequence, movement: 0 };

    // Select algorithm
    switch (algorithm) {
        case 'FCFS':
            sequence = fcfs(rawQueue, head);
            break;
        case 'SSTF':
            sequence = sstf([...rawQueue], head);
            break;
        case 'SCAN':
        case 'C-SCAN':
        case 'LOOK':
        case 'C-LOOK':
            sequence = runDirectionalAlgorithm(
                algorithm, [...rawQueue], head, diskSize, direction
            );
            break;
        default:
            return { sequence: [head], movement: 0 };
    }

    // Compute total head movement
    const movement = sequence.reduce(
        (sum, curr, i, arr) => i === 0 ? 0 : sum + Math.abs(curr - arr[i - 1]),
        0
    );

    return { sequence, movement };
}
