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
        _version       = "1.2",
		_W = $(window),
		_touch = (navigator.userAgent.match(/iPhone|iPad|iPod|Android/i) != null);

    var _createDOM = function (data) {
        var body = (data.settings.openInParent) ? $("body",parent.document) : $("body");
        $(body).append(
            data.overlay = $('<div id="frumbox-overlay"></div>'),
            data.wrapper = $('<div id="frumbox-wrapper"></div>')
        );
        data.inner = $('<div id="frumbox-inner"></div>').appendTo(data.wrapper);
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
                        href: null,                // the url to display (normally $this.href),
                        content: null,					// if href is null, you can specify html to display instead
                        size: {                    // the size to open at (calculated before open @ centered 2/3 size of window, no resize support at this time)
                            top: _W.scrollTop() + (_W.height()/6), 
                            left: _W.scrollLeft() + (_W.width()/6), // 1/6th of the width; 
                            width: (_W.width()/3) * 2 + 10,	// 2/3 width + ~ half width of scrollbar area
                            height: (_W.height()/3) * 2
                        },
                        openInParent: false,    // for use in iframes; open the overlay in the parent frame (assumes permission)
                        closeButton: true,        // is there a close button?
                        escapeCloses: true,        // press escape to close?
                        clickCloses: true,        // click overlay to close?
                        overlay : {                // overlay appearance
                            opacity: 0.8,
                            colour: "#ffffff",
                            speed: 250
                        },
                        onAfterClose: $.noop,    // function to run after close is finished
                        onAfterOpen: $.noop        // function to run after it is displayed
                    }
                    if (options) { $.extend(true, settings, options); }

                    $this.data(_pluginName, {
                        target : $this,
                        settings: settings,
                        isOpen: false,
                        iframe: null,
                        esc: null,
                        overlay: null,
                        wrapper: null,
                        inner: null,
                        closer: null
                    });
                    
                }
            });
        },
        open : function() {
            return this.each(function(index){
                var $this = $(this);
                var data = $this.data(_pluginName);
                if (!data.isOpen) {
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
                    if (href == null || data.settings.html != null) {
                    	data.iframe = $("<div></div>").attr({"id":"frumbox-iframe"}).hide().appendTo(data.inner);
                   		data.iframe.css({
                   			"overflow": "hidden",
                   			"overflow-y": "auto"
                   		});
                    	if (data.settings.content != null) data.iframe.append(data.settings.content);
                    } else {
	                    data.iframe = $('<iframe src="' + href + '" id="frumbox-iframe" name="frumbox-frame' + new Date().getTime() + '" frameborder="0" hspace="0"' + ($.browser.msie ? ' allowtransparency="true"' : '') + '></iframe>').hide().appendTo(data.inner);
	                    if (_touch) data.iframe.css("-webkit-transform","translate3d(0,0,0)"); // force hardware accelleration
	                }

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

						// seems like you have to add this event after the iframe pane is made visible, and has its height/width set to their final values
				        if (_touch) data.inner.css({
				        	"-webkit-overflow-scrolling":"touch",
				        	"overflow":"scroll"
				        });

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
                	// removing an iframe appears to take time in the DOM, so do it first
                	data.iframe.remove();

                    // unbind what we can
                    if (data.settings.clickCloses) data.overlay.unbind("click");
                    if (data.settings.closeButton) data.closer.unbind("click").remove();
                    if (data.settings.escapeCloses) data.esc.unbind("keypress");
        
                    // fade out background
                    data.overlay.animate({
                        opacity : 0
                    }
                    , 100
                    ,function () {
                        data.overlay.unbind("click").empty().remove();

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
	                        data.inner.empty().remove();
	                        data.wrapper.empty().remove();
	                        data.isOpen = false;
	                        
	                        if (typeof data.settings.onAfterClose !== 'undefined' && data.settings.onAfterClose !== $.noop) data.settings.onAfterClose.call($this, data);
	                        
	                    });

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