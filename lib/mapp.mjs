/**
## MAPP

The primary module for the MAPP API will import other MAPP modules and assign itself as the `window.mapp{}` object.

The `mapp.mjs` module is used as entry point for the esbuild process to bundle the MAPP API.

@requires /mapview
@requires /layer
@requires /layer
@requires /utils
@requires /dictionary
@requires /dictionaries

@module mapp
*/

import utils from './utils/_utils.mjs'

import hooks from './hooks.mjs'

import dictionary from './dictionaries/_dictionary.mjs'

import dictionaries from './dictionaries/_dictionaries.mjs'

import layer from './layer/_layer.mjs'

import location from './location/_location.mjs'

import Mapview from './mapview/_mapview.mjs'

import plugins from './plugins/_plugins.mjs'

hooks.parse();

const _ol = {
  current: 10.0,
  load: async () => await new Promise(resolve => {

    const script = document.createElement('script')

    script.type = 'application/javascript'

    script.src = 'https://cdn.jsdelivr.net/npm/ol@v10.0.0/dist/ol.js'

    script.onload = resolve

    document.head.append(script)

    console.warn('Openlayers library loaded from script tag.')
  })
}

if (window.ol === undefined) {

  console.warn(`Openlayers has not been loaded.`)

} else {

  let olVersion = parseFloat(ol?.util.VERSION)

  console.log(`OpenLayers version ${olVersion}`)

  if (olVersion < _ol.current) {

    console.warn(`Update the current OpenLayers version:${ol?.util.VERSION} to ${_ol.current}.`)
  }
}

self.mapp = {
  ol: _ol,

  version: '4.12.0α',

  hash: 'd10a12bce1378a1a89cce041de2172706f6258b1',

  host: document.head?.dataset?.dir || '',

  language: hooks.current.language || 'en',

  dictionaries,

  dictionary,

  hooks,

  layer,

  location,

  Mapview,

  utils,

  plugins
}
