/**
## ui/layers/panels/draw

The draw panel module exports the draw method.

Dictionary entries:
- layer_add_new_location

@requires /dictionary
@module /ui/layers/panels/draw
*/

/**
@function drawPanel

@description
The drawPanel method iterates over the layer.draw object and creates interface elements for each.

The interface elements are returned in a panel element.

Specifying `layer.draw.drawer: false` will prevent a drawer from being made for the drawing panel.

@param {layer} layer
@property {string} layer.geom The field to store draw geometries.
@property {Object} layer.draw The configuration for the layer draw methods.
@property {boolean} [draw.hidden] The draw panel should not be created for the layer.view.
@property {boolean} [draw.popout] Whether the drawer can be popped out into a dialog.
@property {string} [draw.classList] The string will be appended to the drawer element classlist.
@property {boolean} [draw.radio] Whether to control options display with a radio button

@returns {HTMLElement} The draw panel drawer element.
*/
export default function drawPanel(layer) {
  if (typeof layer.draw !== 'object') return;

  // Do not create the panel.
  if (layer.draw.hidden) return;

  // If the layer has no geom return with a warning as you need a geom to draw.
  if (!layer.geom) {
    console.warn(
      `Layer: ${layer.key} - You must have a geom property to draw new features.`,
    );
    return;
  }

  //Set the elementDisplay to none only if radio is truthy.
  const elementDisplay = layer.draw.radio ? 'none' : false;

  const elements = Object.keys(layer.draw)
    .map((key) => {
      // Get element from drawing module
      const drawElement = mapp.ui.elements.drawing[key]?.(layer);

      //Set the display based on whether radio is true or false.
      //Only set the display property where needed.
      elementDisplay &&
        drawElement?.style.setProperty('display', elementDisplay);
      return drawElement;
    })
    .filter((node) => !!node);

  // Short circuit panel creation without elements.
  if (!elements.length) return;

  createRadioOptions({ layer, elements: elements });

  //nullish assing content if layer.draw.radio is false
  layer.draw.content ??= mapp.utils.html`${elements}`;

  if (layer.draw.dialog) {
    layer.draw.dialog = {
      btn_label: 'Drawing',
      title: 'Drawing',
      icon: 'new_label',
      ...layer.draw.dialog,
    };
  }

  if (layer.draw.drawer === false) {
    layer.draw.view =
      layer.draw.dialog?.btn ||
      mapp.utils.html.node`<div data-id="draw-drawer">
        <h3>${mapp.dictionary.layer_add_new_location}</h3>
        ${layer.draw.content}`;
  } else {
    layer.draw.view = mapp.ui.elements.drawer({
      data_id: `${layer.key}-draw-drawer`,
      dialog: layer.draw.dialog,
      layer,
      header: mapp.utils.html`
      <h3>${mapp.dictionary.layer_add_new_location}</h3>
      <div class="notranslate material-symbols-outlined caret"/>`,
      content: layer.draw.content,
      class: layer.draw.classList,
      popout: layer.draw.popout,
    });
  }

  return layer.draw.view;
}

/**
@function createRadioOptions

@description
Creates a radio button with the configured drawing options.

An onchange event is configured for each option which shows that options drawing panel.

@param {Object} params
@property {layer} params.layer The layer where the draw configuration resides.
@property {Object} layer.draw The configuration options for the draw panel.
@property {Array<HTMLElement>} params.elements The draw panels created from the options specified.
*/
function createRadioOptions(params) {
  if (!params.layer.draw.radio) return;

  const layer = params.layer;
  const elements = params.elements;

  const radioOptions = Object.keys(layer.draw)
    .map((key) => {
      // Only create radios for valid drawing options.
      if (!mapp.ui.elements.drawing[key]) return;

      const radioElement = mapp.ui.elements.radio({
        label: layer.draw?.[key]?.label || key,
        group: 'drawing',
        onchange: () => radioOnChange(layer, key),
      });

      return radioElement;
    })
    .filter((node) => !!node);

  layer.draw.content = mapp.utils.html`${radioOptions}${elements}`;
}

/**
@function radioOnChange

@description
Sets the display property on the draw panel for the selected element, as well as hiding the
other panels.

@param {layer} layer
@param {string} key The key of the selected element
*/

function radioOnChange(layer, key) {
  for (const drawKey of Object.keys(layer.draw)) {
    //Leave non-drawing elements onchanged
    if (!mapp.ui.elements.drawing[drawKey]) continue;

    //Get the drawing element
    const drawElement =
      layer.draw?.[drawKey]?.drawer || layer.draw?.[drawKey]?.btn;

    drawElement?.style?.setProperty?.('display', 'none');

    //Set the display to block if the element is the selected option.
    if (drawKey === key) {
      drawElement.style.setProperty('display', 'block');
    }
  }
}
