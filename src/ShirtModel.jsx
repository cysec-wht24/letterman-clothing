import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// Patch zones mapped to their exact material names from the GLB.
// Each patch is a real plane mesh sitting flush on the shirt surface,
// modelled in Blender and exported. We find the material by name
// and set its texture — no floating planes, no position guessing.
export const PLACEMENT_ZONES = [
  {
    id: 'left-chest',
    label: 'Left Chest',
    icon: '◧',
    materialName: 'Material.007',   // Node Plane.001: T=(-0.126, 1.466, -0.084)
  },
  {
    id: 'right-chest',
    label: 'Right Chest',
    icon: '◨',
    materialName: 'Material.008',   // Node Plane.002: T=(0.029, 1.476, 0.018)
  },
  {
    id: 'back-center',
    label: 'Back Center',
    icon: '◫',
    materialName: 'Material.001',   // Node Plane: T=(0.075, 1.432, -0.271)
  },
  {
    id: 'left-sleeve',
    label: 'Left Sleeve',
    icon: '◁',
    materialName: 'Material.009',   // Node Plane.003: T=(-0.240, 1.451, -0.305)
  },
  {
    id: 'right-sleeve',
    label: 'Right Sleeve',
    icon: '▷',
    materialName: 'Material.010',   // Node Plane.004: T=(0.281, 1.484, -0.018)
  },
]

const PATCH_MAT_NAMES = new Set(PLACEMENT_ZONES.map(z => z.materialName))

export default function ShirtModel({ color, autoRotate, selectedZoneId, logoTexture }) {
  const groupRef = useRef()
  const { scene } = useGLTF(import.meta.env.BASE_URL + 'shirt.glb')
  const { camera, controls } = useThree()
  const readyRef = useRef(false)
  const prevMaterialRef = useRef(null)

  // ── Normalize model ───────────────────────────────────────
  useEffect(() => {
    if (!scene || readyRef.current) return
    const box = new THREE.Box3().setFromObject(scene)
    const center = new THREE.Vector3()
    const size = new THREE.Vector3()
    box.getCenter(center)
    box.getSize(size)
    scene.position.set(-center.x, -center.y, -center.z)
    scene.scale.setScalar(1.0 / Math.max(size.x, size.y, size.z))
    scene.updateMatrixWorld(true)
    const box2 = new THREE.Box3().setFromObject(scene)
    const c2 = new THREE.Vector3()
    box2.getCenter(c2)
    scene.position.y -= c2.y

    camera.position.set(0, 0, 1.8)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
    if (controls) { controls.target.set(0, 0, 0); controls.update() }

    // Hide all patch planes initially
    scene.traverse(obj => {
      if (obj.isMesh) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach(m => {
          if (PATCH_MAT_NAMES.has(m.name)) {
            m.transparent = true
            m.opacity = 0
            m.needsUpdate = true
          }
        })
      }
    })

    readyRef.current = true
  }, [scene, camera, controls])

  // ── Recolor shirt body only ───────────────────────────────
  useEffect(() => {
    scene.traverse(obj => {
      if (obj.isMesh) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach(m => {
          if (!PATCH_MAT_NAMES.has(m.name)) {
            m.color.set(color)
            m.needsUpdate = true
          }
        })
      }
    })
  }, [color, scene])

  // ── Apply logo to selected patch material ─────────────────
  useEffect(() => {
    // Clear previous patch
    if (prevMaterialRef.current) {
      prevMaterialRef.current.map = null
      prevMaterialRef.current.opacity = 0
      prevMaterialRef.current.needsUpdate = true
      prevMaterialRef.current = null
    }

    if (!selectedZoneId || !logoTexture) return

    const zone = PLACEMENT_ZONES.find(z => z.id === selectedZoneId)
    if (!zone) return

    scene.traverse(obj => {
      if (obj.isMesh) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach(m => {
          if (m.name === zone.materialName) {
            m.map = logoTexture
            m.transparent = true
            m.opacity = 1
            m.roughness = 0.85
            m.metalness = 0
            m.needsUpdate = true
            prevMaterialRef.current = m
          }
        })
      }
    })
  }, [selectedZoneId, logoTexture, scene])

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload(import.meta.env.BASE_URL + 'shirt.glb')
