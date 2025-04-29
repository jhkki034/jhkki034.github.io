import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '..util/shader.js';

let isInitialized = false;
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let vao1;
let vao2;
let vao3;
let axes;
let sunTransform;
let earthTransform;
let moonTransform;
let rotationAngle = 0;
let currentTransformType = null;
let isAnimating = true;
let lastTime = 0;
let vaos = [];
let draw_earth = false;

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
        requestAnimationFrame(animate);
    }).catch(error => {
        console.error('프로그램 실행 중 오류 발생:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.2, 0.3, 0.4, 1.0);
    
    return true;
}

function setupBuffers() {
    vao1 = gl.createVertexArray();
    setupSingleVAO(vao1, [
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0
    ]);
    vaos.push(vao1);

    vao2 = gl.createVertexArray();
    setupSingleVAO(vao2, [
        0.0, 1.0, 1.0, 1.0,
        0.0, 1.0, 1.0, 1.0,
        0.0, 1.0, 1.0, 1.0,
        0.0, 1.0, 1.0, 1.0
    ]);
    vaos.push(vao2);

    vao3 = gl.createVertexArray();
    setupSingleVAO(vao3, [
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0
    ]);
    vaos.push(vao3);   
}

function setupSingleVAO(vao, cubeColor) {
    const cubeVertices = new Float32Array([
        -0.5,  0.5,  // 좌상단
        -0.5, -0.5,  // 좌하단
         0.5, -0.5,  // 우하단
         0.5,  0.5   // 우상단
    ]);

    const indices = new Uint16Array([
        0, 1, 2,    // 첫 번째 삼각형
        0, 2, 3     // 두 번째 삼각형
    ]);

    const cubeColors = new Float32Array(
        cubeColor
    );

    gl.bindVertexArray(vao);

    // VBO for position
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

    // VBO for color
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    // EBO
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
}

function sun() {
    const T = mat4.create();
    const R = mat4.create();
    const S = mat4.create();

    mat4.translate(T, T, [0, 0, 0]);
    mat4.rotate(R, R, rotationAngle/4, [0, 0, 1]); // rotation about z-axis
    mat4.scale(S, S, [0.2, 0.2, 1]); // scale by (0.3, 0.3)

    return {T, R, S};
    }


function earth() {
    const T = mat4.create();
    const R = mat4.create();
    const S = mat4.create();

    mat4.translate(T, T, [0.7 * Math.cos(rotationAngle/6), 0.7 * Math.sin(rotationAngle/6), 0]);
    mat4.rotate(R, R, rotationAngle, [0, 0, 1]); // rotation about z-axis
    mat4.scale(S, S, [0.1, 0.1, 1]); 

    return {T, R, S};
}

function moon() {
    const T = mat4.create();
    const R = mat4.create();
    const S = mat4.create();

    mat4.translate(T, T, [0.2 * Math.cos(rotationAngle*2), 0.2 * Math.sin(rotationAngle*2), 0]);
    mat4.rotate(R, R, rotationAngle*4, [0, 0, 1]);
    mat4.scale(S, S, [0.05, 0.05, 1]); 

    return {T, R, S};
}


function applyTransform(type) {
    if (type == 'SUN') {
        sunTransform = mat4.create();
        const {T, R, S} = sun();
        mat4.multiply(sunTransform, T, R);
        mat4.multiply(sunTransform, sunTransform, S);
    }

    if (type == 'EARTH') {
        earthTransform = mat4.create();
        const { T: earthT, R: earthR, S: earthS } = earth();
        mat4.multiply(earthTransform, earthT, earthR);
        mat4.multiply(earthTransform, earthTransform, earthS);
    }

    if(type == 'MOON') {
        moonTransform = mat4.create();
        const {T, R, S} = moon();
        mat4.multiply(moonTransform, T, R);
        mat4.multiply(moonTransform, moonTransform, S);
        mat4.multiply(moonTransform, earth().T, moonTransform);
    }
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    // draw axes
    axes.draw(mat4.create(), mat4.create()); 

    // draw cube
    shader.use();
    applyTransform('SUN');
    shader.setMat4("u_model", sunTransform);
    gl.bindVertexArray(vao1);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    applyTransform('EARTH');
    shader.setMat4("u_model", earthTransform);
    gl.bindVertexArray(vao2); 
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    applyTransform('MOON');
    shader.setMat4("u_model", moonTransform);
    gl.bindVertexArray(vao3); 
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}

function animate(currentTime) {
    if (!lastTime) lastTime = currentTime; // if lastTime == 0
    // deltaTime: 이전 frame에서부터의 elapsed time (in seconds)
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    rotationAngle += Math.PI * deltaTime;
    render();
    requestAnimationFrame(animate);
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }
        sunTransform = mat4.create();
        earthTransform = mat4.create();
        moonTransform = mat4.create();
        await initShader();

        setupBuffers();
        axes = new Axes(gl, 0.8); 
        
        gl.bindVertexArray(vao1);
        applyTransform('SUN');

        gl.bindVertexArray(vao2);
        applyTransform('EARTH');

        gl.bindVertexArray(vao3);
        applyTransform('MOON');
        
        render();
        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
