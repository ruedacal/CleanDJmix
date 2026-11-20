// source=web/js/app.jsx
// component=ActionButton
import figma from 'figma'

const instance = figma.selectedInstance

const label = instance.getString('Label') || 'Acción'
const variant = instance.getEnum('Variant', {
  'Primary': 'primary',
  'Ghost': 'ghost',
  'Live': 'live',
  'Danger': 'danger'
})
const disabled = instance.getBoolean('Disabled')

export default {
  example: figma.code`
    <button 
      type="button"
      className="bw-btn bw-btn-${variant}"
      ${disabled ? 'disabled' : ''}
    >
      ${label}
    </button>
  `,
  id: 'action-button',
  metadata: { nestable: true }
}
