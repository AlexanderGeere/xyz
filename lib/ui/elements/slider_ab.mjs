/**
Exports method to create a slider_ab element group.

@module /ui/elements/slider_ab
*/

/**
@function slider_ab

@description
The slider method creates a range slider element with two numeric input elements [a/b].

The params.value property must be between params.min and params.max params.

@param {Object} params Parameter for slider element.
@property {numeric} params.val_a Parameter value for a input.
@property {numeric} params.val_b Parameter value for b input.
@property {numeric} params.min Numeric range min.
@property {numeric} params.max Numeric range max.

@returns {HTMLElement} Element group containing range and numeric input elements.
*/
export default function slider_ab(params) {

  params.group_id ??= params.data_id || 'slider_ab'

  params.step ??= 1

  const minInputParams = {
    data_id: 'a',
    value: params.val_a,
    rangeInput: 'minRangeInput',
    callback: params.callback_a,
    numericChecks
  }

  params = Object.assign(params, minInputParams)

  // Create numericInput element for formatting and numeric checks.
  const minNumericInput = mapp.ui.elements.numericInput(params)

  const maxInputParams = {
    data_id: 'b',
    value: params.val_b,
    rangeInput: 'maxRangeInput',
    callback: params.callback_b,
    numericChecks
  }

  params = Object.assign(params, maxInputParams)

  // Create numericInput element for formatting and numeric checks.
  const maxNumericInput = mapp.ui.elements.numericInput(params)

  /**
  @function numericChecks

  @description
  The numericChecks method checks whether a provided numeric value is a number, larger than params.min, and smaller than params.max.

  The slider_ab numericCheck methods returns false if the 'a' slider element value exceeds the 'b' slider element value or vice versa.

  @param {Object} value The numeric value to check.
  @param {Object} params The config object argument.
  @property {numeric} params.min Value must be larger than min.
  @property {numeric} params.max Value must be smaller than max.
  @property {string} params.data_id The id of the numeric input element.

  @returns {Boolean} true if checks are passed.
  */
  function numericChecks(value, params) {

    // Check whether value is a number.
    if (isNaN(value)) return false;

    if (params.data_id === 'a' && value > maxInputParams.newValue) {

      return false
    }

    if (params.data_id === 'b' && value < minInputParams.newValue) {

      return false
    }

    if (params.min && value < params.min) {

      // The value is smaller than min.
      return false
    }

    if (params.max) {

      return value <= params.max
    }

    return true
  }

  const element = mapp.utils.html.node`
    <div
      role="group"
      data-id=${params.group_id}
      class="input-range multi"
      style=${`
        --min: ${params.min};
        --max: ${params.max};
        --a: ${params.val_a};
        --b: ${params.val_b};`}>
      <div 
        class="label-row">
        <label>${params.label_a || 'A'}
          ${minNumericInput}</label>
        <label>${params.label_b || 'B'}
          ${maxNumericInput}</label>
      </div>
      <div class="track-bg"></div>
      <input data-id="a" type="range"
        name="minRangeInput"
        min=${params.min}
        max=${params.max}
        step=${params.step}
        value=${params.val_a}
        oninput=${e => onRangeInput(e, params)}/>
      <input data-id="b" type="range"
        name="maxRangeInput"
        min=${params.min}
        max=${params.max}
        step=${params.step}
        value=${params.val_b}
        oninput=${e => onRangeInput(e, params)}/>`

  // The sliderElement property is required to update the range input on numeric input.
  minInputParams.sliderElement = element
  maxInputParams.sliderElement = element

  /**
  @function onRangeInput

  @description
  Assign value from range type input to associated numericInput element.

  Formatting and numeric checks will be handled by the numericInput element.

  @param {Object} e oninput event from range type input.
  @param {Object} params params object used to pass additional params to the numericInput input function.
  */
  function onRangeInput(e, params) {

    // Range type input return a string target.value.
    const val = Number(e.target.value)

    //Needed to indicate that the change is coming from a slider element
    params.onRangeInput = true;

    // Check whether input event is from minRangeInput.
    if (e.target.dataset.id === 'a') {

      minNumericInput.value = val

      // Trigger formatting and numeric checks.
      minNumericInput.dispatchEvent(new Event('change'))
    }

    // Check whether input event is from maxRangeInput.
    if (e.target.dataset.id === 'b') {

      maxNumericInput.value = val

      // Trigger formatting and numeric checks.
      maxNumericInput.dispatchEvent(new Event('change'))
    }
  }

  return element
}
