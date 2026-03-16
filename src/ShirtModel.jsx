import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

export default function ShirtModel({ color, autoRotate, textureCanvas }) {
  const groupRef = useRef()
  const { scene } = useGLTF('/t_shirt.glb')
  const { camera, controls } = useThree()
  const initialized = useRef(false)
  const textureRef = useRef(null)

  // Initialize model: center, scale, orient
  useEffect(() => {
    if (!scene || initialized.current) return
    const box = new THREE.Box3().setFromObject(scene)
    const center = new THREE.Vector3()
    const size = new THREE.Vector3()
    box.getCenter(center)
    box.getSize(size)
    scene.position.sub(center)
    const maxDim = Math.max(size.x, size.y, size.z)
    scene.scale.setScalar(1.0 / maxDim)
    scene.rotation.set(0, 0, 0)
    const box2 = new THREE.Box3().setFromObject(scene)
    const center2 = new THREE.Vector3()
    box2.getCenter(center2)
    scene.position.y -= center2.y
    camera.position.set(0, 0, 1.8)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
    if (controls) { controls.target.set(0, 0, 0); controls.update() }
    initialized.current = true
  }, [scene, camera, controls])

  // Apply texture whenever Fabric canvas updates
  useEffect(() => {
    if (!textureCanvas) {
      // No texture — apply flat color
      scene.traverse((obj) => {
        if (obj.isMesh && obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
          mats.forEach(mat => {
            if (textureRef.current) { mat.map = null; mat.needsUpdate = true }
            mat.color.set(new THREE.Color(color))
            mat.needsUpdate = true
          })
        }
      })
      return
    }

    // Build Three texture from Fabric canvas element
    if (textureRef.current) textureRef.current.dispose()
    const tex = new THREE.CanvasTexture(textureCanvas)
    tex.flipY = false
    tex.needsUpdate = true
    textureRef.current = tex

    scene.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach(mat => {
          mat.map = tex
          mat.color.set('#ffffff')
          mat.needsUpdate = true
        })
      }
    })
  }, [textureCanvas, color, scene])

  // Flat color fallback when no canvas
  useEffect(() => {
    if (textureCanvas) return
    scene.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach(mat => {
          mat.map = null
          mat.color.set(new THREE.Color(color))
          mat.needsUpdate = true
        })
      }
    })
  }, [color, scene, textureCanvas])

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.38
    }
  })

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload('/t_shirt.glb')
