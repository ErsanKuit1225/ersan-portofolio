import { get, writable } from "svelte/store"

export const createReorderingStores = context => {
  const { columns, rand, rows } = context
  const reorderingInitialState = {
    columnIdx: null,
    swapColumnIdx: null,
    breakpoints: [],
    initialMouseX: null,
  }
  const reordering = writable(reorderingInitialState)

  // This is broken into its own store as it is rapidly updated, and we want to
  // ensure good performance by avoiding updating other components which depend
  // on other reordering state
  const placeholderInitialState = {
    x: null,
    initialX: null,
    width: null,
    height: null,
  }
  const placeholder = writable(placeholderInitialState)

  // Callback when dragging on a colum header and starting reordering
  const startReordering = (columnIdx, e) => {
    // Generate new breakpoints for the current columns
    let breakpoints = []
    const cols = get(columns)
    console.log(cols)
    cols.forEach((col, idx) => {
      const header = document.getElementById(`sheet-${rand}-header-${idx}`)
      const bounds = header.getBoundingClientRect()
      breakpoints.push(bounds.x)
      if (idx === cols.length - 1) {
        breakpoints.push(bounds.x + bounds.width)
      }
    })

    // Get bounds of the selected header and sheet body
    const self = document.getElementById(`sheet-${rand}-header-${columnIdx}`)
    const selfBounds = self.getBoundingClientRect()
    const body = document.getElementById(`sheet-${rand}-body`)
    const bodyBounds = body.getBoundingClientRect()

    // Update state
    reordering.set({
      columnIdx,
      breakpoints,
      swapColumnIdx: null,
      initialMouseX: e.clientX,
    })
    placeholder.set({
      initialX: selfBounds.x - bodyBounds.x,
      x: selfBounds.x - bodyBounds.x,
      width: selfBounds.width,
      height: (get(rows).length + 2) * 32,
    })

    // Add listeners to handle mouse movement
    document.addEventListener("mousemove", onReorderMouseMove)
    document.addEventListener("mouseup", stopReordering)

    // Trigger a move event immediately so ensure a candidate column is chosen
    onReorderMouseMove(e)
  }

  // Callback when moving the mouse when reordering columns
  const onReorderMouseMove = e => {
    const $reordering = get(reordering)
    if ($reordering.columnIdx == null) {
      return
    }

    // Compute new placeholder position
    const $placeholder = get(placeholder)
    let newX = e.clientX - $reordering.initialMouseX + $placeholder.initialX
    newX = Math.max(0, newX)

    // Compute the closest breakpoint to the current position
    let swapColumnIdx
    let minDistance = Number.MAX_SAFE_INTEGER
    $reordering.breakpoints.forEach((point, idx) => {
      const distance = Math.abs(point - e.clientX)
      if (distance < minDistance) {
        minDistance = distance
        swapColumnIdx = idx
      }
    })

    // Update state
    placeholder.update(state => {
      state.x = newX
      return state
    })
    if (swapColumnIdx !== $reordering.swapColumnIdx) {
      reordering.update(state => {
        state.swapColumnIdx = swapColumnIdx
        return state
      })
    }
  }

  // Callback when stopping reordering columns
  const stopReordering = () => {
    // Swap position of columns
    let { columnIdx, swapColumnIdx } = get(reordering)
    const newColumns = get(columns).slice()
    const removed = newColumns.splice(columnIdx, 1)
    if (--swapColumnIdx < columnIdx) {
      swapColumnIdx++
    }
    newColumns.splice(swapColumnIdx, 0, removed[0])
    columns.set(newColumns)

    // Reset state
    reordering.set(reorderingInitialState)
    placeholder.set(placeholderInitialState)

    // Remove event handlers
    document.removeEventListener("mousemove", onReorderMouseMove)
    document.removeEventListener("mouseup", stopReordering)
  }

  return {
    reordering: {
      ...reordering,
      actions: {
        startReordering,
        stopReordering,
      },
    },
    reorderingPlaceholder: placeholder,
  }
}
