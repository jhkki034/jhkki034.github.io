// main three.module.js library
import * as THREE from 'three';  
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// main scene
const scene = new THREE.Scene();
scene.backgroundColor = 0x0;  // white background

// Camera를 perspective와 orthographic 두 가지로 switching 해야 해서 const가 아닌 let으로 선언
let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.x = 60;
camera.position.y = 30;
camera.position.z = 90;
camera.lookAt(scene.position);

// add camera to the scene
scene.add(camera);

// setup the renderer
// antialias = true: 렌더링 결과가 부드러워짐
const renderer = new THREE.WebGLRenderer({ antialias: true });

// outputColorSpace의 종류
// sRGBColorSpace: 보통 monitor에서 보이는 color로, 어두운 부분을 약간 밝게 보이게 Gamma correction을 함
// sRGBColorSpace는 PBR (Physically Based Rendering), HDR(High Dynamic Range)에서는 필수적으로 사용함
// LinearColorSpace: 모든 색상을 선형으로 보이게 함
renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.shadowMap.enabled = true; // scene에서 shadow를 보이게

renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// 현재 열린 browser window의 width와 height에 맞게 renderer의 size를 설정
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0);
// attach renderer to the body of the html page
document.body.appendChild(renderer.domElement);

// add Stats: 현재 FPS를 보여줌으로써 rendering 속도 표시
const stats = new Stats();
// attach Stats to the body of the html page
document.body.appendChild(stats.dom);

// Camera가 바뀔 때 orbitControls도 바뀌어야 해서 let으로 선언
let orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;

// GUI
const gui = new GUI();
const controls = new function () {
    this.perspective = "Perspective";
    this.switchCamera = function () {
        if (camera instanceof THREE.PerspectiveCamera) {
            scene.remove(camera);
            camera = null; // 기존의 camera 제거    
            // OrthographicCamera(left, right, top, bottom, near, far)
            camera = new THREE.OrthographicCamera(window.innerWidth / -16, 
                window.innerWidth / 16, window.innerHeight / 16, window.innerHeight / -16, -200, 500);
            camera.position.x = 120;
            camera.position.y = 120;
            camera.position.z = 180;
            camera.lookAt(scene.position);
            orbitControls.dispose(); // 기존의 orbitControls 제거
            orbitControls = null;
            orbitControls = new OrbitControls(camera, renderer.domElement);
            orbitControls.enableDamping = true;
            this.perspective = "Orthographic";
        } else {
            scene.remove(camera);
            camera = null; 
            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.x = 60;
            camera.position.y = 30;
            camera.position.z = 90;
            camera.lookAt(scene.position);
            orbitControls.dispose(); // 기존의 orbitControls 제거
            orbitControls = null;
            orbitControls = new OrbitControls(camera, renderer.domElement);
            orbitControls.enableDamping = true;
            this.perspective = "Perspective";
        }
    };
};
const cameraFolder = gui.addFolder('Camera');
cameraFolder.add(controls, 'switchCamera').name("Switch Camera");
cameraFolder.add(controls, 'perspective').name("Current View").listen();

// sun
const textureLoader = new THREE.TextureLoader();
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // 노란색
const sunGeometry = new THREE.SphereGeometry(10, 64, 64);
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sunMesh);

// PLANET DATA
const planetsData = [
  {
    name: 'Mercury', radius: 1.5, distance: 20, color: '#a6a6a6',
    texture: 'Mercury.jpg', rotationSpeed: 0.02, orbitSpeed: 0.02
  },
  {
    name: 'Venus', radius: 3, distance: 35, color: '#e39e1c',
    texture: 'Venus.jpg', rotationSpeed: 0.015, orbitSpeed: 0.015
  },
  {
    name: 'Earth', radius: 3.5, distance: 50, color: '#3498db',
    texture: 'Earth.jpg', rotationSpeed: 0.01, orbitSpeed: 0.01
  },
  {
    name: 'Mars', radius: 2.5, distance: 65, color: '#c0392b',
    texture: 'Mars.jpg', rotationSpeed: 0.008, orbitSpeed: 0.008
  }
];

const planets = [];

planetsData.forEach(data => {
  const planetMat = new THREE.MeshStandardMaterial({ map: textureLoader.load(data.texture), roughness: 0.8, metalness: 0.2 });
  const planetMesh = new THREE.Mesh(new THREE.SphereGeometry(data.radius, 32, 32), planetMat);

  const pivot = new THREE.Object3D();
  pivot.add(planetMesh);
  scene.add(pivot);

  planetMesh.position.x = data.distance;

  const planetInfo = {
    name: data.name,
    mesh: planetMesh,
    pivot: pivot,
    rotationSpeed: data.rotationSpeed,
    orbitSpeed: data.orbitSpeed,
    angle: 0
  };
  planets.push(planetInfo);

  const folder = gui.addFolder(data.name);
  folder.add(planetInfo, 'rotationSpeed', 0, 0.1, 0.001).name("Rotation Speed");
  folder.add(planetInfo, 'orbitSpeed', 0, 0.1, 0.001).name("Orbit Speed");
});

// listen to the resize events
window.addEventListener('resize', onResize, false);
function onResize() {
    const aspect = window.innerWidth / window.innerHeight;

    if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = aspect;
    } else {
        camera.left = window.innerWidth / -16;
        camera.right = window.innerWidth / 16;
        camera.top = window.innerHeight / 16;
        camera.bottom = window.innerHeight / -16;
    }

    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// add ambient light
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

// add directional light
const dirLight = new THREE.DirectionalLight(0xffffff);
dirLight.position.set(5, 12, 8); // 여기서 부터 (0, 0, 0) 방향으로 light ray 방향
dirLight.castShadow = true;  // 이 light가 shadow를 만들어 낼 것임
scene.add(dirLight);

const torusKnotGeometry = new THREE.TorusKnotGeometry(0.5, 0.2, 100, 100);

// MeshPhongMaterial: ambient + diffuse + specular
const torusKnotMat = new THREE.MeshPhongMaterial({
	color: 0x00ff88,
});
// const torusKnotMesh = new THREE.Mesh(torusKnotGeometry,torusKnotMat);
// torusKnotMesh.castShadow = true; // light를 받을 떄 shadow를 만들어 냄
// torusKnotMesh.position.x = 2;
// scene.add(torusKnotMesh);

let step = 0;

function animate() {
    stats.update();
    orbitControls.update();

    step += 0.02;

    // torusKnotMesh.rotation.x -= props.torusRotSpeed;
    // torusKnotMesh.rotation.y += props.torusRotSpeed;
    // torusKnotMesh.rotation.z -= props.torusRotSpeed;

    // 🌎 각 행성의 자전/공전 구현
    planets.forEach(p => {
        p.mesh.rotation.y += p.rotationSpeed;  // 자전
        p.pivot.rotation.y += p.orbitSpeed;    // 공전
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();






