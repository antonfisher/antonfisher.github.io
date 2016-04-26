!{
    "title": "Testing ExtJs with Mocha.js",
    "image": "/images/posts/5-testing-extjs-with-mocha-js/mocha-extjs-demo.gif",
    "imagePreview": "/images/posts/5-testing-extjs-with-mocha-js/mocha-extjs-logo-300.png",
    "metaDescription": "extjs, mocha.js, testing",
    "tags": "extjs,mocha,testing,js",
    "date": "2016-04-25"
}

<!-- preview -->

I know at least two enterprise solutions for testing ExtJs application which have rich interface and functionality:
[Bryntum Siesta](http://www.bryntum.com/products/siesta/) and new [Sencha Test](https://www.sencha.com/products/test/)
(which I have not tried, it did not have Linux version in beta as I know).
In contrast to them, here I present small library which make simpler testing of ExtJs application, uses great
open-source Mocha.js framework and Jenkins for nightly running.

<!-- /preview -->


And it is called..

## mocha-extjs

[Online demo](http://antonfisher.com/demo/mocha-extjs/)

This small library `mocha-extjs` simulates user actions.
Common test cases may be:
- Click on buttons, fill fields in forms 
- Select and edit cells in grid
- Check disable/enable, visible/hidden states
- Run action by clicking on button, wait for loading mask, check components' states.

The library uses this syntax:
```javascript
it('Click on button "Save"', function (done) {
    eTT().button('Save').click(done)
});

it('Select first item in "Country" combobox', function (done) {
    eTT().combobox('Country').select(1, done)
});
```

Search will look for component's properties: _title_, _fieldLabel_, _reference_, _boxLabel_, _xtype_, _text_.

## The map of supported components and methods:

First of all initialize library in _index.html_: `var eTT = new MochaExtJs();`.

```
eTT() -->--->|------->--->|- button ---> (|- '%title%'     )----.
        |    |       |    |- window       |- '%fieldLabel%'     |
        |    |- no --'    |- numberfield  |- '%reference%'      |
        |    |            |- textfield    |- '%boxLabel%'       |
        |    |            |- checkbox     |- '%xtype%'          |
        |    |            |- combobox     `- '%text%'           |
        |    |            |- radio                              |
        |    |            |- grid        .----------------------x----------------------.
        |    |            `- tab         |                                             |
        |    |                           |-->|- click -------> (...) ------------------v
        |    |                           |   |- isEnabled                              |
        |    |- waitLoadMask() ------.   |   |- isDisabled                             |
        |    |                       |   |   |- isHidden                               |
        |    `- waitText('%text%')---v   |   |- isVisible                              |
        |                            |   |   |- select                                 |
        |                            |   |   |- checkRowsCount                         |
        |                            |   |   |- edit                                   |
        |                            |   |   `- fill                                   |
        |                            |   |                                             |
        |                            |   `--> cellEditor() --->|- select ---> (...) ---v
        |                            |                         |- click                |
        |                            |                         `- fill                 |
        |                            |                                                 |
        x----------------------------<-------------------------------------------------'
        |
        |
        `--> done.
```

## Getting Started:

Update _index.html_:

```html
<head>
    ...
    
    <link href="http://cdn.rawgit.com/mochajs/mocha/2.3.0/mocha.css" rel="stylesheet"/>
    <link href="http://cdn.rawgit.com/antonfisher/node-mocha-extjs/master/dist/mocha-extjs.css" rel="stylesheet"/>
    
    <script src="http://cdn.rawgit.com/Automattic/expect.js/0.3.1/index.js"></script>
    <script src="http://cdn.rawgit.com/mochajs/mocha/2.3.0/mocha.js"></script>
    <script src="http://cdn.rawgit.com/antonfisher/node-mocha-extjs/master/dist/mocha-extjs.js"></script>
</head>

<body>
    ...

    <!-- mocha ui -->
    <div id="mocha"></div>

    <script>
        if (typeof window.initMochaPhantomJS === 'function') {
            window.initMochaPhantomJS()
        }
        mocha.setup('bdd')
    </script>
    
    <!-- first test suite -->
    <script src="http://cdn.rawgit.com/antonfisher/node-mocha-extjs/master/test/suites/010-environment.js">
    </script>


    <!-- run script -->
    <script>
        mocha.checkLeaks();
        mocha.globals(['Ext', 'Sandbox']);
    
        var eTT = new MochaExtJs();
    
        window.onload = function () {
            var interval = setInterval(function () {
                if (typeof Ext !== 'undefined' && typeof Sandbox !== 'undefined') {
                    clearInterval(interval);
                    mocha.run();
                }
            }, 200);
        };
    </script>
</body>
```
Done. Then run your application.

## Test case example

Example uses Mocha asynchronous method: 

```javascript
// tests/suites/020-buttons.js
describe('Buttons', function () {
    this.bail(true);         // exit when first test fails
    this.timeout(20 * 1000); // necessary timeout for ui operations

    it('Switch to "Buttons" tab', function (done) { // done - async tests callback
        eTT().tab('Buttons').click(done);
    });

    it('Click "Simple button" button', function (done) {
        eTT().button('Simple button').isEnabled().click(done);
    });
});
```
It is possible to combine multipty actions related to one component.

## Installation

Using NPM:

- `$ npm install mocha-extjs`
- use files from `./dist` folder

or GitHub:

- `git clone git@github.com:antonfisher/mocha-extjs.git`

or direct include to `index.html`:

```html
<link href="http://cdn.rawgit.com/antonfisher/node-mocha-extjs/master/dist/mocha-extjs.css" rel="stylesheet"/>
<script src="http://cdn.rawgit.com/antonfisher/node-mocha-extjs/master/dist/mocha-extjs.js"></script>
```

## Run with Jenkins

_Cooming soon, waiting for pull request in new release version of one dependency..._

## Links

[GitHub repository](https://github.com/antonfisher/mocha-extjs), 
[NPM Package](https://www.npmjs.com/package/mocha-extjs)
