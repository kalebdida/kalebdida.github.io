# PDF fonts

These static Geist fonts are used only by the build to embed portable fonts in
the resume PDF. They were generated from the site's existing
`public/fonts/geist-latin-wght-normal.woff2` at weights 400 and 700 using FontTools.
They use the SIL Open Font License included in `OFL.txt`.

To regenerate with FontTools and Brotli installed:

```sh
fonttools ttLib.woff2 decompress public/fonts/geist-latin-wght-normal.woff2 -o /tmp/kal-geist-variable.ttf
fonttools varLib.instancer /tmp/kal-geist-variable.ttf wght=400 -o scripts/fonts/geist-regular.ttf
fonttools varLib.instancer /tmp/kal-geist-variable.ttf wght=700 -o scripts/fonts/geist-bold.ttf
```

The committed static fonts keep Python and FontTools out of the site build.
