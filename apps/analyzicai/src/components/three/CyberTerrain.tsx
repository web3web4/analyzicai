'use client';

import { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useScroll } from 'framer-motion';
import * as THREE from 'three';

function hash(x: number, y: number): number {
  let n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function noise2D(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function fbm(x: number, y: number, octaves: number): number {
  let val = 0, amp = 1, freq = 1, tot = 0;
  for (let i = 0; i < octaves; i++) {
    val += noise2D(x * freq, y * freq) * amp;
    tot += amp;
    amp *= 0.45;
    freq *= 2.2;
  }
  return val / tot;
}

function ridged(x: number, y: number, octaves: number): number {
  let val = 0, amp = 1, freq = 1, tot = 0;
  for (let i = 0; i < octaves; i++) {
    const n = 1.0 - Math.abs(noise2D(x * freq, y * freq) * 2 - 1);
    val += n * n * amp; // squared for sharper ridges
    tot += amp;
    amp *= 0.5;
    freq *= 2.0;
  }
  return val / tot;
}

function terrainHeight(x: number, z: number, seed: number): number {
  const dist = Math.abs(x);

  const ramp = Math.pow(Math.max(0, (dist - 3)) / 10, 1.2);

  const n1 = fbm(x * 0.06 + seed, z * 0.06 + seed * 0.3, 5);
  const r1 = ridged(x * 0.04 + seed * 1.7, z * 0.05 + seed * 2.1, 4);
  const n2 = fbm(x * 0.15 + seed * 3.0, z * 0.12 + seed * 0.9, 3);

  const baseHeight = ramp * 4;
  const noiseHeight = (n1 * 2.5 + r1 * 4 + n2 * 1.2) * ramp;
  const spike = Math.pow(Math.abs(Math.sin(z * 0.13 + x * 0.09 + seed)), 8) * ramp * 3;

  return baseHeight + noiseHeight + spike;
}

const SEG_X = 40;     // subdivisions across (per side)
const SEG_Z = 200;    // subdivisions along depth
const Z_START = 30;
const Z_END = -90;
const TERRAIN_WIDTH = 35; // how far left/right each side extends

function MountainTerrain({ side }: { side: 'left' | 'right' }) {
  const geometry = useMemo(() => {
    const seed = side === 'left' ? 0.0 : 7.7;
    const xSign = side === 'left' ? -1 : 1;
    const xStart = 0;     // starts at center
    const xEnd = TERRAIN_WIDTH;

    const verts: number[] = [];
    const idx: number[] = [];

    for (let iz = 0; iz <= SEG_Z; iz++) {
      const z = Z_START + (Z_END - Z_START) * (iz / SEG_Z);
      for (let ix = 0; ix <= SEG_X; ix++) {
        const localX = xStart + (xEnd - xStart) * (ix / SEG_X);
        const worldX = localX * xSign;
        const y = terrainHeight(worldX, z, seed) - 3; // -3 to sink canyon floor
        verts.push(worldX, y, z);
      }
    }

    const stride = SEG_X + 1;
    for (let iz = 0; iz < SEG_Z; iz++) {
      for (let ix = 0; ix < SEG_X; ix++) {
        const a = iz * stride + ix;
        const b = a + 1;
        const c = (iz + 1) * stride + ix;
        const d = c + 1;
        idx.push(a, b, c, b, d, c);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  }, [side]);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color="#00FFD1" wireframe transparent opacity={0.18} />
    </mesh>
  );
}

const RIDGE_DISTANCES = [5, 10, 18, 28]; // X-distance from center for each contour

function NeonRidgeLines({ side }: { side: 'left' | 'right' }) {
  const clock = useRef(0);

  const lines = useMemo(() => {
    const seed = side === 'left' ? 0.0 : 7.7;
    const xSign = side === 'left' ? -1 : 1;

    return RIDGE_DISTANCES.map((dist, li) => {
      const points: THREE.Vector3[] = [];
      for (let iz = 0; iz <= SEG_Z; iz++) {
        const z = Z_START + (Z_END - Z_START) * (iz / SEG_Z);
        const worldX = dist * xSign;
        const y = terrainHeight(worldX, z, seed) - 3;
        points.push(new THREE.Vector3(worldX, y, z));
      }

      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const colors = new Float32Array((SEG_Z + 1) * 3);
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const mat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: li === 0 ? 1.0 : li === 1 ? 0.85 : 0.65,
      });
      return new THREE.Line(geo, mat);
    });
  }, [side]);

  useFrame((_, delta) => {
    clock.current += delta;
    const total = SEG_Z + 1;

    lines.forEach((line, li) => {
      const arr = (line.geometry.attributes.color as THREE.BufferAttribute)
        .array as Float32Array;

      const speed = 45 + li * 15;
      const width = 30 + li * 5;
      const offset = li * 40;

      const p1 = ((clock.current * speed + offset) % (total + width * 2)) - width;
      const p2 = total - ((clock.current * speed * 0.55 + offset * 1.6) % (total + width * 2)) + width;

      const isClose = li <= 1;
      const baseBrightness = isClose ? 0.45 : 0.15;

      for (let i = 0; i < total; i++) {
        const g1 = Math.max(0, 1 - Math.abs(i - p1) / width);
        const g2 = Math.max(0, 1 - Math.abs(i - p2) / width);
        const glow = Math.pow(Math.max(g1, g2), 1.5);

        // Cyan base (#00FFD1): R=0, G=1, B=0.82
        // Magenta pulse (#E500CE): R=0.898, G=0, B=0.808
        // Lerp from cyan to magenta based on glow intensity
        const cR = 0, cG = baseBrightness, cB = baseBrightness * 0.82;
        const pR = 0.95, pG = 0.0, pB = 0.85;
        arr[i * 3]     = Math.min(1, cR + glow * pR);           // R: 0 → bright pink
        arr[i * 3 + 1] = Math.min(1, cG * (1 - glow * 0.8));   // G: cyan → suppressed
        arr[i * 3 + 2] = Math.min(1, cB + glow * pB);           // B: stays strong
      }

      (line.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    });
  });

  return (
    <group>
      {lines.map((obj, i) => (
        <primitive key={i} object={obj} />
      ))}
    </group>
  );
}

function CanyonFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, -30]}>
      <planeGeometry args={[6, 120, 6, 120]} />
      <meshBasicMaterial color="#00FFD1" wireframe transparent opacity={0.08} />
    </mesh>
  );
}

function ScrollCamera() {
  const { camera } = useThree();
  const { scrollYProgress } = useScroll();
  const targetZ = useRef(0);

  useFrame(() => {
    const progress = scrollYProgress.get();
    targetZ.current = -progress * 50;

    camera.position.z += (targetZ.current - camera.position.z) * 0.06;
    camera.position.y += (2.0 - camera.position.y) * 0.05;
    // Gentle lateral sway
    const sway = Math.sin(progress * Math.PI * 2) * 1.2;
    camera.position.x += (sway - camera.position.x) * 0.03;
    camera.lookAt(camera.position.x * 0.3, 1.5, camera.position.z - 30);
  });

  return null;
}

function EndLogo() {
  const groupRef = useRef<THREE.Group>(null);
  const clock = useRef(0);

  const letterA = useMemo(() => {
    // Build an "A" shape from line segments
    const s = 5; // scale
    const points = [
      // Left leg
      new THREE.Vector3(-s * 0.5, -s, 0),
      new THREE.Vector3(0, s, 0),
      // Right leg
      new THREE.Vector3(0, s, 0),
      new THREE.Vector3(s * 0.5, -s, 0),
      // Crossbar
      new THREE.Vector3(-s * 0.25, 0, 0),
      new THREE.Vector3(s * 0.25, 0, 0),
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, []);

  useFrame((_, delta) => {
    clock.current += delta;
    if (!groupRef.current) return;
    groupRef.current.position.y = 6 + Math.sin(clock.current * 0.8) * 0.3;
    groupRef.current.rotation.y = Math.sin(clock.current * 0.3) * 0.15;
  });

  return (
    <group ref={groupRef} position={[0, 6, Z_END + 5]}>
      {/* Glow layers — progressively larger, more transparent copies */}
      <lineSegments geometry={letterA} scale={[1.15, 1.15, 1]}>
        <lineBasicMaterial color="#00FFD1" transparent opacity={0.12} />
      </lineSegments>
      <lineSegments geometry={letterA} scale={[1.3, 1.3, 1]}>
        <lineBasicMaterial color="#00FFD1" transparent opacity={0.06} />
      </lineSegments>
      <lineSegments geometry={letterA} scale={[1.5, 1.5, 1]}>
        <lineBasicMaterial color="#00FFD1" transparent opacity={0.03} />
      </lineSegments>

      {/* Core cyan A */}
      <lineSegments geometry={letterA}>
        <lineBasicMaterial color="#00FFD1" transparent opacity={1.0} />
      </lineSegments>

      {/* Magenta glow layers */}
      <lineSegments geometry={letterA} position={[0.1, -0.1, -0.2]} scale={[1.15, 1.15, 1]}>
        <lineBasicMaterial color="#E500CE" transparent opacity={0.15} />
      </lineSegments>
      <lineSegments geometry={letterA} position={[0.1, -0.1, -0.2]} scale={[1.3, 1.3, 1]}>
        <lineBasicMaterial color="#E500CE" transparent opacity={0.08} />
      </lineSegments>

      {/* Core magenta A */}
      <lineSegments geometry={letterA} position={[0.1, -0.1, -0.2]}>
        <lineBasicMaterial color="#E500CE" transparent opacity={0.5} />
      </lineSegments>

      {/* Outer rings with glow */}
      <mesh>
        <ringGeometry args={[5.5, 5.8, 6]} />
        <meshBasicMaterial color="#00FFD1" transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <ringGeometry args={[6, 6.3, 6]} />
        <meshBasicMaterial color="#00FFD1" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <ringGeometry args={[6.3, 7, 6]} />
        <meshBasicMaterial color="#00FFD1" transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>

      <mesh>
        <ringGeometry args={[6.6, 6.9, 6]} />
        <meshBasicMaterial color="#E500CE" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <ringGeometry args={[6.9, 7.6, 6]} />
        <meshBasicMaterial color="#E500CE" transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>

      {/* Center glow disc */}
      <mesh>
        <circleGeometry args={[4, 32]} />
        <meshBasicMaterial color="#00FFD1" transparent opacity={0.04} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ── Main exported component ── */
export default function CyberTerrain() {
  const handleCreated = useCallback(
    ({ gl }: { gl: THREE.WebGLRenderer }) => {
      gl.setClearColor('#0A0A0F', 0);
    },
    []
  );

  return (
    <div
      className="fixed inset-0 z-0"
      style={{ pointerEvents: 'none', background: 'transparent' }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 2.0, 5], fov: 75, near: 0.1, far: 150 }}
        dpr={[1, 1.5]}
        onCreated={handleCreated}
        gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
      >
        <fog attach="fog" args={['#0A0A0F', 10, 70]} />
        <ScrollCamera />
        <MountainTerrain side="left" />
        <MountainTerrain side="right" />
        <NeonRidgeLines side="left" />
        <NeonRidgeLines side="right" />
        <CanyonFloor />
        <EndLogo />
      </Canvas>
    </div>
  );
}
