;(function($) {
	// Resize de la popin en fonction de la taille du contenu de l'iframe
	// - a appeler lorsque l'iframe a été chargé (event ready)
	$.fancybox.frame_resize_height = function() {
		setTimeout('',5000);

		var iFrame				=	document.getElementById('fancybox-frame');
		var $outer				=	$('#fancybox-wrap');
		var $inner				=	$('#fancybox-content');
		var iFrameContentHeight	=	0;
		
		if (typeof iFrame.contentWindow.document.body != 'undefined')
		{
			iFrameContentHeight = $(iFrame.contentWindow.document.body).innerHeight();
		}
		else
		{
			iFrameContentHeight = $(iFrame.contentDocument.body).innerHeight();
		}
		
		if(iFrameContentHeight > 0){
			$outer.css({
                height: iFrameContentHeight
			});
			$inner.css({
                height: iFrameContentHeight
			});
			$.fancybox.center();
		}
	};
})(jQuery);