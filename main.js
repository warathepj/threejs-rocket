import * as THREE from 'three';
import { AxesHelper } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const axesHelper = new AxesHelper( 100 ); // 5 units long axes
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

        // Create an upside-down white cone
        const coneGeometry = new THREE.ConeGeometry(13, 25, 32); // radius, height, radialSegments
        const coneMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // White color
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.position.set(30, -110, 10); // Position the cone relative to the scaled GLTF model
        cone.rotation.x = Math.PI; // Rotate 180 degrees to make it upside down
        gltf.scene.add(cone); // Add cone as a child of the GLTF scene
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

const timeDisplay = document.getElementById('time-display');
const startTime = performance.now();

function animate() {
	requestAnimationFrame( animate );

	const elapsedTime = ((performance.now() - startTime) / 1000).toFixed(1);
	timeDisplay.textContent = `Time: ${elapsedTime}s`;

	controls.update(); // only required if controls.enableDamping or controls.autoRotate are set to true
	renderer.render( scene, camera );
}

animate();
