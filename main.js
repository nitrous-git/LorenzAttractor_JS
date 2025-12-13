import * as THREE from "three";

// Basic three.js setup
// ------------------------------------------------------------
const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.set(0, 0, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// axis helper
//scene.add(new THREE.AxesHelper(20));

// Lorenz attractor
// ------------------------------------------------------------

const y0 = [1.0, 0.0, 0.0]

const a = 0.01;   // 0.001 0.01, 0.4 are pretty cool !!
const b = 8/3;
const c = 28;

const dt = 0.01;
const T = 300; // integrate from O to 40
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
    const dx = y + z;
    const dy = -x + a*y;
    const dz = x**2 - z;
    return [dx, dy, dz];
}

// Compute trajectory
// ------------------------------------------------------------
let state = [y0[0], y0[1], y0[2]]; // initial condition
let t = 0;

const scale = 3;
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
const tvals = new Float32Array(trajectory_points.length); // per vertex attribute, normalized to 0..1 along trajectory

for (let i = 0; i < trajectory_points.length; i++) {
    const p = trajectory_points[i];
    const index = i * 3;

    positions[index + 0] = p.x;
    positions[index + 1] = p.y;
    positions[index + 2] = p.z;

    // t-space is 0 to 1
    tvals[i] = i / (trajectory_points.length - 1);
}

const geom = new THREE.BufferGeometry();
geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
geom.setAttribute("a_t", new THREE.BufferAttribute(tvals, 1));
geom.setDrawRange(0, 2); // start small

const uniforms = {
    u_headT: { value: 0.0 },      // where the currently drawn head is (0..1)
    u_band:  { value: 0.005 },     // glowing segment length (0.001 to 0.005 is good)
    //u_base:  { value: new THREE.Color(0xffcc66) },
    u_glow:  { value: new THREE.Color(0xffffff) },
    u_intensity: { value: 1.8 }, // glow strength
    u_trail: { value: 0.95 }, // keep last 70% visible
    u_paletteShift: { value: 0.0 }
};

const vert = `
  attribute float a_t;
  varying float v_t;

  void main() {
    v_t = a_t;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const frag = `
  precision highp float;

  uniform float u_headT;
  uniform float u_band;
  uniform vec3  u_base;
  uniform vec3  u_glow;
  uniform float u_intensity;
  uniform float u_trail;
  uniform float u_paletteShift;

  varying float v_t;

  // Inigo Quilez-style cosine palette
  vec3 palette(float t) {
      vec3 a = vec3(0.10, 0.08, 0.18);
      vec3 b = vec3(0.90, 0.55, 0.35);
      vec3 c = vec3(1.00, 1.00, 1.00);
      vec3 d = vec3(0.00, 0.20, 0.40);
      return a + b * cos(6.2831853 * (c * t + d));
  }
    
  void main() {
      // Base color changes along the line
      float tcol = fract(v_t + u_paletteShift);
      vec3 base = palette(tcol);
    
      // Head glow
      float d = abs(v_t - u_headT);
      float glow = exp(-(d*d) / max(1e-6, u_band*u_band));
    
      // Trail fade to black behind the head
      float age  = u_headT - v_t;                  // 0 at head, increases behind it
      float fade = smoothstep(u_trail, 0.0, age);  // 1 near head -> 0 far behind
    
      vec3 col = base * fade + u_glow * glow * u_intensity;
      float alpha = max(fade, glow);
    
      gl_FragColor = vec4(col, alpha);
  }
`;

const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,  // helps additive glow layering
});

const line = new THREE.Line(geom, mat);
scene.add(line);


// Animation
// ------------------------------------------------------------
let drawCount = 2;

const startT = performance.now();
const pointsPerSecond = 0.8; // slower/faster: 80..600

function animate(t) {
    requestAnimationFrame(animate);

    //uniforms.u_time.value = performance.now() * 0.001;

    // reveal the line progressively
    const elapsed = (t - startT) * 0.001; // seconds since start
    drawCount = Math.min(drawCount + Math.floor(elapsed * pointsPerSecond), trajectory_points.length);
    geom.setDrawRange(0, drawCount);

    // head index is drawCount-1
    uniforms.u_headT.value = (drawCount - 1) / (trajectory_points.length - 1);
    uniforms.u_paletteShift.value = performance.now() * 0.001 * 0.05;

    renderer.render(scene, camera);
}

requestAnimationFrame(animate);

