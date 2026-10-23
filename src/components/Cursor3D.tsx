"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import type { Group } from "three";

function usePrefersFinePointer() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const pointer = window.matchMedia("(pointer: fine)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const width = window.matchMedia("(min-width: 768px)");

    const update = () => {
      setEnabled(pointer.matches && width.matches && !motion.matches);
    };

    update();
    pointer.addEventListener("change", update);
    motion.addEventListener("change", update);
    width.addEventListener("change", update);
    return () => {
      pointer.removeEventListener("change", update);
      motion.removeEventListener("change", update);
      width.removeEventListener("change", update);
    };
  }, []);

  return enabled;
}

function Y2KCursor({ isDark }: { isDark: boolean }) {
  const group = useRef<Group>(null);
  const mouse = useRef({ x: 0.42, y: 0.08 });

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame(({ viewport }, delta) => {
    if (!group.current) {
      return;
    }

    const nextX = (mouse.current.x * viewport.width) / 2;
    const nextY = (mouse.current.y * viewport.height) / 2;
    const lerp = 1 - Math.exp(-delta * 7);

    group.current.position.x += (nextX - group.current.position.x) * lerp;
    group.current.position.y += (nextY - group.current.position.y) * lerp;
    group.current.rotation.x += delta * 0.7;
    group.current.rotation.y += delta * 1.1;
    group.current.rotation.z += delta * 0.35;
  });

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial
          color={isDark ? "#CDE3B6" : "#F3B3BA"}
          emissive={isDark ? "#E8C5C8" : "#E8C5C8"}
          emissiveIntensity={isDark ? 2.4 : 0.55}
          roughness={0.35}
          metalness={0.05}
          flatShading
          toneMapped={false}
        />
      </mesh>
      <mesh scale={0.46}>
        <octahedronGeometry args={[0.58, 0]} />
        <meshStandardMaterial
          color="#FFF6E9"
          emissive={isDark ? "#CDE3B6" : "#C2E0F2"}
          emissiveIntensity={isDark ? 1.6 : 0.4}
          roughness={0.25}
          metalness={0.08}
          flatShading
          toneMapped={false}
        />
      </mesh>
      {isDark ? (
        <pointLight
          color="#CDE3B6"
          intensity={14}
          distance={10}
          decay={2}
        />
      ) : null}
      {isDark ? (
        <pointLight
          color="#E8C5C8"
          intensity={7}
          distance={7}
          decay={2}
          position={[0.4, -0.2, 0.6]}
        />
      ) : null}
    </group>
  );
}

export function Cursor3D() {
  const { resolvedTheme } = useTheme();
  const enabled = usePrefersFinePointer();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted && resolvedTheme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onMove = (event: PointerEvent) => {
      document.documentElement.style.setProperty(
        "--glow-x",
        `${event.clientX}px`,
      );
      document.documentElement.style.setProperty(
        "--glow-y",
        `${event.clientY}px`,
      );
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled]);

  if (!mounted || !enabled) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-10 hidden md:block"
    >
      <Canvas
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        camera={{ position: [0, 0, 8], fov: 42 }}
        dpr={[1, 1.5]}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={isDark ? 0.22 : 1.15} />
        <directionalLight
          position={[3, 4, 6]}
          intensity={isDark ? 0.6 : 1.4}
          color="#FFF6E9"
        />
        <hemisphereLight
          args={["#C2E0F2", "#E8C5C8", isDark ? 0.4 : 0.9]}
        />
        <Y2KCursor isDark={Boolean(isDark)} />
      </Canvas>
    </div>
  );
}
