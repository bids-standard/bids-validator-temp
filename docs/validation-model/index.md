# Validation model

The basic process of the BIDS validator operates according to the following
[Python]-like pseudocode:

```python
def validate(directory):
    fileTree = loadFileTree(directory)
    dataset = buildDatasetContext(fileTree)

    for file in walk(dataset.fileTree):
        context = buildFileContext(dataset, file)
        for check in perFileChecks:
            check(context)

    for check in datasetChecks:
        check(dataset)
```

The following sections will describe the [the validation context](context.md)
and our implementation of [the Inheritance Principle](inheritance-principle.md).

```{toctree}
:maxdepth: 1
:hidden:

context.md
inheritance-principle.md
```

[Python]: https://en.wikipedia.org/wiki/Python_(programming_language)
