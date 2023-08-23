import * as THREE from 'three';
export default class Base {
    constructor(canvas) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.0001, 1000000);
        this.camera.position.x = 0;
        this.camera.position.y = 1;
        this.camera.position.z = 4;
        this.camera.updateProjectionMatrix();
        this.renderer = new THREE.WebGL1Renderer({ canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
    }
    update() {
        requestAnimationFrame(this.update.bind(this))
        this.renderer.render(this.scene, this.camera)
    }

}
