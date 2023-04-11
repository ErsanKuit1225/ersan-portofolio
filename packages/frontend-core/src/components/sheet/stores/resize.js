import { writable, get, derived } from "svelte/store"
import { DefaultColumnWidth } from "./columns"

export const MinColumnWidth = 100

const initialState = {
  initialMouseX: null,
  initialWidth: null,
  column: null,
  columnIdx: null,
  width: 0,
  left: 0,
}

export const createStores = () => {
  const resize = writable(initialState)
  const isResizing = derived(resize, $resize => $resize.column != null, false)
  return {
    resize,
    isResizing,
  }
}

export const deriveStores = context => {
  const { resize, columns, stickyColumn, ui } = context

  // Starts resizing a certain column
  const startResizing = (column, e) => {
    // Prevent propagation to stop reordering triggering
    e.stopPropagation()
    ui.actions.blur()

    // Find and cache index
    let columnIdx = get(columns).findIndex(col => col.name === column.name)
    if (columnIdx === -1) {
      columnIdx = "sticky"
    }

    // Set initial store state
    resize.set({
      width: column.width,
      left: column.left,
      initialWidth: column.width,
      initialMouseX: e.clientX,
      column: column.name,
      columnIdx,
    })

    // Add mouse event listeners to handle resizing
    document.addEventListener("mousemove", onResizeMouseMove)
    document.addEventListener("mouseup", stopResizing)
  }

  // Handler for moving the mouse to resize columns
  const onResizeMouseMove = e => {
    const { initialMouseX, initialWidth, width, columnIdx } = get(resize)
    const dx = e.clientX - initialMouseX
    const newWidth = Math.round(Math.max(MinColumnWidth, initialWidth + dx))

    // Ignore small changes
    if (Math.abs(width - newWidth) < 5) {
      return
    }

    // Update column state
    if (columnIdx === "sticky") {
      stickyColumn.update(state => ({
        ...state,
        width: newWidth,
      }))
    } else {
      columns.update(state => {
        state[columnIdx].width = newWidth
        return [...state]
      })
    }

    // Update state
    resize.update(state => ({
      ...state,
      width: newWidth,
    }))
  }

  // Stop resizing any columns
  const stopResizing = () => {
    resize.set(initialState)
    document.removeEventListener("mousemove", onResizeMouseMove)
    document.removeEventListener("mouseup", stopResizing)
  }

  // Resets a column size back to default
  const resetSize = column => {
    let columnIdx = get(columns).findIndex(col => col.name === column.name)
    if (columnIdx === -1) {
      stickyColumn.update(state => ({
        ...state,
        width: DefaultColumnWidth,
      }))
    } else {
      columns.update(state => {
        state[columnIdx].width = DefaultColumnWidth
        return [...state]
      })
    }
  }

  return {
    resize: {
      ...resize,
      actions: {
        startResizing,
        resetSize,
      },
    },
  }
}
