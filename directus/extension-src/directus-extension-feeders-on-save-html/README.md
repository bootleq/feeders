# Directus Extension - onSaveHTML Hook for Feeders

Trigger actions when saving fields with default WYSIWYG interface (TinyMCE).


## Sanitize HTML

Do HTML sanitize with [apostrophecms/sanitize-html][].

Target collection / fields by constant `targetFields`.

    const targetFields = {
      facts: ['desc', 'summary', 'origin'],
      insights: ['content'],
      laws: ['summary', 'penalty', 'judgements'],
      blocks: ['content'],
    };

Restrict tags for each collection by `modelTagsMapping`,  
restrict attributes and classes by `allowedAttributes` and `allowedClasses`,  
restrict `<iframe>` host names by `allowedIframeHostnames`.


## File id extraction

Search file ids from input HTML, write to another field to keep record.

Directus currently doesn't have file association for WYSIWYG inserted images.
However our app needs to find the files to know `width` and `height`.

This extension can parse HTML to obtain file ids, and save them to
`cms_file_ids` (name defined by `FILE_ID_FIELD_NAME`) JSON field (user has to
setup this field beforehand).

Use `fileSelectors` to set which collection / what selector to perform the
search, for example:

    const fileSelectors = {
      insights: '.feeders-mce-figure img[src]',
    };

Requires to set `PUBLIC_URL` env variable, because we expect files were
located follow below pattern:

    src="http://localhost:8055/assets/b64f2e08-ff55...-33900ad0d809.png?"
         ^^^^^^^^^^^^^^^^^^^^^        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
              PUBLIC_URL                         file id



[apostrophecms/sanitize-html]: https://github.com/apostrophecms/sanitize-html