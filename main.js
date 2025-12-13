import * as THREE from "three";

// Basic three.js setup
// ------------------------------------------------------------
const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.set(0, 45, 80);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// axis helper
//scene.add(new THREE.AxesHelper(20));

// Lorenz attractor
// ------------------------------------------------------------

const y0 = [-8, 8, 27]

const a = 10;
const b = 8/3;
const c = 28;

const dt = 0.01;
const T = 80; // integrate from O to 40
const N = Math.floor(T / dt);

function RK4(fun, dt, t0, y0) {
    const c1 = fun(t0, y0);

    const y_c2 = [y0[0] + (dt / 2) * c1[0],
                        y0[1] + (dt / 2) * c1[1],
                        y0[2] + (dt / 2) * c1[2]];
    const c2 = fun(t0 + dt / 2, y_c2);

    const y_c3 = [y0[0] + (dt / 2) * c2[0],
                        y0[1] + (dt / 2) * c2[1],
                        y0[2] + (dt / 2) * c2[2]];
    const c3 = fun(t0 + dt / 2, y_c3);

    const y_c4 = [y0[0] + dt * c3[0],
                        y0[1] + dt * c3[1],
                        y0[2] + dt * c3[2]];
    const c4 = fun(t0 + dt, y_c4);

    return [y0[0] + (dt / 6) * (c1[0] + 2 * c2[0] + 2 * c3[0] + c4[0]),
            y0[1] + (dt / 6) * (c1[1] + 2 * c2[1] + 2 * c3[1] + c4[1]),
            y0[2] + (dt / 6) * (c1[2] + 2 * c2[2] + 2 * c3[2] + c4[2])];
}

function lorenz(t, state) {
    const x = state[0], y = state[1], z = state[2];
    const dx = a * (y - x);
    const dy = x * (c - z) - y;
    const dz = x * y - b * z;
    return [dx, dy, dz];
}

// Compute trajectory
// ------------------------------------------------------------
let state = [y0[0], y0[1], y0[2]]; // initial condition
let t = 0;

const scale = 1.8;
const trajectory_points = []; // points
//trajectory_points.push(new THREE.Vector3(state[0], state[1], state[2]));
trajectory_points.push(new THREE.Vector3(state[0], state[2], state[1]).multiplyScalar(scale));

for (let i = 0; i < N; i++) {
    state = RK4(lorenz, dt, t, state);
    t += dt;

    //const p = new THREE.Vector3(state[0], state[1], state[2]);
    const p = new THREE.Vector3(state[0], state[2], state[1]).multiplyScalar(scale);
    trajectory_points.push(p);
}

// Convert points to flat array Float32Array for BufferGeometry
// ------------------------------------------------------------
const positions = new Float32Array(trajectory_points.length * 3);

for (let i = 0; i < trajectory_points.length; i++) {
    const p = trajectory_points[i];
    const index = i * 3;
    positions[index + 0] = p.x;
    positions[index + 1] = p.y;
    positions[index + 2] = p.z;
}

const geom = new THREE.BufferGeometry();
geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
geom.setDrawRange(0, 2); // start small

const mat = new THREE.LineBasicMaterial({ color: 0xffcc66 });
const line = new THREE.Line(geom, mat);
scene.add(line);

// Animation
// ------------------------------------------------------------
let drawCount = 2;

function animate() {
    requestAnimationFrame(animate);

    // reveal the line progressively, 10 more points each iteration
    drawCount = Math.min(drawCount + 10, trajectory_points.length);
    geom.setDrawRange(0, drawCount);

    renderer.render(scene, camera);
}
animate();
