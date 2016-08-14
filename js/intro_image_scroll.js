function distort_background() {
    var scroll_pos = jQuery(window).scrollTop();
    var max_scroll = jQuery('#intro_image').height();
    var scroll_ratio = scroll_pos / max_scroll;
    var blur = 'blur(' + Math.round(scroll_ratio * 20) + 'px)';
    var grayscale = 'grayscale(' + Math.floor(scroll_ratio * 100) + '%)';
    var new_filter = blur + ' ' + grayscale;
    console.log(new_filter);
    jQuery('#background').css('-webkit-filter', new_filter);
    jQuery('#background').css('opacity', 1 - scroll_ratio);
}