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
To control a single HTML Element, use `createZeroG`. The following options are available:

