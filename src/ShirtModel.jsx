import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

export const PLACEMENT_ZONES = [
  { id: 'left-chest',   label: 'Left Chest',   icon: '◧', uv: [-0.10,  0.10, +1], scale: [0.11, 0.075] },
  { id: 'right-chest',  label: 'Right Chest',  icon: '◨', uv: [+0.10,  0.10, +1], scale: [0.11, 0.075] },
  { id: 'center-chest', label: 'Center Chest', icon: '▣', uv: [ 0.00,  0.05, +1], scale: [0.20, 0.14]  },
  { id: 'back-center',  label: 'Back Center',  icon: '◫', uv: [ 0.00,  0.05, -1], scale: [0.22, 0.17]  },
  { id: 'left-sleeve',  label: 'Left Sleeve',  icon: '◁', uv: [-1,     0.05,  0], scale: [0.07, 0.06]  },
  { id: 'right-sleeve', label: 'Right Sleeve', icon: '▷', uv: [+1,     0.05,  0], scale: [0.07, 0.06]  },
]

export default function ShirtModel({ color, autoRotate, selectedZoneId, logoTexture }) {
  const groupRef    = useRef()
  const logoMeshRef = useRef(null)
  const boundsRef   = useRef(null)   // stores { min, max, center } after normalization
  const { scene } = useGLTF(import.meta.env.BASE_URL + 't_shirt.glb')
  const { camera, controls } = useThree()
  const readyRef    = useRef(false)

  // ── Normalize model ───────────────────────────────────────
  useEffect(() => {
    if (!scene || readyRef.current) return

    const box = new THREE.Box3().setFromObject(scene)
    const rawCenter = new THREE.Vector3()
    const rawSize   = new THREE.Vector3()
    box.getCenter(rawCenter)
    box.getSize(rawSize)

    scene.position.set(-rawCenter.x, -rawCenter.y, -rawCenter.z)
    const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z)
    scene.scale.setScalar(1.0 / maxDim)

    scene.updateMatrixWorld(true)
    const box2 = new THREE.Box3().setFromObject(scene)
    const c2 = new THREE.Vector3()
    box2.getCenter(c2)
    scene.position.y -= c2.y

    // Store final bounds for use in logo placement
    scene.updateMatrixWorld(true)
    const box3 = new THREE.Box3().setFromObject(scene)
    const bCenter = new THREE.Vector3()
    const bSize   = new THREE.Vector3()
    box3.getCenter(bCenter)
    box3.getSize(bSize)
    boundsRef.current = {
      min: box3.min.clone(),
      max: box3.max.clone(),
      center: bCenter,
      size: bSize,
    }

    console.log('Shirt bounds after norm:',
      'X', box3.min.x.toFixed(3), '..', box3.max.x.toFixed(3),
      'Y', box3.min.y.toFixed(3), '..', box3.max.y.toFixed(3),
      'Z', box3.min.z.toFixed(3), '..', box3.max.z.toFixed(3),
    )

    camera.position.set(0, 0, 1.8)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
    if (controls) { controls.target.set(0, 0, 0); controls.update() }

    readyRef.current = true
  }, [scene, camera, controls])

  // ── Recolor ───────────────────────────────────────────────
  useEffect(() => {
    scene.traverse(obj => {
      if (obj.isMesh) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach(m => { m.color.set(color); m.needsUpdate = true })
      }
    })
  }, [color, scene])

  // ── Place logo ────────────────────────────────────────────
  useEffect(() => {
    const group = groupRef.current
    if (!group) return

    if (logoMeshRef.current) {
      group.remove(logoMeshRef.current)
      logoMeshRef.current.geometry.dispose()
      logoMeshRef.current.material.dispose()
      logoMeshRef.current = null
    }

    if (!selectedZoneId || !logoTexture || !boundsRef.current) return

    const zone = PLACEMENT_ZONES.find(z => z.id === selectedZoneId)
    if (!zone) return

    const { min, max, center } = boundsRef.current
    const [ux, uy, uz] = zone.uv
    const [w, h] = zone.scale

    // Compute world position from bounds + UV-like offsets
    // uz=+1 means front face, uz=-1 means back face, etc.
    let x, y, z, rx = 0, ry = 0, rz = 0

    if (uz === 1) {
      // Front face
      x = center.x + ux * (max.x - center.x) * 0.65
      y = center.y + uy * (max.y - center.y) * 0.55
      z = max.z + 0.002
      rx = 0; ry = 0
    } else if (uz === -1) {
      // Back face
      x = center.x + ux * (max.x - center.x) * 0.65
      y = center.y + uy * (max.y - center.y) * 0.55
      z = min.z - 0.002
      ry = Math.PI
    } else if (ux === 1) {
      // Right sleeve — outermost X face
      x = max.x + 0.002
      y = center.y + uy * (max.y - center.y) * 0.4
      z = center.z
      ry = Math.PI / 2
    } else if (ux === -1) {
      // Left sleeve
      x = min.x - 0.002
      y = center.y + uy * (max.y - center.y) * 0.4
      z = center.z
      ry = -Math.PI / 2
    }

    const mat = new THREE.MeshStandardMaterial({
      map: logoTexture,
      transparent: true,
      alphaTest: 0.01,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
      roughness: 0.88,
      metalness: 0.0,
      side: THREE.DoubleSide,
    })

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
    mesh.position.set(x, y, z)
    mesh.rotation.set(rx, ry, rz)
    mesh.renderOrder = 1

    group.add(mesh)
    logoMeshRef.current = mesh

    console.log(`Logo placed: zone=${selectedZoneId} pos=(${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)})`)
  }, [selectedZoneId, logoTexture, scene])

  useFrame((_, dt) => {
    if (groupRef.current && autoRotate)
      groupRef.current.rotation.y += dt * 0.35
  })

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload(import.meta.env.BASE_URL + 't_shirt.glb')
