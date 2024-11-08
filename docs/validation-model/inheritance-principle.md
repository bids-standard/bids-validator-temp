# The Inheritance Principle

The [Inheritance Principle] is a core concept in BIDS.
Its original definition (edited for brevity) was:

> Any metadata file (`.json`, `.bvec`, `.tsv`, etc.) may be defined at any directory level,
> but no more than one applicable file may be defined at a given level.
> The values from the top level are inherited by all lower levels
> unless they are overridden by a file at the lower level. [...]
> There is no notion of "unsetting" a key/value pair.

Here, "top level" means dataset root, and "lower level" means closer to the data file
the metadata applies to.
More recent versions of the specification have made the language more precise at the cost
of verbosity.
The core concept remains the same.

The validator uses a "walk back" algorithm to find inherited files:

```python
def walkBack(file, extension):
    fileParts = parsePath(file.path)
    
    fileTree = file.parent
    while fileTree:
        for child in fileTree.children:
            parts = parsePath(child.path)
            if (
                parts.extension == extension
                and parts.suffix = fileParts.suffix
                and isSubset(parts.entities, fileParts.entities)
            ):
                yield child

        fileTree = fileTree.parent
```

Using this basis, `loadSidecar` is simply:

```python
def loadSidecar(file):
    sidecar = {}
    for json in walkBack(file, '.json'):
        # Order matters. `|` overrides the left side with the right.
        # Any collisions resolve in favor of closer to the data file.
        sidecar = loadJson(json) | sidecar
    return sidecar
```

For `loadAssociation`, only the first match is used, if found:

```python
def loadAssociation(file, association):
    for associated_file in walkBack(file, getExtension(association)):
        return getLoader(association)(associated_file)
```

Each association contains different metadata to extract.
Note that some associations have a different suffix from the files they associate to.
The actual implementation of `walkBack` allows overriding suffixes as well as extensions,
but it would not be instructive to show here.

[Inheritance Principle]: https://bids-specification.readthedocs.io/en/stable/common-principles.html#the-inheritance-principle
