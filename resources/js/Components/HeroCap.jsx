import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

const NODE_RADII = [1.35, 1.35, 1.35, 1.35];

function CapScene({ reducedMotion }) {
    const { scene } = useGLTF('/models/smartstudy-cap.glb');

    const nodes = useMemo(
        () => [0, 1, 2, 3].map((i) => scene.getObjectByName(`Node${i}`)).filter(Boolean),
        [scene],
    );
    const ring = useMemo(() => scene.getObjectByName('OrbitRing'), [scene]);

    useFrame((state, delta) => {
        if (reducedMotion) return;
        const t = state.clock.elapsedTime;
        nodes.forEach((node, i) => {
            const angle = (i / 4) * Math.PI * 2 + t * (0.12 + i * 0.03);
            const r = NODE_RADII[i];
            node.position.set(
                Math.cos(angle) * r,
                Math.sin(t * 1.2 + angle) * 0.25 + (i % 2 === 0 ? 0.35 : -0.05),
                Math.sin(angle) * r,
            );
        });
        if (ring) ring.rotation.z += delta * 0.05;
    });

    return <primitive object={scene} />;
}

function PointerTilt({ reducedMotion, children }) {
    const ref = useRef();
    useFrame((state) => {
        if (reducedMotion || !ref.current) return;
        ref.current.rotation.y += (state.pointer.x * 0.3 - ref.current.rotation.y) * 0.05;
        ref.current.rotation.x += (-state.pointer.y * 0.2 + 0.28 - ref.current.rotation.x) * 0.05;
    });
    return (
        <group ref={ref} rotation={[0.28, -0.35, 0]}>
            {children}
        </group>
    );
}

export default function HeroCap({ reducedMotion = false }) {
    return (
        <Canvas
            camera={{ position: [0, 0.5, 4.2], fov: 42 }}
            dpr={[1, 2]}
            gl={{ alpha: true, antialias: true }}
            style={{ touchAction: 'pan-y' }}
            aria-label="3D model of a graduation cap with orbiting subject nodes"
            role="img"
        >
            <ambientLight intensity={0.9} />
            <directionalLight position={[4, 5, 4]} intensity={1.5} color="#10b981" />
            <directionalLight position={[-4, -2, 3]} intensity={1.2} color="#0284c7" />
            <Suspense fallback={null}>
                <PointerTilt reducedMotion={reducedMotion}>
                    <CapScene reducedMotion={reducedMotion} />
                </PointerTilt>
            </Suspense>
        </Canvas>
    );
}
