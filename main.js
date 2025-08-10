import * as THREE from 'three';
import { AxesHelper } from 'three';

const scene = new THREE.Scene();
const axesHelper = new AxesHelper( 5 ); // 5 units long axes
scene.add( axesHelper );
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.set(5, 5, 5); // Isometric-like position
camera.lookAt(0, 0, 0); // Point camera at the origin

function animate() {
	requestAnimationFrame( animate );

	renderer.render( scene, camera );
}

animate();
