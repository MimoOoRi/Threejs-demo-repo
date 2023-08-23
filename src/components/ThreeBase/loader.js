import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

// Draco
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')
dracoLoader.setDecoderConfig({ type: 'js' })

this.loaders.push({
    extensions: ['drc'],
    action: (_resource) => {
        dracoLoader.load(_resource.source, (_data) => {
            this.fileLoadEnd(_resource, _data)

            DRACOLoader.releaseDecoderModule()
        })
    }
})

// GLTF
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

this.loaders.push({
    extensions: ['glb', 'gltf'],
    action: (_resource) => {
        gltfLoader.load(_resource.source, (_data) => {
            this.fileLoadEnd(_resource, _data)
        })
    }
})
