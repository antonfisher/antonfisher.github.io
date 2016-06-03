!{
    "title": "Using SVG icons in ExtJs",
    "image": "/images/posts/7-using-svg-icons-in-extjs/using-svg-icons-in-extjs-logo.png",
    "imagePreview": "/images/posts/7-using-svg-icons-in-extjs/using-svg-icons-in-extjs-logo-300.png",
    "metaDescription": "extjs, svg, svg sprite, icons",
    "tags": "extjs,mochajs,testing,js",
    "date": "2016-06-03"
}

<!-- preview -->

In this issue I will explain how to use any _SVG_ icons in _ExtJs_ buttons.
All icons will be combined to single sprite and injected to `index.html`.
Example uses _Google_ Icons set.

<!-- /preview -->

_ExtJs_ have several ways to add icon to button using these properties:
- `iconCls` + css class which defines background image 
- `icon` + path to icon which will be used in background property
- `glyph` + font-based symbol, see [docs](http://docs.sencha.com/extjs/6.0/6.0.1-classic/#!/api/Ext.button.Button)...

Let's add some _SVG_ here.

## Prepare SVG-sprite

Let's create _SVG_ sprite which containts all needed icons in project.
For example, I will use icons from [https://design.google.com/icons/](https://design.google.com/icons/).
From this set I selected _Save_ and _Delete_ icons:
<center>
![Google Icons](/images/posts/7-using-svg-icons-in-extjs/google-icons.png)
</center>

Download _SVG_ files of selected icons, _Save_ icon looks like: 

```xml
<svg fill="#FFFFFF" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 0h24v24H0z" fill="none"/>
    <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
</svg>
```

Then combine icons to one _SVG_ sprite, each icon `paths` should be into `symbol` tag and has unique _id:_

```xml
<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;height:0;width:0;">
    <defs>
        <symbol viewBox="0 0 24 24" id="svg-icon-save">
            <path d="M0 0h24v24H0z" fill="none"/>
            <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
        </symbol>
        <symbol viewBox="0 0 24 24" id="svg-icon-delete">
            <path d="M0 0h24v24H0V0z" fill="none"/>
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"/>
            <path d="M0 0h24v24H0z" fill="none"/>
        </symbol>
    </defs>
</svg>
```

## Include sprite to _index.html_

For include our sprite to page just include it before body close tag:

```html
<body>
    <!-- other stuff here-->
    
    <svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;height:0;width:0;">
        <defs>
            <symbol viewBox="0 0 24 24" id="svg-icon-save">
                <path d="M0 0h24v24H0z" fill="none"/>
                <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
            </symbol>
            <symbol viewBox="0 0 24 24" id="svg-icon-delete">
                <path d="M0 0h24v24H0V0z" fill="none"/>
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"/>
                <path d="M0 0h24v24H0z" fill="none"/>
            </symbol>
        </defs>
    </svg>
</body>
```

_SVG_ sprite should be hidden on page, so `position:absolute;height:0;width:0;` style was applied here.

## Override _Button_ class

Next step is overriding _Button_ class to support new button's paramater `iconSvg`.
Create file `%APP_FOLDER%/overrides/button/Button.js` and copy this code to it:

```javascript
// overrides/button/Button.js
Ext.define('Override.button.Button', {
    override: 'Ext.button.Button',

    // inject svg to icon template
    iconTpl: [
        '<span id="{id}-btnIconEl" data-ref="btnIconEl" role="presentation" unselectable="on" ',
            'class="{baseIconCls} {baseIconCls}-{ui} {iconCls} {glyphCls}{childElCls}" ',
            'style="',
                '<tpl if="iconUrl">background-image:url({iconUrl});</tpl>',
                '<tpl if="glyph && glyphFontFamily">font-family:{glyphFontFamily};</tpl>',
                '<tpl if="iconSvg">display: inline-block;</tpl>',
            '">',
            '<tpl if="glyph">&#{glyph};</tpl>',
            '<tpl if="iconCls || iconUrl">&#160;</tpl>',
            '<tpl if="iconSvg">', // new property
                '<svg class="svg-icon svg-icon-{iconSvg}"><use xlink:href="#svg-icon-{iconSvg}"></use></svg>',
            '</tpl>',
        '</span>'
    ].join(''),

    // extend template values
    getTemplateArgs: function () {
        var args = this.callParent();
        args.iconSvg = this.iconSvg;
        return args;
    }
});
```

Do not forget to build application.

## Add styles for new icons

Add styles for icons to preperly place, e.i. `%APP_FOLDER%/sass/etc/svg-icons.scss`:

```css
.svg-icon {
  fill: #ffffff;
  margin: 0 1px 0 3px;
  width: 24px;
  height: 24px;
}

.svg-icon-save {
  margin: 0 1px 0 3px;
}

.svg-icon-delete {
  margin: 0 0 0 3px;
}
```

Import new icons file `svg-icons.scss` to `%APP_FOLDER%/sass/etc/all.scss`:

```scss
@import "svg-icons";
```

The best place is theme packade folder if you use it.

## Using

We are ready to use our new icons.
Just add `iconSvg` property to button config:
 
```javascript
items: [{
    xtype: 'button',
    text: 'Save',
    iconSvg: 'save', // <--- here
    scale: 'medium'
}, {
    xtype: 'button',
    text: 'Delete',
    iconSvg: 'delete', // <--- and here
    scale: 'medium'
}]
```

Update page and get icons in buttons:

<center>
![Buttons with Google Icons](/images/posts/7-using-svg-icons-in-extjs/buttons-with-google-icons.png)
</center>

## Links

- Google icons:
[https://design.google.com/icons/](https://design.google.com/icons/)
- Good article about using _SVG_ icons:
[https://css-tricks.com/svg-sprites-use-better-icon-fonts/](https://css-tricks.com/svg-sprites-use-better-icon-fonts/).



Thanks for reading. I will glad to get any feedback!
