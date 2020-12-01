const PageTypes = {
  MAIN: "main",
  UNAUTHENTICATED: "unauthenticated",
}

const MAIN = {
  componentLibraries: ["@budibase/standard-components"],
  title: "{{ name }}",
  favicon: "./_shared/favicon.png",
  stylesheets: [],
  name: PageTypes.MAIN,
  props: {
    _id: "private-master-root",
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
        _code: "",
        type: "div",
        _appId: "inst_app_80b_f158d4057d2c4bedb0042d42fda8abaf",
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
            _code: "",
            logoUrl:
              "https://d33wubrfki0l68.cloudfront.net/aac32159d7207b5085e74a7ef67afbb7027786c5/2b1fd/img/logo/bb-emblem.svg",
            _appId: "inst_cf8ace4_69efc0d72e6f443db2d4c902c14d9394",
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
                _code: "",
                url: "/",
                openInNewTab: false,
                text: "Home",
                _appId: "inst_cf8ace4_69efc0d72e6f443db2d4c902c14d9394",
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
        _code: "",
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
    _code: "",
  },
}

const UNAUTHENTICATED = {
  componentLibraries: ["@budibase/standard-components"],
  title: "{{ name }}",
  favicon: "./_shared/favicon.png",
  stylesheets: [],
  name: PageTypes.UNAUTHENTICATED,
  props: {
    _id: "public-master-root",
    _component: "@budibase/standard-components/container",
    _children: [
      {
        _id: "686c252d-dbf2-4e28-9078-414ba4719759",
        _component: "@budibase/standard-components/login",
        _styles: {
          normal: {
            padding: "64px",
            background: "rgba(255, 255, 255, 0.4)",
            "border-radius": "0.5rem",
            "margin-top": "0px",
            margin: "0px",
            "line-height": "1",
            "box-shadow":
              "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            "font-size": "16px",
            "font-family": "Inter",
            flex: "0 1 auto",
            transform: "0",
          },
          hover: {},
          active: {},
          selected: {},
        },
        _code: "",
        _instanceName: "Login",
        _children: [],
        title: "Log in to {{ name }}",
        buttonText: "Log In",
        logo:
          "https://d33wubrfki0l68.cloudfront.net/aac32159d7207b5085e74a7ef67afbb7027786c5/2b1fd/img/logo/bb-emblem.svg",
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
    _code: "",
  },
}

module.exports = { MAIN, UNAUTHENTICATED, PageTypes }
