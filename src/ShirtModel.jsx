import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// ⭐ IMPORTANT — GitHub Pages base path fix
const BASE = import.meta.env.BASE_URL

export const PLACEMENT_ZONES = [
  {
    id: 'left-chest',
    label: 'Left Chest',
    icon: '◧',
    position: [-0.11, 0.22, 0.223],
    rotation: [0, 0, 0],
    scale: [0.12, 0.08],
  },
  {
    id: 'right-chest',
    label: 'Right Chest',
    icon: '◨',
    position: [0.11, 0.22, 0.223],
    rotation: [0, 0, 0],
    scale: [0.12, 0.08],
  },
  {
    id: 'center-chest',
    label: 'Center Chest',
    icon: '▣',
    position: [-0.08, 0.18, 0.165],
    rotation: [0, 0, 0],
    scale: [0.22, 0.15],
  },
  {
    id: 'back-center',
    label: 'Back Center',
    icon: '◫',
    position: [0.0, 0.08, -0.223],
    rotation: [0, Math.PI, 0],
    scale: [0.24, 0.18],
  },
  {
    id: 'left-sleeve',
    label: 'Left Sleeve',
    icon: '◁',
    position: [-0.366, 0.256, 0.057],
    rotation: [0, -Math.PI / 2, 0],
    scale: [0.08, 0.07],
  },
  {
    id: 'right-sleeve',
    label: 'Right Sleeve',
    icon: '▷',
    position: [0.365, 0.256, 0.057],
    rotation: [0, Math.PI / 2, 0],
    scale: [0.08, 0.07],
  },
]

export default function ShirtModel({ color, autoRotate, selectedZoneId, logoTexture }) {
  const groupRef = useRef()
  const logoMeshRef = useRef(null)

  // ⭐ FIXED PATH
  const { scene } = useGLTF(BASE + 't_shirt.glb')

  const { camera, controls } = useThree()
  const readyRef = useRef(false)

  useEffect(() => {
    if (!scene || readyRef.current) return

    const box = new THREE.Box3().setFromObject(scene)
    const center = new THREE.Vector3()
    const size = new THREE.Vector3()
    box.getCenter(center)
    box.getSize(size)

    scene.position.sub(center)
    scene.scale.setScalar(1.0 / Math.max(size.x, size.y, size.z))
    scene.rotation.set(0, 0, 0)

    const box2 = new THREE.Box3().setFromObject(scene)
    const c2 = new THREE.Vector3()
    box2.getCenter(c2)
    scene.position.y -= c2.y

    camera.position.set(0, 0, 1.8)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()

    if (controls) {
      controls.target.set(0, 0, 0)
      controls.update()
    }

    readyRef.current = true
  }, [scene, camera, controls])

  useEffect(() => {
    scene.traverse(obj => {
      if (obj.isMesh) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach(m => {
          m.color.set(color)
          m.needsUpdate = true
        })
      }
    })
  }, [color, scene])

  useEffect(() => {
    const group = groupRef.current
    if (!group) return

    if (logoMeshRef.current) {
      group.remove(logoMeshRef.current)
      logoMeshRef.current.geometry.dispose()
      logoMeshRef.current.material.dispose()
      logoMeshRef.current = null
    }

    if (!selectedZoneId || !logoTexture) return

    const zone = PLACEMENT_ZONES.find(z => z.id === selectedZoneId)
    if (!zone) return

    const [w, h] = zone.scale

    const geo = new THREE.PlaneGeometry(w, h)
    const mat = new THREE.MeshStandardMaterial({
      map: logoTexture,
      transparent: true,
      alphaTest: 0.01,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
      roughness: 0.88,
      metalness: 0,
      side: THREE.DoubleSide,
    })

    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(...zone.position)
    mesh.rotation.set(...zone.rotation)
    mesh.renderOrder = 1

    group.add(mesh)
    logoMeshRef.current = mesh
  }, [selectedZoneId, logoTexture])

  useFrame((_, dt) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += dt * 0.35
    }
  })

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  )
}

// ⭐ FIXED PRELOAD
useGLTF.preload(BASE + 't_shirt.glb')