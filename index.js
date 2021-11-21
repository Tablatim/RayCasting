const SCREEN_WIDTH = window.innerWidth
const SCREEN_HEIGHT = window.innerHeight -10

const canvas = document.createElement("canvas")
canvas.setAttribute("width", SCREEN_WIDTH)
canvas.setAttribute("height", SCREEN_HEIGHT)
document.body.appendChild(canvas)

const context = canvas.getContext("2d")

const TICK = 30;

const CELL_SIZE = 64;

const PLAYER_SIZE = 10;

const WALL_SIZE = 277;

const FOV = toRadians(90);

const COLORS = {
    empty: "white",
    rays: "#F7DC6F",
    player: "blue",
    cell_1: "grey",
    cell_2: "black",
    floor: "#d52b1e",
    ceiling: "#ffffff",
    wall_1: "#013aa6",
    wall_2: "green",
    wallDark_1: "#012975",
    wallDark_2: "#006400"
}

const map = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 2, 1],
    [1, 0, 1, 1, 0, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1],
    [1, 1, 1, 2, 1, 1, 1]
];

const player = {
    x: CELL_SIZE * 1.5,
    y: CELL_SIZE * 2,
    size: 10,
    angle: 0,
    speed: 0,
    movement: "z"
}

function resetPlayerPos() {
    player.x = CELL_SIZE * 2.5
    player.y = CELL_SIZE * 3.25
    player.size = 10
    player.angle = 1.55
    player.speed = 0
    player.movement = "z"
}

function clearScreen(){
    context.fillStyle = COLORS.empty
    context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
}

function movePlayer(){
    dir=0
    if(player.movement == "q") dir = toRadians(-90)
    if(player.movement == "d") dir = toRadians(90)
    new_x = player.x + Math.cos(player.angle+dir) * player.speed
    new_y = player.y +Math.sin(player.angle+dir) * player.speed
    if(!getCellFromCoord(new_x, new_y)) {
        player.x = new_x
        player.y = new_y
    }
}

function outOfMapBounds(x, y) {
    return x < 0 || x >= map[0].length || y < 0 || y >= map.length
}

function distance(x1, y1, x2, y2){
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function getVCollision(angle) {
    const right = Math.abs(Math.floor((angle - Math.PI/2) / Math.PI) %2)

    const firstX = right 
        ? Math.floor(player.x / CELL_SIZE) * CELL_SIZE + CELL_SIZE 
        : Math.floor(player.x / CELL_SIZE) * CELL_SIZE

    const firstY = player.y + (firstX - player.x) * Math.tan(angle)

    const xA = right ? CELL_SIZE : -CELL_SIZE
    const yA = xA * Math.tan(angle)

    let wall
    let nextX = firstX
    let nextY = firstY
    let cellX = 0
    let cellY = 0
    while (!wall) {
        cellX = right 
            ? Math.floor(nextX / CELL_SIZE) 
            : Math.floor(nextX / CELL_SIZE) -1

        cellY = Math.floor(nextY / CELL_SIZE)

        if(outOfMapBounds(cellX, cellY)) {
            break
        }
        wall = map[cellY][cellX]
        if(!wall){
            nextX += xA
            nextY += yA
        }
    }

    return { angle, distance: distance(player.x, player.y, nextX, nextY), vertical: true, wallX: cellX, wallY: cellY}
}

function getHCollision(angle) {
    const up = Math.abs(Math.floor(angle / Math.PI) % 2);
    const firstY = up
        ? Math.floor(player.y / CELL_SIZE) * CELL_SIZE
        : Math.floor(player.y / CELL_SIZE) * CELL_SIZE + CELL_SIZE

    const firstX = player.x + (firstY - player.y) / Math.tan(angle);

    const yA = up ? -CELL_SIZE : CELL_SIZE;
    const xA = yA / Math.tan(angle);

    let wall
    let nextX = firstX
    let nextY = firstY
    let cellX = 0
    let cellY = 0
    while (!wall) {
        cellX = Math.floor(nextX / CELL_SIZE)

        cellY = up 
            ? Math.floor(nextY / CELL_SIZE) -1
            : Math.floor(nextY / CELL_SIZE) 

        if(outOfMapBounds(cellX, cellY)) {
            break
        }
        wall = map[cellY][cellX]
        if(!wall){
            nextX += xA
            nextY += yA
        }
    }

    return { angle, distance: distance(player.x, player.y, nextX, nextY), vertical: false, wallX: cellX, wallY: cellY}
}

function castRay(angle) {
    const vCollision = getVCollision(angle)
    const hCollision = getHCollision(angle)

    return hCollision.distance >= vCollision.distance ? vCollision : hCollision
}

function getRays(){
    const initialAngle = player.angle - FOV/2
    const numberOfRays = SCREEN_WIDTH;
    const angleStep = FOV/numberOfRays;

    return Array.from({ length: numberOfRays}, (_, i) => {
        const angle = initialAngle + i * angleStep;
        const ray = castRay(angle)
        return ray
    })
}

function fixFishEye(distance, angle, playerAngle) {
    const diff = angle - playerAngle
    return distance * Math.cos(diff)
}

function getCellFromCoord(x, y){
    cell_x = Math.floor(x/CELL_SIZE)
    cell_y = Math.floor(y/CELL_SIZE)
    if(outOfMapBounds(cell_x, cell_y)) {
        return -1
    } else {
        cell_value = map[cell_y][cell_x]
        return cell_value
    }
}

function getCellCoordFromRay(ray) {
    return {
        x: ray.wallX, 
        y: ray.wallY, 
        cell_value: getCellFromCoord(ray.wallX, ray.wallY)
    }
}

function getColorFromCell(ray) {
    c = getCellCoordFromRay(ray)
    if(!outOfMapBounds(c.x, c.y)) {
        cell = map[c.y][c.x]
        if(cell == 1) return ray.vertical ? COLORS.wallDark_1 : COLORS.wall_1
        if(cell == 2) return ray.vertical ? COLORS.wallDark_2 : COLORS.wall_2
    }
    return
}

function renderScene(rays){
    rays.forEach((ray, i) => {
        const distance = fixFishEye(ray.distance, ray.angle, player.angle)
        const wallHeight = ((CELL_SIZE * 5) / distance) * WALL_SIZE;
        context.fillStyle = getColorFromCell(ray);
        context.fillRect(i, SCREEN_HEIGHT/2 - wallHeight /2, 1, wallHeight)
        context.fillStyle = COLORS.floor;
        context.fillRect(i, SCREEN_HEIGHT/2 + wallHeight/2, 1, SCREEN_HEIGHT/2 - wallHeight/2)
        context.fillStyle = COLORS.ceiling;
        context.fillRect(i, 0, 1, SCREEN_HEIGHT/2 - wallHeight/2)
    })

    crossScale = 7.5
    context.fillStyle = '#1C2833'
    context.fillRect( SCREEN_WIDTH/2-crossScale,  SCREEN_HEIGHT/2-2*crossScale, crossScale, crossScale*3)

    context.fillRect( SCREEN_WIDTH/2-2*crossScale,  SCREEN_HEIGHT/2-crossScale, 3*crossScale, crossScale)

    context.fillStyle = '#922B21'
    context.fillRect( SCREEN_WIDTH/2-crossScale,  SCREEN_HEIGHT/2-crossScale, crossScale, crossScale)

}

function renderMiniMap(posX = 0, posY = 0, scale = 1, rays){
    // cells
    const cellSize = scale * CELL_SIZE;
    map.forEach((row, y) => {
        row.forEach((cell, x) => {
            switch(cell){
                case 0:
                    break
                case 1:
                    context.fillStyle = COLORS.cell_1
                    context.fillRect(posX + x * cellSize, posY + y * cellSize, cellSize, cellSize)
                    break
                case 2:
                    context.fillStyle = COLORS.cell_2
                    context.fillRect(posX + x * cellSize, posY + y * cellSize, cellSize, cellSize)
                    break
                default:
                    break
            }
        })
    })
    
    //rays
    context.strokeStyle = COLORS.rays;
    rays.forEach(ray => {
        context.beginPath()
        context.moveTo(player.x * scale + posX, player.y * scale + posY)
        context.lineTo(
            (player.x + Math.cos(ray.angle) * ray.distance) * scale,
            (player.y + Math.sin(ray.angle) * ray.distance) * scale,
        )
        context.closePath()
        context.stroke()
    })

    //player
    context.fillStyle = COLORS.player
    context.fillRect(
        posX + player.x * scale - player.size/2,
        posY + player.y * scale - player.size/2,
        player.size, 
        player.size
    )
    context.fill()

    //player dir
    const rayLenth = player.size * 2;
    context.strokeStyle = COLORS.player
    context.beginPath()
    context.moveTo(player.x * scale + posX, player.y * scale + posY)
    context.lineTo(
        (player.x + Math.cos(player.angle) * rayLenth) * scale,
        (player.y + Math.sin(player.angle) * rayLenth) * scale,
    )
    context.closePath()
    context.stroke()
}

function gameLoop(){
    clearScreen();
    movePlayer();
    const rays = getRays();
    renderScene(rays);
    renderMiniMap(0, 0, 0.5, rays)
}

setInterval(gameLoop, TICK)

function toRadians(deg) {
    return (deg * Math.PI) / 180
}

let keysPressed = {};
document.addEventListener("keydown", (e) => {
    if(e.key != " ") keysPressed[e.key] = true;
    mult = 1
    if(keysPressed["Shift"] == true) mult = 1.75
    if(e.key.toLocaleLowerCase() == "z") {
        player.speed = 2*mult
        player.movement = e.key.toLocaleLowerCase()
    }
    if(e.key.toLocaleLowerCase() == "s") {
        player.speed = -2*mult
        player.movement = e.key.toLocaleLowerCase()
    }
    if(e.key.toLocaleLowerCase() == "d") {
        player.speed = 2*mult
        player.movement = e.key.toLocaleLowerCase()
    }
    if(e.key.toLocaleLowerCase() == "q") {
        player.speed = 2*mult
        player.movement = e.key.toLocaleLowerCase()
    }
    if(e.key.toLocaleLowerCase() == " ") {
        resetPlayerPos()
    }
})

document.addEventListener("keyup", (e) => {
    delete keysPressed[e.key];
    keys = ["z", "q", "s", "d"]
    if(keys.includes(e.key.toLocaleLowerCase())) {
        player.speed = 0
    }
})

document.addEventListener("mousemove", (e) => {
    //player.angle = Math.atan2(toRadians(e.y) - player.y, toRadians(e.x) - player.x) + Math.PI / 2
    player.angle += toRadians(e.movementX) * 0.5
})

canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;

document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;

canvas.ondblclick = function() {
    if (document.pointerLockElement === canvas) {
        document.exitPointerLock();
    } else {
        canvas.requestPointerLock();
    }
};

canvas.onclick = function() {
    rays = getRays()
    rays.forEach((ray, y) => {
        if(ray.angle == player.angle) {
            cell = getCellCoordFromRay(ray)
            if(!outOfMapBounds(cell.x, cell.y))map[cell.y][cell.x] = 0
        }
    })
}