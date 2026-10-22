import * as THREE from "three";

export interface DemoNode {
  id: number;
  position: THREE.Vector3;
}
export interface DemoElement {
  id: number;
  center: THREE.Vector3;
  vertices: THREE.Vector3[];
}

function plate(
  width: number,
  height: number,
  holes: [number, number, number][],
) {
  const shape = new THREE.Shape();
  const w = width / 2,
    h = height / 2,
    r = 0.16;
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);
  holes.forEach(([x, y, radius]) => {
    const hole = new THREE.Path();
    hole.absarc(x, y, radius, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  });
  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.26,
    bevelEnabled: false,
    steps: 1,
    curveSegments: 24,
  });
}

// Procedural display geometry, not an engineering FEM mesh.
export function makeBracket() {
  const parts: THREE.BufferGeometry[] = [];
  const base = plate(5.8, 3.7, [
    [-2.25, -1.15, 0.25],
    [2.25, -1.15, 0.25],
    [-2.25, 1.15, 0.25],
    [2.25, 1.15, 0.25],
  ]);
  base.rotateX(-Math.PI / 2);
  base.translate(0, -0.9, 0.1);
  parts.push(base);
  const upright = plate(4.2, 3.8, [
    [0, 0.55, 0.8],
    [-1.48, 1.23, 0.2],
    [1.48, 1.23, 0.2],
  ]);
  upright.translate(0, 0.95, -1.22);
  parts.push(upright);
  const gusset = new THREE.Shape();
  gusset.moveTo(0, 0);
  gusset.lineTo(0, 2.4);
  gusset.lineTo(2.7, 0);
  gusset.closePath();
  for (const x of [-1.45, 1.19]) {
    const geom = new THREE.ExtrudeGeometry(gusset, {
      depth: 0.26,
      bevelEnabled: false,
      steps: 1,
    });
    geom.rotateY(-Math.PI / 2);
    geom.translate(x, -0.65, -1.2);
    parts.push(geom);
  }
  const group = new THREE.Group();
  const nodes: DemoNode[] = [],
    elements: DemoElement[] = [];
  const seen = new Set<string>();
  parts.forEach((geometry) => {
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: "#6b9eaf",
        roughness: 0.63,
        metalness: 0.25,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      }),
    );
    mesh.userData.elementOffset = elements.length;
    group.add(mesh);
    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(geometry),
      new THREE.LineBasicMaterial({
        color: "#294d5e",
        transparent: true,
        opacity: 0.55,
      }),
    );
    group.add(wire);
    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry, 30),
      new THREE.LineBasicMaterial({
        color: "#b9e0e7",
        transparent: true,
        opacity: 0.65,
      }),
    );
    group.add(edge);
    const positions = geometry.getAttribute("position");
    for (let i = 0; i < positions.count; i++) {
      const position = new THREE.Vector3().fromBufferAttribute(positions, i);
      const key = position
        .toArray()
        .map((n) => n.toFixed(3))
        .join(",");
      if (!seen.has(key)) {
        seen.add(key);
        nodes.push({ id: nodes.length + 1, position });
      }
    }
    const count = geometry.index?.count ?? positions.count;
    for (let i = 0; i < count; i += 3) {
      const vertices = [0, 1, 2].map((j) =>
        new THREE.Vector3().fromBufferAttribute(
          positions,
          geometry.index?.getX(i + j) ?? i + j,
        ),
      );
      elements.push({
        id: elements.length + 1,
        center: vertices
          .reduce((a, b) => a.add(b), new THREE.Vector3())
          .divideScalar(3),
        vertices,
      });
    }
  });
  return { group, nodes, elements };
}
