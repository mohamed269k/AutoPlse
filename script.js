document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // UI Elements
    const scoreEl = document.getElementById('score');
    const levelEl = document.getElementById('level');
    const livesEl = document.getElementById('lives');
    const pauseBtn = document.getElementById('pauseBtn');
    const gameOverEl = document.getElementById('gameOver');
    const finalScoreEl = document.getElementById('finalScore');
    const restartBtn = document.getElementById('restartBtn');
    
    // Game constants
    const CELL_SIZE = 30;
    const ROWS = 20;
    const COLS = 28;
    
    // Game state
    let gameState = 'playing'; // 'playing', 'paused', 'gameOver'
    let score = 0;
    let level = 1;
    let lives = 3;
    let dotsRemaining = 0;
    let powerPelletActive = false;
    let powerPelletTimer = 0;
    
    // Maze layout (1 = wall, 0 = path, 2 = dot, 3 = power pellet)
    const mazeLayout = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
        [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
        [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
        [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
        [1,1,1,1,1,1,2,1,1,0,1,1,0,0,0,0,1,1,0,1,1,2,1,1,1,1,1,1],
        [0,0,0,0,0,0,2,0,0,0,1,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0],
        [1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1,1],
        [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
        [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
        [1,3,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,3,1],
        [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
        [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
        [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];
    
    let maze = JSON.parse(JSON.stringify(mazeLayout));
    
    const pacman = { x: 13, y: 15, dx: 0, dy: 0, nextDx: 0, nextDy: 0, mouthOpen: true, mouthTimer: 0 };
    
    const ghosts = [
        { x: 13, y: 9, dx: 0, dy: -1, color: '#ff0000', vulnerable: false },
        { x: 13, y: 9, dx: 0, dy: 1, color: '#ffb8ff', vulnerable: false },
        { x: 14, y: 9, dx: 0, dy: -1, color: '#00ffff', vulnerable: false },
        { x: 12, y: 9, dx: 0, dy: 1, color: '#ffb852', vulnerable: false }
    ];
    
    function countDots() {
        dotsRemaining = 0;
        maze.forEach(row => row.forEach(cell => {
            if (cell === 2 || cell === 3) dotsRemaining++;
        }));
    }
    
    function initGame() {
        countDots();
        updateUI();
        canvas.focus();
    }
    
    function updateUI() {
        scoreEl.textContent = score;
        levelEl.textContent = level;
        livesEl.textContent = lives;
    }
    
    function setDirection(dx, dy) {
        if (gameState !== 'playing') return;
        pacman.nextDx = dx;
        pacman.nextDy = dy;
    }
    
    window.handleTouch = function(event, dx, dy) {
        event.preventDefault();
        setDirection(dx, dy);
    };

    function isValidPosition(x, y) {
        const col = Math.round(x);
        const row = Math.round(y);
        if (row >= 0 && row < ROWS && (col < 0 || col >= COLS)) return true; // Tunnel
        return row >= 0 && row < ROWS && col >= 0 && col < COLS && maze[row][col] !== 1;
    }
    
    function handleTunnel(entity) {
        if (entity.x < -0.5) entity.x = COLS - 0.5;
        else if (entity.x > COLS - 0.5) entity.x = -0.5;
    }
    
    function movePacman() {
        const speed = 0.1;
        const atGridCenter = Math.abs(pacman.x - Math.round(pacman.x)) < speed && Math.abs(pacman.y - Math.round(pacman.y)) < speed;

        if (atGridCenter && (pacman.nextDx !== 0 || pacman.nextDy !== 0)) {
            const nextGridX = Math.round(pacman.x) + pacman.nextDx;
            const nextGridY = Math.round(pacman.y) + pacman.nextDy;
            if (isValidPosition(nextGridX, nextGridY)) {
                pacman.x = Math.round(pacman.x);
                pacman.y = Math.round(pacman.y);
                pacman.dx = pacman.nextDx;
                pacman.dy = pacman.nextDy;
                pacman.nextDx = 0;
                pacman.nextDy = 0;
            }
        }
        
        const nextX = pacman.x + pacman.dx * speed;
        const nextY = pacman.y + pacman.dy * speed;
        if (isValidPosition(nextX, nextY)) {
            pacman.x = nextX;
            pacman.y = nextY;
        } else {
            pacman.x = Math.round(pacman.x);
            pacman.y = Math.round(pacman.y);
            pacman.dx = 0;
            pacman.dy = 0;
        }
        
        handleTunnel(pacman);
        pacman.mouthTimer = (pacman.mouthTimer + 1) % 16;
        pacman.mouthOpen = pacman.mouthTimer < 8;
    }
    
    function moveGhosts() {
        ghosts.forEach(ghost => {
            const speed = ghost.vulnerable ? 0.06 : 0.08;
            const atGridCenter = Math.abs(ghost.x - Math.round(ghost.x)) < speed && Math.abs(ghost.y - Math.round(ghost.y)) < speed;
            const isBlocked = !isValidPosition(ghost.x + ghost.dx * speed, ghost.y + ghost.dy * speed);

            if (atGridCenter && (isBlocked || Math.random() < 0.2)) {
                ghost.x = Math.round(ghost.x);
                ghost.y = Math.round(ghost.y);
                const directions = [{dx:0,dy:-1},{dx:1,dy:0},{dx:0,dy:1},{dx:-1,dy:0}];
                const validDirections = directions.filter(dir => isValidPosition(ghost.x + dir.dx, ghost.y + dir.dy) && !(dir.dx === -ghost.dx && dir.dy === -ghost.dy));
                
                if (validDirections.length > 0) {
                    let bestDir = validDirections[0];
                    let bestDist = Infinity;
                    if (ghost.vulnerable) bestDist = -1;

                    validDirections.forEach(dir => {
                        const dist = Math.hypot(ghost.x + dir.dx - pacman.x, ghost.y + dir.dy - pacman.y);
                        if ((!ghost.vulnerable && dist < bestDist) || (ghost.vulnerable && dist > bestDist)) {
                            bestDist = dist;
                            bestDir = dir;
                        }
                    });
                    ghost.dx = bestDir.dx;
                    ghost.dy = bestDir.dy;
                }
            }
            
            ghost.x += ghost.dx * speed;
            ghost.y += ghost.dy * speed;
            handleTunnel(ghost);
        });
    }

    function checkCollisions() {
        const pacmanRow = Math.round(pacman.y);
        const pacmanCol = Math.round(pacman.x);

        if (maze[pacmanRow] && maze[pacmanRow][pacmanCol]) {
            if (maze[pacmanRow][pacmanCol] === 2) {
                maze[pacmanRow][pacmanCol] = 0;
                score += 10;
                dotsRemaining--;
                updateUI();
            } else if (maze[pacmanRow][pacmanCol] === 3) {
                maze[pacmanRow][pacmanCol] = 0;
                score += 50;
                dotsRemaining--;
                powerPelletActive = true;
                powerPelletTimer = 300; // 5 seconds at 60 FPS
                ghosts.forEach(g => g.vulnerable = true);
                updateUI();
            }
        }
        
        ghosts.forEach(ghost => {
            if (Math.hypot(ghost.x - pacman.x, ghost.y - pacman.y) < 0.7) {
                if (ghost.vulnerable) {
                    score += 200;
                    ghost.vulnerable = false;
                    ghost.x = 13.5;
                    ghost.y = 9;
                    updateUI();
                } else {
                    lives--;
                    updateUI();
                    if (lives <= 0) gameOver();
                    else resetPositions();
                }
            }
        });
    }
    
    function resetPositions() {
        pacman.x = 13; pacman.y = 15; pacman.dx = 0; pacman.dy = 0;
        pacman.nextDx = 0; pacman.nextDy = 0;
        ghosts.forEach((ghost, i) => {
            ghost.x = 13 + (i - 1.5) * 0.5;
            ghost.y = 9;
            ghost.vulnerable = false;
        });
        powerPelletActive = false;
        powerPelletTimer = 0;
        gameState = 'paused'; // Brief pause after life lost
        setTimeout(() => gameState = 'playing', 1000);
    }
    
    function updatePowerPellet() {
        if (powerPelletActive) {
            powerPelletTimer--;
            if (powerPelletTimer <= 0) {
                powerPelletActive = false;
                ghosts.forEach(g => g.vulnerable = false);
            }
        }
    }
    
    function checkLevelComplete() {
        if (dotsRemaining === 0) {
            level++;
            updateUI();
            resetLevel();
        }
    }
    
    function resetLevel() {
        maze = JSON.parse(JSON.stringify(mazeLayout));
        countDots();
        resetPositions();
    }
    
    function gameOver() {
        gameState = 'gameOver';
        finalScoreEl.textContent = score;
        gameOverEl.style.display = 'block';
    }
    
    function restartGame() {
        gameState = 'playing';
        score = 0;
        level = 1;
        lives = 3;
        powerPelletActive = false;
        powerPelletTimer = 0;
        gameOverEl.style.display = 'none';
        resetLevel();
        updateUI();
    }
    
    window.togglePause = function() {
        if (gameState === 'playing') {
            gameState = 'paused';
            pauseBtn.textContent = 'RESUME';
        } else if (gameState === 'paused') {
            gameState = 'playing';
            pauseBtn.textContent = 'PAUSE';
        }
    };
    
    // Draw functions
    function drawMaze() {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const x = c * CELL_SIZE;
                const y = r * CELL_SIZE;
                if (maze[r][c] === 1) {
                    ctx.fillStyle = '#0000ff';
                    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                } else if (maze[r][c] === 2) {
                    ctx.fillStyle = '#ffff00';
                    ctx.beginPath();
                    ctx.arc(x + CELL_SIZE/2, y + CELL_SIZE/2, 2, 0, Math.PI * 2);
                    ctx.fill();
                } else if (maze[r][c] === 3) {
                    ctx.fillStyle = '#ffff00';
                    ctx.beginPath();
                    ctx.arc(x + CELL_SIZE/2, y + CELL_SIZE/2, 8, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }
    
    function drawPacman() {
        const x = pacman.x * CELL_SIZE + CELL_SIZE / 2;
        const y = pacman.y * CELL_SIZE + CELL_SIZE / 2;
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        if (pacman.mouthOpen && (pacman.dx !== 0 || pacman.dy !== 0)) {
            let angle = Math.atan2(pacman.dy, pacman.dx);
            ctx.arc(x, y, 12, angle + 0.2 * Math.PI, angle - 0.2 * Math.PI);
            ctx.lineTo(x, y);
        } else {
            ctx.arc(x, y, 12, 0, Math.PI * 2);
        }
        ctx.fill();
    }
    
    function drawGhosts() {
        ghosts.forEach(ghost => {
            const x = ghost.x * CELL_SIZE + CELL_SIZE / 2;
            const y = ghost.y * CELL_SIZE + CELL_SIZE / 2;
            ctx.fillStyle = ghost.vulnerable ? (powerPelletTimer > 120 || powerPelletTimer % 20 > 10 ? '#0000ff' : '#ffffff') : ghost.color;
            ctx.beginPath();
            ctx.arc(x, y, 12, Math.PI, 0);
            ctx.lineTo(x + 12, y + 12);
            ctx.lineTo(x - 12, y + 12);
            ctx.closePath();
            ctx.fill();
        });
    }
    
    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (gameState === 'playing') {
            movePacman();
            moveGhosts();
            checkCollisions();
            updatePowerPellet();
            checkLevelComplete();
        }
        
        drawMaze();
        drawPacman();
        drawGhosts();
        
        if (gameState === 'paused') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ffff00';
            ctx.font = "36px 'Press Start 2P', cursive";
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
        }
        
        requestAnimationFrame(gameLoop);
    }
    
    // Event Listeners
    document.addEventListener('keydown', (e) => {
        if (gameState !== 'playing') return;
        const keyMap = { 'ArrowUp': [0, -1], 'w': [0, -1], 'W': [0, -1], 'ArrowDown': [0, 1], 's': [0, 1], 'S': [0, 1], 'ArrowLeft': [-1, 0], 'a': [-1, 0], 'A': [-1, 0], 'ArrowRight': [1, 0], 'd': [1, 0], 'D': [1, 0] };
        if (keyMap[e.key]) {
            e.preventDefault();
            setDirection(...keyMap[e.key]);
        } else if (e.key === ' ') {
            e.preventDefault();
            togglePause();
        }
    });

    restartBtn.addEventListener('click', restartGame);
    
    // Start Game
    initGame();
    gameLoop();
});
