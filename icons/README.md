# Extension Icons

This directory contains the extension icons in various sizes.

## Required Sizes
- icon16.png (16x16) - Toolbar icon
- icon48.png (48x48) - Extension management page
- icon128.png (128x128) - Chrome Web Store

## Creating Icons

You can use the provided SVG file (icon.svg) to generate the required PNG sizes:

### Using ImageMagick:
```bash
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png
```

### Using Inkscape:
```bash
inkscape icon.svg --export-filename=icon16.png --export-width=16 --export-height=16
inkscape icon.svg --export-filename=icon48.png --export-width=48 --export-height=48
inkscape icon.svg --export-filename=icon128.png --export-width=128 --export-height=128
```

### Online Tools:
You can also use online SVG to PNG converters like:
- https://cloudconvert.com/svg-to-png
- https://www.aconvert.com/image/svg-to-png/

## Temporary Placeholders

For development, you can create simple placeholder icons using ImageMagick:

```bash
convert -size 16x16 xc:#667eea icon16.png
convert -size 48x48 xc:#667eea icon48.png
convert -size 128x128 xc:#667eea icon128.png
```
