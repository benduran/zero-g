
import { panner } from './src';

const elem = document.getElementById('dev');

if (!elem) throw new Error('Cannot run dev page because DOM element root was missing');

const pannerInstance = panner(elem);

console.info(pannerInstance);
