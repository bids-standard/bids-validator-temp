# The BIDS Validator

The BIDS Validator is a web application, command-line utility,
and Javascript/Typescript library for assessing compliance with the
[Brain Imaging Data Structure][BIDS] standard.

## Getting Started

In most cases,
the simplest way to use the validator is to browse to the [BIDS Validator][] web page:

![The web interface to the BIDS Validator with the "Select Dataset Files" button highlighted.
(Dark theme)](_static/web_entrypoint_dark.png){.only-dark width="50%" align=center}
![The web interface to the BIDS Validator with the "Select Dataset Files" button highlighted.
(Light theme)](_static/web_entrypoint_light.png){.only-light width="50%" align=center}

The web validator runs in-browser, and does not transfer data to any remote server.

In some contexts, such as when working on a remote server,
it may be easier to use the command-line.
The BIDS Validator can be run with the [Deno] runtime
(see [Deno - Installation][] for detailed installation instructions):

```shell
deno run -A jsr:@bids/validator
```

```{toctree}
:maxdepth: 2
:hidden:
:caption: User guide

user_guide/web.md
user_guide/command-line.md
user_guide/issues.md
```

```{toctree}
:maxdepth: 2
:hidden:
:caption: Developer guide

dev/using-the-api.md
dev/contributing.md
dev/environment.md
```

```{toctree}
:maxdepth: 2
:hidden:
:caption: Concepts

validation-model/index.md
```

```{toctree}
:hidden:
:caption: Reference

API Reference <https://jsr.io/@bids/validator/doc>
```

[BIDS]: https://bids.neuroimaging.io
[BIDS Validator]: https://bids-standard.github.io/bids-validator/
[Deno]: https://deno.com/
[Deno - Installation]: https://docs.deno.com/runtime/getting_started/installation/
