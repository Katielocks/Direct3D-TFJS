# Direct3D-TFJS

Direct3D-TFJS is a small WebGL renderer powered by [TensorFlow.js](https://www.tensorflow.org/js). It renders volumetric data using a custom ray marching shader and provides utilities for drawing WebGL textures to an HTML canvas. The code is intended for browser-based experiments or applications that need to visualize 3D grids with GPU acceleration.

## Features

- **Volume Rendering** – `Renderer3D` compiles a TensorFlow.js kernel (`rayMarcher`) that performs ray marching on a 3D tensor representing the volume.
- **Orbit Controls** – `Orbital` offers simple mouse controls for rotating, panning and zooming around the scene.
- **Direct WebGL Draw** – `Gldraw` exposes helpers such as `drawTexture` and `syncWait` to efficiently blit GPU textures to the canvas without downloading data back to the CPU.

## Repository Layout

```
Gldraw.js          # WebGL helpers for drawing textures
OrbitControls.js   # Mouse interaction for camera movement
Renderer3D.js      # Main renderer class using TensorFlow.js
Shaders/
  rayMarching.js   # GLSL code for the ray marching kernel
```

## Installation

```
npm install direct3d-tfjs
```

The package is distributed as ES modules and expects TensorFlow.js and a WebGL2‑capable browser environment. It can be used as a lightweight alternative to PixelDraw for TensorFlow.js based projects.


## Usage

```javascript
import { Renderer3D } from 'direct3d-tfjs';   

const canvas = document.getElementById('view');
const engine = { grid: tf.tensor3d(/* volume data */) };
const renderer = new Renderer3D(canvas, engine);

renderer.render();
```

`Renderer3D` expects `engine.grid` to be a `tf.Tensor3D` containing your volume data. The renderer handles the creation of the WebGL program and drawing to the supplied canvas. `Orbital` is automatically instantiated to provide mouse controls.

## Notes

The project is experimental. Ensure that the canvas has a WebGL2 context and that TensorFlow.js is loaded before creating the renderer.

## License

This project is released under the MIT License. See [LICENSE](LICENSE) for more information.