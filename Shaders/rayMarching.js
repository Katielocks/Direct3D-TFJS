export const rayMarching =  `
vec2 intersectBox(vec3 ro, vec3 rd, vec3 boxMin, vec3 boxMax) {
    vec3 tMin = (boxMin - ro) / rd;
    vec3 tMax = (boxMax - ro) / rd;
    vec3 t1 = min(tMin, tMax);
    vec3 t2 = max(tMin, tMax);
    float tNear = max(max(t1.x, t1.y), t1.z);
    float tFar = min(min(t2.x, t2.y), t2.z);
    return vec2(tNear, tFar);
}

float sampleVolume(vec3 pos) {
    ivec3 voxelCoord = ivec3(floor(pos)); 
    int X = int(volumeDims.x);
    int Y = int(volumeDims.y);
    int Z = int(volumeDims.z);
    voxelCoord = clamp(voxelCoord, ivec3(0), ivec3(X-1, Y-1, Z-1));
    float u = (float(voxelCoord.x) + 0.5) / float(X);
    float v = (float(voxelCoord.z * Y + voxelCoord.y) + 0.5) / float(Y * Z);
    return texture(volumeData, vec2(u, v)).r;
}

vec3 computeRayDirection(vec2 coords, vec2 resolution, vec2 sxy, vec3 f, vec3 r, vec3 u) {
    vec2 normcoords = (coords + 0.5) / resolution;
    float aspect = resolution.x / resolution.y;
    vec2 ndc = vec2(
        (2.0 * normcoords.x - 1.0) * aspect,
        (1.0 - 2.0 * normcoords.y)
    );
    vec2 sndc = ndc * sxy;
    return normalize(sndc.x * r + sndc.y * u + f);
}

void main() {
    ivec2 outputCoords = getOutputCoords();
    vec3 ro = cameraPos;
    vec3 rd = computeRayDirection(vec2(outputCoords), resolution, sxy, f, r, u);
    vec2 t = intersectBox(ro, rd, vec3(0.0), volumeDims);
    if (t.y < 0.0 || t.x > t.y) {
        outputColor = vec4(0.0);
        return;
    }
    t.x = max(t.x, 0.0);
    vec3 v = ro + rd * t.x;
    float epsilon = 1e-5;
    v += rd * epsilon;
    vec3 rdSign = sign(rd);
    vec3 tDelta = 1.0 / abs(rd);
    vec3 s = (rdSign * (floor(v) - v + 0.5)+0.5)*tDelta;
    float tcurr = 0.0;
    float totalLength = t.y - t.x;
    while (tcurr < totalLength) {
        vec3 boundaryCmp = min(s.yzx, s.zxy);
        vec3 mask = vec3(lessThanEqual(s, boundaryCmp));
        float nextStep = min(min(s.x, s.y), s.z);
        vec3 voxelCoord = vec3(floor(v));
        float density = sampleVolume(voxelCoord);
        if (density > 0.0) {
            outputColor = vec4(vec3(density), 1.0);
            return;
        }
        tcurr = nextStep;
        s += tDelta * mask;
        v += rdSign * mask;
    }
    outputColor = vec4(0.0);
}
 `