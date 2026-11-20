// source=web/js/app.jsx
// component=MetricCard
import figma from 'figma'

const instance = figma.selectedInstance

const label = instance.getString('Label') || 'SALUD GLOBAL'
const value = instance.getString('Value') || '16'
const sublabel = instance.getString('Sublabel') || 'pistas auditadas'
const state = instance.getEnum('State', {
  'Active': 'active',
  'Warning': 'warn',
  'Success': 'ok',
  'Danger': 'fail'
})

export default {
  example: figma.code`
    <div className="ws-hud-card is-${state}">
      <span className="ws-hud-label">${label}</span>
      <span className="ws-hud-val">${value}</span>
      <span className="ws-hud-sub">${sublabel}</span>
    </div>
  `,
  id: 'metric-card',
  metadata: { nestable: true }
}
