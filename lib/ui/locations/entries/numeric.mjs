export default entry => {

  entry.formatterParams ??= {}

  entry.formatterParams.options ??= {}

  if (entry.edit) {

    if (entry.edit.range) {
      return createSlider(entry);
    }

    return createNumberInput(entry);
  }

  if (isNaN(entry.value)) return;

  if (entry.type === 'integer') {

    entry.formatterParams.options.maximumFractionDigits = 0
  }

  return mapp.utils.html.node`
  <div class="val" style=${entry.css_val}>
    ${entry.prefix}${parseFloat(entry.value).toLocaleString(entry.formatterParams.locale || 'en-GB', entry.formatterParams.options)}${entry.suffix}`;

}

function createSlider(entry) {
  return mapp.ui.elements.slider({
    min: entry.edit.range.min,
    max: entry.edit.range.max,
    val: entry.newValue || entry.value,
    callback: e => {
      entry.newValue = entry.type === 'integer'
        ? parseInt(e.target.value)
        : parseFloat(e.target.value);

      entry.location.view?.dispatchEvent(
        new CustomEvent('valChange', { detail: entry })
      );
    }
  });
}

function createNumberInput(entry) {
  return mapp.utils.html.node`
    <input
      type="number"
      value=${entry.newValue || entry.value}
      placeholder=${entry.edit.placeholder}
      onkeyup=${e => handleKeyUp(e, entry)}>`;
}

function handleKeyUp(e, entry) {
  if (entry.type === 'integer') {
    e.target.value = parseInt(e.target.value);
  }

  entry.newValue = e.target.value;
  entry.location.view?.dispatchEvent(
    new CustomEvent('valChange', { detail: entry })
  );
}