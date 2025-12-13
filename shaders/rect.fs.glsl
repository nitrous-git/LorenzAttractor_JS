// Fragment shader
precision mediump float;
uniform vec2  u_resolution;
uniform float u_time;

void main() {
    float t = 0.5 + 0.5 * sin(u_time);   // 0..1 pulse
    gl_FragColor = vec4(t, 0.2, 1.0 - t, 1.0);
}