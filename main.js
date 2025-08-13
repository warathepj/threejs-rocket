import * as THREE from 'three';
import { AxesHelper } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const axesHelper = new AxesHelper( 5 ); // 5 units long axes
scene.add( axesHelper );

// Add lighting to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Directional light
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set(70, 100, 70); // Initial camera position, adjusted for better view
camera.lookAt(0, 0, 0); // Point camera at the origin

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );
controls.target.set(0, 0, 0); // Set orbit target to the origin
controls.enableZoom = false; // Disable default OrbitControls zoom

// Custom scroll zoom logic
renderer.domElement.addEventListener('wheel', (event) => {
    event.preventDefault();

    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    const vector = new THREE.Vector3(mouseX, mouseY, 0.5);
    vector.unproject(camera);

    const dir = vector.sub(camera.position).normalize();
    const distance = -camera.position.dot(dir) / dir.dot(dir);
    const point = camera.position.clone().add(dir.multiplyScalar(distance));

    const zoomFactor = 1.0 + (event.deltaY * -0.001); // Adjust zoom speed

    camera.position.sub(point).multiplyScalar(zoomFactor).add(point);
    controls.target.sub(point).multiplyScalar(zoomFactor).add(point);

    controls.update();
}, false);

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const loader = new GLTFLoader();
loader.load(
    'low_poly_rocket/scene.gltf',
    function (gltf) {
        gltf.scene.position.set(0, 0, 0); // Set position to 0,0,0
        gltf.scene.scale.set(0.1, 0.1, 0.1); // Scale down the model
        scene.add(gltf.scene);
    },
    undefined,
    function (error) {
        console.error(error);
    }
);

// Remove the existing cube as it's no longer needed
// const geometry = new THREE.BoxGeometry();
// const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
// const cube = new THREE.Mesh( geometry, material );
// scene.add( cube );

function animate() {
	requestAnimationFrame( animate );

	controls.update(); // only required if controls.enableDamping or controls.autoRotate are set to true
	renderer.render( scene, camera );
}

animate();
