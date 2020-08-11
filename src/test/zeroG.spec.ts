
import { createZeroG } from '../src';

describe('Zero G Single Instance', () => {
  let parent: HTMLDivElement;
  let elem: HTMLImageElement;
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1920,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: 1080,
    });
    parent = document.createElement('div');
    parent.style.position = 'fixed';
    parent.style.top = '0px';
    parent.style.left = '0px';
    parent.style.right = '0px';
    parent.style.bottom = '0px';
    document.body.appendChild(parent);
    elem = document.createElement('img');
    parent.appendChild(elem);
  });
  it('Should initialize a ZeroG instance without crashing', () => {
    const instance = createZeroG(elem);
    expect(instance).toBeDefined();
    elem.addEventListener('load', () => console.info(elem.naturalWidth, elem.naturalHeight));
  });
});
