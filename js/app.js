// Tooltip functionality using jQuery
$(function () {
function onHoverToggleTooltip(e) {
    var $this = $(this),
    title = $this.attr("title"),
    type = e.type,
    xOffset = e.pageX + 10,
    yOffset = e.pageY + 20;

    if (type == "mouseenter") {
    $this.data("tipText", title).removeAttr("title");
    $("<span class='title'></span>")
        .text(title)
        .appendTo("body")
        .fadeIn(200);
    } else if (type == "mouseleave") {
    $this.attr("title", $this.data("tipText"));
    $(".title").fadeOut(200, function () {
        $(this).remove();
    });
    } else if (type == "mousemove") {
    $(".title")
        .css("top", yOffset + "px")
        .css("left", xOffset + "px");
    }
}

$(document).on(
    {
    mouseenter: onHoverToggleTooltip,
    mouseleave: onHoverToggleTooltip,
    mousemove: onHoverToggleTooltip,
    },
    ".tooltip"
);
});

// Sticky path container functionality
window.addEventListener("scroll", function() {
    const navbar = document.querySelector(".path-container");
    const body = document.body;

    if (window.scrollY > 20) {
        if (!navbar.classList.contains("fixed")) {
            navbar.classList.add("fixed");
            body.style.paddingTop = navbar.offsetHeight + "px"; // ใช้ padding แทน margin
        }
    } else {
        navbar.classList.remove("fixed");
        body.style.paddingTop = "0"; // reset
    }
});
