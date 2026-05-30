import { useRef, useEffect } from 'react';
import * as THREE from 'three';

export default function ThreeLoader() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 240;
    const height = container.clientHeight || 240;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    container.appendChild(renderer.domElement);

    // Geometric "knowledge core" – slightly smaller icosahedron
    const geometry = new THREE.IcosahedronGeometry(0.9, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x4f46e5, // indigo-600
      emissive: 0x1d4ed8, // blue-700 glow
      metalness: 0.6,
      roughness: 0.25,
      wireframe: true
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Soft lighting
    const light = new THREE.PointLight(0xffffff, 1.3);
    light.position.set(5, 5, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    const onResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || width;
      const newHeight = container.clientHeight || height;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', onResize);

    let frameId;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000;

      // Gentle but lively motion: rotation + breathing
      mesh.rotation.x = elapsed * 0.9;
      mesh.rotation.y = elapsed * 1.2;

      const pulse = 1 + 0.06 * Math.sin(elapsed * 2.3);
      mesh.scale.set(pulse, pulse, pulse);

      // Subtle camera drift for depth
      camera.position.x = Math.sin(elapsed * 0.4) * 0.6;
      camera.position.y = Math.cos(elapsed * 0.3) * 0.4;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="w-48 h-48 mx-auto flex items-center justify-center" ref={containerRef}>
      {/* Three.js canvas will be injected here */}
    </div>
  );
}
