// source=web/js/app.jsx
// component=HotCueGrid
import figma from 'figma'

const instance = figma.selectedInstance

const activePad = instance.getString('ActivePad') || '1'
const colorMode = instance.getEnum('ColorMode', {
  'RGB': 'rgb',
  'Serato': 'serato',
  'Rekordbox': 'rekordbox'
})

export default {
  example: figma.code`
    <div className="hotcue-grid grid-cols-4 mode-${colorMode}">
      {[1, 2, 3, 4, 5, 6, 7, 8].map(pad => (
        <button
          key={pad}
          type="button"
          className="cue-pad ${activePad === String(pad) ? 'is-active' : ''}"
        >
          <span className="pad-num">{pad}</span>
          <span className="pad-name">CUE {pad}</span>
        </button>
      ))}
    </div>
  `,
  id: 'hotcue-grid',
  metadata: { nestable: true }
}
