'use client';

/**
 * @file SplashScreenBigBang.js
 * @description Splash screen animada com Three.js: partículas (agentes)
 *              convergem para o logo, que cresce e explode num Big Bang,
 *              revelando o site.
 *
 * Fases da animação (~3s total):
 *   1. Convergência  (0   – 1.0s) — partículas movem-se para o centro
 *   2. Crescimento   (1.0 – 1.5s) — logo cresce com brilho
 *   3. Big Bang      (1.5 – 2.0s) — explosão radial + flash
 *   4. Fade out      (2.0 – 3.0s) — tudo desaparece, site revelado
 */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const PHASE_CONVERGE = 0;
const PHASE_GROW = 1;
const PHASE_BIG_BANG = 2;
const PHASE_FADE = 3;
const PHASE_DONE = 4;

const TIMING = {
  convergeEnd: 1.0,
  growEnd: 1.5,
  bigBangEnd: 2.0,
  fadeEnd: 3.0,
};

const PARTICLE_COUNT = 80;
const EXPLOSION_PARTICLE_COUNT = 60;
const BRAND_COLORS = [
  new THREE.Color('#28BEFD'),
  new THREE.Color('#0146DF'),
  new THREE.Color('#E6C8FD'),
];
const SESSION_KEY = 'agentic_space_splash_played';

function getRandomBrandColor() {
  return BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)];
}

function createParticles(count, radius) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * (0.6 + Math.random() * 0.4);

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const color = getRandomBrandColor();
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    sizes[i] = 0.05 + Math.random() * 0.08;
  }

  return { positions, colors, sizes };
}

function createExplosionParticles(count) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const velocities = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = 0;

    const color = getRandomBrandColor();
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    sizes[i] = 0.03 + Math.random() * 0.06;

    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const speed = 2.0 + Math.random() * 3.0;
    velocities[i * 3] = speed * Math.sin(phi) * Math.cos(theta);
    velocities[i * 3 + 1] = speed * Math.sin(phi) * Math.sin(theta);
    velocities[i * 3 + 2] = speed * Math.cos(phi);
  }

  return { positions, colors, sizes, velocities };
}

/**
 * Hook que orquestra a cena Three.js e o ciclo de vida da animação.
 */
function useBigBangAnimation(canvasRef, logoTexture, onComplete) {
  useEffect(() => {
    if (!canvasRef.current || !logoTexture) return;

    const canvas = canvasRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#00011E');

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const light = new THREE.PointLight(0xffffff, 0, 10);
    light.position.set(0, 0, 0);
    scene.add(light);

    const { positions, colors, sizes } = createParticles(PARTICLE_COUNT, 4);
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    const initialPositions = new Float32Array(positions);

    const logoMat = new THREE.SpriteMaterial({
      map: logoTexture,
      transparent: true,
      opacity: 0,
    });
    const logoSprite = new THREE.Sprite(logoMat);
    logoSprite.scale.set(0.3, 0.3, 1);
    scene.add(logoSprite);

    const flashGeo = new THREE.PlaneGeometry(20, 20);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.z = 2;
    scene.add(flash);

    let explosionData = null;
    let explosionPoints = null;
    let explosionGeo = null;
    let explosionMat = null;

    const clock = new THREE.Clock();
    let elapsed = 0;
    let phase = PHASE_CONVERGE;
    let rafId;

    function animate() {
      rafId = requestAnimationFrame(animate);
      elapsed = clock.getElapsedTime();

      const posAttr = particleGeo.getAttribute('position');
      const positions = posAttr.array;

      if (phase === PHASE_CONVERGE) {
        const t = Math.min(elapsed / TIMING.convergeEnd, 1);
        const eased = 1 - Math.pow(1 - t, 3);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
          positions[i * 3] = initialPositions[i * 3] * (1 - eased);
          positions[i * 3 + 1] = initialPositions[i * 3 + 1] * (1 - eased);
          positions[i * 3 + 2] = initialPositions[i * 3 + 2] * (1 - eased);
        }
        posAttr.needsUpdate = true;

        logoMat.opacity = Math.min(t * 1.5, 1);
        const scale = 0.3 + eased * 1.2;
        logoSprite.scale.set(scale, scale, 1);
        light.intensity = t * 2;

        if (elapsed >= TIMING.convergeEnd) {
          phase = PHASE_GROW;
        }
      } else if (phase === PHASE_GROW) {
        const t = Math.min((elapsed - TIMING.convergeEnd) / (TIMING.growEnd - TIMING.convergeEnd), 1);
        const eased = 1 - Math.pow(1 - t, 2);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const jitter = 0.02;
          positions[i * 3] *= 0.9;
          positions[i * 3 + 1] *= 0.9;
          positions[i * 3 + 2] *= 0.9;
          positions[i * 3] += (Math.random() - 0.5) * jitter;
          positions[i * 3 + 1] += (Math.random() - 0.5) * jitter;
          positions[i * 3 + 2] += (Math.random() - 0.5) * jitter;
        }
        posAttr.needsUpdate = true;

        const scale = 1.5 + eased * 0.8;
        logoSprite.scale.set(scale, scale, 1);
        logoMat.opacity = 1;
        light.intensity = 2 + eased * 3;
        particleMat.opacity = 0.9 - eased * 0.5;

        if (elapsed >= TIMING.growEnd) {
          phase = PHASE_BIG_BANG;
          flashMat.opacity = 0.9;
          light.intensity = 10;

          explosionData = createExplosionParticles(EXPLOSION_PARTICLE_COUNT);
          explosionGeo = new THREE.BufferGeometry();
          explosionGeo.setAttribute('position', new THREE.BufferAttribute(explosionData.positions, 3));
          explosionGeo.setAttribute('color', new THREE.BufferAttribute(explosionData.colors, 3));
          explosionMat = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
          });
          explosionPoints = new THREE.Points(explosionGeo, explosionMat);
          scene.add(explosionPoints);
        }
      } else if (phase === PHASE_BIG_BANG) {
        const t = Math.min((elapsed - TIMING.growEnd) / (TIMING.bigBangEnd - TIMING.growEnd), 1);

        const expPosAttr = explosionGeo.getAttribute('position');
        const expPositions = expPosAttr.array;
        const dt = clock.getDelta();

        for (let i = 0; i < EXPLOSION_PARTICLE_COUNT; i++) {
          expPositions[i * 3] += explosionData.velocities[i * 3] * dt * 3;
          expPositions[i * 3 + 1] += explosionData.velocities[i * 3 + 1] * dt * 3;
          expPositions[i * 3 + 2] += explosionData.velocities[i * 3 + 2] * dt * 3;

          explosionData.velocities[i * 3] *= 0.98;
          explosionData.velocities[i * 3 + 1] *= 0.98;
          explosionData.velocities[i * 3 + 2] *= 0.98;
        }
        expPosAttr.needsUpdate = true;

        flashMat.opacity = Math.max(0, 0.9 - t * 3);
        light.intensity = Math.max(0, 10 - t * 10);

        const logoScale = 2.3 + t * 4;
        logoSprite.scale.set(logoScale, logoScale, 1);
        logoMat.opacity = Math.max(0, 1 - t * 2);

        particleMat.opacity = Math.max(0, 0.4 - t * 0.4);

        if (elapsed >= TIMING.bigBangEnd) {
          phase = PHASE_FADE;
        }
      } else if (phase === PHASE_FADE) {
        const t = Math.min((elapsed - TIMING.bigBangEnd) / (TIMING.fadeEnd - TIMING.bigBangEnd), 1);

        if (explosionGeo) {
          const expPosAttr = explosionGeo.getAttribute('position');
          const expPositions = expPosAttr.array;
          const dt = clock.getDelta();
          for (let i = 0; i < EXPLOSION_PARTICLE_COUNT; i++) {
            expPositions[i * 3] += explosionData.velocities[i * 3] * dt * 2;
            expPositions[i * 3 + 1] += explosionData.velocities[i * 3 + 1] * dt * 2;
            expPositions[i * 3 + 2] += explosionData.velocities[i * 3 + 2] * dt * 2;
          }
          expPosAttr.needsUpdate = true;
          explosionMat.opacity = Math.max(0, 1 - t);
        }

        scene.background = new THREE.Color('#00011E');
        renderer.setClearColor(0x00011E, 1 - t);
        logoMat.opacity = 0;
        particleMat.opacity = 0;
        flashMat.opacity = 0;
        light.intensity = 0;

        if (elapsed >= TIMING.fadeEnd) {
          phase = PHASE_DONE;
          cancelAnimationFrame(rafId);
          renderer.dispose();
          particleGeo.dispose();
          particleMat.dispose();
          logoMat.dispose();
          flashGeo.dispose();
          flashMat.dispose();
          if (explosionGeo) {
            explosionGeo.dispose();
            explosionMat.dispose();
          }
          logoTexture.dispose();
          onComplete();
          return;
        }
      }

      renderer.render(scene, camera);
    }

    animate();

    function handleResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      logoMat.dispose();
      flashGeo.dispose();
      flashMat.dispose();
      if (explosionGeo) {
        explosionGeo.dispose();
        explosionMat.dispose();
      }
      logoTexture.dispose();
    };
  }, [canvasRef, logoTexture, onComplete]);
}

export default function SplashScreenBigBang() {
  const [visible, setVisible] = useState(true);
  const [logoTexture, setLogoTexture] = useState(null);
  const canvasRef = useRef(null);
  const onCompleteRef = useRef(null);

  useEffect(() => {
    try {
      const played = sessionStorage.getItem(SESSION_KEY);
      if (played) {
        setVisible(false);
        return;
      }
    } catch {
      // sessionStorage pode estar indisponível (modo privado)
    }

    const loader = new THREE.TextureLoader();
    loader.load(
      '/images/logo 2025 - whatsapp.png',
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        setLogoTexture(texture);
      },
      undefined,
      () => {
        // Fallback: cria textura procedural simples
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#00011E';
        ctx.beginPath();
        ctx.arc(64, 64, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#28BEFD';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('AS', 64, 64);
        const fallbackTexture = new THREE.CanvasTexture(canvas);
        fallbackTexture.colorSpace = THREE.SRGBColorSpace;
        setLogoTexture(fallbackTexture);
      }
    );
  }, []);

  useEffect(() => {
    onCompleteRef.current = () => {
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        // Ignora se sessionStorage indisponível
      }
      setVisible(false);
    };
  }, []);

  useBigBangAnimation(canvasRef, logoTexture, () => {
    onCompleteRef.current?.();
  });

  if (!visible) return null;

  return (
    <div className="agentic-splash-bigbang" aria-hidden="true">
      <canvas ref={canvasRef} className="agentic-splash-bigbang__canvas" />
    </div>
  );
}
