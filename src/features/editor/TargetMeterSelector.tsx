import { FOOT_PATTERNS, meterName, type Foot } from '@/engines/meter'

interface TargetMeterSelectorProps {
  value: { foot: Foot; feet: number } | null
  onChange: (value: { foot: Foot; feet: number } | null) => void
}

const FEET = [1, 2, 3, 4, 5, 6]
const FOOTS = Object.keys(FOOT_PATTERNS) as Foot[]

export function TargetMeterSelector({ value, onChange }: TargetMeterSelectorProps) {
  const selected = value ? `${value.foot}:${value.feet}` : 'auto'

  return (
    <select
      value={selected}
      onChange={(event) => {
        if (event.target.value === 'auto') {
          onChange(null)
          return
        }
        const [foot, feetStr] = event.target.value.split(':')
        onChange({ foot: foot as Foot, feet: Number(feetStr) })
      }}
      className="rounded-full border border-canvas-line bg-canvas px-3 py-1 text-xs text-ink/60"
    >
      <option value="auto">Auto-detect meter</option>
      {FOOTS.map((foot) =>
        FEET.map((feet) => (
          <option key={`${foot}:${feet}`} value={`${foot}:${feet}`}>
            {meterName(foot, feet)}
          </option>
        )),
      )}
    </select>
  )
}
