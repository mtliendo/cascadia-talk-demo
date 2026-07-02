'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type Seat } from '@/lib/flights'

type Props = {
  seats: Seat[]
  onSelect: (seat: Seat) => void
  preselectedSeatId?: string
}

const CLASS_LABELS: Record<Seat['class'], string> = {
  business: 'Business',
  premium: 'Premium Economy',
  economy: 'Economy',
}

const CLASS_COLORS: Record<Seat['class'], string> = {
  business: 'bg-violet-500/15 border-violet-500/30 hover:bg-violet-500/25',
  premium: 'bg-blue-500/15 border-blue-500/30 hover:bg-blue-500/25',
  economy: 'bg-muted/60 border-border hover:bg-muted',
}

const CLASS_SELECTED: Record<Seat['class'], string> = {
  business: 'bg-violet-500 border-violet-600 text-white',
  premium: 'bg-blue-500 border-blue-600 text-white',
  economy: 'bg-primary border-primary text-primary-foreground',
}

export function SeatPicker({ seats, onSelect, preselectedSeatId }: Props) {
  const [selected, setSelected] = useState<string | undefined>(preselectedSeatId)

  const rows = Array.from(new Set(seats.map((s) => s.row))).sort((a, b) => a - b)
  const cols = ['A', 'B', 'C', 'D', 'E', 'F']

  function handleSelect(seat: Seat) {
    if (!seat.available) return
    setSelected(seat.id)
    onSelect(seat)
  }

  const selectedSeat = seats.find((s) => s.id === selected)

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-sm bg-violet-500/20 border border-violet-500/30" />
          <span className="text-muted-foreground">Business</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-sm bg-blue-500/20 border border-blue-500/30" />
          <span className="text-muted-foreground">Premium Economy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-sm bg-muted/60 border border-border" />
          <span className="text-muted-foreground">Economy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-sm bg-muted/20 border border-border/40 opacity-40" />
          <span className="text-muted-foreground">Occupied</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-sm bg-orange-500/20 border border-orange-500/30" />
          <span className="text-muted-foreground">Exit row</span>
        </div>
      </div>

      {/* Column headers */}
      <div className="overflow-auto">
        <div className="min-w-[320px]">
          <div className="grid grid-cols-[2rem_1fr_0.5rem_1fr] gap-1 mb-1 pl-1">
            <div />
            <div className="grid grid-cols-3 gap-1">
              {['A', 'B', 'C'].map((c) => (
                <div key={c} className="text-center text-xs text-muted-foreground font-mono">
                  {c}
                </div>
              ))}
            </div>
            <div />
            <div className="grid grid-cols-3 gap-1">
              {['D', 'E', 'F'].map((c) => (
                <div key={c} className="text-center text-xs text-muted-foreground font-mono">
                  {c}
                </div>
              ))}
            </div>
          </div>

          {/* Seat rows */}
          <div className="space-y-0.5">
            {rows.map((row) => {
              const rowSeats = seats.filter((s) => s.row === row)
              const isExitRow = rowSeats.some((s) => s.exitRow)

              return (
                <div key={row}>
                  {isExitRow && row === 12 && (
                    <div className="flex items-center gap-2 py-1 my-1">
                      <div className="flex-1 border-t border-orange-500/30 border-dashed" />
                      <span className="text-xs text-orange-500 font-mono shrink-0">EXIT</span>
                      <div className="flex-1 border-t border-orange-500/30 border-dashed" />
                    </div>
                  )}
                  <div className="grid grid-cols-[2rem_1fr_0.5rem_1fr] gap-1 items-center">
                    <div className="text-xs text-muted-foreground font-mono text-center">
                      {row}
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {cols.slice(0, 3).map((col) => {
                        const seat = rowSeats.find((s) => s.column === col)
                        if (!seat) return <div key={col} />
                        return (
                          <SeatButton
                            key={seat.id}
                            seat={seat}
                            isSelected={selected === seat.id}
                            onSelect={handleSelect}
                          />
                        )
                      })}
                    </div>
                    <div />
                    <div className="grid grid-cols-3 gap-1">
                      {cols.slice(3).map((col) => {
                        const seat = rowSeats.find((s) => s.column === col)
                        if (!seat) return <div key={col} />
                        return (
                          <SeatButton
                            key={seat.id}
                            seat={seat}
                            isSelected={selected === seat.id}
                            onSelect={handleSelect}
                          />
                        )
                      })}
                    </div>
                  </div>
                  {isExitRow && row === 13 && (
                    <div className="flex items-center gap-2 py-1 my-1">
                      <div className="flex-1 border-t border-orange-500/30 border-dashed" />
                      <span className="text-xs text-orange-500 font-mono shrink-0">EXIT</span>
                      <div className="flex-1 border-t border-orange-500/30 border-dashed" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Selection summary */}
      {selectedSeat && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
              {selectedSeat.id}
            </div>
            <div>
              <p className="text-sm font-medium">
                Seat {selectedSeat.id} · {CLASS_LABELS[selectedSeat.class]}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {selectedSeat.type} seat
                {selectedSeat.exitRow ? ' · Exit row' : ''}
                {selectedSeat.extraLegroom && !selectedSeat.exitRow ? ' · Extra legroom' : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            {selectedSeat.price > 0 ? (
              <Badge variant="secondary" className="text-xs">
                +${selectedSeat.price}
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs text-emerald-600">
                Included
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SeatButton({
  seat,
  isSelected,
  onSelect,
}: {
  seat: Seat
  isSelected: boolean
  onSelect: (seat: Seat) => void
}) {
  const isExitRow = seat.exitRow

  return (
    <button
      onClick={() => onSelect(seat)}
      disabled={!seat.available}
      title={`${seat.id} — ${seat.available ? 'Available' : 'Occupied'}`}
      className={cn(
        'w-full aspect-square rounded-sm border text-xs font-mono transition-colors',
        !seat.available && 'opacity-25 cursor-not-allowed bg-muted/20 border-border/40',
        seat.available && !isSelected && isExitRow && 'bg-orange-500/15 border-orange-500/30 hover:bg-orange-500/25',
        seat.available && !isSelected && !isExitRow && CLASS_COLORS[seat.class],
        isSelected && !isExitRow && CLASS_SELECTED[seat.class],
        isSelected && isExitRow && 'bg-orange-500 border-orange-600 text-white'
      )}
    >
      {isSelected ? seat.id : ''}
    </button>
  )
}
