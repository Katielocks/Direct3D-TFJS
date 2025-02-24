    import * as tf from '@tensorflow/tfjs'
    import { drawTexture, syncWait } from './Gldraw.js';
    import { rayMarching } from './Shaders/rayMarching.js';

    import { Orbital } from './OrbitControls.js'

    export class Renderer3D {
    constructor(canvas, engine) {
        this.canvas = canvas;
        this.engine = engine;
        this.volumeData = engine.grid
        this.fov = 45
        this.cameraPos = [100,100,100]
        this.cameraTarget = this.volumeData.shape.map(x=>Math.floor(x/2))
        this.colorScale = [tf.tensor([68 / 255, 13 / 255, 84 / 255]),tf.tensor([253 / 255, 232 / 255, 64 / 255]),tf.tensor([18/255,18/255,18/255])]
        this.pixelSize = 1;

        this.updateVectors()

        this.fovScalar =  Array.from({ length: 2 }).fill(Math.tan((this.fov* Math.PI) / 180 / 2));

        this.orbital = new Orbital(this);  
        


        tf.registerKernel({
            kernelName:'rayMarcher',
            backendName: 'webgl',
            kernelFunc: ({ inputs, backend,attrs }) => {
            const program = {
                variableNames: ['volumeData'],
                customUniforms: [
                    { type: 'vec3', name: 'volumeDims' },
                    { type: 'vec3', name: 'cameraPos' },
                    { type: 'vec2', name: 'resolution' },
                    { type: 'vec2', name: 'sxy' },
                    { type: 'vec3', name: 'f' },
                    { type: 'vec3', name: 'r' },
                    { type: 'vec3', name: 'u' }
                    ],
                outputShape: attrs[2],
                userCode: rayMarching
            };
            return backend.compileAndRun(
                program,
                [inputs.volumeData],
                'float32',
                attrs
            );
            }
        })}
        async render() {
            let processer;
            console.log(this.volumeData)
            const volumeData = this.volumeData
            const output = tf.tidy(() => {
                return tf.engine().runKernel(
                    'rayMarcher',
                    { volumeData },
                    [volumeData.shape,
                     this.cameraPos,
                     [this.canvas.height, this.canvas.width],
                     this.fovScalar,
                     this.forward,
                     this.right,
                     this.up]
                );
            });

            const rgbaTensor = g2rgba(output, this.colorScale);
            const gpuData = rgbaTensor.dataToGPU({ customTexShape: [this.canvas.height, this.canvas.width] });
            processer = drawTexture(this.canvas, gpuData.texture, { format: 'rgba' });
            await syncWait(processer.gl);
            // Dispose TensorFlow.js tensors.
            tf.dispose([output, rgbaTensor, gpuData]);
        }
        updateVectors() {
            this.forward = normalize(this.cameraTarget.map((x,i)=>x-this.cameraPos[i]))
            this.right = normalize(cross([0,1,0], this.forward));
            this.up = normalize(cross(this.forward, this.right));
        }
        onResize() {
            this.canvas.width = Math.floor(this.canvas.clientWidth/this.pixelSize);
            this.canvas.height = Math.floor(this.canvas.clientHeight/this.pixelSize);
            this.render()
        }
}
function  normalize(v) {
    const len = Math.hypot(...v);
    return v.map(x=>x/len);
}
function cross(a, b) {
return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
];
}

function applyColormap(matrix,color) {
    return tf.tidy(() => {
    const expandedMatrix = matrix.expandDims(-1);
    const mask = tf.greater(expandedMatrix ,0)
    const background = tf.mul(tf.equal(mask,0),color[2])
    const diff = color[1].sub(color[0]);
    const rgbTensor = expandedMatrix.mul(diff).add(color[0]);
    return tf.add(tf.mul(rgbTensor,mask),background)});
}
function rgb2rgba(rgb) {
    return tf.tidy(() => {
      const squeezed = rgb.shape.length === 4 ? tf.squeeze(rgb) : rgb;
      const [r, g, b] = tf.split(squeezed, 3, 2);
      const alpha = tf.ones([squeezed.shape[0], squeezed.shape[1], 1], 'float32');
      return tf.stack([r, g, b, alpha], 2); // Let tidy manage intermediates
    });
  }
function g2rgba(matrix,color){
    return tf.tidy(() => {    
    const rgb = applyColormap(matrix,color)
    return rgb2rgba(rgb)})
}