import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  CanvasTexture,
  Color,
  MathUtils,
  Shape,
  SRGBColorSpace,
  TextureLoader,
  type Group,
  type MeshStandardMaterial,
  type PointLight,
  type Texture,
} from 'three'
import type { HeroInteraction } from '@/components/HeroSection'
import { palette } from '@/lib/palette'

interface HeroArcadeProps {
  active: boolean
  reducedMotion: boolean
  interaction: RefObject<HeroInteraction>
  onPlay: () => void
  onUnavailable: () => void
}

const SIDE_TURN = -1.18
const BASE_SPEED = 0.38
const SPEAKER_ROWS = [-1.22, -1.32, -1.42] as const
const FEET = [
  [-0.64, -1.73, 0.3],
  [0.64, -1.73, 0.3],
  [-0.64, -1.73, -0.45],
  [0.64, -1.73, -0.45],
] satisfies [number, number, number][]
const EXTRUSION = { depth: 1.8, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 1, steps: 1 }

function useLabelTexture(kind: 'screen' | 'marquee'): CanvasTexture | null {
  const invalidate = useThree((state) => state.invalidate)
  const [texture, setTexture] = useState<CanvasTexture | null>(null)

  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = kind === 'screen' ? 384 : 112
    const context = canvas.getContext('2d')
    if (!context) return
    const label = new CanvasTexture(canvas)
    label.colorSpace = SRGBColorSpace
    let disposed = false

    function draw() {
      if (!context || disposed) return
      context.fillStyle = kind === 'screen' ? palette.ink : palette.butter
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillStyle = kind === 'screen' ? palette.butter : palette.ink
      if (kind === 'screen') {
        context.font = '19px "Press Start 2P", monospace'
        context.fillText('MIAU ORBITAL', 256, 74)
        context.font = '66px "Press Start 2P", monospace'
        context.fillText('PLAY', 256, 201)
        context.font = '15px "Press Start 2P", monospace'
        context.fillStyle = palette.pink
        context.fillText('START', 256, 303)
        context.fillStyle = palette.cloud
        context.fillRect(50, 120, 6, 6)
        context.fillRect(446, 253, 6, 6)
        context.fillRect(410, 116, 4, 4)
        context.fillRect(85, 282, 4, 4)
      } else {
        context.font = '46px "Tilt Warp", sans-serif'
        context.fillText('FRUFRU', 256, 58)
      }
      label.needsUpdate = true
      invalidate()
    }

    draw()
    setTexture(label)
    void document.fonts.ready.then(draw)
    return () => {
      disposed = true
      label.dispose()
    }
  }, [kind, invalidate])

  return texture
}

function Mascot({ materialRef }: { materialRef: RefObject<MeshStandardMaterial | null> }) {
  const [texture, setTexture] = useState<Texture | null>(null)
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    let disposed = false
    const image = new TextureLoader().load('/brand/mascot.png', (loaded) => {
      if (disposed) {
        loaded.dispose()
        return
      }
      loaded.colorSpace = SRGBColorSpace
      setTexture(loaded)
      invalidate()
    })
    return () => {
      disposed = true
      image.dispose()
    }
  }, [invalidate])

  if (!texture) return null
  return (
    <mesh position={[1.72, 0.12, 0.65]}>
      <planeGeometry args={[1.48, 1.213]} />
      <meshStandardMaterial
        ref={materialRef}
        map={texture}
        emissiveMap={texture}
        emissive={palette.butter}
        emissiveIntensity={0.12}
        transparent
        alphaTest={0.02}
        roughness={1}
        metalness={0}
      />
    </mesh>
  )
}

function Cabinet({ screenMaterial, onPlay }: {
  screenMaterial: RefObject<MeshStandardMaterial | null>
  onPlay: () => void
}) {
  const screen = useLabelTexture('screen')
  const marquee = useLabelTexture('marquee')
  const profile = useMemo(() => {
    // Perfil em (−profundidade, altura), extrudado da esquerda para a direita.
    const shape = new Shape()
    shape.moveTo(-0.55, -1.6)
    shape.lineTo(0.65, -1.6)
    shape.lineTo(0.65, 1.65)
    shape.lineTo(-0.5, 1.65)
    shape.lineTo(-0.72, 1.32)
    shape.lineTo(-0.35, 1.12)
    shape.lineTo(-0.65, 0.25)
    shape.lineTo(-1, 0.1)
    shape.lineTo(-1, -0.12)
    shape.lineTo(-0.55, -0.35)
    shape.closePath()
    return shape
  }, [])

  return (
    <>
      <mesh position={[-0.9, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <extrudeGeometry args={[profile, EXTRUSION]} />
        <meshStandardMaterial attach="material-0" color={palette.pink} roughness={0.8} />
        <meshStandardMaterial attach="material-1" color={palette.ink} roughness={0.8} />
      </mesh>

      {/* Filete lateral: a silhueta extrudada continua legível em perfil. */}
      <mesh position={[-0.935, -0.45, 0.03]} rotation={[0, -Math.PI / 2, 0]}>
        <circleGeometry args={[0.44, 32]} />
        <meshStandardMaterial color={palette.butter} roughness={1} />
      </mesh>
      <mesh position={[0.935, -0.45, 0.03]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.44, 32]} />
        <meshStandardMaterial color={palette.butter} roughness={1} />
      </mesh>

      <group position={[0, 1.43, 0.61]} rotation={[-0.12, 0, 0]}>
        <mesh>
          <boxGeometry args={[1.67, 0.4, 0.16]} />
          <meshStandardMaterial color={palette.ink} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.087]}>
          <planeGeometry args={[1.49, 0.27]} />
          <meshStandardMaterial map={marquee} color={marquee ? undefined : palette.butter} roughness={0.8} />
        </mesh>
      </group>

      <group position={[0, 0.72, 0.5]} rotation={[-0.32, 0, 0]}>
        <mesh>
          <boxGeometry args={[1.65, 1.05, 0.15]} />
          <meshStandardMaterial color={palette.cloud} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.085]}>
          <boxGeometry args={[1.43, 0.87, 0.03]} />
          <meshStandardMaterial color={palette.ink} roughness={0.8} />
        </mesh>
        <mesh
          position={[0, 0, 0.105]}
          onClick={(event) => {
            event.stopPropagation()
            onPlay()
          }}
        >
          <planeGeometry args={[1.25, 0.74]} />
          <meshStandardMaterial
            ref={screenMaterial}
            map={screen}
            color={screen ? undefined : palette.ink}
            emissiveMap={screen}
            emissive={palette.butter}
            emissiveIntensity={0.18}
            roughness={0.35}
            toneMapped={false}
          />
        </mesh>
      </group>

      <group position={[0, 0.13, 0.77]} rotation={[0.23, 0, 0]}>
        <mesh>
          <boxGeometry args={[1.7, 0.13, 0.63]} />
          <meshStandardMaterial color={palette.butter} roughness={0.75} />
        </mesh>
        <mesh position={[-0.43, 0.19, 0.02]}>
          <cylinderGeometry args={[0.035, 0.045, 0.25, 10]} />
          <meshStandardMaterial color={palette.ink} roughness={0.6} />
        </mesh>
        <mesh position={[-0.43, 0.35, 0.02]}>
          <sphereGeometry args={[0.115, 16, 12]} />
          <meshStandardMaterial color={palette.pink} roughness={0.5} />
        </mesh>
        <mesh position={[0.27, 0.12, 0.07]}>
          <cylinderGeometry args={[0.105, 0.12, 0.095, 16]} />
          <meshStandardMaterial color={palette.pink} roughness={0.55} />
        </mesh>
        <mesh position={[0.59, 0.12, -0.02]}>
          <cylinderGeometry args={[0.105, 0.12, 0.095, 16]} />
          <meshStandardMaterial color={palette.pistachio} roughness={0.55} />
        </mesh>
      </group>

      <mesh position={[0, -0.99, 0.57]}>
        <boxGeometry args={[1.59, 1.15, 0.065]} />
        <meshStandardMaterial color={palette.cloud} roughness={0.85} />
      </mesh>
      <mesh position={[0, -0.76, 0.625]}>
        <boxGeometry args={[0.34, 0.46, 0.065]} />
        <meshStandardMaterial color={palette.ink} roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.67, 0.663]}>
        <boxGeometry args={[0.18, 0.035, 0.015]} />
        <meshStandardMaterial color={palette.butter} />
      </mesh>
      <mesh position={[0, -0.87, 0.67]}>
        <boxGeometry args={[0.13, 0.08, 0.025]} />
        <meshStandardMaterial color={palette.pink} />
      </mesh>
      {SPEAKER_ROWS.map((y) => (
        <mesh key={y} position={[0, y, 0.61]}>
          <boxGeometry args={[0.53, 0.025, 0.014]} />
          <meshStandardMaterial color={palette.ink} />
        </mesh>
      ))}
      {FEET.map((position, index) => (
        <mesh key={index} position={position}>
          <boxGeometry args={[0.26, 0.22, 0.32]} />
          <meshStandardMaterial color={palette.ink} roughness={1} />
        </mesh>
      ))}
    </>
  )
}

function Starfield({ groupRef }: { groupRef: RefObject<Group | null> }) {
  const positions = useMemo(() => {
    const points = new Float32Array(96 * 3)
    let seed = 137
    for (let index = 0; index < points.length; index += 3) {
      seed = (seed * 16807) % 2147483647
      points[index] = (seed / 2147483647 - 0.5) * 15
      seed = (seed * 16807) % 2147483647
      points[index + 1] = (seed / 2147483647 - 0.5) * 10
      seed = (seed * 16807) % 2147483647
      points[index + 2] = -2 - (seed / 2147483647) * 5
    }
    return points
  }, [])

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color={palette.butter} size={0.035} sizeAttenuation transparent opacity={0.8} />
      </points>
    </group>
  )
}

function ArcadeScene({ active, reducedMotion, interaction, onPlay, onUnavailable }: HeroArcadeProps) {
  const cabinet = useRef<Group>(null)
  const star = useRef<Group>(null)
  const stars = useRef<Group>(null)
  const mascotMaterial = useRef<MeshStandardMaterial>(null)
  const screenMaterial = useRef<MeshStandardMaterial>(null)
  const glow = useRef<PointLight>(null)
  const { camera, size, gl, invalidate } = useThree()
  const movement = useRef({ yaw: SIDE_TURN, velocity: 0, angle: 2.1, speed: BASE_SPEED, time: 0, glow: 0 })
  const starShape = useMemo(() => {
    const shape = new Shape()
    shape.moveTo(0, 0.36)
    shape.lineTo(0.075, 0.085)
    shape.lineTo(0.28, 0)
    shape.lineTo(0.075, -0.085)
    shape.lineTo(0, -0.36)
    shape.lineTo(-0.075, -0.085)
    shape.lineTo(-0.28, 0)
    shape.lineTo(-0.075, 0.085)
    shape.closePath()
    return shape
  }, [])

  useLayoutEffect(() => {
    const aspect = size.width / Math.max(size.height, 1)
    camera.position.set(0.15, 0.3, aspect < 1 ? 10.8 : 8.8)
    camera.lookAt(0.15, 0, 0)
    camera.updateProjectionMatrix()
    invalidate()
  }, [camera, size.width, size.height, invalidate])

  useEffect(() => {
    interaction.current.requestFrame = invalidate
    return () => {
      interaction.current.requestFrame = null
    }
  }, [interaction, invalidate])

  useEffect(() => {
    const canvas = gl.domElement
    const onContextLost = (event: Event) => {
      event.preventDefault()
      onUnavailable()
    }
    canvas.addEventListener('webglcontextlost', onContextLost)
    return () => canvas.removeEventListener('webglcontextlost', onContextLost)
  }, [gl, onUnavailable])

  useLayoutEffect(() => {
    if (reducedMotion) {
      movement.current.yaw = 0
      movement.current.velocity = 0
      if (cabinet.current) cabinet.current.rotation.set(0, 0, 0)
      if (stars.current) stars.current.rotation.set(0, 0, 0)
    }
    invalidate()
  }, [reducedMotion, active, invalidate])

  useFrame((_state, delta) => {
    if (!active) return
    const dt = Math.min(delta, 0.04)
    const input = interaction.current
    const motion = movement.current
    const impulse = input.impulse
    input.impulse = 0

    if (!reducedMotion) {
      motion.time += dt
      const proximity = input.focused || input.frontal ? 1 : input.proximity
      const target = SIDE_TURN * (1 - proximity) + input.x * proximity * 0.06
      if (input.focused) {
        // Teclado recebe a mesma vista imediatamente, sem viagem de câmera.
        motion.yaw = 0
        motion.velocity = 0
      } else {
        motion.velocity += (100 * (target - motion.yaw) - 10 * motion.velocity) * dt
        motion.yaw += motion.velocity * dt
      }
      motion.speed = MathUtils.damp(Math.min(motion.speed + impulse, 3.4), BASE_SPEED, 1.4, dt)
      motion.angle += motion.speed * dt
      motion.glow = Math.max(0, (motion.speed - BASE_SPEED) / (3.4 - BASE_SPEED))
    } else {
      motion.yaw = 0
      motion.glow = impulse > 0 ? 0.3 : motion.glow
    }

    if (cabinet.current) cabinet.current.rotation.y = motion.yaw
    if (stars.current && !reducedMotion) {
      stars.current.rotation.y = MathUtils.damp(stars.current.rotation.y, input.x * 0.035, 3, dt)
      stars.current.rotation.x = MathUtils.damp(stars.current.rotation.x, input.y * 0.025, 3, dt)
    }
    if (star.current) {
      star.current.position.set(
        1.72 + Math.cos(motion.angle) * 0.94,
        0.12 + Math.sin(motion.angle) * 0.93,
        0.62 + Math.sin(motion.angle) * 0.35,
      )
      star.current.rotation.z = reducedMotion ? 0.2 : -motion.angle * 0.4
    }
    if (mascotMaterial.current) mascotMaterial.current.emissiveIntensity = 0.12 + motion.glow * 0.65
    if (glow.current) glow.current.intensity = 0.5 + motion.glow * 2
    if (screenMaterial.current) {
      screenMaterial.current.emissiveIntensity = reducedMotion ? 0.18 : 0.18 + Math.sin(motion.time * 2) * 0.045
    }
  })

  return (
    <>
      <ambientLight intensity={1.6} color={palette.cream} />
      <directionalLight position={[-3, 5, 5]} intensity={3.2} color={palette.cream} />
      <pointLight position={[-3, 1, 3]} intensity={18} distance={8} color={palette.pink} />
      <pointLight position={[3, 2, 1]} intensity={15} distance={8} color={palette.cloud} />
      <Starfield groupRef={stars} />
      <group position={[-0.48, 0, 0]}>
        <group ref={cabinet} rotation={[0, reducedMotion ? 0 : SIDE_TURN, 0]}>
          <Cabinet screenMaterial={screenMaterial} onPlay={onPlay} />
        </group>
        <Mascot materialRef={mascotMaterial} />
        <pointLight ref={glow} position={[1.72, 0.2, 1.8]} color={palette.butter} intensity={0.5} distance={3} />
        <group ref={star} position={[1.245, 0.923, 0.922]}>
          <mesh>
            <shapeGeometry args={[starShape]} />
            <meshStandardMaterial
              color={palette.butter}
              emissive={palette.butter}
              emissiveIntensity={0.65}
              roughness={0.7}
              toneMapped={false}
            />
          </mesh>
        </group>
      </group>
    </>
  )
}

export default function HeroArcade(props: HeroArcadeProps) {
  const background = useMemo(() => new Color(palette.ink), [])

  return (
    <div aria-hidden="true" className="h-full w-full">
      <Canvas
        tabIndex={-1}
        dpr={[1, 1.5]}
        frameloop={!props.active ? 'never' : props.reducedMotion ? 'demand' : 'always'}
        camera={{ position: [0.15, 0.3, 8.8], fov: 35, near: 0.1, far: 30 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'low-power' }}
        onCreated={({ scene }) => { scene.background = background }}
      >
        <Suspense fallback={null}>
          <ArcadeScene {...props} />
        </Suspense>
      </Canvas>
    </div>
  )
}
