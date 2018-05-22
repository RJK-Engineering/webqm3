$$('div[data-border-template]').each(function (div) {
    var template = document.querySelector('template#'+div.get('data-border-template'));
    var content = document.importNode(template.content, true);
    var placeholder = content.querySelector('#'+template.get('data-placeholder'));
    var borderWidth = template.get('data-border-width')*2;
    div.getChildren().each(function (el) {
        placeholder.appendChild(el);
    });
    div.appendChild(content);
    var width = div.getStyle('width').toInt();
    if (width) {
        var height = div.getStyle('height').toInt();
        placeholder.setStyles({
            width: div.getStyle('width').toInt() - borderWidth,
            height: div.getStyle('height').toInt() - borderWidth,
            // width: div.getWidth() - width,
            // height: div.getHeight() - width,
        });
    }
    // alert(placeholder.getPosition().x + ', '+placeholder.getPosition().y);
    // alert(div.getWidth() + ', '+div.getHeight());
});
