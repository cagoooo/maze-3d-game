import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const POOL_SIZE = 240;
const PER_BURST = 24;
const LIFE = 0.6;
const GRAVITY = 9.5;

export interface ParticleBurstHandle {
  spawn: (x: number, y: number, z: number) => void;
}

export const ParticleBurst = forwardRef<ParticleBurstHandle>(
  function ParticleBurst(_, ref) {
    const pointsRef = useRef<THREE.Points>(null);

    const { positions, colors, velocities, ages } = useMemo(() => {
      const positions = new Float32Array(POOL_SIZE * 3);
      const colors = new Float32Array(POOL_SIZE * 3);
      const velocities = new Float32Array(POOL_SIZE * 3);
      const ages = new Float32Array(POOL_SIZE);
      for (let i = 0; i < POOL_SIZE; i++) ages[i] = LIFE + 1;
      return { positions, colors, velocities, ages };
    }, []);

    const nextIdxRef = useRef(0);

    useImperativeHandle(ref, () => ({
      spawn(x, y, z) {
        const geo = pointsRef.current?.geometry;
        if (!geo) return;
        for (let i = 0; i < PER_BURST; i++) {
          const idx = nextIdxRef.current;
          nextIdxRef.current = (idx + 1) % POOL_SIZE;
          positions[idx * 3] = x;
          positions[idx * 3 + 1] = y;
          positions[idx * 3 + 2] = z;

          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const speed = 2.2 + Math.random() * 2.8;
          velocities[idx * 3] = Math.sin(phi) * Math.cos(theta) * speed;
          velocities[idx * 3 + 1] = Math.cos(phi) * speed * 0.6 + 1.8;
          velocities[idx * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;

          colors[idx * 3] = 1.0;
          colors[idx * 3 + 1] = 0.85;
          colors[idx * 3 + 2] = 0.35;

          ages[idx] = 0;
        }
        geo.attributes.position.needsUpdate = true;
        geo.attributes.color.needsUpdate = true;
      },
    }));

    useFrame((_, dtRaw) => {
      const dt = Math.min(dtRaw, 0.05);
      const geo = pointsRef.current?.geometry;
      if (!geo) return;
      let anyAlive = false;
      for (let i = 0; i < POOL_SIZE; i++) {
        const age = ages[i];
        if (age >= LIFE) continue;
        const newAge = age + dt;
        ages[i] = newAge;
        velocities[i * 3 + 1] -= GRAVITY * dt;
        positions[i * 3] += velocities[i * 3] * dt;
        positions[i * 3 + 1] += velocities[i * 3 + 1] * dt;
        positions[i * 3 + 2] += velocities[i * 3 + 2] * dt;
        const fade = Math.max(0, 1 - newAge / LIFE);
        const f2 = fade * fade;
        colors[i * 3] = 1.0 * f2;
        colors[i * 3 + 1] = 0.85 * f2;
        colors[i * 3 + 2] = 0.35 * f2;
        anyAlive = true;
      }
      if (anyAlive) {
        geo.attributes.position.needsUpdate = true;
        geo.attributes.color.needsUpdate = true;
      }
    });

    return (
      <points ref={pointsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
            count={POOL_SIZE}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
            count={POOL_SIZE}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.22}
          sizeAttenuation
          transparent
          depthWrite={false}
          vertexColors
          blending={THREE.AdditiveBlending}
        />
      </points>
    );
  },
);
