# The validation context

The core structure of the validator is the `context`,
a namespace that aggregates properties of the dataset (the `dataset` variable, above)
and the current file being validated.

Its type can be described as follows:

```typescript
Context: {
  // Dataset properties
  dataset: {
    dataset_description: object
    datatypes: string[]
    modalities: string[]
    // Lists of subjects as discovered in different locations
    subjects: {
        sub_dirs: string[]
        participant_id: string[]
        phenotype: string[]
    }
  }

  // Properties of the current subject
  subject: {
      // Lists of sessions as discovered in different locations
      sessions: {
        ses_dirs: string[]
        session_id: string[]
        phenotype: string[]
      }
  }

  // Path properties
  path: string
  entities: object
  datatype: string
  suffix: string
  extension: string
  // Inferred property
  modality: string

  // Inheritance principle constructions
  sidecar: object
  associations: {
    // Paths and properties of files associated with the current file
    aslcontext: { path: string, n_rows: integer, volume_type: string[] }
    ...
  }

  // Content properties
  size: integer

  // File type-specific content properties
  columns: object
  gzip: object
  json: object
  nifti_header: object
  ome: object
  tiff: object
}
```

To take an example, in a minimal dataset containing only a single subject's T1-weighted image,
the context for that image might be:

```yaml
dataset:
  dataset_description:
    Name: "Example dataset"
    BIDSVersion: "1.10.0"
    DatasetType: "raw"
  datatypes: ["anat"]
  modalities: ["mri"]
  subjects:
    sub_dirs: ["sub-01"]
    participant_id: null
    phenotype: null

subject:
  sessions: { ses_dirs: null, session_id: null, phenotype: null }

path: "/sub-01/anat/sub-01_T1w.nii.gz"
entities:
  subject: "01"
datatype: "anat"
suffix: "T1w"
extension: ".nii.gz"
modality: "mri"

sidecar:
  MagneticFieldStrength: 3
  ...
associations: {}

size: 22017017
nifti_header:
  dim: 3
  voxel_sizes: [1, 1, 1]
  ...
```

Fields from this context can be queried using object dot notation.
For example, `sidecar.MagneticFieldStrengh` has the integer value `3`,
and `entities.subject` has the string value `"01"`.
This permits the use of boolean expressions, such as
`sidecar.RepetitionTime == nifti_header.pixdim[4]`.

As the validator validates each file in turn, it constructs a new context.
The `dataset` property remains constant,
while a new `subject` property is constructed when inspecting a new subject directory,
and the remaining properties are constructed for each file, individually.

## Context definition

The validation context is largely dictated by the [schema],
and the full type generated from the schema definition can be found in
[jsr:@bids/schema/context](https://jsr.io/@bids/schema/doc/context/~/Context).

## Context construction

The construction of a validation context is where BIDS concepts are implemented.
Again, this is easiest to explain with pseudocode:

```python
def buildFileContext(dataset, file):
    context = namespace()
    context.dataset = dataset
    context.path = file.path
    context.size = file.size

    fileParts = parsePath(file.path)
    context.entities = fileParts.entities
    context.datatype = fileParts.datatype
    context.suffix = fileParts.suffix
    context.extension = fileParts.extension

    context.subject = buildSubjectContext(dataset, context.entities.subject)

    context.sidecar = loadSidecar(file)
    context.associations = namespace({
        association: loadAssociation(file, association)
        for association in associationTypes(file)
    })

    if isTSV(file):
        context.columns = loadColumns(file)
    if isNIfTI(file):
        context.nifti_header = loadNiftiHeader(file)
    ...  # And so on

    return context
```

The heavy lifting is done in `parsePath`, `loadSidecar` and `loadAssociation`.
`parsePath` is relatively simple, but `loadSidecar` and `loadAssociation`
implement the BIDS [Inheritance Principle].

[Inheritance Principle]: https://bids-specification.readthedocs.io/en/stable/common-principles.html#the-inheritance-principle
