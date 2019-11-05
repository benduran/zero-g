
import { createDockingProcedure } from './src';
import { DockingProcedureInstance } from './src/dockingProcedure';

const elem = document.getElementById('outer');

if (!elem) throw new Error('Cannot run dev page because DOM element root was missing');

declare global {
  interface Window {
    dockingProcedure: DockingProcedureInstance;
    ZOOM_LEVEL: number;
    ZOOM_STEP: number;
  }
}

window.ZOOM_STEP = 0.5;

const zoomInBtn = document.getElementById('zoomIn')!;
const zoomOutBtn = document.getElementById('zoomOut')!;
const currentScaleBtn = document.getElementById('currentScale')!;

const dockingProcedure = createDockingProcedure(Array.from(elem.querySelectorAll('img')), {
  onScaleChange: (scale) => {
    currentScaleBtn.innerHTML = `${(scale * 100).toFixed(0)}%`;
    window.ZOOM_LEVEL = scale;
  },
});

zoomInBtn.addEventListener('click', () => {
  window.ZOOM_LEVEL = window.ZOOM_LEVEL + window.ZOOM_STEP;
  dockingProcedure.zoomInOut(window.ZOOM_LEVEL);
});
zoomOutBtn.addEventListener('click', () => {
  window.ZOOM_LEVEL = window.ZOOM_LEVEL - window.ZOOM_STEP;
  dockingProcedure.zoomInOut(window.ZOOM_LEVEL);
});
currentScaleBtn.addEventListener('click', () => {
  dockingProcedure.zoomFit();
});

window.dockingProcedure = dockingProcedure;
