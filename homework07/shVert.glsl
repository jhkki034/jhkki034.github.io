#version 300 es

precision highp float;
precision highp int;

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec4 a_color;
layout(location = 3) in vec2 a_texCoord;

struct Material {
    vec3 diffuse;       // surface's diffuse color
    vec3 specular;      // surface's specular color
    float shininess;    // specular shininess
};

struct Light {
    vec3 position;      // light position
    vec3 ambient;       // ambient strength
    vec3 diffuse;       // diffuse strength
    vec3 specular;      // specular strength
};

uniform Material material;
uniform Light light;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

uniform vec3 u_viewPos;
uniform int u_renderMode;

out vec3 fragPos;
out vec3 normal;
out vec3 gouraudColor;  // Only used if GOURAUD mode is active

void main() {
    vec4 worldPos = u_model * vec4(a_position, 1.0);
    fragPos = vec3(worldPos);
    normal = mat3(transpose(inverse(u_model))) * a_normal;

    if (u_renderMode == 1) { // GOURAUD shading
        vec3 norm = normalize(normal);
        vec3 lightDir = normalize(light.position - fragPos);
        vec3 viewDir = normalize(u_viewPos - fragPos);
        vec3 reflectDir = reflect(-lightDir, norm);

        float diff = max(dot(norm, lightDir), 0.0);
        vec3 diffuse = light.diffuse * diff * material.diffuse;

        float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
        vec3 specular = light.specular * spec * material.specular;

        vec3 ambient = light.ambient * material.diffuse;

        gouraudColor = ambient + diffuse + specular;
    } else {
        gouraudColor = vec3(0.0);  // must be initialized even if unused
    }

    gl_Position = u_projection * u_view * vec4(fragPos, 1.0);
}
