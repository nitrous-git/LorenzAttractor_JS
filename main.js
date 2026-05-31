import * as THREE from "three";
import GUI from "lil-gui";

// Basic three.js setup
// ------------------------------------------------------------
const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.set(0, 45, 80);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// axis helper
//scene.add(new THREE.AxesHelper(20));

// RK4 integrator
// ------------------------------------------------------------

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

// Attractor presets
// ------------------------------------------------------------

const ATTRACTORS = {
    Aizawa: {
        name: "Aizawa",
        initial: [0.1, 0.0, 0.0],
        dt: 0.01,
        T: 600,
        scale: 3,

        cameraPosition: [0, 3, 10],
        cameraLookAt: [0, 2, 0],

        ode: function aizawa(t, state) {
            const x = state[0];
            const y = state[1];
            const z = state[2];

            const a = 0.95;
            const b = 0.7;
            const c = 0.6;
            const d = 3.5;
            const e = 0.25;
            const f = 0.1;

            const dx = (z - b) * x - d * y;
            const dy = d * x + (z - b) * y;
            const dz =
                c +
                a * z -
                (z ** 3) / 3 -
                (x ** 2 + y ** 2) * (1 + e * z) +
                f * z * (x ** 3);

            return [dx, dy, dz];
        },
    },

    Lorenz: {
        name: "Lorenz",
        initial: [-8, 8, 27],
        dt: 0.001,
        T: 200,
        scale: 1.8,

        cameraPosition: [0, 45, 80],
        cameraLookAt: [0, 45, 0],

        ode: function lorenz(t, state) {
            const x = state[0];
            const y = state[1];
            const z = state[2];

            const a = 10;
            const b = 8 / 3;
            const c = 28;

            const dx = a * (y - x);
            const dy = x * (c - z) - y;
            const dz = x * y - b * z;

            return [dx, dy, dz];
        },
    },

    Rossler: {
        name: "Rossler",
        initial: [0.1, 0.0, 0.0],
        dt: 0.01,
        T: 1000,
        scale: 1.6,

        cameraPosition: [0, 15, 45],
        cameraLookAt: [0, 8, 0],

        ode: function rossler(t, state) {
            const x = state[0];
            const y = state[1];
            const z = state[2];

            const a = 0.2;
            const b = 0.2;
            const c = 5.7;

            const dx = -y - z;
            const dy = x + a * y;
            const dz = b + z * (x - c);

            return [dx, dy, dz];
        },
    },

    Thomas: {
        label: "Thomas",
        initial: [1.0, 0.0, -1.0],
        dt: 0.01,
        T: 1800,
        scale: 12.0,

        cameraPosition: [45, 45, 45],
        cameraLookAt: [0, 0, 0],

        ode: function thomas(t, state) {
            const x = state[0];
            const y = state[1];
            const z = state[2];

            const b = 0.208186;

            const dx = Math.sin(y) - b * x;
            const dy = Math.sin(z) - b * y;
            const dz = Math.sin(x) - b * z;

            return [dx, dy, dz];
        },
    },

    Halvorsen: {
        label: "Halvorsen",
        initial: [0.1, 0.0, 0.0],
        dt: 0.005,
        T: 250,
        scale: 5.0,

        cameraPosition: [45, 45, 45],
        cameraLookAt: [0, 0, 0],

        ode: function halvorsen(t, state) {
            const x = state[0];
            const y = state[1];
            const z = state[2];

            const a = 1.4;

            const dx = -a * x - 4 * y - 4 * z - y * y;
            const dy = -a * y - 4 * z - 4 * x - z * z;
            const dz = -a * z - 4 * x - 4 * y - x * x;

            return [dx, dy, dz];
        },
    },

    Dadras: {
        label: "Dadras",
        initial: [1.0, 1.0, 1.0],
        dt: 0.005,
        T: 900,
        scale: 2.0,

        cameraPosition: [60, 45, 25],
        cameraLookAt: [2, 5, 0],

        ode: function dadras(t, state) {
            const x = state[0];
            const y = state[1];
            const z = state[2];

            const a = 2.6;
            const b = 2.7;
            const c = 2.8;
            const d = 3.0;
            const e = 7.4;

            const dx = y - a * x + b * y * z;
            const dy = c * y - x * z + z;
            const dz = d * x * y - e * z;

            return [dx, dy, dz];
        },
    },

    Misc_01: {
        name: "Misc_01",
        initial: [1.0, 0.0, 0.0],
        dt: 0.01,
        T: 300,
        scale: 3,

        cameraPosition: [0, 0, 5],
        cameraLookAt: [0, 0, 0],

        ode: function misc01(t, state) {
            const x = state[0];
            const y = state[1];
            const z = state[2];

            const a = 0.01;   // 0.001 0.01, 0.4 are pretty cool !!

            const dx = y + z;
            const dy = -x + a*y;
            const dz = x**2 - z;

            return [dx, dy, dz];
        },
    },

};

// UI / runtime settings
// ------------------------------------------------------------

const settings = {
    attractor: "Aizawa",

    x0: 0.1,
    y0: 0.0,
    z0: 0.0,

    dt: 0.01,
    T: 600,
    scale: 3,

    pointsPerSecond: 3.0,

    trail: 0.7,
    band: 0.005,
    intensity: 1.8,

    restart: function () {
        restartSimulation();
    }
};


// Geometry and trajectory state
// -----------------------------------------------------------
let trajectory_points = [];
let drawCount = 2;
let revealStartTime = performance.now();

const geom = new THREE.BufferGeometry();
geom.setDrawRange(0, 2);

// Shader
// ------------------------------------------------------------

const uniforms = {
    u_headT: { value: 0.0 },      // where the currently drawn head is (0..1)
    u_band:  { value: 0.005 },     // glowing segment length (0.001 to 0.005 is good)
    u_glow:  { value: new THREE.Color(0xffffff) },
    u_intensity: { value: 1.8 }, // glow strength
    u_trail: { value: 1.0 }, // keep last 70% visible
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
  
  vec3 paletteSynthwave(float t) {
      // Neon synthwave: magenta/purple/blue/cyan with high saturation
      // Mix of 3 keyed ramps to avoid “muddy” midtones.
      t = fract(t);
    
      vec3 magenta = vec3(1.00, 0.12, 0.78);
      vec3 purple  = vec3(0.62, 0.18, 1.00);
      vec3 blue    = vec3(0.10, 0.45, 1.00);
      vec3 cyan    = vec3(0.00, 1.00, 0.95);
    
      // Segment blends (smooth, continuous)
      float s0 = smoothstep(0.00, 0.35, t); // magenta -> purple
      vec3 c0 = mix(magenta, purple, s0);
    
      float s1 = smoothstep(0.25, 0.65, t); // purple -> blue
      vec3 c1 = mix(purple, blue, s1);
    
      float s2 = smoothstep(0.55, 1.00, t); // blue -> cyan
      vec3 c2 = mix(blue, cyan, s2);
    
      // Combine ramps so we keep punchy neon throughout
      vec3 col = (c0 + c1 + c2) / 3.0;
    
      // Add a subtle “neon lift” (push brights, keep blacks)
      col = pow(col, vec3(0.85)); // slightly brighter mid/highs
      return col;
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
    uniforms : uniforms,
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,  // helps additive glow layering
});

const line = new THREE.Line(geom, mat);
scene.add(line);

// Trajectory generation
// ------------------------------------------------------------

function computeTrajectory() {
    const def = ATTRACTORS[settings.attractor];

    const dt = settings.dt;
    const T = settings.T;
    const N = Math.floor(T / dt);
    const scale = settings.scale;

    let state = [settings.x0, settings.y0, settings.z0];
    let t = 0;

    trajectory_points = [];
    trajectory_points.push( new THREE.Vector3(state[0], state[2], state[1]).multiplyScalar(scale) );

    for (let i = 0; i < N; i++) {
        state = RK4(def.ode, dt, t, state);
        t += dt;

        const p = new THREE.Vector3(state[0], state[2], state[1]).multiplyScalar(scale);
        trajectory_points.push(p);
    }

    // Convert points to flat array Float32Array for BufferGeometry
    // ------------------------------------------------------------
    const positions = new Float32Array(trajectory_points.length * 3);
    const tvals = new Float32Array(trajectory_points.length); // per vertex attribute, normalized to 0..1 along trajectory

    for (let i = 0; i < trajectory_points .length; i++) {
        const p = trajectory_points[i];
        const index = i * 3;

        positions[index + 0] = p.x;
        positions[index + 1] = p.y;
        positions[index + 2] = p.z;

        tvals[i] = i / (trajectory_points.length - 1);
    }

    return {
        positions: positions,
        tvals: tvals,
    };
}

function rebuildTrajectory() {
    const result = computeTrajectory();

    geom.setAttribute("position", new THREE.BufferAttribute(result.positions, 3));

    geom.setAttribute("a_t", new THREE.BufferAttribute(result.tvals, 1));

    geom.computeBoundingSphere();

    drawCount = 2;
    revealStartTime = performance.now();

    geom.setDrawRange(0, drawCount);

    uniforms.u_headT.value = 0.0;
}

function restartSimulation() {
    rebuildTrajectory();
}


// Preset helpers
// ------------------------------------------------------------

function applyPreset(name) {
    const def = ATTRACTORS[name];

    settings.attractor = name;

    settings.x0 = def.initial[0];
    settings.y0 = def.initial[1];
    settings.z0 = def.initial[2];

    settings.dt = def.dt;
    settings.T = def.T;
    settings.scale = def.scale;

    applyCameraPreset(def);

    rebuildTrajectory();
    updateGuiDisplay();
}

function applyCameraPreset(def) {
    camera.position.set(
        def.cameraPosition[0],
        def.cameraPosition[1],
        def.cameraPosition[2]
    );

    camera.lookAt(
        def.cameraLookAt[0],
        def.cameraLookAt[1],
        def.cameraLookAt[2]
    );
}

// GUI
// ------------------------------------------------------------

let gui;
const guiControllers = [];

function trackController(controller) {
    guiControllers.push(controller);
    return controller;
}

function updateGuiDisplay() {
    for (let i = 0; i < guiControllers.length; i++) {
        guiControllers[i].updateDisplay();
    }
}

function setupGUI() {
    gui = new GUI({
        title: "Attractor Controls",
    });

    trackController(
        gui
            .add(settings, "attractor", Object.keys(ATTRACTORS))
            .name("ODE System")
            .onChange(function (value) {
                applyPreset(value);
            })
    );

    gui.add(settings, "restart").name("Restart Simulation");

    const initialFolder = gui.addFolder("Initial Values");

    trackController(
        initialFolder
            .add(settings, "x0", -5, 5, 0.001)
            .name("x0")
            .onFinishChange(rebuildTrajectory)
    );

    trackController(
        initialFolder
            .add(settings, "y0", -5, 5, 0.001)
            .name("y0")
            .onFinishChange(rebuildTrajectory)
    );

    trackController(
        initialFolder
            .add(settings, "z0", -5, 5, 0.001)
            .name("z0")
            .onFinishChange(rebuildTrajectory)
    );

    const simulationFolder = gui.addFolder("Simulation");

    trackController(
        simulationFolder
            .add(settings, "dt", 0.001, 0.05, 0.001)
            .name("dt")
            .onFinishChange(rebuildTrajectory)
    );

    trackController(
        simulationFolder
            .add(settings, "T", 10, 1000, 1)
            .name("Total Time")
            .onFinishChange(rebuildTrajectory)
    );

    trackController(
        simulationFolder
            .add(settings, "scale", 0.05, 10, 0.05)
            .name("Scale")
            .onFinishChange(rebuildTrajectory)
    );

    trackController(
        simulationFolder
            .add(settings, "pointsPerSecond", 0.1, 20, 0.1)
            .name("Draw Speed")
    );

    const visualFolder = gui.addFolder("Visuals");

    trackController(
        visualFolder
            .add(settings, "trail", 0.05, 1.0, 0.01)
            .name("Trail")
            .onChange(function (value) {
                uniforms.u_trail.value = value;
            })
    );

    trackController(
        visualFolder
            .add(settings, "band", 0.0005, 0.05, 0.0005)
            .name("Glow Band")
            .onChange(function (value) {
                uniforms.u_band.value = value;
            })
    );

    trackController(
        visualFolder
            .add(settings, "intensity", 0.1, 5.0, 0.1)
            .name("Glow Intensity")
            .onChange(function (value) {
                uniforms.u_intensity.value = value;
            })
    );

    initialFolder.open();
    simulationFolder.open();
}





// Animation
// ------------------------------------------------------------

function animate(t) {
    requestAnimationFrame(animate);

    // reveal the line progressively
    const elapsed = (t - revealStartTime) * 0.001; // seconds since start
    drawCount = Math.min(drawCount + Math.floor(elapsed * settings.pointsPerSecond), trajectory_points.length);
    geom.setDrawRange(0, drawCount);

    // head index is drawCount-1
    uniforms.u_headT.value = (drawCount - 1) / (trajectory_points.length - 1);
    uniforms.u_paletteShift.value = performance.now() * 0.001 * 0.05;

    renderer.render(scene, camera);
}

// Resize
// ------------------------------------------------------------

window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Init
// ------------------------------------------------------------

setupGUI();
applyCameraPreset(ATTRACTORS[settings.attractor]);
rebuildTrajectory();
requestAnimationFrame(animate);

