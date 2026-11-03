"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type CosmicFieldProps = {
  className?: string;
  density?: number;
};

export function CosmicField({ className, density = 1 }: CosmicFieldProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const width = () => host.clientWidth || window.innerWidth;
    const height = () => host.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, width() / height(), 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width(), height());
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const starCount = Math.floor(900 * density);
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 28;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 18;
      starSizes[i] = 0.5 + Math.random() * 2.2;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute("aSize", new THREE.BufferAttribute(starSizes, 1));
    const stars = new THREE.Points(
      starGeometry,
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color("#dffcf7") },
        },
        vertexShader: `
          attribute float aSize;
          uniform float uTime;
          varying float vAlpha;
          void main() {
            vec3 p = position;
            p.x += sin(uTime * 0.12 + position.y) * 0.08;
            p.y += cos(uTime * 0.1 + position.x) * 0.05;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = aSize * (180.0 / -mv.z);
            vAlpha = smoothstep(10.0, 2.0, -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          varying float vAlpha;
          void main() {
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            float alpha = smoothstep(0.5, 0.0, d) * vAlpha;
            gl_FragColor = vec4(uColor, alpha * 0.9);
          }
        `,
      }),
    );
    scene.add(stars);

    const ribbons: THREE.Mesh[] = [];
    const ribbonColors = ["#2dd4bf", "#f472b6", "#ff7a32"];
    ribbonColors.forEach((hex, index) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-9, index * 1.2 - 1.4, -2),
        new THREE.Vector3(-3, Math.sin(index) * 1.6, -1),
        new THREE.Vector3(2, Math.cos(index) * 1.4 + 0.4, -2.4),
        new THREE.Vector3(8, index * 0.7 - 0.5, -1.2),
      ]);
      const geometry = new THREE.TubeGeometry(curve, 80, 0.08 + index * 0.03, 12, false);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(hex),
        transparent: true,
        opacity: 0.34,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      ribbons.push(mesh);
      scene.add(mesh);
    });

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 32, 32),
      new THREE.MeshBasicMaterial({
        color: "#5eead4",
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    core.position.set(2.8, 0.4, -1.5);
    scene.add(core);

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(1.35, 32, 32),
      new THREE.MeshBasicMaterial({
        color: "#f472b6",
        transparent: true,
        opacity: 0.14,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    glow.position.copy(core.position);
    scene.add(glow);

    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    const onPointer = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    host.addEventListener("pointermove", onPointer);

    const onResize = () => {
      const w = width();
      const h = height();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    const tick = () => {
      frame = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      const material = stars.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = t;
      if (!reduceMotion) {
        stars.rotation.y = t * 0.02;
        ribbons.forEach((ribbon, index) => {
          ribbon.rotation.z = Math.sin(t * 0.18 + index) * 0.08;
          ribbon.rotation.y = Math.cos(t * 0.12 + index) * 0.05;
        });
        core.scale.setScalar(1 + Math.sin(t * 1.4) * 0.05);
        glow.scale.setScalar(1 + Math.cos(t * 1.1) * 0.08);
        camera.position.x += (pointerX * 0.55 - camera.position.x) * 0.04;
        camera.position.y += (-pointerY * 0.35 - camera.position.y) * 0.04;
        camera.lookAt(0, 0, 0);
      }
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      host.removeEventListener("pointermove", onPointer);
      starGeometry.dispose();
      (stars.material as THREE.Material).dispose();
      ribbons.forEach((ribbon) => {
        ribbon.geometry.dispose();
        (ribbon.material as THREE.Material).dispose();
      });
      core.geometry.dispose();
      (core.material as THREE.Material).dispose();
      glow.geometry.dispose();
      (glow.material as THREE.Material).dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
  }, [density]);

  return <div ref={hostRef} className={className} aria-hidden="true" />;
}
