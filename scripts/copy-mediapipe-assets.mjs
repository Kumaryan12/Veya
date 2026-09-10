import { cp, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = `${root}/node_modules/@mediapipe/tasks-vision/wasm`;
const destination = `${root}/public/mediapipe`;

await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true });
