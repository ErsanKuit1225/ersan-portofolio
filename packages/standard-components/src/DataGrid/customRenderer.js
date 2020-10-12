// Custom renderers to handle special types
// https://www.ag-grid.com/javascript-grid-cell-rendering-components/

import AttachmentCell from './AttachmentCell/Button.svelte'
import Select from './Select/Wrapper.svelte'
import DatePicker from "./DateTime/Wrapper.svelte"

const renderers = new Map([
    ["boolean", booleanRenderer],
    ["attachment", attachmentRenderer],
    ["options", optionsRenderer],
    ["link", linkedRecordRenderer],
])


export function getRenderer({ type, constraints }, editable) {
    if (renderers.get(type)) {
        return renderers.get(type)(constraints, editable)
    } else {
        return false
    }
}

function booleanRenderer(constraints, editable) {
    return params => {
        const toggle = (e) => {
            params.value = !params.value
            params.setValue(e.currentTarget.checked)
        }
        let input = document.createElement("input")
        input.style.display = "grid";
        input.style.placeItems = "center";
        input.style.height = "100%";
        input.type = "checkbox"
        input.checked = params.value
        if (editable) {
            input.addEventListener("click", toggle)
        } else {
            input.disabled = true
        }

        return input
    }
}
function attachmentRenderer(constraints, editable ) {
    return params => {
        const container = document.createElement("div")

        const attachmentInstance = new AttachmentCell({
            target: container,
            props: {
                files: params.value || [],
            }
        });

        return container
    }
}
function dateRenderer(constraints, editable) {
    return function (params) {
        const container = document.createElement("div")
        const toggle = (e) => {
            params.setValue(e.detail[0][0])
        }

        // Options need to be passed in with minTime and maxTime! Needs bbui update.

        const datePickerInstance = new DatePicker({
            target: container,
            props: {
                value: params.value,
            }
        });

        return container
    }
}


function optionsRenderer({ inclusion }, editable) {
    return params => {
        if (!editable) return params.value
        const container = document.createElement("div")
        container.style.display = "grid";
        container.style.placeItems = "center";
        container.style.height = "100%";
        const change = (e) => {
            params.setValue(e.detail)
        }

        const selectInstance = new Select({
            target: container,
            props: {
                value: params.value,
                options: inclusion
            }
        });

        selectInstance.$on('change', change)

        return container
    }
}
function linkedRecordRenderer(constraints, editable) {
    return params => {
        console.log(params.value)
        let container = document.createElement("div")
        container.style.display = "grid";
        container.style.placeItems = "center";
        container.style.height = "100%";

        container.innerText = params.value.length || 0

        return container
    }
}