{
    "title": "Using SVG icons in ExtJs",
    "image": "/images/posts/7-using-svg-icons-in-extjs/using-svg-icons-in-extjs-logo.png",
    "imagePreview": "/images/posts/7-using-svg-icons-in-extjs/using-svg-icons-in-extjs-logo-300.png",
    "metaDescription": "extjs, svg, svg sprite, icons",
    "tags": "extjs,svg,icons",
    "date": "2016-06-06"
}

<!-- preview -->

In this issue we will figure out how to use any _SVG_ icons in _ExtJs_ buttons.
All icons will be combined to a single sprite that injected to `index.html`.
Example uses _Google Icons_ set.

<!-- /preview -->

_ExtJs_ has several ways to add an icon on a button.
Here are these properties:
- `iconCls` + css class that defines background image
- `icon` + path to icon that will be used in background property
- `glyph` + font-based symbol, see [docs...](http://docs.sencha.com/extjs/6.0/6.0.1-classic/#!/api/Ext.button.Button)

Let's add some _SVG_ here.

## Prepare _SVG_ sprite

Let's create _SVG_ sprite that contains all needed icons in project.
For this tutorial, I will use icons from [https://design.google.com/icons/](https://design.google.com/icons/).
But it can be any other _SVG_ icons created in a vector-graphic software.
I selected _Save_ and _Delete_ icons from the set:
<center>
![Google Icons](/images/posts/7-using-svg-icons-in-extjs/google-icons.png)
</center>

Download _SVG_ files of selected icons, e.g. _Save_ icon will look like:

```xml
<svg fill="#FFFFFF" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 0h24v24H0z" fill="none"/>
    <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
</svg>
```

Then combine icons into a single _SVG_ sprite,
all `paths` of each icon should be into a separate `symbol` tag and has unique _id:_

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

## Include the sprite into _index.html_

For include our sprite into page just paste it before `</body>` tag:

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

_SVG_ sprite should be hidden on a page, so `position:absolute;height:0;width:0;` style was applied here.

## Override _Button_ class

The next step is overriding _Button_ class to support new button's parameter `iconSvg`.
Create a file `%APP_FOLDER%/overrides/button/Button.js` and copy this code into it:

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

Looks like a lot of changes, but actually here are two small things:
- new property in template
```javascript
'<tpl if="iconSvg">', // new property
    '<svg class="svg-icon svg-icon-{iconSvg}"><use xlink:href="#svg-icon-{iconSvg}"></use></svg>',
'</tpl>',
```
- overrided `getTemplateArgs` function to add `iconSvg` parameter into template's values object.

## Add styles for new icons

Add _CSS_ styles for the icons to an appropriate place, e.i. `%APP_FOLDER%/sass/etc/svg-icons.scss`:

```css
.svg-icon {
  fill: #ffffff;
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

Import the new style file `svg-icons.scss` in `%APP_FOLDER%/sass/etc/all.scss`:

```scss
@import "svg-icons";
```

If you use a theme package, it will be the best place for the new `svg-icons.scss` file.

After all changes, do not forget to re-build the application.

## Using the new icons with buttons

Now we are ready to use our new icons.
Just add the `iconSvg` property into button configuration:

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

Update a page and get the icons on buttons:

<center>
![Buttons with Google Icons](/images/posts/7-using-svg-icons-in-extjs/buttons-with-google-icons.png)
</center>

There was a simplistic solution, that can be improved.
You could add _getter/setter_ functions for the new property to make it bindable.
Instead of overriding you could use extended button class.
For using in other components just add a similar solution to it,
or place _SVG_ icon template directly to component configuration.
Injection sprite into `index.html` can be automated.
All depends on a project.

## Links

- Google Icons:
[https://design.google.com/icons/](https://design.google.com/icons/)
- Good article about using _SVG_ icons:
[https://css-tricks.com/svg-sprites-use-better-icon-fonts/](https://css-tricks.com/svg-sprites-use-better-icon-fonts/).



Thanks for reading. I will glad to get any feedback!
