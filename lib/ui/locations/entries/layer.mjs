/**
## ui/locations/entries/layer

The entries layer module exports the default layer method.

@module /ui/locations/entries/layer
*/

/**
@function layer

@description
The layer entry method attempts to lookup a layer from the locale and will spread the infoj-entry object into a structured clone of the locale layer.

The infoj-entry effectively becomes a JSON layer which will be decorated and add the mapview.

The layer.key is a concatenated from the entry.layer [key] and the entry.location.hook.

A layer.view will be created for the decorated layer and appended to the entry.node for the location view.

@param {infoj-entry} entry type:layer entry.
@property {string} [entry.layer] lookup layer key for locale.layers[].

@return {HTMLElement} Node element to hold the layer view drawer.
*/
export default function layer(entry) {

  if (entry.mapview) {

    // The layer is assumed to be decorated already.
    return;
  }

  entry.mapview = entry.location.layer.mapview

  // The layer lookup is optional. An entry maybe defined as a layer.
  if (entry.layer) {

    // The layer.key must be unique.
    entry.key = `${entry.layer}|${entry.location.hook}`

    // The locale layer key.
    entry.Key = entry.layer

    const layer = entry.mapview.locale.layers
      .find(layer => layer.key === entry.layer)

    entry = {
      ...structuredClone(layer),
      ...entry
    }
  }

  entry.zIndex ??= entry.location.layer.zIndex++

  mapp.layer.decorate(entry).then(layer => {

    layer.show = showLayer;

    layer.hide = hideLayer;

    entry.mapview.layers[layer.key] = layer

    layer.display && layer.show()

    layer.display_toggle = mapp.ui.elements.chkbox({
      data_id: `${entry.key}-display`,
      label: entry.name,
      checked: entry.display,
      onchange: (checked) => {
        checked? layer.show(): layer.hide()
      }
    })

    layer.node.append(layer.display_toggle)
  })

  entry.location.removeCallbacks.push(()=>{
    entry.hide()
    delete entry.mapview.layers[entry.location.hook]
  })

  const node = mapp.utils.html.node`<div class="entry-layer">`

  return node
}

async function featureLookupQuery(entry) {

  if (!entry.featureLookup) return true;

  if (!entry.data && entry.query) {

    const paramString = mapp.utils.paramString(mapp.utils.queryParams(entry))

    entry.data = await mapp.utils.xhr(`${entry.mapview.host}/api/query?${paramString}`)

    if (!entry.data) {

      entry.view.classList.add('disabled')
      return;
    }

    entry.featureLookup = entry.data
  }

  return true;
}

async function featureSetQuery(entry) {

  if (!entry.featureSet) return true;

  if (Array.isArray(entry.value)) {
    entry.featureSet = new Set(entry.value)
    return;
  }

  if (entry.query) {

    const paramString = mapp.utils.paramString(mapp.utils.queryParams(entry))

    entry.value = await mapp.utils.xhr(`${entry.mapview.host}/api/query?${paramString}`)

    if (!entry.value) {

      entry.view.classList.add('disabled')
      return;
    }

    entry.featureSet = new Set(entry.value)

    return true;
  }
}

/**
@function showLayer
@async

@description
A custom show [layer] method which will not update the mapp.hooks.
*/
async function showLayer() {

  // featureLookup method returns falls if attempted lookup returns null.
  if (!(await featureLookupQuery(this))) {
    this.hide()
    return;
  }

  if (!(await featureSetQuery(this))) {
    this.hide()
    return;
  }

  this.display = true;

  try {

    // Add layer to map
    this.mapview.Map.addLayer(this.L);
  } catch {
    // Will catch assertation error when layer is already added.
  }

  // Reload layer data if available.
  this.reload instanceof Function && this.reload();

  // Execute showCallbacks
  this.showCallbacks?.forEach(fn => fn instanceof Function && fn(this));
}

/**
@function hideLayer

@description
A custom hide [layer] method which will not update the mapp.hooks.
*/
function hideLayer() {

  this.display = false;

  // Remove OL layer from mapview.
  this.mapview.Map.removeLayer(this.L);

  // Execute hideCallbacks
  this.hideCallbacks?.forEach(fn => fn instanceof Function && fn(this));
}