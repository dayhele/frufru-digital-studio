import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Expand, RotateCcw, RotateCw, ZoomIn, ZoomOut, type LucideIcon } from 'lucide-react'
import { BackSide, Box3, EdgesGeometry, FrontSide, MathUtils, Shape, ShapeGeometry, Vector3, type Group, type LineSegments } from 'three'
import type { BoxDimensions, PackagingStructure } from '@/lib/cms/types'
import { dielineMetrics } from '@/lib/packaging/dieline'
import { palette } from '@/lib/palette'

export interface BoxViewerProps {
  structure: PackagingStructure
  dims: BoxDimensions
  /** 0 = planificada, 1 = montada. */
  fold: number
  /** Cor da face impressa (hex). */
  color: string
  reducedMotion: boolean
}

/** 1 unidade de cena = 100 mm. */
const MM = 1 / 100
const FOV = 30
const ZOOM_MIN = 0.6
const ZOOM_MAX = 2.4

const RIGHT_ANGLE = Math.PI / 2
const DUST_ANGLE = MathUtils.degToRad(92)
const GLUE_ANGLE = MathUtils.degToRad(92)
const TUCK_ANGLE = MathUtils.degToRad(91)

const STRUCTURE_LABEL: Record<PackagingStructure, string> = {
  'tuck-end': 'cartucho tuck-end',
  sleeve: 'luva',
}

type ViewAction = 'left' | 'right' | 'closer' | 'farther' | 'reset'
interface ViewCommand { action: ViewAction; id: number }
const VIEW_CONTROLS: Array<{ action: ViewAction; label: string; icon: LucideIcon }> = [
  { action: 'left', label: 'Girar à esquerda', icon: RotateCcw },
  { action: 'right', label: 'Girar à direita', icon: RotateCw },
  { action: 'closer', label: 'Aproximar', icon: ZoomIn },
  { action: 'farther', label: 'Afastar', icon: ZoomOut },
  { action: 'reset', label: 'Restaurar vista', icon: Expand },
]

type Point = readonly [number, number]

interface PanelGeometry {
  face: ShapeGeometry
  edges: EdgesGeometry
}

function fromShape(shape: Shape): PanelGeometry {
  const face = new ShapeGeometry(shape, 6)
  return { face, edges: new EdgesGeometry(face) }
}

function polygon(points: Point[]): PanelGeometry {
  const shape = new Shape()
  points.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)))
  shape.closePath()
  return fromShape(shape)
}

function rect(w: number, h: number): PanelGeometry {
  return polygon([
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ])
}

/** Aba de encaixe com a dobra em y = 0, abrindo para `dir` (+1 cima, -1 baixo). */
function tuckFlap(w: number, t: number, r: number, dir: 1 | -1): PanelGeometry {
  const shape = new Shape()
  shape.moveTo(0, 0)
  shape.lineTo(w, 0)
  shape.lineTo(w, dir * (t - r))
  shape.quadraticCurveTo(w, dir * t, w - r, dir * t)
  shape.lineTo(r, dir * t)
  shape.quadraticCurveTo(0, dir * t, 0, dir * (t - r))
  shape.closePath()
  return fromShape(shape)
}

interface BoxGeometries {
  wide: PanelGeometry
  side: PanelGeometry
  glue: PanelGeometry
  ends: {
    lidTop: PanelGeometry
    lidBottom: PanelGeometry
    tuckTop: PanelGeometry
    tuckBottom: PanelGeometry
    dustTop: PanelGeometry
    dustBottom: PanelGeometry
  } | null
}

function buildGeometries(structure: PackagingStructure, dims: BoxDimensions): BoxGeometries {
  const m = dielineMetrics(structure, dims)
  const W = dims.width * MM
  const H = dims.height * MM
  const D = dims.depth * MM
  const g = m.glue * MM
  const gc = m.glueChamfer * MM

  const geometries: BoxGeometries = {
    wide: rect(W, H),
    side: rect(D, H),
    glue: polygon([
      [0, 0],
      [0, H],
      [-g, H - gc],
      [-g, gc],
    ]),
    ends: null,
  }

  if (structure === 'tuck-end') {
    const lid = dims.depth * MM
    const t = m.tuck * MM
    const r = m.tuckRadius * MM
    const f = m.dust * MM
    const c = m.dustChamfer * MM
    const dust = (dir: 1 | -1) =>
      polygon([
        [0, 0],
        [D, 0],
        [D - c, dir * f],
        [c, dir * f],
      ])
    geometries.ends = {
      lidTop: polygon([
        [0, 0],
        [W, 0],
        [W, lid],
        [0, lid],
      ]),
      lidBottom: polygon([
        [0, 0],
        [W, 0],
        [W, -lid],
        [0, -lid],
      ]),
      tuckTop: tuckFlap(W, t, r, 1),
      tuckBottom: tuckFlap(W, t, r, -1),
      dustTop: dust(1),
      dustBottom: dust(-1),
    }
  }
  return geometries
}

function disposeGeometries(geometries: BoxGeometries): void {
  const all: Array<PanelGeometry | undefined> = [
    geometries.wide,
    geometries.side,
    geometries.glue,
    ...(geometries.ends ? Object.values(geometries.ends) : []),
  ]
  for (const panel of all) {
    panel?.face.dispose()
    panel?.edges.dispose()
  }
}


/** Progresso suavizado de uma etapa dentro da janela [from, to] do valor único de dobra. */
function stage(fold: number, from: number, to: number): number {
  return MathUtils.smoothstep(fold, from, to)
}

interface PanelProps {
  geometry: PanelGeometry
  color: string
  /** Contorno das abas internas: some quando a aba fecha, para não vazar através das paredes. */
  outlineRef?: (node: LineSegments | null) => void
}

function Panel({ geometry, color, outlineRef }: PanelProps) {
  return (
    <>
      <mesh geometry={geometry.face}>
        <meshStandardMaterial
          color={color}
          side={FrontSide}
          roughness={0.92}
          metalness={0}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      <mesh geometry={geometry.face}>
        <meshStandardMaterial
          color={palette.cream}
          side={BackSide}
          roughness={0.92}
          metalness={0}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      <lineSegments ref={outlineRef} geometry={geometry.edges}>
        <lineBasicMaterial color={palette.ink} />
      </lineSegments>
    </>
  )
}

type InnerFlap = 'glue' | 'dust' | 'tuck'

type HingeName =
  | 'spin'
  | 'root'
  | 'glue'
  | 'left'
  | 'front'
  | 'right'
  | 'lidTop'
  | 'lidBottom'
  | 'tuckTop'
  | 'tuckBottom'
  | 'dustLeftTop'
  | 'dustLeftBottom'
  | 'dustRightTop'
  | 'dustRightBottom'

function BoxScene({ structure, dims, fold, color, reducedMotion, command }: BoxViewerProps & { command: ViewCommand | null }) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const invalidate = useThree((state) => state.invalidate)

  const bounds = useMemo(() => new Box3(), [])
  const center = useMemo(() => new Vector3(), [])
  const extent = useMemo(() => new Vector3(), [])
  const up = useMemo(() => new Vector3(0, 1, 0), [])
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const hinges = useRef<Partial<Record<HingeName, Group>>>({})
  const bind = (name: HingeName) => (node: Group | null) => {
    if (node) hinges.current[name] = node
    else delete hinges.current[name]
  }
  const outlines = useRef<Record<InnerFlap, Set<LineSegments>>>({ glue: new Set(), dust: new Set(), tuck: new Set() })
  const outline = (kind: InnerFlap) => (node: LineSegments | null) => {
    if (node) {
      outlines.current[kind].add(node)
      return () => {
        outlines.current[kind].delete(node)
      }
    }
  }

  const { width, height, depth } = dims
  const geometries = useMemo(
    () => buildGeometries(structure, { width, height, depth }),
    [structure, width, height, depth],
  )
  useEffect(() => () => disposeGeometries(geometries), [geometries])

  const W = width * MM
  const H = height * MM
  const D = depth * MM
  const lid = D

  /** Dobra exibida; começa plana e persegue o alvo (ou salta, com movimento reduzido). */
  const shown = useRef(reducedMotion ? fold : 0)
  const target = useRef(fold)
  const lastFit = useRef<number | null>(null)

  const apply = (value: number) => {
    const h = hinges.current
    const walls = stage(value, 0, 0.5)
    const dust = stage(value, 0.5, 0.7)
    const lids = stage(value, 0.7, 0.9)
    const tucks = stage(value, 0.9, 1)

    // Todas as dobras vão para -z (em cada referencial local): a face impressa fica por fora.
    if (h.left) h.left.rotation.y = walls * RIGHT_ANGLE
    if (h.front) h.front.rotation.y = walls * RIGHT_ANGLE
    if (h.right) h.right.rotation.y = walls * RIGHT_ANGLE
    if (h.glue) h.glue.rotation.y = -walls * GLUE_ANGLE
    if (h.lidTop) h.lidTop.rotation.x = -lids * RIGHT_ANGLE
    if (h.lidBottom) h.lidBottom.rotation.x = lids * RIGHT_ANGLE
    if (h.tuckTop) h.tuckTop.rotation.x = -tucks * TUCK_ANGLE
    if (h.tuckBottom) h.tuckBottom.rotation.x = tucks * TUCK_ANGLE
    if (h.dustLeftTop) h.dustLeftTop.rotation.x = -dust * DUST_ANGLE
    if (h.dustRightTop) h.dustRightTop.rotation.x = -dust * DUST_ANGLE
    if (h.dustLeftBottom) h.dustLeftBottom.rotation.x = dust * DUST_ANGLE
    if (h.dustRightBottom) h.dustRightBottom.rotation.x = dust * DUST_ANGLE

    // Abas internas já fechadas ficam escondidas dentro da caixa: sem contorno, sem vazamento.
    const hidden = 0.995
    for (const line of outlines.current.glue) line.visible = walls < hidden
    for (const line of outlines.current.dust) line.visible = dust < hidden
    for (const line of outlines.current.tuck) line.visible = tucks < hidden

    // Mede a hierarquia já dobrada, em vez de interpolar uma caixa que pode recortar
    // os painéis no meio do movimento. Reutiliza as caixas/vetores a cada frame.
    if (!h.spin || !h.root) return
    h.spin.rotation.set(0.32 * walls, (Math.PI - 0.7) * walls, 0)
    h.spin.position.set(0, 0, 0)
    h.spin.updateMatrixWorld(true)
    bounds.setFromObject(h.root)
    bounds.getCenter(center)
    bounds.getSize(extent)
    h.spin.position.copy(center).multiplyScalar(-1)

    // A esfera do AABB inclui tampas e encaixes em qualquer ângulo de órbita.
    if ('fov' in camera) {
      const aspect = size.height > 0 ? Math.max(size.width / size.height, 0.01) : 1
      const halfV = MathUtils.degToRad(camera.fov) / 2
      const halfH = Math.atan(Math.tan(halfV) * aspect)
      const fit = extent.length() / (2 * Math.sin(Math.min(halfV, halfH))) * 1.12
      // Preserva o zoom escolhido pela pessoa, como razão sobre o enquadramento anterior.
      const zoom =
        lastFit.current === null
          ? 1
          : MathUtils.clamp(camera.position.length() / lastFit.current, ZOOM_MIN, ZOOM_MAX)
      if (camera.position.lengthSq() === 0) camera.position.set(0, 0, 1)
      camera.position.setLength(fit * zoom)
      lastFit.current = fit
      if (controls.current) {
        controls.current.minDistance = fit * ZOOM_MIN
        controls.current.maxDistance = fit * ZOOM_MAX
        controls.current.update()
      }
    }
  }

  // Medidas, estrutura ou tamanho do canvas mudaram: reposiciona tudo na dobra atual.
  useLayoutEffect(() => {
    apply(shown.current)
    invalidate()
  }, [structure, width, height, depth, size.width, size.height, camera])

  useEffect(() => {
    target.current = MathUtils.clamp(fold, 0, 1)
    invalidate()
  }, [fold, reducedMotion, invalidate])

  useEffect(() => {
    if (!command || !controls.current || lastFit.current === null) return
    const fit = lastFit.current
    if (command.action === 'reset') {
      camera.position.set(0, 0, fit)
      camera.up.set(0, 1, 0)
    } else if (command.action === 'left' || command.action === 'right') {
      camera.position.applyAxisAngle(up, (command.action === 'left' ? -1 : 1) * Math.PI / 12)
    } else {
      const scale = command.action === 'closer' ? 0.8 : 1.25
      camera.position.setLength(MathUtils.clamp(camera.position.length() * scale, fit * ZOOM_MIN, fit * ZOOM_MAX))
    }
    controls.current.update()
    invalidate()
  }, [command, camera, invalidate, up])

  useFrame((state, delta) => {
    const diff = target.current - shown.current
    if (diff === 0) return
    if (reducedMotion || Math.abs(diff) < 0.0008) {
      shown.current = target.current
    } else {
      const dt = Math.min(delta, 1 / 30)
      const maxStep = dt * 0.85
      shown.current += MathUtils.clamp(diff * (1 - Math.exp(-dt * 9)), -maxStep, maxStep)
      state.invalidate()
    }
    apply(shown.current)
  })

  const ends = geometries.ends

  return (
    <>
      <ambientLight intensity={2} />
      <directionalLight position={[3, 5, 6]} intensity={1.1} />
      <directionalLight position={[-5, -2, 3]} intensity={0.5} />
      <OrbitControls
        ref={controls}
        makeDefault
        enablePan={false}
        enableDamping={!reducedMotion}
        dampingFactor={0.09}
        rotateSpeed={0.8}
      />

      <group ref={bind('spin')}>
        {/* Raiz = painel do verso, com a origem no canto inferior esquerdo. */}
        <group ref={bind('root')}>
          <Panel geometry={geometries.wide} color={color} />

          <group ref={bind('glue')}>
            <Panel geometry={geometries.glue} color={color} outlineRef={outline('glue')} />
          </group>

          {ends && (
            <>
              <group ref={bind('lidTop')} position={[0, H, 0]}>
                <Panel geometry={ends.lidTop} color={color} />
                <group ref={bind('tuckTop')} position={[0, lid, 0]}>
                  <Panel geometry={ends.tuckTop} color={color} outlineRef={outline('tuck')} />
                </group>
              </group>
              <group ref={bind('lidBottom')}>
                <Panel geometry={ends.lidBottom} color={color} />
                <group ref={bind('tuckBottom')} position={[0, -lid, 0]}>
                  <Panel geometry={ends.tuckBottom} color={color} outlineRef={outline('tuck')} />
                </group>
              </group>
            </>
          )}

          <group ref={bind('left')} position={[W, 0, 0]}>
            <Panel geometry={geometries.side} color={color} />
            {ends && (
              <>
                <group ref={bind('dustLeftTop')} position={[0, H, 0]}>
                  <Panel geometry={ends.dustTop} color={color} outlineRef={outline('dust')} />
                </group>
                <group ref={bind('dustLeftBottom')}>
                  <Panel geometry={ends.dustBottom} color={color} outlineRef={outline('dust')} />
                </group>
              </>
            )}

            <group ref={bind('front')} position={[D, 0, 0]}>
              <Panel geometry={geometries.wide} color={color} />

              <group ref={bind('right')} position={[W, 0, 0]}>
                <Panel geometry={geometries.side} color={color} />
                {ends && (
                  <>
                    <group ref={bind('dustRightTop')} position={[0, H, 0]}>
                      <Panel geometry={ends.dustTop} color={color} outlineRef={outline('dust')} />
                    </group>
                    <group ref={bind('dustRightBottom')}>
                      <Panel geometry={ends.dustBottom} color={color} outlineRef={outline('dust')} />
                    </group>
                  </>
                )}
              </group>
            </group>
          </group>
        </group>
      </group>
    </>
  )
}

export default function BoxViewer(props: BoxViewerProps) {
  const { structure, dims, fold } = props
  const [command, setCommand] = useState<ViewCommand | null>(null)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const [contextLost, setContextLost] = useState(false)
  useEffect(() => {
    if (!canvas) return
    const lost = () => setContextLost(true)
    canvas.addEventListener('webglcontextlost', lost)
    return () => canvas.removeEventListener('webglcontextlost', lost)
  }, [canvas])
  const percent = Math.round(MathUtils.clamp(fold, 0, 1) * 100)
  const state = percent === 0 ? 'planificada' : percent === 100 ? 'montada' : `${percent}% montada`
  const label = `Prévia 3D da embalagem ${STRUCTURE_LABEL[structure]}, ${dims.width} × ${dims.height} × ${dims.depth} mm (largura × altura × profundidade), ${state}. Arraste para girar.`

  if (contextLost) {
    return (
      <div role="status" className="flex h-full items-center justify-center p-8 text-center text-sm font-medium text-ink">
        A prévia 3D perdeu a conexão gráfica. A faca e o download continuam disponíveis abaixo.
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <div role="img" aria-label={label} className="h-full w-full cursor-grab touch-none active:cursor-grabbing">
        <Canvas
          frameloop="demand"
          dpr={[1, 1.75]}
          flat
          gl={{ alpha: true, antialias: true }}
          camera={{ fov: FOV, near: 0.01, far: 400, position: [0, 0, 8] }}
          onCreated={({ gl }) => setCanvas(gl.domElement)}
          style={{ background: 'transparent' }}
        >
          <BoxScene {...props} command={command} />
        </Canvas>
      </div>
      <div role="group" aria-label="Controles da vista 3D" className="absolute right-3 top-3 flex max-w-[75%] flex-wrap justify-end gap-1.5">
        {VIEW_CONTROLS.map(({ action, label: controlLabel, icon: Icon }) => (
          <button
            key={action}
            type="button"
            aria-label={controlLabel}
            title={controlLabel}
            onClick={() => setCommand((previous) => ({ action, id: (previous?.id ?? 0) + 1 }))}
            className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-ink bg-cream text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <Icon size={20} strokeWidth={2.5} aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  )
}
