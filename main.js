import * as THREE from 'three';
import { AxesHelper } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';

const scene = new THREE.Scene();
// const axesHelper = new AxesHelper( 100 ); // 5 units long axes
// scene.add( axesHelper );

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

// Create a light brown plane
const brownPlaneGeometry = new THREE.BoxGeometry(1000, 5, 1000);
const brownPlaneMaterial = new THREE.MeshBasicMaterial({ color: 0x666600 }); // Changed to #666600
const brownPlane = new THREE.Mesh(brownPlaneGeometry, brownPlaneMaterial);
brownPlane.position.set(0, 0, 0);
scene.add(brownPlane);

// TODO Create a white transparent plane
// const planeGeometry = new THREE.BoxGeometry(300, 50, 200); // width, height, depth
// const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
// const transparentPlane = new THREE.Mesh(planeGeometry, planeMaterial);
// transparentPlane.position.set(70, 500, 300);
// scene.add(transparentPlane);

// Add a new red box
const redBoxGeometry = new THREE.BoxGeometry(1500, 3000, 1500);
const redBoxMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.01 }); // Changed to white transparent
const redBox = new THREE.Mesh(redBoxGeometry, redBoxMaterial);
redBox.position.set(0, 2000, 0);
scene.add(redBox);

// Create 100 white spheres inside the redBox
const redBoxWidth = redBoxGeometry.parameters.width;
const redBoxHeight = redBoxGeometry.parameters.height;
const redBoxDepth = redBoxGeometry.parameters.depth;

for (let i = 0; i < 2500; i++) {
    const sphereGeometry = new THREE.SphereGeometry(1, 8, 8); // radius, widthSegments, heightSegments
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // White color
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

    // Generate random position within the redBox's local coordinates
    const x = (Math.random() - 0.5) * redBoxWidth;
    const y = (Math.random() - 0.5) * redBoxHeight;
    const z = (Math.random() - 0.5) * redBoxDepth;

    sphere.position.set(x, y, z);
    redBox.add(sphere); // Add sphere as a child of redBox
}

// Add lighting to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Directional light
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set(70, 100, 70); // Initial camera position, adjusted for better view
camera.lookAt(0, 0, 0); // Point camera at the origin

let rocketCamera; // New camera for rocket view
let currentCamera = camera; // Initially use the main camera
let isVibrating = false; // New variable to control rocket vibration

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( currentCamera, renderer.domElement );
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
let rocketVisualModel; // Declare rocketVisualModel to hold the loaded GLTF scene
let rocketActivated = false; // Flag to activate rocket physics after 4 seconds
let cone; // Declare cone globally
let yellowCone; // Declare yellowCone globally

loader.load(
    'low_poly_rocket/scene.gltf',
    function (gltf) {
        rocketVisualModel = gltf.scene; // Assign the loaded scene to the global variable
        rocketVisualModel.position.set(0, 0, 0); // Set position to 0,0,0
        rocketVisualModel.scale.set(0.1, 0.1, 0.1); // Scale down the model
        scene.add(rocketVisualModel);

        // Create an upside-down white cone
        const coneGeometry = new THREE.ConeGeometry(140, 225, 32); // radius, height, radialSegments
        const coneMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // White color
        cone = new THREE.Mesh(coneGeometry, coneMaterial); // Assign to global cone
        cone.position.set(30, -84, 10); // Position the cone relative to the scaled GLTF model
        cone.rotation.x = Math.PI; // Rotate 180 degrees to make it upside down
        rocketVisualModel.add(cone); // Add cone as a child of the GLTF scene
        cone.visible = false; // Initially hide the cone

        // Create a new yellow cone
        const yellowConeGeometry = new THREE.ConeGeometry(140, 600, 32); // Same dimensions as the white cone
        const yellowConeMaterial = new THREE.MeshBasicMaterial({ color: 0xffd11a }); // Yellow color
        yellowCone = new THREE.Mesh(yellowConeGeometry, yellowConeMaterial);
        yellowCone.position.set(30, -270, 10); // Same position as the white cone
        yellowCone.rotation.x = Math.PI; // Rotate 180 degrees to make it upside down
        rocketVisualModel.add(yellowCone); // Add as a child of the GLTF scene
        yellowCone.visible = false; // Initially hide the yellow cone

        // TODO Initialize rocketCamera and add it as a child of the rocket
        rocketCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        rocketCamera.position.set(0, 1000, -450); // Position relative to the rocket, moved further back
        rocketVisualModel.add(rocketCamera);

        // Create a Cannon.js body for the rocket
        const rocketShape = new CANNON.Box(new CANNON.Vec3(5, 5, 5)); // Approximate shape for the rocket
        rocketBody = new CANNON.Body({
            mass: 0, // kg - Set mass to 0 initially to prevent movement
            position: new CANNON.Vec3(rocketVisualModel.position.x, 6, rocketVisualModel.position.z), // Adjusted Y-position to prevent initial intersection
            shape: rocketShape,
            gravityScale: 0, // Disable gravity initially
        });
        world.addBody(rocketBody);
        rocketVisualModel.userData.physicsBody = rocketBody; // Store reference to physics body
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
const velocityDisplay = document.getElementById('velocity-display');
const startTime = performance.now();
let animationStopped = false; // New variable to control animation state

const fixedTimeStep = 1.0 / 60.0; // seconds

function animate() {
    if (animationStopped) return; // Stop animation if flag is true

    requestAnimationFrame(animate);

    const elapsedTime = ((performance.now() - startTime) / 1000).toFixed(1);
    timeDisplay.textContent = `Time: ${elapsedTime}s`;

    // Stop animation at 30 seconds
    if (parseFloat(elapsedTime) >= 30 && rocketBody) {
        animationStopped = true;
        rocketBody.velocity.y = 0; // Stop rocket movement
        velocityDisplay.textContent = `Velocity: 0.00 m/s (Animation Stopped)`;
        return; // Exit animate function
    }

    // Show cone after 3 seconds
    if (parseFloat(elapsedTime) >= 3 && cone && !cone.visible) {
        cone.visible = true;
    }

    // Hide cone at 12 seconds and show yellow cone
    if (parseFloat(elapsedTime) >= 12 && cone && cone.visible) {
        cone.visible = false;
        if (yellowCone) {
            yellowCone.visible = true;
        }
    }

    // Move rocket after 4 seconds
    if (parseFloat(elapsedTime) >= 3 && rocketBody && !rocketActivated) {
        rocketBody.mass = 1; // Activate physics by setting mass to 1
        rocketBody.type = CANNON.Body.DYNAMIC;
        rocketActivated = true;
    }

    if (rocketActivated) {
        rocketBody.wakeUp();
        if (parseFloat(elapsedTime) >= 16) {
            rocketBody.velocity.y = 220;
            isVibrating = true; // Activate vibration
        } else if (parseFloat(elapsedTime) >= 14) {
            rocketBody.velocity.y = 150;
            isVibrating = false;
        } else if (parseFloat(elapsedTime) >= 12) {
            rocketBody.velocity.y = 100;
            isVibrating = false;
        } else if (parseFloat(elapsedTime) >= 10) {
            rocketBody.velocity.y = 40;
            isVibrating = false;
        } else if (parseFloat(elapsedTime) >= 8) {
            rocketBody.velocity.y = 20;
            isVibrating = false;
        } else if (parseFloat(elapsedTime) >= 6) {
            rocketBody.velocity.y = 6;
            isVibrating = false;
        } else if (parseFloat(elapsedTime) >= 5) {
            rocketBody.velocity.y = 2;
            isVibrating = false;
        } else {
            rocketBody.velocity.y = 1; // Set velocity along Y-axis to 1
            isVibrating = false;
        }
        velocityDisplay.textContent = `Velocity: ${rocketBody.velocity.y.toFixed(2)} m/s`;

        // After 9 seconds, make the camera focus on the rocket
        if (parseFloat(elapsedTime) >= 9) {
            controls.target.copy(rocketBody.position);
        }
    } else {
        velocityDisplay.textContent = `Velocity: 0.00 m/s`;
    }

    // Camera switch logic
    if (parseFloat(elapsedTime) >= 17 && currentCamera === camera) {
        currentCamera = rocketCamera;
        controls.object = rocketCamera;
        controls.target.set(0, 0, 0); // Reset target for the new camera to focus on rocket's local origin
        controls.update();
    }

    // Update the physics world
    world.step(fixedTimeStep);

    // Synchronize Three.js objects with Cannon.js bodies
    scene.traverse((object) => {
        if (object.userData.physicsBody) {
            if (object === rocketVisualModel && isVibrating) {
                // Apply small random offset for vibration to the visual model
                object.position.x = object.userData.physicsBody.position.x + (Math.random() - 0.5) * 0.5; // Adjust 0.5 for intensity
                object.position.y = object.userData.physicsBody.position.y + (Math.random() - 0.5) * 0.5;
                object.position.z = object.userData.physicsBody.position.z + (Math.random() - 0.5) * 0.5;
            } else {
                // Ensure position is synchronized when not vibrating or for other objects
                object.position.copy(object.userData.physicsBody.position);
            }
            object.quaternion.copy(object.userData.physicsBody.quaternion);
        }
    });

    controls.update(); // only required if controls.enableDamping or controls.autoRotate are set to true
    renderer.render(scene, currentCamera);
}

animate();
