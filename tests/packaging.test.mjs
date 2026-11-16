import assert from 'node:assert/strict'
import test from 'node:test'
import { buildDieline, dielineMetrics, dielineToSvg } from '../src/lib/packaging/dieline.ts'

function contourPoints(path) {
  const tokens = path.match(/[MLQZ]|-?\d+(?:\.\d+)?/g)
  const points = []
  let i = 0
  let current = [0, 0]
  while (i < tokens.length) {
    const command = tokens[i++]
    if (command === 'M' || command === 'L') {
      current = [+tokens[i++], +tokens[i++]]
      points.push(current)
    } else if (command === 'Q') {
      const control = [+tokens[i++], +tokens[i++]]
      const end = [+tokens[i++], +tokens[i++]]
      const start = current
      for (let step = 1; step <= 32; step++) {
        const t = step / 32
        points.push(start.map((v, axis) => (1 - t) ** 2 * v + 2 * (1 - t) * t * control[axis] + t * t * end[axis]))
      }
      current = end
    } else {
      assert.equal(command, 'Z')
    }
  }
  return points
}

function area(points) {
  return Math.abs(points.reduce((sum, a, i) => {
    const b = points[(i + 1) % points.length]
    return sum + a[0] * b[1] - b[0] * a[1]
  }, 0) / 2)
}

const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])

for (const [structure, widths, heights, depths] of [
  ['tuck-end', [40, 200], [50, 300], [20, 120]],
  ['sleeve', [40, 250], [30, 250], [10, 120]],
]) {
  test(`${structure}: extreme dimensions preserve a usable dieline`, () => {
    for (const width of widths) for (const height of heights) for (const depth of depths) {
      const dims = { width, height, depth }
      const metrics = dielineMetrics(structure, dims)
      const dieline = buildDieline(structure, dims, 3)
      assert.ok(metrics.glue < depth, 'glue must not cross the opposite wall')
      assert.equal(dieline.flatWidth, 2 * (width + depth) + metrics.glue)
      assert.equal(dieline.flatHeight, height + (structure === 'tuck-end' ? 2 * (depth + metrics.tuck) : 0))
      const points = contourPoints(dieline.cut)
      assert.ok(Math.abs(area(points) - dieline.panelArea) < 0.1, 'quoted board area must match the cut contour')
      for (let a = 0; a < points.length; a++) for (let b = a + 2; b < points.length; b++) {
        if (a === 0 && b === points.length - 1) continue
        const A = points[a], B = points[(a + 1) % points.length]
        const C = points[b], D = points[(b + 1) % points.length]
        assert.ok(!(cross(A, B, C) * cross(A, B, D) < -1e-8 && cross(C, D, A) * cross(C, D, B) < -1e-8), 'cut must not cross itself')
      }
      for (const [x, y] of points) {
        assert.ok(x >= dieline.bleed && y >= dieline.bleed)
        assert.ok(x <= dieline.width - dieline.bleed && y <= dieline.height - dieline.bleed)
      }
    }
  })
}

test('SVG metadata cannot inject markup or invalid XML controls', () => {
  const dims = { width: 80, height: 120, depth: 40 }
  const dieline = buildDieline('tuck-end', dims, 3)
  const svg = dielineToSvg(dieline, { name: '<script>&"\'\u0001', dims, bleed: 3 })
  assert.ok(svg.includes('&lt;script&gt;&amp;&quot;&apos;'))
  assert.ok(!svg.includes('<script>'))
  assert.ok(!svg.includes('\u0001'))
})
