/*
*
* - Facebook album reader
*
* - Filename: jquery.fbalbumreader-0.1.js
* - Creation date: 11/02/14
* - Site name: ammot.it
* - Author: Giovanni Di Fiore
* - Email: giovadf@gmail.com
*
*/

(function($) {	
	
	// init settings with high visibility into the plugin
	var settings;
	
	$.fn.facebookAlbumGallery = function( options )
	{
		var __fb_graph_url = "https://graph.facebook.com";
		
		// extends options with default settings		
		if (typeof options == "string")
		{
			settings.action = options;
		}
		else if (typeof options == "object")
		{
			settings = $.extend({	
				action				: "init",
				fb_album_id			: null,
				limit				: 25,				
				ul_class			: "fb-album",
				li_class			: "fb-album-photo-element",
				anchor_class		: "fb-album-photo-anchor",
				imgcontainer_class	: "fb-album-photo-imagecontainer",
				img_class			: "fb-album-photo-img",
				likecount_class		: "fb-album-photo-like",
				commentscount_class	: "fb-album-photo-comments",
				connections_class	: "fb-album-photo-connections",
				on_action_end		: function() {return;}
			}, options);
		}
		
		// manage chaining
		return this.each(function()
		{	
			// select current object					
			$obj = $(this);
			
			switch (settings.action) 
			{
				case "init":
				
					$obj.data(__ns("state"), "idle");
					
					// check preconditions
					if (settings.fb_album_id==null)
					{
						__debug("fb_album_id not provided");
						break;
					}
					
					// store data into object
					$obj.data(__ns("fb_album_id"), settings.fb_album_id);
					$obj.data(__ns("limit"), settings.limit);
					
					// create the list of photos as ul
					$ul = $("<ul class=\""+settings.ul_class+"\"></ul>");
					$obj.append($ul);
					
					// prepare parameters for opengraph call
					var og_url 	= __fb_graph_url+"/"+$obj.data(__ns("fb_album_id"))+"/photos",
						og_data	= 	{
										limit: $obj.data(__ns("limit"))
									};
									
					// do opengraph call
					__opengraph_get(og_url, og_data, function(response) {
						if (response && !response.error)
						{	
							__append_photo_data_to_obj($ul, response.data);
							
							// set state to initialized
							$obj.data(__ns("state"), "initialized");
							
							// update paging next
							if (typeof response.paging.next != null)
								$obj.data(__ns("paging_next"), response.paging.next);						
							
							// do action end, if needed
							__on_action_end(response.data);
							
							return true;
						}
						return false;
						__debug( "FB Open Graph response is not valid" );
					});
															
				break;
				
				case "load_next" :
					
					// check precoditions
					if ($obj.data(__ns("state"))!="initialized")
					{
						__debug( "plugin not initialized" );
						return false;
					}
					
					// if don't have a paging_next...
					if (typeof $obj.data(__ns("paging_next"))=="undefined")
					{
						__debug( "no more pages to load" );
						return false;
					}
					
					// get the ul list
					$ul = $obj.children("ul");
					
					// prepare parameters for opengraph call
					var og_url 	= $obj.data(__ns("paging_next"));
									
					// we reached the end
					if (og_url == "undefined")
					{
						__on_action_end(null);
						return true;
					}
					
					// do opengraph call
					__opengraph_get(og_url, null, function(response) {
						if (response && !response.error)
						{
							__append_photo_data_to_obj($ul, response.data);
							// update paging next
							if (typeof response.paging.next != "undefined")
								$obj.data(__ns("paging_next"), response.paging.next);
							else $obj.data(__ns("paging_next"), "undefined");
							
							// do action end, if needed
							__on_action_end(response.data);
							
							return true;
						}
						return false;
						__debug( "FB Open Graph response is not valid" );
					});
					
				break;				
			}			
		});
	}
	
	$.fn.facebookAlbumList = function ( options )
	{
		var __fb_graph_url = "https://graph.facebook.com";
		
		// extends options with default settings		
		settings = $.extend({
			fb_album_ids		: null,	
			ul_class			: "fb-album-list",
			li_class			: "fb-album-element",
			anchor_class		: "fb-album-anchor",
			imgcontainer_class	: "fb-album-imagecontainer",
			img_class			: "fb-album-img",
			albumname_class 	: "fb-album-name",
			photocount_class	: "fb-album-count",
			likecount_class		: "fb-album-like",
			commentscount_class	: "fb-album-comments",
			connections_class	: "fb-album-connections",
			on_action_end		: function() {return;}
		}, options);
		
		$obj = $(this);
		// create the list of photos as ul
		$ul = $("<ul class=\""+settings.ul_class+"\"></ul>");
		$obj.append($ul);
		
		if (settings.fb_album_ids==null || typeof settings.fb_album_ids != "object") {
			__debug( "fb_album_ids array not valid" );
			return false;
		}
		
		// build the batch array
		var albums 		= [],
			j			= 0,
			length 		= (typeof settings.fb_album_ids.length != "undefined") ? settings.fb_album_ids.length : 1,
			batch_mode	= $obj.length==0 ? true : false;
		
		$.each(settings.fb_album_ids, function(k, v){
						
			var og_url	= __fb_graph_url+"/"+v+"/";
			
			__opengraph_get(og_url, null, function(response) {
				if (response && !response.error)
				{	
					// do another opengraph_get in order to get the album cover photo					
					og_url = __fb_graph_url+"/"+response.cover_photo+"/";
										
					__opengraph_get(og_url, null, function(cp_response) {
						if (cp_response && !cp_response.error)
						{	
							// merge data
							var obj = {
								fb_album_id			: v,
								fb_url				: response.link,
								cover_photo_picture	: cp_response.picture,
								cover_photo_source	: cp_response.source,
								likes_count			: (typeof response.likes != "undefined") ? response.likes.data.length : 0,
								photo_count			: (typeof response.count != "undefined") ? response.count : 0,
								comments_count		: (typeof response.comments != "undefined") ? response.comments.data.length : 0,
								name				: response.name
							}							
							
							// push obj into albums array			
							albums[k] = obj
							j++;							
														
							// call callback when all asynchronous data is retrived
							if (j==length)
							{
								if (!batch_mode)
									__append_album_data_to_obj($ul, albums);
								__on_action_end(albums);
							}						
						}
					});
				}							
			}, function (response) {
				__debug( "album "+v+" doesn't exist" );
				j++;
			});			
		});
		
	}
	
	// expose facebookAlbumList in order to query Open Graph System without modify any DOM object
	$.extend({
		facebookAlbumQuery: function( options ) {
			$(null).facebookAlbumList( options );
		}
	});
	
	// perform functions on actions end
	function __on_action_end(param) {
		if (typeof settings.on_action_end=="function")
		{
			settings.on_action_end(param);
		}
	}
	
	// namespace adder
	function __ns(prop) {
		return "fbalbumreader:"+prop;
	}
	
	// do ajax request to Open Graph Service
	function __opengraph_get(url, data, on_success, on_error)
	{
		$.ajax({
			type: "GET",
			url: url,
			dataType: "json",
			data: data,
			success: function( response ) {
				if (typeof on_success == "function"){
					on_success(response);
				}
			},
			error: function( response ) {
				if (typeof on_error == "function"){
					on_error(response);
				}
			}
		});
	}
	
	// append the photo returned into the list
	function __append_photo_data_to_obj( $obj, data )
	{
		var htmlString = "";
		
		$.each(data, function(k, v){
			htmlString +=
				"<li class=\""+settings.li_class+"\" data-fbid=\""+v.id+"\">"
					+"<div class=\""+settings.imgcontainer_class+"\">"
						var likes,comments;
						if (typeof v.likes != "undefined") likes = v.likes.data.length; else likes = 0;	
						if (typeof v.comments != "undefined") comments = v.comments.data.length; else comments = 0;						
						commentsHtml = "";
						if (comments!=0)
							commentsHtml +=
							"<a target='_blank' class='"+settings.anchor_class+"' href='"+v.link+"'>"
								+"<span class='"+settings.commentscount_class+"'>"+comments+"</span>"
							+"</a>";						
						htmlString +=
						"<a class=\""+settings.anchor_class+"\" rel=\""+settings.anchor_class+"\" href=\""+v.source+"\" title=\"<span class='"+settings.likecount_class+"'>"+likes+"</span>"+commentsHtml+"\">"
							+"<img class=\""+settings.img_class+"\" src=\""+v.source+"\" />"
						+"</a>"
						+"<p class=\""+settings.connections_class+"\">"
							+"<span class=\""+settings.likecount_class+"\">"+likes+"</span>"
							+commentsHtml							
						+"</p>"
					+"</div>"
				+"</li>";
		});
		
		$obj.append(htmlString);
	}
	
	// append the album cover photo into the list
	function __append_album_data_to_obj( $obj, data )
	{
		var htmlString = "";
		
		$.each(data, function(k, v) {
			htmlString +=
				"<li class=\""+settings.li_class+"\" data-fbid=\""+v.fb_album_id+"\">"
					+"<div class=\""+settings.imgcontainer_class+"\">"
						+"<a class=\""+settings.anchor_class+"\">"
							+"<img class=\""+settings.img_class+"\" src=\""+v.cover_photo_source+"\" />"
						+"</a>"
						+"<p class=\""+settings.likecount_class+"\">"+v.likes_count+"</p>"
					+"</div>"
					+"<p class=\""+settings.albumname_class+"\">"
						+"<a class=\""+settings.anchor_class+"\">"
							+v.name
						+"</a>"
					+"</p>"
					+"<p class=\""+settings.connections_class+"\">"
						+"<span class=\""+settings.photocount_class+"\">"+v.photo_count+" foto</span>";
						if (v.comments_count>1)
							htmlString += "<span class=\""+settings.commentscount_class+"\">&bull; <a target=\"_blank\" href=\""+v.fb_url+"\">"+v.comments_count+" commenti</a></span>";
						else if (v.comments_count==1)
							htmlString += "<span class=\""+settings.commentscount_class+"\">&bull; <a target=\"_blank\" href=\""+v.fb_url+"\">"+v.comments_count+" commento</a></span>";
					htmlString += "</p>"
				+"</li>";
		});
		
		// append html
		$obj.append(htmlString);
	}
	
	// debug utility
	function __debug( msg )
	{
		if (typeof console != undefined && typeof msg != undefined)
		{
			console.log("jquery.fbalbumreader: "+msg);
		}
	}
	
} (jQuery));