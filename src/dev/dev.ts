import { createZeroG, ZeroGInstance } from './src/zeroG';

const elem = document.getElementById('dev');

if (!elem) throw new Error('Cannot run dev page because DOM element root was missing');

declare global {
  interface Window {
    pannerInstance: ZeroGInstance;
    ZOOM_LEVEL: number;
    ZOOM_STEP: number;
  }
}

window.ZOOM_STEP = 0.5;

const zoomInBtn = document.getElementById('zoomIn')!;
const zoomOutBtn = document.getElementById('zoomOut')!;
const currentScaleBtn = document.getElementById('currentScale')!;

const pannerInstance = createZeroG(elem);
pannerInstance.onScaleChange((scale) => {
  currentScaleBtn.innerHTML = `${(scale * 100).toFixed(0)}%`;
  window.ZOOM_LEVEL = scale;
});

zoomInBtn.addEventListener('click', () => {
  window.ZOOM_LEVEL += window.ZOOM_STEP;
  pannerInstance.zoomInOut(window.ZOOM_LEVEL);
});
zoomOutBtn.addEventListener('click', () => {
  window.ZOOM_LEVEL -= window.ZOOM_STEP;
  pannerInstance.zoomInOut(window.ZOOM_LEVEL);
});
currentScaleBtn.addEventListener('click', () => {
  pannerInstance.zoomFit();
});

window.pannerInstance = pannerInstance;
