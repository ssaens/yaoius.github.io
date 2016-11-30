var acc = document.getElementsByClassName("expandable");
var i;

for (i = 0; i < acc.length; i++) {
    acc[i].onclick = function(){
        this.nextElementSibling.classList.toggle("show");
        this.children[0].classList.toggle("active");
        this.children[1].classList.toggle("active");
    }
}