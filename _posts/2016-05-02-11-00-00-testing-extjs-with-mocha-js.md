{
    "title": "Testing ExtJs with Mocha.js",
    "image": "/images/posts/5-testing-extjs-with-mocha-js/mocha-extjs-demo.gif",
    "imagePreview": "/images/posts/5-testing-extjs-with-mocha-js/mocha-extjs-logo-300.png",
    "metaDescription": "extjs, mochajs, testing",
    "tags": "extjs,mochajs,testing,js",
    "date": "2016-05-02"
}

<!-- preview -->

At least two enterprise solutions exists for testing _ExtJs_ applications.
They have rich user interface and functionality:
_[Siesta](http://www.bryntum.com/products/siesta/)_ (_Bryntum_)
and new _[Sencha Test](https://www.sencha.com/products/test/)_.
In contrast to them, here I present small library which allows testing _ExtJs_ application.
It uses great open-source _Mocha.js_ framework and _PhantomJs_ for nightly running.

<!-- /preview -->


## mocha-extjs

[Online demo](/demo/mocha-extjs/)

The aim was to build library which suits for
[End-to-End](https://www.techopedia.com/definition/7035/end-to-end-test) testing for single-page Web-applications
(<abbr title="Rich Internet Application">RIA</abbr>).

Advantages:
- run tests exactly into real application with actions visualisation
- run <abbr title="Continuous Integration">CI</abbr> tests using _[PhantomJs](http://phantomjs.org/)_.

This small library _mocha-extjs_ simulates user actions.
Common test cases can be:
- click on buttons, fill fields in forms 
- select and edit cells in grid
- check disable/enable, visible/hidden states
- run action by clicking on button, wait for loading mask, check components' states.

Library uses chain-based syntax, where `eTT()` is a function which creates new chain:
```javascript
it('Click on button "Save"', function (done) {
    eTT().button('Save').click(done);
});

it('Select first item in "Country" combobox', function (done) {
    eTT().combobox('Country').select(1, done);
});
```

Search of components on a page will do search by properties:
_title_, _fieldLabel_, _reference_, _boxLabel_, _xtype_, _text_.

## The map of supported components and methods:

First initialize library in the _index.html_ file: `var eTT = new MochaExtJs();`.

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

Update the _index.html_ file like here:

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
        // necessary of mocha-phantomjs
        if (typeof window.initMochaPhantomJS === 'function') {
            window.initMochaPhantomJS();
        }
        
        // setup mocha before first test-suite!
        mocha.setup('bdd');
    </script>
    
    <!-- first test suite -->
    <script src="http://cdn.rawgit.com/antonfisher/node-mocha-extjs/master/test/suites/010-environment.js">
    </script>

    <!-- configure and run Mocha.js -->
    <script>
        mocha.checkLeaks();
        mocha.globals(['Ext', 'Sandbox']);
    
        var eTT = new MochaExtJs();
    
        window.onload = function () {
            setTimeout(function () {
                mocha.run();
            }, 1000);
        };
    </script>
</body>
```
Tests will run after opening application in browser.
For more information about _Mocha.js_ configuration see [docs](http://mochajs.org).
Let's create first test case now.

## Test case example

Test files can be stored anywhere, just include it in the _index.html_.
You should pass a _Mocha.js_ `done` callback to the last method in `eTT()` chain:

```javascript
// tests/suites/020-buttons.js
// Variable eTT was defined globaly in index.html (var eTT = new MochaExtJs())

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

## Run with PhantomJs

It works now, but some hack is needed.
Just install `mocha-phantomjs` package and upgrade one of its dependency to latest version:

```bash
$ node --version
v5.10.1
$ npm --version
3.8.3

$ npm install mocha-phantomjs@4.0.2 mocha-phantomjs-core@2.0.1
$ rm -rf ./node_modules/mocha-phantomjs/node_modules/mocha-phantomjs-core
```

Run tests on console:

```bash
# http://localhost:3000 - application address
$ ./node_modules/.bin/mocha-phantomjs --timeout 15000 --path ./node_modules/.bin/phantomjs --view 1024x768 http://localhost:3000
```

Console output example:
![PhantomJs run example](/images/posts/5-testing-extjs-with-mocha-js/mocha-extjs-phantomjs.png)

## Installation

Using NPM:

- `$ npm install mocha-extjs`
- use files from `./dist` folder

or GitHub:

- `git clone https://github.com/antonfisher/node-mocha-extjs.git`

or direct include to `index.html`:

```html
<link href="http://cdn.rawgit.com/antonfisher/node-mocha-extjs/master/dist/mocha-extjs.css" rel="stylesheet"/>
<script src="http://cdn.rawgit.com/antonfisher/node-mocha-extjs/master/dist/mocha-extjs.js"></script>
```

## Links

Library on [GitHub](https://github.com/antonfisher/mocha-extjs),
[NPM Package](https://www.npmjs.com/package/mocha-extjs) page.



Thanks for reading. I will glad to get any feedback!
