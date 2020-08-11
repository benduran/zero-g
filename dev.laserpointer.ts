import { createZeroG, ZeroGInstance } from './src/zeroG';
import createLaserPointer, {
  LaserPointerDrawingType,
  LaserPointerInstance,
  LaserPointerMode,
} from './src/laserPointer';
import { simplifyPoints } from './src/simplifyPoints';

const elem = document.getElementById('dev');

if (!elem) throw new Error('Cannot run dev page because DOM element root was missing');

declare global {
  interface Window {
    laserPointerInstance: LaserPointerInstance;
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
const laserPointerInstance = createLaserPointer(pannerInstance);

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

laserPointerInstance.set('mode', LaserPointerMode.Draw);
laserPointerInstance.onCreateShape((shape) => {
  if (shape.type === LaserPointerDrawingType.DRAWING) {
    const d = { ...shape, points: simplifyPoints(shape.points) };
    laserPointerInstance.addDrawings([d]);
  }
});

window.pannerInstance = pannerInstance;
window.laserPointerInstance = laserPointerInstance;
