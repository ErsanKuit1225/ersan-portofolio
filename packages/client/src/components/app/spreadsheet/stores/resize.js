import { writable, get } from "svelte/store"
import { domDebounce } from "../../../../utils/domDebounce.js"

const MinColumnWidth = 100

export const createResizeStore = context => {
  const { columns, rand } = context
  const initialState = {
    initialMouseX: null,
    initialWidth: null,
    columnIdx: null,
  }

  let initialWidth = 0
  let width = 0
  let left = 0
  let initialMouseX = null
  let sheet
  let columnIdx = 0
  let columnCount = 0
  let styles

  const resize = writable(initialState)

  const startResizing = (idx, e) => {
    // Prevent propagation to stop reordering triggering
    e.stopPropagation()

    sheet = document.getElementById(`sheet-${rand}`)
    styles = getComputedStyle(sheet)
    width = parseInt(styles.getPropertyValue(`--col-${idx}-width`))
    left = parseInt(styles.getPropertyValue(`--col-${idx}-left`))
    initialWidth = width
    initialMouseX = e.clientX
    columnIdx = idx
    columnCount = get(columns).length

    // Add mouse event listeners to handle resizing
    document.addEventListener("mousemove", onResizeMouseMove)
    document.addEventListener("mouseup", stopResizing)
  }

  const onResizeMouseMove = e => {
    const dx = e.clientX - initialMouseX
    const newWidth = Math.round(Math.max(MinColumnWidth, initialWidth + dx))

    if (Math.abs(width - newWidth) < 10) {
      return
    }


    let newStyle = `--col-${columnIdx}-width:${newWidth}px;`

    let offset = left + newWidth
    for (let i = columnIdx + 1; i < columnCount; i++) {
      const colWidth = 160//parseInt(styles.getPropertyValue(`--col-${i}-width`))
      newStyle += `--col-${i}-left:${offset}px;`
      offset += colWidth
    }

    sheet.style.cssText += newStyle
    width = newWidth

    // Update width of column
    // columns.update(state => {
    //   state[$resize.columnIdx].width = Math.round(newWidth)
    //
    //   // Update left offset of other columns
    //   let offset = 40
    //   state.forEach(col => {
    //     col.left = offset
    //     offset += col.width
    //   })
    //
    //   return state
    // })
  }

  const stopResizing = () => {
    resize.set(initialState)
    document.removeEventListener("mousemove", onResizeMouseMove)
    document.removeEventListener("mouseup", stopResizing)
  }

  return {
    ...resize,
    actions: {
      startResizing,
    },
  }
}
