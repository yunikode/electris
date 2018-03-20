const electron = require('electron')

const { ipcRenderer } = electron

const canvas = document.getElementById('tetris')
const context = canvas.getContext('2d')

const overlay = document.querySelector('.overlay')

const previewCanvas = document.getElementById('preview')
const previewContext = previewCanvas.getContext('2d')

context.scale(20,20)
previewContext.scale(20,20)

context.fillStyle = '#000'
context.fillRect(0,0,canvas.width, canvas.height)

previewContext.fillStyle = '#000'
previewContext.fillRect(0,0,previewCanvas.width, previewCanvas.height)

let previewPart;

let _paused = true;
let _gameOver = true


function arenaSweep() {
  let rowCount = 1
  outer: for(let y= arena.length - 1; y > 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) {
        continue outer
      }
    }
    const row = arena.splice(y, 1)[0].fill(0)
    arena.unshift(row)
    ++y

    player.score += rowCount * 10
    rowCount *= 2
  }
}

function collide(arena, player) {
  const [m, o] = [player.matrix, player.pos]
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if( m[y][x] !== 0 &&
         (arena[y + o.y] &&
         arena[y + o.y][x + o.x])!== 0) {
           return true
      }
    }
  }
  return false
}

function createMatrix(w, h) {
  const matrix = []
  while (h--) {
    matrix.push(new Array(w).fill(0))
  }
  return matrix
}

function createPiece(type) {
  if (type === 'T') {
    return [
      [0,0,0],
      [1,1,1],
      [0,1,0]
    ]
  } else if (type ==='O') {
    return [
      [2,2],
      [2,2]
    ]
  } else if (type ==='I') {
    return [
      [0,5,0,0],
      [0,5,0,0],
      [0,5,0,0],
      [0,5,0,0]
    ]
  } else if (type ==='L') {
    return [
      [0,3,0],
      [0,3,0],
      [0,3,3]
    ]
  } else if (type ==='J') {
    return [
      [0,4,0],
      [0,4,0],
      [4,4,0]
    ]
  } else if (type ==='S') {
    return [
      [0,6,6],
      [6,6,0],
      [0,0,0]
    ]
  } else if (type ==='Z') {
    return [
      [7,7,0],
      [0,7,7],
      [0,0,0]
    ]
  }
}

function draw() {
  context.fillStyle = '#000'
  context.fillRect(0,0,canvas.width, canvas.height)
  drawMatrix(arena, {x:0, y:0}, context)
  drawMatrix(player.matrix, player.pos, context)

  previewContext.fillStyle = '#000'
  previewContext.fillRect(0,0,previewCanvas.width, previewCanvas.height)
  drawMatrix(previewPaint, {x:0, y:0}, previewContext)
  drawMatrix(player.preview, {x:0, y:0}, previewContext
  )
}

function drawMatrix(matrix, offset,context) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        context.fillStyle = colors[value]
        context.fillRect(x + offset.x,y + offset.y,1,1)
      }
    })
  })
}

function gameOver() {
  _gameOver = !_gameOver
  gamePause()
  _gameOver ? overlay.innerText = `Game Over ${player.score} points` : ''
}

function gamePause() {
  _paused = !_paused
  overlay.innerText = 'Game Paused'
  overlay.classList.toggle('hidden')
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = val
      }
    })
  })
}

function playerMove(dir) {
  player.pos.x += dir
  if (collide(arena,player)) {
    player.pos.x -= dir
  }
}

function playerDrop() {

  player.pos.y++
  if (collide(arena, player)) {
    player.pos.y--
    merge(arena, player)
    playerReset(previewPart)
    arenaSweep()
    updateScore()
  }
  dropCounter = 0
}

function playerReset() {
  const pieces = 'ILJOTSZ'
  player.matrix = player.preview
  player.preview = createPiece(pieces[pieces.length * Math.random() | 0])
  player.pos.y = 0
  player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0)
  if (collide(arena, player)) {
    gameOver()
    arena.forEach(row => row.fill(0))
    player.score = 0
    updateScore()

  }
}

function playerRotate(dir) {
  const pos = player.pos.x
  let offset = 1
  rotate(player.matrix, dir)
  while (collide(arena,player)) {
    player.pos.x += offset
    offset = -(offset + (offset > 0 ? 1 : -1))
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir)
      player.pos.x = pos
      return
    }
  }
}

function resize() {
  const maxWidth = window.innerWidth
  const maxHeight = window.innerHeight

  const height = maxHeight - 80
  const width = maxWidth * 2/3

  if (height / 20 < width / 12) {
    canvas.height = height
    canvas.width = 12 * height / 20
    previewCanvas.height = 4 * height / 20
    previewCanvas.width = 4 * height / 20
  } else {
    canvas.width = width
    canvas.height = 20 * width / 12
    previewCanvas.height = width * 1/3
    previewCanvas.width = width * 1/3
  }

  context.scale(canvas.width/12, canvas.width/12)
  previewContext.scale(canvas.width/12, canvas.width/12)

  context.fillRect(0,0,width, height)
  previewContext.fillRect(0,0,width,height)

}

function rotate(matrix, dir) {
  for (let y =0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [
        matrix[x][y],
        matrix[y][x]
      ] = [
        matrix[y][x],
        matrix[x][y]
      ]
    }
  }

  if (dir > 0) {
    matrix.forEach(row => row.reverse())
  } else {
    matrix.reverse()
  }
}

let dropCounter = 0
let dropInterval = 1000


let lastTime = 0

function update(time = 0) {
  const deltaTime = time - lastTime

  lastTime = time

  _paused ? dropCounter += deltaTime : ''

  if (dropCounter > dropInterval) {
    playerDrop()
  }

  draw()
  requestAnimationFrame(update)
}


function updateScore() {
    document.getElementById('score').innerText = player.score
}

const arena = createMatrix(12, 20)
const previewPaint = createMatrix(4,4)

const colors = [
  null,
  '#ff0d72',
  '#0dc2ff',
  '#0dff72',
  '#f538ff',
  '#ff8e0d',
  '#ffe138',
  '#3877ff',
]

const player = {
  pos: {x:0, y:0},
  matrix: null,
  preview: null,
  score: 0
}

document.addEventListener('keydown', event => {
  if (!!_paused && event.keyCode === 37) {
    playerMove(-1)
  } else if (!!_paused && event.keyCode === 39) {
    playerMove(+1)
  } else if (!!_paused && event.keyCode === 40) {
    playerDrop()
  } else if (!!_paused && event.keyCode === 81) {
    playerRotate(-1)
  } else if (!!_paused && event.keyCode === 87) {
    playerRotate(1)
  } else if (event.keyCode === 32) {
    !_gameOver ? gamePause() : ''
  }

})


window.addEventListener('resize', () => resize())

const pieces = 'ILJOTSZ'
player.preview = createPiece(pieces[pieces.length * Math.random() | 0])

playerReset()
updateScore()

ipcRenderer.on('game:new', () => {
  update()
  gameOver()
})
