import { 
    split,
    last
} from "lodash/fp";
import {writable} from "svelte/store";
import { $ } from "./core/common";
import { setupBinding } from "./state/stateBinding";

export const createApp = componentLibraries => {

    const initialiseComponent = (props, htmlElement) => {

        const {componentName, libName} = splitName(props._component);

        if(!componentName || !libName) return;

        const {initialProps, bind} = setupBinding(store, props);

        const component = new (componentLibraries[libName][componentName])({
            target: htmlElement,
            props: {...initialProps, _app}
        });

        bind(component);

    }

    const store = writable({});

    const _app = {
        initialiseComponent, 
        store
    };

    return _app;

}


const splitName = fullname => {
    const componentName = $(fullname, [
        split("/"),
        last
    ]);

    const libName =fullname.substring(
        0, fullname.length - componentName.length - 1);

    return {libName, componentName}; 
}