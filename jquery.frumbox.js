;(function($) {

	// easings used in animate (to avoid requiring easing.js, new names to avoid name clash)
	jQuery.extend( jQuery.easing, {
		frumboxIn: function (x, t, b, c, d) { // easeInQuad
			return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
		},
		frumboxOut: function (x, t, b, c, d) { // easeOutQuad
			return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
		}
	});

    // ***************************
    // ***** Private Members *****
    var _pluginName = "frumbox",
        _version       = "1.1",
        _W = $(window);
        _D = $(document);

    var _createDOM = function (data) {
        if (data.settings.openInParent) {
        	_D = $(window.parent.document);
        	if ($("link[href$='jquery.frumbox.css']", _D).length==0) {
		    	// need to attach the stylesheet reference to parent page (if not already present); which lives in the same folder as jquery.frumbox.js
		    	var loc = document.location.pathname; // in THIS frame
		    	$("script").each(function(index,el) {
		    		var src = $(el).attr("src");
		    		if (src.indexOf("jquery.frumbox.js")!=-1) {
		    			loc = src.replace("jquery.frumbox.js",""); // remaining url is path we need
		    			return false; // break each
		    		}
		    	});
				var link = $('<link />', {
					href: loc + "jquery.frumbox.css",
					media: 'screen',
					rel: 'stylesheet',
					type: 'text/css',
					'id' : 'frumbox_css'
				}).appendTo($('head', _D));
				if ($.browser.msie) { $('#frumbox_css',_D).clone().appendTo($('head',_D)); } // Some IE's needs to clone in order to apply styles
			}

        	// create a proxy span to animate from
        	// TODO: use window messages to determine source object instead of this hack; see http://stackoverflow.com/a/6051453/1238884
        	var iframeSrc = (data.settings.iframeId==null) ? $("iframe:first", _D) : $(data.settings.iframeId, _D);
        	
	       	data.proxy = $("<span></span>").css({
				position: "fixed",
                top: data.target.offset().top + iframeSrc.offset().top - _W.scrollTop(),
                left: data.target.offset().left + iframeSrc.offset().left - _W.scrollLeft(),
                width: data.target.outerWidth(true),
                height: data.target.outerHeight(false),
                display: "block"
			})
			.appendTo($("body", _D));
			data.target = data.proxy; // data.target is now a dummy element positioned "above" the clicked control, but in the parent frame
			_W = $(parent.window); // shim window so _W is now the parent doc for further calculations
			if (!data.settings.customSize) { // RECALCULATE default size based on new _W
				$.extend(true, data.settings.size,  {
				    top: _W.scrollTop() + (_W.height()/4),
				    left: _W.scrollLeft() + (_W.width()/4),
				    width: _W.width()/2,
				    height: _W.height()/2
				});
			}

		}
        $("body", _D).append(
            data.overlay = $('<div id="frumbox-overlay"></div>'),
            data.wrapper = $('<div id="frumbox-wrapper"></div>')
        );
        data.inner = $('<div id="frumbox-inner"></div>').appendTo(data.wrapper);
        if (navigator.userAgent.match(/iPad/i) != null) data.inner.attr("style", "-webkit-overflow-scrolling:touch;overflow:auto;"); // iframe on iPad needs touch scrolling hack
        if (data.settings.closeButton) {
            data.closer = $('<a id="frumbox-close"></a>').appendTo(data.wrapper);
        };
        
        
    };

    // **************************
    // ***** Public Methods *****
    var methods = {
        init : function(options) {
            //"this" is a jquery object on which this plugin has been invoked.
            return this.each(function(index){
                var $this = $(this);
                var data = $this.data(_pluginName);
                
                if (!data) { // If the plugin hasn't been initialized yet
                    var settings = {
                        href: '',               // the url to display (normally $this.href)
                        size: {                 // the size to open at (calculated before open @ centered 1/4 size of window, no resize support at this time)
                            top: _W.scrollTop() + (_W.height()/4),
                            left: _W.scrollLeft() + (_W.width()/4),
                            width: _W.width()/2,
                            height: _W.height()/2
                        },
                        openInParent: false,    // for use in iframes; open the overlay in the parent frame (assumes permission)
                        iframeId: null,			// id of iframe that contains this caller (if not specified, assumes iframe[0])
                        closeButton: true,      // is there a close button?
                        escapeCloses: true,     // press escape to close?
                        clickCloses: true,      // click overlay to close?
                        overlay : {             // overlay appearance
                            opacity: 0.5,
                            colour: "#ffffff",
                            speed: 250
                        },
                        onAfterClose: $.noop,   // function to run after close is finished
                        onAfterOpen: $.noop     // function to run after it is displayed
                    }
                    if (options) { $.extend(true, settings, options); }

                    $this.data(_pluginName, {
                        target : $this,
                        orig: $this,			// we overwrite target when openInParent:true; need to reset it to $this on close to allow re-opening
                        settings: settings,
                        isOpen: false,
                        iframe: null,
                        esc: null,
                        overlay: null,
                        wrapper: null,
                        inner: null,
                        closer: null,
                        proxy: null,
                        customSize: false
                    });
                }
            });
        },
        open : function() {
            return this.each(function(index){
                var $this = $(this);
                var data = $this.data(_pluginName);
                if(!data.isOpen) {
                    _createDOM(data);

                    // draw the overlay at opacity:0 so that it takes up the whole screen
                    data.overlay.width(0).height(0).css({
                        opacity: 0,
                        'background-color': data.settings.overlay.colour,
                        width: _W.width(),
                        height: _W.height(),
                        top: 0, // _W.scrollTop(),
                        left: 0 // _W.scrollLeft() // now uses position:fixed
                    });

                    // bind clickers and keys
                    if (data.settings.clickCloses) {
                        data.overlay.bind("click", function () {
                            methods.close.call($this);
                        });
                    }
                    if (data.settings.escapeCloses) {
                        data.esc = $(document).keypress(function(event) {
                            if (event.keyCode == 27) {
                                event.preventDefault();
                                methods.close.call($this);
                            }
                        });
                    }
                    if (data.settings.closeButton) data.closer.hide();
    
                    // draw the iframe and set its href, but don't display it yet -animating the size of the iframe with a loading body is a bad idea
                    var href = data.settings.href || data.target.attr('href') || null;
                    if ((/^(?:javascript)/i).test(href) || href == '#') { href = null; }
                    if (href == null) href = "about:blank"; // maybe you want to load something later?
                    data.iframe = $('<iframe src="' + href + '" id="frumbox-iframe" name="frumbox-frame' + new Date().getTime() + '" frameborder="0" hspace="0"' + ($.browser.msie ? ' allowtransparency="true"' : '') + '></iframe>').hide().appendTo(data.inner);

                    // animation of inner starts at size and position (roughly) of object we bound to
                    data.inner.css({
                        opacity: 0.1,
                        top: data.target.offset().top - _W.scrollTop(),
                        left: data.target.offset().left - _W.scrollLeft(),
                        width: data.target.width(),
                        height: data.target.height()
                    });
                    
                    var pad_h = parseInt(data.inner.css("padding-left"),10) + parseInt(data.inner.css("padding-right"),10) + parseInt(data.inner.css("borderLeftWidth"), 10) + parseInt(data.inner.css("borderLeftWidth"), 10),
                        pad_v = parseInt(data.inner.css("padding-top"),10) + parseInt(data.inner.css("borderTopWidth"), 10) + parseInt(data.inner.css("padding-bottom"),10) + parseInt(data.inner.css("borderBottomWidth"), 10);
        
                    // fade in overlay and animate inner at the same time (don't need to dequeue)
                    data.overlay.animate({
                        opacity: data.settings.overlay.opacity
                    }, data.settings.overlay.speed);
                    data.inner.animate({
                        opacity: 1,
                        top: data.settings.size.top - _W.scrollTop(),
                        left: data.settings.size.left - _W.scrollLeft(),
                        width: data.settings.size.width - pad_h,
                        height: data.settings.size.height - pad_v
                    }
                    , data.settings.overlay.speed
                    , 'frumboxIn'
                    , function () {
                        // show the close button, if enabled (image assumed @ 30x30px)
                        if (data.settings.closeButton) {
                            data.closer.css({
                                top: data.inner.offset().top - _W.scrollTop() - 15,
                                left: data.inner.width() + data.inner.offset().left - _W.scrollLeft() + 7.5
                            })
                            .fadeIn(data.settings.overlay.speed)
                            .click(function () {
                                methods.close.call($this);
                            });
                           }
                           
                           // position and show the iframe
                           data.iframe.css({
                            width: data.inner.width(),
                            height: data.inner.height()
                        }).show();

						if (_W.PIE) { // CSS3PIE javascript object might be present
							_W.PIE.attach(_D.getElementById('frumbox-inner'));
					    }

	                    data.isOpen = true;
	                    if (typeof data.settings.onAfterOpen !== 'undefined' && data.settings.onAfterOpen !== $.noop) data.settings.onAfterOpen.call($this, data);

                    });
                }
            });
        },
        // perform the lightbox close
        close : function () {
            return this.each(function(index){
                var $this = $(this);
                var data = $this.data(_pluginName);
                if(data.isOpen) {

                    // unbind what we can
                    if (data.settings.clickCloses) data.overlay.unbind("click");
                    if (data.settings.closeButton) data.closer.unbind("click").remove();
                    if (data.settings.escapeCloses) data.esc.unbind("keypress");
                    data.iframe.remove();
        
                    // fade out background
                    data.overlay.animate({
                        opacity : 0
                    }
                    , data.settings.overlay.speed
                    ,function () {
                        data.overlay.unbind("click").remove();
                    });

                    // animate close of inner div
                    data.inner.animate({
                        opacity: 0.1,
                        top: data.target.offset().top - _W.scrollTop(),
                        left: data.target.offset().left - _W.scrollLeft(),
                        width: data.target.width(),
                        height: data.target.height()
                    }
                    , data.settings.overlay.speed
                    ,'frumboxOut'
                    , function () {
                        data.inner.remove();
                        data.wrapper.remove();
                        data.isOpen = false;
                        
                        if (data.settings.openInParent) {
                        	data.proxy.remove();
                        	_D = $(document);
                        	_W = $(window);
                        	data.target = data.orig;
                        }
                        
                        if (typeof data.settings.onAfterClose !== 'undefined' && data.settings.onAfterClose !== $.noop) data.settings.onAfterClose.call($this, data);
                        
                    });
                }
            });
        },
        // if you want to change the size after initialisation / before open
        setSize : function (options) {
        	return this.each(function (index) {
                var $this = $(this);
                var data = $this.data(_pluginName);
				if (options) { $.extend(true, data.settings.size, options); }
				data.settings.customSize = true;
        	});
        }
    };


    // *****************************
    // ***** Start: Supervisor *****
    $.fn[_pluginName] = function( method ) {
        if ( methods[method] ) {
            return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || !method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' + method + ' does not exist in jQuery.' + _pluginName );
        }
    };
    // ***** Fin: Supervisor *****
    // ***************************
})( jQuery );