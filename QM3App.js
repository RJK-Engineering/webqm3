
/****************************************************************************/
var QM3App = new Class ({
/****************************************************************************/

    conf: [],
    currentPagenr: 0,
    prevPagenr: 0,
    currentPage: null,
    styleSheet: null,
    colorPalette: null,

    // elements
    menu: null,
    pagetitleDiv: null,
    pagenrDiv: null,
    dateDiv: null,
    timeDiv: null,
    pages: [],
    // items: [],
    buttons: [],
    dialogs: [],

    months: [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ],
    weekdays: [
        "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday", "Sunday"
    ],

    start: function(value) {
        this.menu = $('menu');
        this.pagenrDiv = $('pagenr');
        this.pagetitleDiv = $('pagetitle');

        this.styleSheet = new StyleSheet("qm_colors.css");

        this.loadConf();
        this.loadElements();
        this.setupControl();

        this.updateClock();
        var self = this;
        setInterval(function() { self.updateClock() }, 60000);
    },

    loadConf: function() {
        var self = this;
        new Request.JSON({
            url: "qm.json",
            onSuccess: function(res) {
                self.conf = res;
                self.init();
            }
        }).send();
    },

    init: function() {
        this.loadPages();
        this.colorPalette = new ColorPalette($('colorpalette'), this.conf.palette);

        var self = this;
        var selectColorScheme = $('selectColorScheme');
        Object.each(this.conf.colors, function (scheme, name) {
            var option = new Element('option.File');
            option.set('text', name+'.CLR');
            option.addEvent('click', function () {
                self.setColorScheme(name);
            });
            selectColorScheme.appendChild(option);
        });
    },

    loadElements: function() {
        // buttons
        $$('button').each(function (el) {
            var id = el.get('id');
            if (id) this.buttons[id] = el;
        }, this);
        // dialogs
        $$('.Dialog').each(function (el) {
            var id = el.get('id');
            if (id) this.dialogs[id] = el;
        }, this);
        this.timeDiv = $('time');
        this.dateDiv = $('date');
    },

    loadPages: function() {
        var self = this;
        this.pages = [];
        // var i = 0;
        this.conf.pages.each(function(pageConf) {
            var pagediv = new Element('div.Page#page'+pageConf.pagenr,
                { 'data-title' : pageConf.title } );
            if (pageConf.items) {
                pageConf.items.each(function(itemConf) {
                    // var itemId = 'item' + i++;
                    var item = new Item(itemConf, self.conf.palette);
                    item.addOnClickEvent(self);
                    pagediv.appendChild(item.containerDiv);
                    // self.items[itemId] = item;
                });
            }
            this.menu.appendChild(pagediv);
            this.pages.push(pagediv);
        }, this);
        this.reloadPage();
    },

    setupControl: function() {
        var self = this;

        // Done buttons close parent Dialog
        $$('button.Done').each(function (el) {
            el.addEvent('click', function () {
                var parent = el.getParent('.Dialog');
                if (parent) {
                    parent.setStyle('display', 'none');
                    var button = parent.get('data-button');
                    if (button)
                        self.buttons[button].removeClass('Active');
                } else {
                    alert("No parent found");
                }
            });
        });
        // ShowDialog buttons
        $$('button[data-dialog]').each(function (button) {
            button.addEvent('click', function() {
                button.addClass('Active');
                var dialog = self.dialogs[button.get('data-dialog')];
                dialog.set('data-button', button.get('id'))
                dialog.setStyle('display', 'inline-block');
            });
        });
        // Checkbox buttons
        $$('button.Checkbox').each(function (button) {
            button.set('html', "&nbsp;");
            button.addEvent('click', function() {
                if (button.hasClass('Active')) {
                    button.removeClass('Active');
                    button.set('html', "&nbsp;");
                } else {
                    button.addClass('Active');
                    button.set('html', '&diams;');
                }
            });
        });

        this.buttons.pagedown.addEvent('click', function() {
            self.showPage(self.currentPagenr + 1);
        });
        this.buttons.pageup.addEvent('click', function() {
            self.showPage(self.currentPagenr - 1);
        });
        this.buttons.saveColors.addEvent('click', function() {
            self.styleSheet.randomColors(self.conf.coloritems, self.conf.palette);
        });
    },

    showPage: function(pagenr) {
        if (this.pages[pagenr]) {
            this.prevPagenr = this.currentPagenr;
            this.currentPagenr = pagenr;
            this.reloadPage();
        }
    },

    reloadPage: function() {
        this.pages[this.prevPagenr].setStyle('display', 'none');
        this.pagenrDiv.set('text', this.currentPagenr+1);
        this.pagetitleDiv.set('text', this.pages[this.currentPagenr].get('data-title'));
        this.pages[this.currentPagenr].setStyle('display', 'inline-block');
    },

    setColorScheme: function(name) {
        var i = 0;
        this.conf.colors[name].each(function (index) {
            this.styleSheet.setColor(
                this.conf.coloritems[i++], '#' + this.conf.palette[index]
            );
        }, this);
    },

    updateClock: function() {
        var now = new Date();

        // date
        this.dateDiv.set('text',
            this.weekdays[now.getDay()] + ", " +
            this.months[now.getMonth()] + " " +
            now.getDate() + ", " + now.getFullYear()
        );

        // time
        var m = now.getMinutes();
        if (m < 10) m = "0" + m;
        this.timeDiv.set('text', now.getHours() + ":" + m);
    },

    // $$('div.Item').each(function(i) { new Drag(i) })
});


/****************************************************************************/
var Item = new Class ({
/****************************************************************************/

    conf: null,
    borderStyle: null,
    containerDiv: null,
    itemPadding: 11,

    ALIGN_LEFT: 0,
    ALIGN_CENTER: 1,
    ALIGN_RIGHT: 2,

    STYLE_ROUNDED_CORNERS: 2,
    STYLE_BORDER_SHADOW: 3,
    STYLE_CORNER_TRIANGLES: 4,
    STYLE_TEXT_SHADOW: 5,
    STYLE_RAISED: 6,
    STYLE_SUNKEN: 7,
    STYLE_THICK_BORDER: 8,
    STYLE_NO_BORDER: 9,

    initialize: function(conf, palette) {
        this.conf = conf;
        // Item styles 0-8 have same border style as
        // item styles 10-18, item style 9 has no border.
        // Item styles 0-8 are text only,
        // item styles 9-18 include an icon.
        this.borderStyle = conf.style % 10;

        // Icon div

        var iconDiv = new Element('div.Icon');

        // add text first for right alignment
        if (conf.align == this.ALIGN_RIGHT)
            iconDiv.appendText(conf.name || "");

        if (conf.style >= this.STYLE_NO_BORDER) {
            var img = new Element('img.Icon',
                { src : "icons/icon"+conf.icon+".ico" } );
            iconDiv.appendChild(img);
            if (conf.align == this.ALIGN_CENTER)
                iconDiv.appendChild(new Element('br'));
            img.addClass('Align' + conf.align);
        }

        // add text for left and center alignment
        if (conf.align != this.ALIGN_RIGHT)
            iconDiv.appendText(conf.name || "");
        iconDiv.addClass('Align' + conf.align);
        if (this.borderStyle == this.STYLE_TEXT_SHADOW)
            iconDiv.addClass('TextShadow');

        // Item face div

        var faceDiv = new Element('div.ItemFace');
        if (conf.style != this.STYLE_NO_BORDER)
            this.resize(faceDiv);
        faceDiv.addClass('Border' + this.borderStyle);
        faceDiv.appendChild(iconDiv);

        // Item container
        // Either: add a border div, set the container as border, or no border

        var bordercolor = palette[conf.bordercolor];
        var textcolor = palette[conf.textcolor];
        var fillcolor = palette[conf.fillcolor];
        this.containerDiv = new Element('div.ItemContainer');

        if (this.borderStyle == this.STYLE_CORNER_TRIANGLES) {
            // Add border div
            var borderDiv = new Element('div.ItemBorder.Border4');
            borderDiv.appendChild(faceDiv);
            this.containerDiv.appendChild(borderDiv);
            // set colors
            borderDiv.setStyle('color', '#' + textcolor);
            borderDiv.setStyle('background-color', '#' + fillcolor);
            borderDiv.setStyle('border-color', '#' + bordercolor);

            // Add triangles
            var top = -conf.h - 2*this.itemPadding + 29 + 'px';

            var el = new Element('div.TriangleTopLeft');
            el.setStyles({ left: -conf.w - 2*this.itemPadding + 22 + 'px', top: top,
                'border-top-color': '#' + bordercolor });
            this.containerDiv.appendChild(el);

            el = new Element('div.TriangleTopRight');
            el.setStyles({ left: '-15px', top:  top,
                'border-top-color': '#' + bordercolor });
            this.containerDiv.appendChild(el);

            el = new Element('div.TriangleBottomLeft');
            el.setStyles({ left: -conf.w - 2*this.itemPadding + 6, top: '1px',
                'border-bottom-color': '#' + bordercolor });
            this.containerDiv.appendChild(el);

            el = new Element('div.TriangleBottomRight');
            el.setStyles({ left: '-31px', top: '1px',
                'border-bottom-color': '#' + bordercolor });
            this.containerDiv.appendChild(el);

        } else if (conf.style != this.STYLE_NO_BORDER) {
            // Container is border
            this.containerDiv.addClass('ItemBorder');
            this.containerDiv.addClass('Border' + this.borderStyle);
            // set colors
            this.containerDiv.setStyle('color', '#' + textcolor);
            this.containerDiv.setStyle('background-color', '#' + fillcolor);
            if (this.borderStyle >= this.STYLE_TEXT_SHADOW) {
                this.containerDiv.setStyle('outline-color', '#' + bordercolor);
            } else {
                if (this.borderStyle >= this.STYLE_BORDER_SHADOW) {
                    this.containerDiv.setStyle('box-shadow',
                        "1px 1px #" + bordercolor + ", 2px 2px #" + bordercolor);
                }
                this.containerDiv.setStyle('border-color', '#' + bordercolor);
            }
            this.containerDiv.appendChild(faceDiv);
        } else {
            // No border
            this.containerDiv.appendChild(faceDiv);
        }

        // Put item on its position
        this.reposition();
    },

    resize: function(div) {
        var x = 7, y = 7;
        if (this.borderStyle >= this.STYLE_ROUNDED_CORNERS &&
            this.borderStyle <= this.STYLE_SUNKEN
        ) {
            x += 2;
            y += 2;
        }
        div.setStyles({
            width: this.conf.w - x,
            height: this.conf.h - y
        });
    },

    reposition: function() {
        var d = 0;
        if (this.borderStyle == this.STYLE_THICK_BORDER) d = 2;
        else if (this.borderStyle >= this.STYLE_CORNER_TRIANGLES &&
                 this.borderStyle < this.STYLE_THICK_BORDER) d = 1;
        this.containerDiv.setPosition({
            x: this.conf.x + d,
            y: this.conf.y + 42 + d
        });
    },

    addOnClickEvent: function(qm3app) {
        var self = this;
        this.containerDiv.addEvent('click', function () {
            if (self.conf.type == 5) {
                qm3app.showPage(self.conf.link - 1);
            } else if (self.conf.type == 4) {
                $('softwareItemSpeedkey').value = String.fromCharCode(self.conf.key);
                $('softwareItemName').value = self.conf.name || "";
                $('softwareItemLocation').value = self.conf.location || "";
                $('softwareItemCommand').value = self.conf.command || "";
                qm3app.dialogs.editSoftwareItemDialog.setStyle(
                    'display', 'inline-block');
                if (self.conf.link == 0 && $('softwareItemPause').hasClass('Active'))
                    $('softwareItemPause').click();
                if (self.conf.link == 1 && ! $('softwareItemPause').hasClass('Active'))
                    $('softwareItemPause').click();
            }
        });
    },

});


/****************************************************************************/
var StyleSheet = new Class ({
/****************************************************************************/

    name: null,
    cssStyleSheet: null,
    cssRules: {},

    initialize: function(name) {
        this.name = name;
        this.loadRules();
    },

    loadRules: function() {
        var re = new RegExp(this.name+"$");
        for (var i=0; i<document.styleSheets.length; i++) {
            var css = document.styleSheets[i];
            if (css.href.match(re)) {
                this.cssStyleSheet = css;
                for (var j=0; j<css.cssRules.length; j++) {
                    var rule = css.cssRules[j];
                    this.cssRules[rule.selectorText] = {
                        index: j,
                        rule: rule,
                    };
                }
            }
        };
    },

    updateStyle: function(selector, style) {
        var cssRule = this.cssRules[selector] //firefox
                   || this.cssRules[selector.toLowerCase()]; //chrome
        // var text = cssRule.rule.cssText;
        Object.each(style, function (value, property) {
            cssRule.rule.style[property] = value;
            // var re = new RegExp(property+"\\s*:\\s*[^;]+");
            // if (text.match(re)) {
            //     text = text.replace(re, property+": "+value);
            // }
        });

        // this.cssStyleSheet.deleteRule(cssRule.index);
        // this.cssStyleSheet.insertRule(text, cssRule.index);
        // this.cssRules[selector] = {
        //     index: cssRule.index,
        //     rule: this.cssStyleSheet.cssRules[cssRule.index],
        // };
    },

    randomColors: function(classnames, palette) {
        var index = 0;
        classnames.each(function (classname) {
            this.setColor(classname, '#' + palette[Math.ceil(Math.random()*16)-1]);
        }, this);
    },

    setColor: function(classname, color) {
        var property;
        if (classname == 'DialogFrame')
            property = 'border-color';
        else
            property = classname.match(/Text$/) ? 'color' : 'background-color';

        var style = {};
        style[property] = color;
        this.updateStyle('.'+classname, style);
    },

});


/****************************************************************************/
var ColorPalette = new Class ({
/****************************************************************************/

    palette: null,
    optionDivs: null,
    selected: null,

    initialize: function(div, palette) {
        this.palette = palette;
        this.optionDivs = div.getElements('div.ColorBorder');
        var self = this;
        var i = 0;
        this.optionDivs.each(function (div) {
            div.getElement('.Color').setStyle(
                'background-color', '#' + self.palette[i]);
            var j = i++;
            div.addEvent('click', function () {
                self.deselect();
                self.select(div);
                self.selected = j;
            });
        });
    },

    selectColor: function(index) {
        var div = this.optionDivs[index];
        if (div == null) return;
        this.deselect();
        this.select(div);
        this.selected = index;
    },

    select: function(div) {
        div.addClass('Active');
        div.getElements('*').each(function (el) {
            el.addClass('Active');
        });
    },

    deselect: function() {
        if (this.selected == null) return;
        var div = this.optionDivs[this.selected];
        div.removeClass('Active');
        div.getElements('*').each(function (el) {
            el.removeClass('Active');
        });
    },

});
