# jQuery Facebook Albums Plugin

A working example is reported below:

```html
<div id="facebookAlbumList"></div>
```

```javascript
	// populate fields
	(function($) {
		$(document).ready(function() {
		
			$("#facebookAlbumList").facebookAlbumList({
				fb_album_ids: ["194952257226611","515744411814059","524241640964336","542374155817751"],
				imgcontainer_class	: "fb-album-imagecontainer image-panel",
				img_class			: "fb-album-img image-to-resize",
				on_action_end		: function(albums) {				
					$names	= $(".fb-album-name");
					$li		= $(".fb-album-element");
					// attaching dotdotdot to names and to window resize event
					$(window).on('resize', function() {
						$names.dotdotdot();
					});
					// trigger window resize event so that scrolling and image resizing is performed
					$(window).trigger('resize');
					// now attach anchors
					$li
  					.filter("[data-fbid=\"194952257226611\"]")
  					.find("a.fb-album-anchor").each(function(){ 
  						$(this).attr("href", "/albums/194952257226611");
  					});
					$li
						.filter("[data-fbid=\"515744411814059\"]")
						.find("a.fb-album-anchor").each(function(){ 
							$(this).attr("href", "/albums/515744411814059");
						});
					$li
						.filter("[data-fbid=\"524241640964336\"]")
						.find("a.fb-album-anchor").each(function(){ 
							$(this).attr("href", "/albums/524241640964336");
						});
					$li
						.filter("[data-fbid=\"542374155817751\"]")
						.find("a.fb-album-anchor").each(function(){ 
							$(this).attr("href", "/albums/542374155817751");
						});
				}
			});
		});
	}(jQuery));
```
