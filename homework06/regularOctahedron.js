export class Octahedron {
    constructor(gl) {
        this.gl = gl;

        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();

        const sqrt2over2 = 0.7071;

        // 8 faces * 3 vertices per face = 24 vertices
        this.vertices = new Float32Array([
            // Top pyramid
            0,  sqrt2over2, 0,  -0.5, 0, -0.5,   0.5, 0, -0.5, // face 0
            0,  sqrt2over2, 0,   0.5, 0, -0.5,   0.5, 0,  0.5, // face 1
            0,  sqrt2over2, 0,   0.5, 0,  0.5,  -0.5, 0,  0.5, // face 2
            0,  sqrt2over2, 0,  -0.5, 0,  0.5,  -0.5, 0, -0.5, // face 3

            // Bottom pyramid
            0, -sqrt2over2, 0,   0.5, 0, -0.5,  -0.5, 0, -0.5, // face 4
            0, -sqrt2over2, 0,   0.5, 0,  0.5,   0.5, 0, -0.5, // face 5
            0, -sqrt2over2, 0,  -0.5, 0,  0.5,   0.5, 0,  0.5, // face 6
            0, -sqrt2over2, 0,  -0.5, 0, -0.5,  -0.5, 0,  0.5  // face 7
        ]);

        // Compute flat normals
        const normals = new Float32Array(this.vertices.length);
        for (let i = 0; i < this.vertices.length; i += 9) {
            const ax = this.vertices[i],     ay = this.vertices[i+1], az = this.vertices[i+2];
            const bx = this.vertices[i+3],   by = this.vertices[i+4], bz = this.vertices[i+5];
            const cx = this.vertices[i+6],   cy = this.vertices[i+7], cz = this.vertices[i+8];

            const ux = bx - ax, uy = by - ay, uz = bz - az;
            const vx = cx - ax, vy = cy - ay, vz = cz - az;

            const nx = uy * vz - uz * vy;
            const ny = uz * vx - ux * vz;
            const nz = ux * vy - uy * vx;

            const length = Math.hypot(nx, ny, nz);
            const nxn = nx / length, nyn = ny / length, nzn = nz / length;

            for (let j = 0; j < 3; ++j) {
                normals[i + j*3]     = nxn;
                normals[i + j*3 + 1] = nyn;
                normals[i + j*3 + 2] = nzn;
            }
        }
        this.normals = normals;

        this.texCoords = new Float32Array([
            // Top pyramid faces
            0.5, 0.75,   0.0, 0.5,   0.25, 0.5,   // face 0
            0.5, 0.75,   0.25, 0.5,  0.5,  0.5,   // face 1
            0.5, 0.75,   0.5,  0.5,  0.75, 0.5,   // face 2
            0.5, 0.75,   0.75, 0.5,  1.0,  0.5,   // face 3

            // Bottom pyramid faces
            0.5, 0.25,   0.25, 0.5,   0.0, 0.5,   // face 4
            0.5, 0.25,   0.5, 0.5,    0.25, 0.5,   // face 5
            0.5, 0.25,   0.75, 0.5,   0.5, 0.5,   // face 6
            0.5, 0.25,   1.0, 0.5,    0.75, 0.5    // face 7
        ]);

        this.indices = new Uint16Array([
            0, 1, 2,   3, 4, 5,   6, 7, 8,   9,10,11,
           12,13,14,  15,16,17, 18,19,20,  21,22,23
        ]);

        this.initBuffers();
    }

    initBuffers() {
        const gl = this.gl;
        const vSize = this.vertices.byteLength;
        const nSize = this.normals.byteLength;
        const tSize = this.texCoords.byteLength;
        const totalSize = vSize + nSize + tSize;
    
        gl.bindVertexArray(this.vao);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, totalSize, gl.STATIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize, this.texCoords);
    
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, vSize + nSize);
    
        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
    
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
    
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