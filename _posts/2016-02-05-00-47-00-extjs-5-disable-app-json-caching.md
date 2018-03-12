{
    "title": "ExtJS 5: disable app.json caching",
    "image": "/images/posts/4-extjs-5-disable-app-json-caching/extjs-logo.png",
    "imagePreview": "/images/posts/4-extjs-5-disable-app-json-caching/extjs-logo-500.png",
    "metaDescription": "extjs, cache, app.json",
    "tags": "extjs,cache,js",
    "date": "2016-02-05"
}

<!-- preview -->

By default _ExtJS 5_ enabled cache for `app.json` (or I am wrong?).
In some cases you get old version from browser cache, even after new build.

<!-- /preview -->

In my case the build sets `_dc` cache key after each run:
  
``` javascript
// ./app.json

"loader": {
    "cache": "${build.timestamp}",
    "cacheParam": "_dc"
}
```
  
But anyways browser could cache `app.json` file.
To prevent this, let's generate cache key for `app.json` request.

Sample code implements this:

``` html
<script type="text/javascript">
    var Ext= (Ext || {});
    Ext.manifest = ("app.json?_dc=" + +new Date());
</script>
```

Just put this code to your `index.html` file before this line:

``` html
<!-- The line below must be kept intact for Sencha Cmd to build your application -->
<script id="microloader" type="text/javascript" src="bootstrap.js"></script>
```

If you use a workspace, it is easier to create a macros in `../workspace/.sencha/workspace/sencha.cfg`:

```
workspace.disableAppJsonCacheScript=\
    <script type="text/javascript">\
        var Ext= (Ext || {});\
        Ext.manifest = ("app.json?_dc=" + +new Date());\
    </script>\
```

And then update `index.html` files for each application in the workspace:

``` html
<!DOCTYPE HTML>
<html manifest="">
<head>
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta charset="UTF-8">

    <title>My App Title</title>

    #disableAppJsonCacheScript

    <!-- The line below must be kept intact for Sencha Cmd to build your application -->
    <script id="microloader" type="text/javascript" src="bootstrap.js"></script>

</head>
<body></body>
</html>
```

Macros must replace `#disableAppJsonCacheScript` placeholder after build, update `./build.xml` file for this:

``` xml
<target name="-after-build">
    <replace file="${build.out.page.path}"
             token="#disableAppJsonCacheScript"
             value="${workspace.disableAppJsonCacheScript}"/>
</target>
```

Cache is defeated!
