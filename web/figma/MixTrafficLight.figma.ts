// source=web/js/app.jsx
// component=MixTrafficLight
import figma from 'figma'

const instance = figma.selectedInstance

const status = instance.getEnum('Status', {
  'Safe': 'safe',
  'Caution': 'caution',
  'Clash': 'clash'
})
const message = instance.getString('Message') || 'Sync 100% · Camelot 8A ➔ 8A'

export default {
  example: figma.code`
    <div className="mix-traffic-light is-${status}">
      <span className="traffic-dot"></span>
      <span className="traffic-status">
        ${status === 'safe' ? '🟢 SAFE MIX' : status === 'caution' ? '🟡 CAUTION' : '🔴 BASS CLASH'}
      </span>
      <span className="traffic-msg">${message}</span>
    </div>
  `,
  id: 'mix-traffic-light',
  metadata: { nestable: true }
}
