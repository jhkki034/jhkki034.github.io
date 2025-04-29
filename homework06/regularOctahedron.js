
export class Octahedron {
    constructor(gl) {
        this.gl = gl;
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();

        // Initializing data x, y, z, u, v
        const vertices = new Float32Array([
            // Top vertex
            0.0,  1/Math.sqrt(2),  0.0,   0.5, 1.0, // 0

            // Middle ring
            -0.5, 0.0,  0.5,   0.0, 0.5,  // 1
            0.5, 0.0,  0.5,   0.5, 0.5,  // 2
            0.5, 0.0,  -0.5,   1.0, 0.5,  // 3
            -0.5, 0.0, -0.5,   0.5, 0.0,  // 4

            // Bottom vertex
            0.0, -1/Math.sqrt(2), 0.0,   0.5, 0.0, //5
        ]);

        const indices = new Uint16Array([
            // Top
            0, 1, 2,
            0, 2, 3,
            0, 3, 4,
            0, 4, 1,

            // Bottom
            5, 2, 1,
            5, 3, 2,
            5, 4, 3,
            5, 1, 4,
        ]);

        gl.bindVertexArray(this.vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        // Position attribute
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 5 * 4, 0);

        // Texture coordinate attribute
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 5 * 4, 3 * 4);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        gl.bindVertexArray(null);
    }

    draw(shader) {
        this.gl.bindVertexArray(this.vao);
        this.gl.drawElements(this.gl.TRIANGLES, 24, this.gl.UNSIGNED_SHORT, 0);
        this.gl.bindVertexArray(null);
    }
}
