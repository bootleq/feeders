# Directus Extension - Endpoints for Feeders

Provide custom endpoints.


## TinyMCE interface CSS

To be loaded with default [WYSIWYG][] interface's `content_css` Options Override.

Example `Options Override` for WYSIWYG field interface:

```json
{
  "content_css": "/tinymce/general.css",
  "preview_styles": "color font-size font-family font-weight"
}
```

```json
{
  "content_css": "/tinymce/article.css",
  "preview_styles": "color font-size font-family font-weight"
}
```


## Setup

To update and install:

    npm run build && npm run install



[WYSIWYG]: https://docs.directus.io/app/data-model/fields/text-numbers.html#wysiwyg
