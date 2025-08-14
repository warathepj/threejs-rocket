import * as THREE from 'three';
import { AxesHelper } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';

const scene = new THREE.Scene();
const axesHelper = new AxesHelper( 100 ); // 5 units long axes
scene.add( axesHelper );

// Initialize Cannon.js world
const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0), // m/s²
});

// Create a ground plane
const groundBody = new CANNON.Body({
    mass: 0, // mass = 0 makes the body static
    shape: new CANNON.Plane(),
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // Rotate it to lie flat on the z-x plane
world.addBody(groundBody);

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
let rocketBody; // Declare rocketBody outside to be accessible in animate

loader.load(
    'low_poly_rocket/scene.gltf',
    function (gltf) {
        gltf.scene.position.set(0, 0, 0); // Set position to 0,0,0
        gltf.scene.scale.set(0.1, 0.1, 0.1); // Scale down the model
        scene.add(gltf.scene);

        // Create an upside-down white cone
        const coneGeometry = new THREE.ConeGeometry(140, 185, 32); // radius, height, radialSegments
        const coneMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // White color
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.position.set(30, -84, 10); // Position the cone relative to the scaled GLTF model
        cone.rotation.x = Math.PI; // Rotate 180 degrees to make it upside down
        gltf.scene.add(cone); // Add cone as a child of the GLTF scene

        // Create a Cannon.js body for the rocket
        const rocketShape = new CANNON.Box(new CANNON.Vec3(5, 5, 5)); // Approximate shape for the rocket
        rocketBody = new CANNON.Body({
            mass: 1, // kg
            position: new CANNON.Vec3(gltf.scene.position.x, gltf.scene.position.y, gltf.scene.position.z),
            shape: rocketShape,
        });
        world.addBody(rocketBody);
        gltf.scene.userData.physicsBody = rocketBody; // Store reference to physics body
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

const fixedTimeStep = 1.0 / 60.0; // seconds

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = ((performance.now() - startTime) / 1000).toFixed(1);
    timeDisplay.textContent = `Time: ${elapsedTime}s`;

    // Update the physics world
    world.step(fixedTimeStep);

    // Synchronize Three.js objects with Cannon.js bodies
    scene.traverse((object) => {
        if (object.userData.physicsBody) {
            object.position.copy(object.userData.physicsBody.position);
            object.quaternion.copy(object.userData.physicsBody.quaternion);
        }
    });

    controls.update(); // only required if controls.enableDamping or controls.autoRotate are set to true
    renderer.render(scene, camera);
}

animate();
