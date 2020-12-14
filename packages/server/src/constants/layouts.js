const { getLogoUrl } = require("../utilities")

const BASE_LAYOUT_PROP_IDS = {
  PRIVATE: "layout_private_master",
  PUBLIC: "layout_public_master",
}

const EMPTY_LAYOUT = {
  componentLibraries: ["@budibase/standard-components"],
  title: "{{ name }}",
  favicon: "./_shared/favicon.png",
  stylesheets: [],
  props: {
    _id: "30b8822a-d07b-49f4-9531-551e37c6899b",
    _component: "@budibase/standard-components/container",
    _children: [
      {
        _id: "7fcf11e4-6f5b-4085-8e0d-9f3d44c98967",
        _component: "##builtin/screenslot",
        _styles: {
          normal: {},
          hover: {},
          active: {},
          selected: {},
        },
        _children: [],
      },
    ],
    type: "div",
    _styles: {
      active: {},
      hover: {},
      normal: {},
      selected: {},
    },
    className: "",
    onLoad: [],
  },
}

const BASE_LAYOUTS = [
  {
    _id: BASE_LAYOUT_PROP_IDS.PRIVATE,
    componentLibraries: ["@budibase/standard-components"],
    title: "{{ name }}",
    favicon: "./_shared/favicon.png",
    stylesheets: [],
    name: "Top Navigation Layout",
    props: {
      _id: "4f569166-a4f3-47ea-a09e-6d218c75586f",
      _component: "@budibase/standard-components/container",
      _children: [
        {
          _id: "c74f07266980c4b6eafc33e2a6caa783d",
          _component: "@budibase/standard-components/container",
          _styles: {
            normal: {
              display: "flex",
              "flex-direction": "row",
              "justify-content": "flex-start",
              "align-items": "flex-start",
              background: "#fff",
              width: "100%",
              "box-shadow": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            },
            hover: {},
            active: {},
            selected: {},
          },
          className: "",
          onLoad: [],
          type: "div",
          _instanceName: "Header",
          _children: [
            {
              _id: "49e0e519-9e5e-4127-885a-ee6a0a49e2c1",
              _component: "@budibase/standard-components/navigation",
              _styles: {
                normal: {
                  "max-width": "1400px",
                  "margin-left": "auto",
                  "margin-right": "auto",
                  padding: "20px",
                  color: "#757575",
                  "font-weight": "400",
                  "font-size": "16px",
                  flex: "1 1 auto",
                },
                hover: {},
                active: {},
                selected: {},
              },
              logoUrl: getLogoUrl(),
              title: "",
              backgroundColor: "",
              color: "",
              borderWidth: "",
              borderColor: "",
              borderStyle: "",
              _instanceName: "Navigation",
              _children: [
                {
                  _id: "48b35328-4c91-4343-a6a3-1a1fd77b3386",
                  _component: "@budibase/standard-components/link",
                  _styles: {
                    normal: {
                      "font-family": "Inter",
                      "font-weight": "500",
                      color: "#000000",
                      "text-decoration-line": "none",
                      "font-size": "16px",
                    },
                    hover: {
                      color: "#4285f4",
                    },
                    active: {},
                    selected: {},
                  },
                  url: "/",
                  openInNewTab: false,
                  text: "Home",
                  color: "",
                  hoverColor: "",
                  underline: false,
                  fontSize: "",
                  fontFamily: "initial",
                  _instanceName: "Home Link",
                  _children: [],
                },
              ],
            },
          ],
        },
        {
          _id: "7fcf11e4-6f5b-4085-8e0d-9f3d44c98967",
          _component: "##builtin/screenslot",
          _styles: {
            normal: {
              flex: "1 1 auto",
              display: "flex",
              "flex-direction": "column",
              "justify-content": "flex-start",
              "align-items": "stretch",
              "max-width": "100%",
              "margin-left": "20px",
              "margin-right": "20px",
              width: "1400px",
              padding: "20px",
            },
            hover: {},
            active: {},
            selected: {},
          },
          _children: [],
        },
      ],
      type: "div",
      _styles: {
        active: {},
        hover: {},
        normal: {
          display: "flex",
          "flex-direction": "column",
          "align-items": "center",
          "justify-content": "flex-start",
          "margin-right": "auto",
          "margin-left": "auto",
          "min-height": "100%",
          "background-image":
            "linear-gradient(135deg, rgba(252,215,212,1) 20%, rgba(207,218,255,1) 100%);",
        },
        selected: {},
      },
      className: "",
      onLoad: [],
    },
  },
  {
    _id: BASE_LAYOUT_PROP_IDS.PUBLIC,
    componentLibraries: ["@budibase/standard-components"],
    title: "{{ name }}",
    favicon: "./_shared/favicon.png",
    stylesheets: [],
    name: "Empty Layout",
    props: {
      _id: "3723ffa1-f9e0-4c05-8013-98195c788ed6",
      _component: "@budibase/standard-components/container",
      _children: [
        {
          _id: "7fcf11e4-6f5b-4085-8e0d-9f3d44c98967",
          _component: "##builtin/screenslot",
          _styles: {
            normal: {
              flex: "1 1 auto",
              display: "flex",
              "flex-direction": "column",
              "justify-content": "flex-start",
              "align-items": "stretch",
              "max-width": "100%",
              "margin-left": "20px",
              "margin-right": "20px",
              width: "1400px",
              padding: "20px",
            },
            hover: {},
            active: {},
            selected: {},
          },
          _children: [],
        },
      ],
      type: "div",
      _styles: {
        active: {},
        hover: {},
        normal: {
          display: "flex",
          "flex-direction": "column",
          "align-items": "center",
          "justify-content": "center",
          "margin-right": "auto",
          "margin-left": "auto",
          "min-height": "100%",
          "background-image":
            "linear-gradient(135deg, rgba(252,215,212,1) 20%, rgba(207,218,255,1) 100%);",
        },
        selected: {},
      },
      className: "",
      onLoad: [],
    },
  },
]

module.exports = {
  BASE_LAYOUTS,
  BASE_LAYOUT_PROP_IDS,
  EMPTY_LAYOUT,
}
