export class Cone {
    constructor(gl, segments = 32, options = {}) {
        this.gl = gl;

        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();

        const radius = 0.5;
        const height = 1.0;
        const halfHeight = height / 2;
        const angleStep = (2 * Math.PI) / segments;

        const positions = [];
        const normals = [];
        const colors = [];
        const texCoords = [];
        const indices = [];

        const color = options.color || [0.8, 0.8, 0.8, 1.0];
        let vertexIndex = 0;

        for (let i = 0; i < segments; i++) {
            const angle0 = i * angleStep;
            const angle1 = (i + 1) * angleStep;

            // 밑면 두 정점
            const x0 = radius * Math.cos(angle0);
            const z0 = radius * Math.sin(angle0);
            const x1 = radius * Math.cos(angle1);
            const z1 = radius * Math.sin(angle1);
            const yBase = -halfHeight;
            const yTip = halfHeight;

            // 3점 좌표 (tip, base1, base2)
            const tip = [0, yTip, 0];
            const base1 = [x0, yBase, z0];
            const base2 = [x1, yBase, z1];

            // face normal: (base2 - base1) x (tip - base1)
            const U = [
                base1[0] - base2[0],
                base1[1] - base2[1],
                base1[2] - base2[2]
            ];
            const V = [
                tip[0] - base2[0],
                tip[1] - base2[1],
                tip[2] - base2[2]
            ];
            const nx = (U[1] * V[2]) - (U[2] * V[1]);
            const ny = (U[2] * V[0]) - (U[0] * V[2]);
            const nz = (U[0] * V[1]) - (U[1] * V[0]);
            const len = Math.hypot(nx, ny, nz);
            const normal = [nx / len, ny / len, nz / len];

            // 각 triangle 정점 3개 모두 추가
            for (const pos of [tip, base2, base1]) {
                positions.push(...pos);
                normals.push(...normal); // flat normal
                colors.push(...color);
                texCoords.push(0, 0); // 임의 좌표 (사용 안할 경우)
                indices.push(vertexIndex++);
            }
        }

        this.vertices = new Float32Array(positions);
        this.normals = new Float32Array(normals);
        this.colors = new Float32Array(colors);
        this.texCoords = new Float32Array(texCoords);
        this.indices = new Uint16Array(indices);

        // 노멀 백업
        this.faceNormals = new Float32Array(this.normals);
        this.vertexNormals = new Float32Array(this.normals);
        this.computeVertexNormals(); // smooth 계산용

        this.initBuffers();
    }

    computeVertexNormals() {
        const vCount = this.vertices.length / 3;
        const h = 1.0;
        const r = 0.5;
        const slope = r / h;
        this.vertexNormals = new Float32Array(this.vertices.length);

        for (let i = 0; i < vCount; i++) {
            const x = this.vertices[i * 3 + 0];
            const y = this.vertices[i * 3 + 1];
            const z = this.vertices[i * 3 + 2];

            if (y > 0.4) {
                this.vertexNormals.set([0, 1, 0], i * 3);
                continue;
            }

            const nx = x;
            const ny = slope;
            const nz = z;
            const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
            this.vertexNormals.set([nx / len, ny / len, nz / len], i * 3);
        }
    }

    copyFaceNormalsToNormals() {
        this.normals.set(this.faceNormals);
    }

    copyVertexNormalsToNormals() {
        this.normals.set(this.vertexNormals);
    }

    updateNormals() {
        const gl = this.gl;
        const vSize = this.vertices.byteLength;

        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

    initBuffers() {
        const gl = this.gl;

        const vSize = this.vertices.byteLength;
        const nSize = this.normals.byteLength;
        const cSize = this.colors.byteLength;
        const tSize = this.texCoords.byteLength;
        const totalSize = vSize + nSize + cSize + tSize;

        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, totalSize, gl.STATIC_DRAW);

        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize, this.colors);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize + cSize, this.texCoords);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);                      // position
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, vSize);                 // normal
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, vSize + nSize);         // color
        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, vSize + nSize + cSize); // texCoord

        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.enableVertexAttribArray(2);
        gl.enableVertexAttribArray(3);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    draw(shader) {
        const gl = this.gl;
        shader.use();
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }

    delete() {
        const gl = this.gl;
        gl.deleteBuffer(this.vbo);
        gl.deleteBuffer(this.ebo);
        gl.deleteVertexArray(this.vao);
    }
}
