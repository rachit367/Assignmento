'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'

// --- Chrome Dino Game Constants (matched to the real game) ---
const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 150
const GRAVITY = 0.6
const JUMP_FORCE = -12
const GROUND_Y = 130
const INITIAL_SPEED = 5
const SPEED_INCREMENT = 0.001
const MAX_SPEED = 13
const SPAWN_INTERVAL_MIN = 50
const SPAWN_INTERVAL_MAX = 120

// --- Cookie helpers ---
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function setCookie(name: string, value: string, days: number = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/`
}

// --- Types ---
type GameState = 'START' | 'PLAYING' | 'GAME_OVER'

interface Obstacle {
  x: number
  y: number
  width: number
  height: number
  type: 'small_cactus' | 'large_cactus' | 'cactus_group'
}

interface Cloud {
  x: number
  y: number
}

export default function NotFound() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>('START')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)

  const scoreRef = useRef(0)
  const speedRef = useRef(INITIAL_SPEED)
  const dinoRef = useRef({
    x: 25,
    y: GROUND_Y - 44,
    width: 44,
    height: 44,
    vy: 0,
    isJumping: false,
    legFrame: 0,
    frameCount: 0,
  })
  const obstaclesRef = useRef<Obstacle[]>([])
  const cloudsRef = useRef<Cloud[]>([
    { x: 100, y: 20 },
    { x: 300, y: 35 },
    { x: 500, y: 15 },
  ])
  const nextSpawnRef = useRef(60)
  const animationFrameRef = useRef<number>(0)
  const gameStateRef = useRef<GameState>('START')
  const groundOffsetRef = useRef(0)

  // Load high score from cookie on mount
  useEffect(() => {
    const saved = getCookie('dino_highscore')
    if (saved) setHighScore(parseInt(saved, 10))
  }, [])

  const resetGame = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    speedRef.current = INITIAL_SPEED
    dinoRef.current = {
      x: 25,
      y: GROUND_Y - 44,
      width: 44,
      height: 44,
      vy: 0,
      isJumping: false,
      legFrame: 0,
      frameCount: 0,
    }
    obstaclesRef.current = []
    nextSpawnRef.current = 60
    groundOffsetRef.current = 0
  }, [])

  const handleInput = useCallback(() => {
    setGameState((prev) => {
      if (prev === 'START' || prev === 'GAME_OVER') {
        resetGame()
        return 'PLAYING'
      }
      if (prev === 'PLAYING' && !dinoRef.current.isJumping) {
        dinoRef.current.vy = JUMP_FORCE
        dinoRef.current.isJumping = true
      }
      return prev
    })
  }, [resetGame])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        handleInput()
      }
    }
    const handleTouch = (e: TouchEvent) => {
      e.preventDefault()
      handleInput()
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('touchstart', handleTouch)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('touchstart', handleTouch)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [handleInput])

  const endGame = useCallback(() => {
    setGameState((prev) => {
      if (prev === 'PLAYING') {
        const finalScore = Math.floor(scoreRef.current)
        if (finalScore > highScore) {
          setHighScore(finalScore)
          setCookie('dino_highscore', finalScore.toString())
        }
        return 'GAME_OVER'
      }
      return prev
    })
  }, [highScore])

  const update = useCallback(() => {
    if (speedRef.current < MAX_SPEED) {
      speedRef.current += SPEED_INCREMENT
    }

    scoreRef.current += 0.1
    setScore(Math.floor(scoreRef.current))

    // Ground scroll
    groundOffsetRef.current = (groundOffsetRef.current + speedRef.current) % 24

    // Update dino
    const dino = dinoRef.current
    dino.vy += GRAVITY
    dino.y += dino.vy
    if (dino.y > GROUND_Y - dino.height) {
      dino.y = GROUND_Y - dino.height
      dino.vy = 0
      dino.isJumping = false
    }
    dino.frameCount++
    if (dino.frameCount % 6 === 0) {
      dino.legFrame = dino.legFrame === 0 ? 1 : 0
    }

    // Update obstacles
    obstaclesRef.current.forEach((obs) => { obs.x -= speedRef.current })
    obstaclesRef.current = obstaclesRef.current.filter((obs) => obs.x + obs.width > -20)

    // Update clouds (slower)
    cloudsRef.current.forEach((c) => { c.x -= speedRef.current * 0.3 })
    cloudsRef.current.forEach((c) => {
      if (c.x < -60) { c.x = CANVAS_WIDTH + Math.random() * 100; c.y = 15 + Math.random() * 30 }
    })

    // Spawn obstacles
    nextSpawnRef.current--
    if (nextSpawnRef.current <= 0) {
      const types: Obstacle['type'][] = ['small_cactus', 'large_cactus', 'cactus_group']
      const type = types[Math.floor(Math.random() * types.length)]
      let w = 17, h = 35
      if (type === 'large_cactus') { w = 25; h = 50 }
      else if (type === 'cactus_group') { w = 51; h = 35 }

      obstaclesRef.current.push({
        x: CANVAS_WIDTH,
        y: GROUND_Y - h,
        width: w,
        height: h,
        type,
      })
      nextSpawnRef.current = Math.floor(
        Math.random() * (SPAWN_INTERVAL_MAX - SPAWN_INTERVAL_MIN + 1)
      ) + SPAWN_INTERVAL_MIN
    }

    // Collision
    const hitbox = { x: dino.x + 4, y: dino.y + 4, width: dino.width - 10, height: dino.height - 6 }
    for (const obs of obstaclesRef.current) {
      if (
        hitbox.x < obs.x + obs.width &&
        hitbox.x + hitbox.width > obs.x &&
        hitbox.y < obs.y + obs.height &&
        hitbox.y + hitbox.height > obs.y
      ) {
        endGame()
        break
      }
    }
  }, [endGame])

  const drawDino = (ctx: CanvasRenderingContext2D) => {
    const d = dinoRef.current
    ctx.fillStyle = '#535353'

    // Head
    ctx.fillRect(d.x + 22, d.y, 22, 16)
    // Eye (white cutout)
    ctx.fillStyle = '#fff'
    ctx.fillRect(d.x + 36, d.y + 4, 4, 4)
    ctx.fillStyle = '#535353'
    // Mouth indent
    ctx.fillRect(d.x + 30, d.y + 12, 14, 2)

    // Neck
    ctx.fillRect(d.x + 18, d.y + 14, 12, 6)

    // Body
    ctx.fillRect(d.x + 8, d.y + 16, 30, 16)

    // Arm
    ctx.fillRect(d.x + 32, d.y + 20, 6, 8)

    // Tail
    ctx.fillRect(d.x, d.y + 20, 10, 4)
    ctx.fillRect(d.x - 2, d.y + 18, 4, 4)

    // Legs
    if (d.isJumping || gameStateRef.current !== 'PLAYING') {
      // Both legs down when jumping or not playing
      ctx.fillRect(d.x + 12, d.y + 32, 6, 12)
      ctx.fillRect(d.x + 26, d.y + 32, 6, 12)
    } else {
      // Animated running legs
      if (d.legFrame === 0) {
        ctx.fillRect(d.x + 12, d.y + 32, 6, 12)
        ctx.fillRect(d.x + 26, d.y + 32, 6, 6)
      } else {
        ctx.fillRect(d.x + 12, d.y + 32, 6, 6)
        ctx.fillRect(d.x + 26, d.y + 32, 6, 12)
      }
    }
  }

  const drawCactus = (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
    ctx.fillStyle = '#535353'
    if (obs.type === 'small_cactus') {
      // Trunk
      ctx.fillRect(obs.x + 6, obs.y, 5, obs.height)
      // Left arm
      ctx.fillRect(obs.x, obs.y + 10, 6, 4)
      ctx.fillRect(obs.x, obs.y + 6, 4, 8)
      // Right arm
      ctx.fillRect(obs.x + 11, obs.y + 14, 6, 4)
      ctx.fillRect(obs.x + 13, obs.y + 10, 4, 8)
    } else if (obs.type === 'large_cactus') {
      // Trunk
      ctx.fillRect(obs.x + 9, obs.y, 7, obs.height)
      // Left arm
      ctx.fillRect(obs.x, obs.y + 16, 9, 5)
      ctx.fillRect(obs.x, obs.y + 10, 5, 11)
      // Right arm
      ctx.fillRect(obs.x + 16, obs.y + 22, 9, 5)
      ctx.fillRect(obs.x + 20, obs.y + 16, 5, 11)
    } else {
      // Group of 3 small cacti
      for (let i = 0; i < 3; i++) {
        const ox = obs.x + i * 17
        ctx.fillRect(ox + 5, obs.y, 5, obs.height)
        ctx.fillRect(ox, obs.y + 10, 5, 4)
        ctx.fillRect(ox + 10, obs.y + 14, 5, 4)
      }
    }
  }

  const drawCloud = (ctx: CanvasRenderingContext2D, c: Cloud) => {
    ctx.fillStyle = '#e8e8e8'
    ctx.fillRect(c.x, c.y + 4, 40, 6)
    ctx.fillRect(c.x + 6, c.y, 28, 14)
    ctx.fillRect(c.x + 12, c.y - 2, 16, 18)
  }

  const drawGround = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#535353'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, GROUND_Y)
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y)
    ctx.stroke()

    // Ground texture (bumps)
    ctx.fillStyle = '#535353'
    const offset = groundOffsetRef.current
    for (let i = -1; i < CANVAS_WIDTH / 24 + 2; i++) {
      const bx = i * 24 - offset
      // Small random-looking bumps
      ctx.fillRect(bx + 3, GROUND_Y + 4, 2, 1)
      ctx.fillRect(bx + 10, GROUND_Y + 6, 3, 1)
      ctx.fillRect(bx + 18, GROUND_Y + 3, 1, 1)
    }
  }

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Clouds
    cloudsRef.current.forEach((c) => drawCloud(ctx, c))

    // Ground
    drawGround(ctx)

    // Dino
    drawDino(ctx)

    // Obstacles
    obstaclesRef.current.forEach((obs) => drawCactus(ctx, obs))

    // Score (top right)
    ctx.fillStyle = '#535353'
    ctx.font = '13px "Courier New", monospace'
    ctx.textAlign = 'right'
    const scoreText = Math.floor(scoreRef.current).toString().padStart(5, '0')
    ctx.fillText(scoreText, CANVAS_WIDTH - 10, 20)

    // High score
    const hi = highScore.toString().padStart(5, '0')
    ctx.fillStyle = '#757575'
    ctx.fillText(`HI ${hi}`, CANVAS_WIDTH - 80, 20)

    // Game over text
    if (gameStateRef.current === 'GAME_OVER') {
      ctx.fillStyle = '#535353'
      ctx.font = 'bold 20px "Courier New", monospace'
      ctx.textAlign = 'center'
      ctx.fillText('G A M E   O V E R', CANVAS_WIDTH / 2, 50)

      // Restart icon (circular arrow)
      const cx = CANVAS_WIDTH / 2
      const cy = 78
      ctx.strokeStyle = '#535353'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, 12, 0.3, Math.PI * 1.8)
      ctx.stroke()
      // Arrow head
      ctx.fillStyle = '#535353'
      ctx.beginPath()
      ctx.moveTo(cx + 10, cy - 8)
      ctx.lineTo(cx + 16, cy - 2)
      ctx.lineTo(cx + 6, cy - 2)
      ctx.closePath()
      ctx.fill()
    }

    // Start text
    if (gameStateRef.current === 'START') {
      ctx.fillStyle = '#535353'
      ctx.font = '14px "Courier New", monospace'
      ctx.textAlign = 'center'
      ctx.fillText('Press SPACE or tap to start', CANVAS_WIDTH / 2, 70)
    }
  }, [highScore])

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    update()
    draw(ctx)

    if (gameStateRef.current === 'PLAYING') {
      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }
  }, [update, draw])

  useEffect(() => {
    gameStateRef.current = gameState
    if (gameState === 'PLAYING') {
      animationFrameRef.current = requestAnimationFrame(gameLoop)
    } else {
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) draw(ctx)
      }
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [gameState, gameLoop, draw])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white select-none">
      <div className="w-full max-w-150 px-4">
        {/* Chrome-style error text */}
        <div className="text-center mb-8">
          <p className="text-[#535353] text-base font-mono">This page isn&apos;t available</p>
          <p className="text-[#969696] text-sm font-mono mt-1">Try checking the URL or go back home.</p>
        </div>

        {/* Game canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-auto cursor-pointer border-0 outline-none"
          onClick={handleInput}
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Home link */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="text-[#4285f4] text-sm font-mono hover:underline"
          >
            Go to homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
