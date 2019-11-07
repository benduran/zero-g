# zero-g
Have a DOM element that needs to be panned or zoomed? This is the zero-dependency library you're looking for (with TypeScript typings). Built especially for usage with `<img />` or `<video />` elements.

## Installation
`npm install zero-g --save`

## Basic Usage
```
import { createZeroG } from 'zero-g';
const elemToPanAndZoom = document.getElementById('element');
const instance = createZeroG(elemToPanAndZoom, { /* options */ });
```

## API

### Single Instance
To control a single HTML Element, use `createZeroG`:

#### Your HTML
```html
<div>
  <img id="img" src="https://i.pinimg.com/originals/05/1d/b9/051db99b019d8ab861c87ac76c04ed81.jpg" alt="my image" />
</div>
```

#### Your JS / TS
```javascript
  import { createZeroG } from 'zero-g';
  const elem = document.getElementById('img');
  const z = createZeroG(elem, {/* Optional options object */});
```

#### `createZeroG` Options
- `changeCursorOnPan` - `boolean` - *Optional* - If `true`, changes the mouse cursor to `grabbing` on pan. Defaults to `true`.
- `diabled` - `boolean` - *Optional* - **Not Implemented - In Progress** - If `true`, disabled the zeroG instance from allowing panning or zooming
- `refitOnResize` - `boolean` - *Optional* - If `true`, performs a `zoomFit` operation when the window resizes to recenter the zoomed / panned element.
- `onScaleChange` - `(currentScale: number) => void` - *Optional* - If provided, function will be executed on initial render and on subsequent zoom operations with the current scale of the zoomable element. Useful for displaying the current zoom percentage to your users.
- `onPanStart` - `(panEvent: IPanEvent, instance: ZeroGInstance) => void` - *Optional* - If provided, will be executed whenever the user has started panning the element. Will be provided an object containing properties about the pan event, as well as the zeroG instance that was panned.
- `onPanMove` - `(panEvent: IPanEvent, instance: ZeroGInstance) => void` - *Optional* - If provided, will be executed whenever the user is actively moving the element around. Will be provided an object containing properties about the pan event, as well as the zeroG instance that was panned.
- `onPanEnd` - `(panEvent: IPanEvent, instance: ZeroGInstance) => void` - *Optional* - If provided, will be executed whenever the user has finished panning the element. Will be provided an object containing properties about the pan event, as well as the zeroG instance that was panned.

### Multiple Instances
If you want to synchronize two or more instance of zeroG to have synchronized pan and zooming (useful if you're comparing items side-by-side), you can use `createDockingProcedure`

#### Your HTML
```html
<div id="outer">
  <div>
    <img id="img1" src="https://i.pinimg.com/originals/05/1d/b9/051db99b019d8ab861c87ac76c04ed81.jpg" alt="my image" />
  </div>
  <div>
    <img id="img2" src="https://i.pinimg.com/originals/05/1d/b9/051db99b019d8ab861c87ac76c04ed81.jpg" alt="my image" />
  </div>
</div>
```

#### Your JS / TS
```javascript
import { createDockingProcedure } from 'zero-g';
const elems = document.querySelectorAll('img');
const d = createDockingProcedure(elems, { /* Optional options object */ });
```

#### `createDockingProcedure` Options
ALl the options are the same as `createZeroG`, but apply globally to all child instances of `zeroG` that `createDockingProcedure` creates.

## License
[MIT](https://en.wikipedia.org/wiki/MIT_License)
