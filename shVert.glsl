#version 300 es

layout (location = 0) in vec3 aPos;

uniform float change_x;
uniform float change_y;

void main() {
    gl_Position = vec4(aPos[0] + change_x, aPos[1] + change_y, aPos[2], 1.0);
} 