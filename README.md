#Frumbox - animated lightbox for IFRAMES

The purpose of this plugin is to to provide an animated opening, easy to use lightbox designed with iframes in mind - both popping up from within an iframe, and to display iframes in the popup.

It does NOT do images, ajax-fed data, slideshows, next/back, title overlays, have bouncy opening effects, or anything like that.

It DOES work with iframes. It opens from within an iframe in the parent (or self), and will display an iframe. It is designed to work on IE7+, Firefox, Chrome/Safari and iOS 5+ (though it might also work on iOS 4).

Documentation:

  https://github.com/frumbert/frumbox/wiki/Frumbox-Options

Features:

  - Will open an iframe based on the href attribute of the opening object
  - Optionally can specify the URI to open if triggering directly (e.g. from button, div, etc)
  - Has onAfterOpen and onAfterClose event hooks so you know when it has been opened or closed
  - Public open, close and setSize methods to control programatically
  - Can specify whether it closes on pressing the Escape key, clicking on the overlay background, or whether the close button is visible
  - Uses a CSS3 based shadow effect, and detects CSS3PIE (window.PIE) javascript is available to call after opening to support box shadows, rounded edges etc in IE6-9
  - Animates from the opening element to the final position (and back again on close; variable speed)
  - Defaults to centered on screen
  - Able to specify the top, left, width and height of the final position (e.g. it doesn't have to be centered)
  - Is able to be triggered in the PARENT frame (e.g. useful from within iframes in the same domain)

Features:

  - Will open an iframe based on the href of the opening object
  - Optionally can specify a href to open if triggering directly
  - Has onAfterOpen and onAfterClose event hooks
  - Can specify whether it closes on pressing the Escape key, clicking on the overlay background, or whether the close button is visible
  - Uses a CSS3 based shadow effect, and detects is CSS3PIE (window.PIE) javascript is available to call after opening to support box shadows, rounded edges etc in IE6-9
  - Animates from the opening element to the final position
  - Defaults to centered on screen
  - Able to specify the top, left, width and height of the final position (e.g. it doesn't have to be centered)

Licence:

The Unlicense (http://unlicense.org)

This is free and unencumbered software released into the public domain.
Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.
