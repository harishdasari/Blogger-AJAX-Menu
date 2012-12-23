/**
 * Mashable Style AJAX Menu for Blogger jQuery Plugin
 *
 * Version 1.0
 * by Harish Dasari <harish@way2blogging.org>
 * http://www.way2blogging.org/
 * http://github.com/harishdasari
 *
 * Copyright 2012 Harish Dasari (http://www.way2blogging.org/)
 * Dual licensed under the MIT and GPL v2 licenses
 */

;(function($){

	var W2bAJAXBloggerMenu = function( elem, options ){

		this.elem     = elem;
		this.settings = options;
		this.addAjaxHtml();
		this.ajaxcall = null;
		this.lielem   = this.elem.find('.verticlemenu li a');
		this.menuHelper(this.elem);
		this.addEvents();

	};

	W2bAJAXBloggerMenu.prototype = {

		regex: {

			islabel     : new RegExp( '/search/label/', 'g' ),
			issearch    : new RegExp( '[?&]q=', 'g' ),
			labelsearch : new RegExp( '(http://[^/]+)/search/label/([^/?&]+).*[?&]q=([^$&]+)(?:[^$]+)?', 'g' ),
			label       : new RegExp( '(http://[^/]+)/search/label/([^/?&$]+)', 'g' ),
			search      : new RegExp( '(http://[^/]+)/search/?[?&]q=(.*)', 'g' )
		},

		addEvents: function () {

			var self = this;
			this.lielem.hover(function () {
				if ( $(this).data('menuloaded') !== 'true') {
					self.li        = $(this);
					self.url       = self.li.attr('href');
					self.container = self.li.closest('ul').siblings('ul');
					self.hoverOver();
				}
			}, function () {
				self.hoverOut();
			});

		},

		hoverOver: function () {

			var self = this;
			this.getAJAXUrl();

			if ( ! this.ajaxUrl ) {
				return;
			}

			this.ajaxcall = $.ajax({
				type      : 'GET',
				url       : self.ajaxUrl,
				dataType  : 'jsonp',
				data      : self.ajaxData,
				beforeSend: function () {
					self.showLoader();
				},
				success   : function (data) {
					self.hideLoader();
					self.addArrow();
					self.showPosts(data);
				},
				error     : function (data) {
					self.showError(data);
				}
			});

		},

		hoverOut: function () {

			this.ajaxcall.abort();
			this.hideLoader();

		},

		getAJAXUrl: function () {

			if ( this.url ) {

				var self = this;

				this.ajaxData = {
					alt           : 'json',
					'max-results' : this.settings.numPosts
				};

				if ( this.url.search( this.regex.islabel ) !== -1 && this.url.search( this.regex.issearch ) !== -1 ) {
					this.ajaxUrl = this.url.replace( this.regex.labelsearch, function (url, blogurl, labelname, sterm) {
						self.ajaxData.q = sterm;
						return [blogurl, '/feeds/posts/default/-/', labelname, '/'].join('');
					});
				}else if( this.url.search( this.regex.islabel ) !== -1 && this.url.search( this.regex.issearch ) === -1 ) {
					this.ajaxUrl = this.url.replace( this.regex.label , function (url, blogurl, labelname) {
						delete self.ajaxData.q;
						return [blogurl, '/feeds/posts/default/-/', labelname, '/'].join('');
					});
				} else if ( this.url.search( this.regex.islabel ) === -1 && this.url.search( this.regex.issearch ) !== -1 ) {
					this.ajaxUrl = this.url.replace( this.regex.search , function (url, blogurl, sterm) {
						self.ajaxData.q = sterm;
						return [blogurl, '/feeds/posts/default'].join('');
					});
				} else {
					this.ajaxUrl = false;
				}

			} else {
				this.ajaxUrl = false;
			}

		},

		showLoader: function () {

			$('<span></span>', {
				'class': 'loader'
			}).appendTo(this.li.closest('li'));

		},

		hideLoader: function () {

			this.li.closest('li').find('span.loader').remove();

		},

		showPosts: function (json) {

			var self = this,
				posts = [],
				posttitle,
				posturl,
				postimage;

			if ( json.feed.openSearch$totalResults.$t > 0 ) {
				$.each(json.feed.entry, function (index, postobj) {
					posttitle = postobj.title.$t;
					$.each(postobj.link, function (index, urlobj) {
						if (urlobj.rel === 'alternate') {
							posturl = urlobj.href;
						} else {
							posturl = '#';
						}
					});
					postimage = postobj.media$thumbnail ? postobj.media$thumbnail.url.replace(/\/s72\-c\//, '/s100-c/') : self.settings.defaultImg;
					posts.push('<li><span class="imgCont"><img alt="', posttitle, '" src="', postimage, '"/></span><a rel="nofollow" title="', posttitle, '" href="', posturl, '">', posttitle, '</a></li>');
				});
			} else {
				posts.push('<h5>', 'Sorry!!, No Posts to Show', '</h5>');
			}

			this.container.html(posts.join(''));
			this.lielem.removeData('menuloaded');
			this.li.data('menuloaded', 'true');

		},

		showError: function (data) {

			if (data.statusText === 'error') {
				this.hideLoader();
				this.addArrow();
				this.container.html('<h5>Error!! Could not fetch the Blog Posts!</h5>');
			}

		},

		addArrow: function () {

			this.lielem.closest('li').find('span').remove();
			this.lielem.removeClass('hoverover');
			this.li.addClass('hoverover');

			$('<span></span>', {
				'class': 'menuArrow'
			}).appendTo(this.li.closest('li'));

		},

		menuHelper: function (elem) {

			var self = this;
			elem.find('>li').hover(function () {
				var $this = $(this);
				$this.find('a:first').addClass('hoverover');
				var height = $(this).find('ul.verticlemenu li').height() * $(this).find('ul.verticlemenu li').length;
				$this.find('ul.postslist').css({
					'min-height': height + 'px'
				});
				self.requestFirstAjax($this);
			}, function () {
				$(this).find('a:first').removeClass('hoverover');
			});

		},

		addAjaxHtml: function () {

			this.elem.find('ul ul').remove();

			this.elem.addClass('w2bajaxmenu').find('>li').find('ul:first').addClass('verticlemenu').wrap(
				$('<div></div>', {
					'class': this.settings.divClass
				})
			);

			$('ul.verticlemenu').after(
				$('<ul></ul>', {
					'class': 'postslist'
				})
			);

		},

		requestFirstAjax: function (firstli) {

			firstli        = firstli.find('.verticlemenu li:first-child a');
			this.url       = firstli.attr('href');
			this.container = firstli.closest('ul').siblings('ul');
			this.li        = firstli;
			this.hoverOver();

		}

	};

	$.fn.ajaxBloggerMenu = function(options) {

		var defaults = {
			numPosts     : 4,
			divClass     : 'submenu',
			postsClass   : 'postslist',
			defaultImg   : '/default.png'
		};

		var settings = $.extend({}, defaults, options);
		
		return this.each(function(){
			var ajaxmenu = new W2bAJAXBloggerMenu($(this), settings);
		});

	};

})(jQuery);