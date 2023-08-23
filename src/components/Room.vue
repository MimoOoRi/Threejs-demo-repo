<script setup>
import { reactive, ref, onMounted } from 'vue';
import gsap from 'gsap'
import * as THREE from 'three';
import Base from './ThreeBase/Base';
import MODELS from './ThreeBase/assets'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import g, { GUI } from 'three/examples/jsm/libs/lil-gui.module.min';

const canvasDom = ref(null);
let base = reactive({});
const baseModel = MODELS[0]
const texture = new THREE.TextureLoader()
const pointLights = { cup1: { rgb: [1, .54, .54], color: 'pink' }, cup2: { rgb: [.2, .2, 0], color: 'yellow' } }
const colorLights = { pink: { light: null, isClose: false }, yellow: { light: null, isClose: false } }
let roomObj = null

const raycaster = new THREE.Raycaster()
raycaster.layers.set(1)
const raycaster1 = new THREE.Raycaster()
raycaster1.layers.set(2)
const pointer = new THREE.Vector2()
const pointer1 = new THREE.Vector2()
const actionStatus = { pcScreen: false, light: false }
const moveDistance = { x: 0, y: 0 }
const lastPosition = { x: 0, y: 0 }

const meshGroup = { door: null, book: null }
const objectActions = {
  door: {
    open: { action: 'rotation', args: { y: -.9, duration: .5 } },
    reset: { action: 'rotation', args: { y: 0, duration: .5 } },
  },
  book: {
    move: { action: 'position', args: { x: 1.5, duration: .5 } },
    reset: { action: 'position', args: { x: 0, duration: .5 } }
  },
}

onMounted(() => {
  base = new Base(canvasDom.value);
  updateAnimation()
  addLight()
  loaderGLTF()
  window.addEventListener('pointermove', onHoverItem);
  window.addEventListener('pointerdown', onClickItem);
})
const loaderGLTF = () => {
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath('draco/')
  dracoLoader.setDecoderConfig({ type: 'js' })
  const gltfLoader = new GLTFLoader()
  gltfLoader.setDRACOLoader(dracoLoader)

  const roomModel = baseModel.items.find(model => model.name === 'roomModel')
  if (roomModel) {
    const bedroomGLB = 'gltf/bedroom10.glb'
    gltfLoader.load(bedroomGLB, (gltf) => {
      const obj1 = gltf.scene.children[1];
      renderObjects(obj1.children)
      base.scene.add(obj1)
      roomObj = obj1
      const gui = new GUI();
      setDefaultView(obj1)
      createCameraControlGroup(gui, obj1)
    })
  }
}

const addLight = () => {
  const light = new THREE.AmbientLight();
  base.scene.add(light)

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(2024, 2024)
  base.scene.add(dirLight);
}

const renderObjects = (target) => {
  target.forEach(ele => {
    if (ele instanceof THREE.Mesh) {
      ele.castShadow = true;
      ele.receiveShadow = true;
      handleMesh(ele)
    } else {
      renderObjects(ele.children)
    }
  });
}

const createCameraControlGroup = (gui, obj1) => {
  // const args = { x: 3, y: 2.6, z: 17.6, rx: 0.36442, ry: 2.60123, rz: 0 }
  const args = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 }
  const folder = gui.addFolder('Position');
  folder.add(args, 'x', -10, 10, 0.1).onChange((value) => {
    // gltf.screen.children[1].position.x = value;
    base.camera.position.x = value;
  });
  folder.add(args, 'y', -10, 10, 0.1).onChange((value) => {
    // gltf.screen.children[1].position.y = value;
    base.camera.position.y = value;
  });
  folder.add(args, 'z', -10, 10, 0.1).onChange((value) => {
    // gltf.screen.children[1].position.z = value;
    base.camera.position.z = value;
  });
  const rotationFolder = gui.addFolder('Rotation');
  rotationFolder.add(args, 'rx', -Math.PI, Math.PI).onChange((value) => {
    obj1.rotation.x = value;
  });
  rotationFolder.add(args, 'ry', -Math.PI, Math.PI).onChange((value) => {
    obj1.rotation.y = value;
  });
  rotationFolder.add(args, 'rz', -Math.PI, Math.PI).onChange((value) => {
    obj1.rotation.z = value;
  });
}

const setDefaultView = (obj) => {
  obj.rotation.x = 0.28
  obj.rotation.y = -1.41
  obj.rotation.z = -0.1
}

const videoPreset = (url) => {
  const video = document.createElement('video');
  video.src = url;
  video.loop = true;
  video.muted = true;
  video.play();
  return video;
}
const handleVideoTexture = (video, isRotate) => {
  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.minFilter = THREE.NearestFilter;
  videoTexture.magFilter = THREE.NearestFilter;
  videoTexture.generateMipmaps = false;
  videoTexture.encoding = THREE.sRGBEncoding;
  if (isRotate) {
    videoTexture.center = new THREE.Vector2(0.5, 0.5)
    videoTexture.rotation = Math.PI / 2
  }
  return videoTexture
}

const addPointLight = (obj, { rgb, color }) => {
  const lightColor = new THREE.Color(rgb)
  const light = new THREE.PointLight(lightColor.getHex(), 1, 1)
  light.matrixWorld = obj.matrixWorld
  colorLights[color][`light`] = light
  obj.layers.enable(2)
  base.scene.add(light)
}

const handleTextureMaterial = (obj, texture) => {
  obj.material.map = texture
}

const handleMesh = (obj) => {
  const objName = obj.name
  if (objName.includes('pic')) {
    handleTextureMaterial(obj, texture.load(`images/${objName}.jpg`))
  } else if (objName.includes('cup')) {
    addPointLight(obj, pointLights[objName])
  } else {
    switch (objName) {
      case 'screen': {
        const videoEle = videoPreset('videos/1.mp4')
        const videoTexture = handleVideoTexture(videoEle, true)
        obj.layers.enable(2)
        handleTextureMaterial(obj, videoTexture)
        break;
      }
      case 'door': {
        obj.layers.enable(1)
        meshGroup.door = obj
        break;
      }
      case 'book': {
        obj.layers.enable(1)
        meshGroup.book = obj
        break;
      }
    }
  }
}



const objectAction = (name, { action, args }) => {
  gsap.to(meshGroup[name]?.[action], args)
}
const updateAnimation = () => {
  requestAnimationFrame(updateAnimation)
  // update the picking ray with the camera and pointer position
  raycaster.setFromCamera(pointer, base.camera);
  // calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects(base.scene.children);
  if (intersects.length > 0 && meshGroup) {
    const targetObject = intersects[0].object
    const targetName = targetObject.name
    switch (targetName) {
      case 'door': {
        objectAction(targetName, objectActions[targetName].open)
        break;
      }
      case 'book': {
        objectAction(targetName, objectActions[targetName].move)
        break;
      }
    }
  } else {
    objectAction('door', objectActions['door'].reset)
    objectAction('book', objectActions['book'].reset)
  }



  //raycaster 1
  raycaster1.setFromCamera(pointer1, base.camera);
  const intersects1 = raycaster1.intersectObjects(base.scene.children);
  if (intersects1.length > 0 && actionStatus.light) {
    actionStatus.light = false
    const targetObject = intersects1[0].object
    const targetName = targetObject.name
    switch (targetName) {
      case 'cup1': {
        colorLights.pink.isClose = !colorLights.pink.isClose
        colorLights.pink.light.intensity = colorLights.pink.isClose ? 0 : 1
        break;
      }
      case 'cup2': {
        colorLights.yellow.isClose = !colorLights.yellow.isClose
        colorLights.yellow.light.intensity = colorLights.yellow.isClose ? 0 : 1
        break;
      }
      case 'screen': {
        const zoomIn = { x: .8, y: .8, z: .7 }
        const zoomOut = { x: 0, y: 1, z: 4 }
        gsap.to(base.camera.position, { ...(actionStatus.pcScreen ? zoomOut : zoomIn), duration: 1, ease: 'power2' })
        actionStatus.pcScreen = !actionStatus.pcScreen
        break;
      }
    }
  }

  base.renderer.render(base.scene, base.camera)
}

const onHoverItem = (event) => {
  if (roomObj) {
    gsap.killTweensOf(roomObj?.rotation)
    gsap.to(roomObj?.rotation, { y: pointer.x * 0.11 - 1, duration: 1, })
  }
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
}
const onClickItem = (event) => {
  actionStatus.light = true
  pointer1.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer1.y = - (event.clientY / window.innerHeight) * 2 + 1;
}
</script>

<template>
  <canvas id="canvasDom" ref="canvasDom"></canvas>
</template>

<style scoped>
#canvasDom {}
</style>

