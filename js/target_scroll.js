//var element_to_scroll_to = document.getElementById('anchorName2');
//// Or:
//var element_to_scroll_to = document.querySelectorAll('.my-element-class')[0];
//// Or:
//var element_to_scroll_to = $('.my-element-class')[0];
//// Basically `element_to_scroll_to` just have to be a reference
//// to any DOM element present on the page
//// Then:
//element_to_scroll_to.scrollIntoView();

function scroll_to(id) {
    var scrollto = 0;
    if (id != undefined) {
        var offset = $(id).offset();
        scrollto = offset.top - 64;
    }
    $('html, body').animate({scrollTop:scrollto}, 400);
}