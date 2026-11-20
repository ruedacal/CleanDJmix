// source=web/js/app.jsx
// component=DeckPlayer
import figma from 'figma'

const instance = figma.selectedInstance

const deckNumber = instance.getString('Deck') || '1'
const title = instance.getString('Title') || 'Losing It'
const artist = instance.getString('Artist') || 'Fisher'
const bpm = instance.getString('BPM') || '126.0'
const key = instance.getString('Key') || '8A'
const isPlaying = instance.getBoolean('IsPlaying')

export default {
  example: figma.code`
    <div className="bw-deck-player">
      <div className="deck-info">
        <span className="deck-badge">DECK ${deckNumber}</span>
        <h4 className="track-title">${title}</h4>
        <span className="track-artist">${artist}</span>
      </div>
      <div className="deck-meta">
        <span className="meta-bpm">${bpm} BPM</span>
        <span className="meta-key">${key}</span>
      </div>
      <div className="deck-controls">
        <button type="button" className="bw-deck-btn">CUE</button>
        <button type="button" className="bw-deck-play ${isPlaying ? 'is-playing' : ''}">
          ${isPlaying ? '❚❚' : '▶'}
        </button>
        <button type="button" className="bw-deck-btn">SYNC</button>
      </div>
    </div>
  `,
  id: 'deck-player',
  metadata: { nestable: true }
}
