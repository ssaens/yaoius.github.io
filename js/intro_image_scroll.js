function distort_background() {
    var scroll_pos = jQuery(window).scrollTop();
    var max_scroll = jQuery('#intro_image').height();
    var scroll_ratio = Math.min(scroll_pos / max_scroll, 1);
    var blur = 'blur(' + Math.round(scroll_ratio * 10) + 'px)';
    var grayscale = 'grayscale(' + Math.floor((1 - scroll_ratio) * 100) + '%)';
    var new_filter = blur + ' ' + grayscale;
    console.log('Scroll pos: '+scroll_pos);
    jQuery('#background').css('-webkit-filter', new_filter);
}