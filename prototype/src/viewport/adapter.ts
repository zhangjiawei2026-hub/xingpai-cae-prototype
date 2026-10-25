import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { makeBracket } from "./bracket";
import type { EntityType } from "../types/domain";

export type ViewMode = "iso" | "front" | "top" | "right";
export function createViewport(
  container: HTMLElement,
  onPick: (id: number) => void,
  onDirection?: (axes: { x: number; y: number }[]) => void,
  onOrbit?: () => void,
) {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor("#dbe6f2", 0);
  renderer.domElement.setAttribute(
    "aria-label",
    "安装支架三维演示模型，拖动旋转，滚轮缩放",
  );
  renderer.domElement.setAttribute("role", "img");
  container.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.5, 0);
  controls.enableDamping = false;
  controls.minDistance = 5;
  controls.maxDistance = 35;
  const { group, nodes, elements } = makeBracket();
  scene.add(group);
  scene.add(new THREE.HemisphereLight("#eef6ff", "#6f8796", 2.2));
  const light = new THREE.DirectionalLight("#ffffff", 3);
  light.position.set(3, 7, 5);
  scene.add(light);
  const rim = new THREE.DirectionalLight("#5ecce5", 1.8);
  rim.position.set(-5, 3, -4);
  scene.add(rim);
  const grid = new THREE.GridHelper(22, 44, "#8aa6c4", "#a9bfd8");
  const gridMaterial = grid.material as THREE.LineBasicMaterial;
  gridMaterial.transparent = true;
  gridMaterial.opacity = 0.45;
  grid.position.y = -0.94;
  scene.add(grid);
  const markerGroup = new THREE.Group();
  scene.add(markerGroup);
  const highlights = new THREE.Group();
  scene.add(highlights);
  let active: EntityType | null = null;
  let empty = false,
    disposed = false;
  const render = () => {
    if (!disposed) {
      renderer.render(scene, camera);
      const inverse = camera.quaternion.clone().invert();
      onDirection?.(
        [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ].map(([x, y, z]) => {
          const axis = new THREE.Vector3(x, y, z).applyQuaternion(inverse);
          return { x: 38 + axis.x * 25, y: 36 - axis.y * 25 };
        }),
      );
    }
  };
  const resize = () => {
    const w = container.clientWidth,
      h = container.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    render();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  function clear(groupToClear: THREE.Group) {
    [...groupToClear.children].forEach((child) => {
      groupToClear.remove(child);
      if (
        child instanceof THREE.Mesh ||
        child instanceof THREE.LineSegments ||
        child instanceof THREE.Points
      ) {
        child.geometry.dispose();
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        materials.forEach((m) => m.dispose());
      }
    });
  }
  function setSelection(entity: EntityType | null, ids: number[]) {
    active = entity;
    controls.mouseButtons.LEFT = entity ? null : THREE.MOUSE.ROTATE;
    clear(markerGroup);
    clear(highlights);
    if (entity === "Node") {
      const geometry = new THREE.BufferGeometry().setFromPoints(
        nodes.map((n) => n.position),
      );
      markerGroup.add(
        new THREE.Points(
          geometry,
          new THREE.PointsMaterial({
            color: "#a8e4f1",
            size: 0.065,
            depthTest: false,
          }),
        ),
      );
      ids.forEach((id) => {
        const node = nodes[id - 1];
        if (!node) return;
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.075, 10, 8),
          new THREE.MeshBasicMaterial({ color: "#f4c171", depthTest: false }),
        );
        sphere.position.copy(node.position);
        sphere.renderOrder = 4;
        highlights.add(sphere);
      });
    } else if (entity === "Element") {
      ids.forEach((id) => {
        const el = elements[id - 1];
        if (!el) return;
        const geometry = new THREE.BufferGeometry().setFromPoints(el.vertices);
        geometry.computeVertexNormals();
        const mesh = new THREE.Mesh(
          geometry,
          new THREE.MeshBasicMaterial({
            color: "#f1ba62",
            side: THREE.DoubleSide,
            depthTest: false,
            transparent: true,
            opacity: 0.9,
          }),
        );
        mesh.renderOrder = 4;
        highlights.add(mesh);
      });
    }
    render();
  }
  const bounds = new THREE.Box3()
    .setFromObject(group)
    .getBoundingSphere(new THREE.Sphere());
  function fit() {
    const direction = camera.position.clone().sub(controls.target).normalize();
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const limitingFov = Math.min(
      halfFov,
      Math.atan(Math.tan(halfFov) * camera.aspect),
    );
    const distance = (bounds.radius / Math.sin(limitingFov)) * 1.15;
    controls.maxDistance = Math.max(35, distance * 2);
    camera.far = Math.max(100, distance * 4);
    camera.updateProjectionMatrix();
    controls.target.copy(bounds.center);
    camera.position.copy(bounds.center).addScaledVector(direction, distance);
    controls.update();
    render();
  }
  function view(mode: ViewMode) {
    const direction = new THREE.Vector3(
      ...({
        iso: [8.5, 6.4, 10.2],
        front: [0, 0, 1],
        top: [0, 1, 0.00001],
        right: [1, 0, 0],
      }[mode] as [number, number, number]),
    );
    camera.position.copy(controls.target).add(direction);
    fit();
  }
  const ray = new THREE.Raycaster();
  const pick = (event: PointerEvent) => {
    if (!active || empty || event.button !== 0) return;
    const box = renderer.domElement.getBoundingClientRect();
    ray.setFromCamera(
      new THREE.Vector2(
        ((event.clientX - box.left) / box.width) * 2 - 1,
        (-(event.clientY - box.top) / box.height) * 2 + 1,
      ),
      camera,
    );
    const hit = ray.intersectObjects(
      group.children.filter((object) => object instanceof THREE.Mesh),
    )[0];
    if (!hit) return;
    if (active === "Node") {
      let nearest = nodes[0];
      nodes.forEach((node) => {
        if (
          node.position.distanceToSquared(hit.point) <
          nearest.position.distanceToSquared(hit.point)
        )
          nearest = node;
      });
      onPick(nearest.id);
    } else {
      onPick(
        (hit.object.userData.elementOffset as number) +
          (hit.faceIndex ?? 0) +
          1,
      );
    }
  };
  renderer.domElement.addEventListener("pointerup", pick);
  const previousRotation = camera.quaternion.clone();
  controls.addEventListener("change", () => {
    if (previousRotation.angleTo(camera.quaternion) > 0.00001) onOrbit?.();
    previousRotation.copy(camera.quaternion);
    render();
  });
  resize();
  view("iso");
  return {
    view,
    fit,
    setSelection,
    setVisible(visible: boolean) {
      empty = !visible;
      group.visible = visible;
      markerGroup.visible = visible;
      highlights.visible = visible;
      render();
    },
    setWireframe(visible: boolean) {
      group.children.forEach((object) => {
        if (
          object instanceof THREE.LineSegments &&
          object.geometry instanceof THREE.WireframeGeometry
        )
          object.visible = visible;
      });
      render();
    },
    zoom(delta: number) {
      camera.position
        .sub(controls.target)
        .multiplyScalar(delta)
        .add(controls.target);
      controls.update();
      render();
    },
    counts: { nodes: nodes.length, elements: elements.length },
    dispose() {
      disposed = true;
      observer.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointerup", pick);
      clear(markerGroup);
      clear(highlights);
      clear(group);
      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
