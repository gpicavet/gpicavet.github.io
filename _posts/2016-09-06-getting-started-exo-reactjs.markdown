---
layout: post
title:  "Getting started with ReactJS and Exoplatform portlet development"
date:   2016-09-17 20:38:41 +0200
categories: jekyll update
---

Here is the first post of -i hope- many posts dedicated to web development !

In this article I would like to share an experience with <a href="https://community.exoplatform.com">Exoplatform portal</a> and ReactJS : you'll learn how to set up a simple reactjs and nodejs development stack, build a standalone app, and then package to a portlet.

Exoplatform comes with a frontend portlet framework called Juzu to build interactive client-side UI, but the platform allows you to use the technologies you are confortable with .
My organization recently modernized its web development stack with React as a main component. So when we started our intranet project, we decided to use it in portlet development as well.
If you dont know React, take a look at <a href="https://facebook.github.io/react/">the site</a> first. I'm not here to advocate React, but it's a really good tool to manage complex UI and to easily reuse components accross applications.

But don't adventure in heavy javascript development without a good stack or you'll bite the dust ! The main reason is that javascript unlike java, doesn't have a statically, strongly type system, nor a module system. Fortunately some standards has emerged from the mess since a few years !
You can now use any "high level" language like coffeescript, typescript, ES2015 (ex-ES6). However, these languages will not execute in the browser, except for ES2015 which is the next version of javascript but still only partially supported. So you have to  "transpile" these languages to a good old "ES5" syntax.
ReactJS also comes with a syntax called JSX which mix JS and HTML tags, so we'll have to transpile it as well.
Babel will be a good guy for transpiling task, and we'll use this time ES2015.

In order to efficiently manage JS library dependencies, we will use nodejs and npm. We'll then use maven to build and package the portlet part.

OK now it's time to open your IDE, If you dont have one try <a href="https://atom.io/">Atom</a>. It is lightweight and opensource and works well with JS. Dont forget to install JSX plugin !

Source code is available <a href="https://github.com/gpicavet/react-portlet">here</a>. Please follow instructions for building and deploying at the Portlet section.

## nodejs stack and standalone application

* As said, the stack is based on Node. First <a href="https://nodejs.org/en/download/">Install</a> it on your system. It will come with npm, with which you can install js dependencies (works like maven).

* Update npm first ! Current version of npm included in node install is 2.something... Dont use it :) Big improvement has been made in dependencies resolving : it uses flattened strucutre resulting in smaller disk usage and faster build 
{% highlight shell %}
npm install npm@latest -g
{% endhighlight %}

* Create a directory named "react-portlet" and generate a starting package.json file :
{% highlight shell %}
npm init
{% endhighlight %}
Let the default values for this time :)

* Next install the React libraries, plus another one, "moment", to deal with date format later :
{% highlight shell %}
npm install --save react@15.3.1 react-dom@15.3.1 moment
{% endhighlight %}
Note : react has a core part and a specific lib to render to DOM

* Install the babel transpilers as dev dependency :
{% highlight shell %}
npm install --save-dev babel-loader babel-core babel-preset-es2015 babel-preset-react
{% endhighlight %}

* We will need the webpack library in order to gather all the JS modules into a "bundle" file, and also to do some "hot rebuild".
We'll also install the express Http server, in order to quickly test our app in standalone mode.
{% highlight shell %}
npm install –save-dev webpack express
{% endhighlight %}


At this point, package.json has been updated (with the --save argument), and node dependencies installed in "node_modules" directory.
package.json must be added to version control so anyone can build your project.

* A word about project structure, it has to be maven-compliant (keep in mind we have to build a portlet!) :
<pre>
/
├─src
│  ├─main
│  │  ├─java
│  │  ├─js
│  │  ├─webapp
│  │      ├─css
│  │      ├─META-INF
│  │      ├─WEB-INF
│  ├─static
├─package.json
├─pom.xml
</pre>

* Now we can create a first React component "Activities" that will fetch the user's activities from server and transform them into html. But in order to use the modularity of react, lets also create a child Component to render a single activity.
First Create the file "Activities.jsx" in /src/main/js :
{% highlight Javascript %}
import React from 'react';
import ReactDOM from 'react-dom';
import {Activity} from './Activity.jsx';

class Activities extends React.Component {

  constructor(props) {
    super(props);
    this.state = {activities:[]};
  }

  componentDidMount() {
    fetch("/rest/v1/social/activities?limit="+this.props.limit+"&expand=identity",
      {credentials: 'include'})
    .then((res) => {
        return res.json();
      })
    .then((json) => {
       this.setState(json);
    })
  }

  render() {
    var list = this.state.activities.map( (act) => {
      return <Activity key={act.id} {...act} />
    });
    return <ul>{list}</ul>;
  }

}

ReactDOM.render(<Activities limit="10"/>, document.getElementById('app'));
{% endhighlight %}

the file "Activity.jsx" in /src/main/js will be :
{% highlight Javascript %}
import React from 'react';
var moment = require('moment');

export class Activity extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
      var titleHtml = {__html:this.props.title};
      return (
          <li>
              <img src={this.props.identity.profile.avatar===null ? "/eXoSkin/skin/images/system/UserAvtDefault.png":this.props.identity.profile.avatar} />
              <div className="block">
                <div className="header">
                  <strong>{this.props.identity.profile.fullname}</strong>
                  <br/>
                  Posted : <span>{moment(new Date(this.props.createDate)).fromNow()}</span>
                </div>
                <div dangerouslySetInnerHTML={titleHtml}/>
              </div>
             </li>);
  }

}
{% endhighlight %}

We are using the ES6/ES2015 syntax with class inheritance. The React lifecycle in short will : init the state, mount component to DOM, fetch data from API and render.
There's a method corresponding to each lifecycle step. For example doing fetch in componentDidMount is the safest way because of asynchronous update.<br>
Whenever the state is modified, render method is called and check what part of the DOM has to be updated.In the example we wont do actions so state will not be modified.
A good React pattern to use whenever possible, is to manage state at the highest level component (here Activities) and pass data to child components (here Activity) via the "props". So we could replace the Activity class with the react <a href="https://facebook.github.io/react/docs/reusable-components.html#stateless-functions">stateless function</a> pattern, in order to get rid of the useless lifecycle.<br>
Did you Notice the weird attribute "dangerouslySetInnerHTML" ? React is xss proof, but sometimes you have to inject preformated html code. Do it if html has been sanitized server side :)

* Now we create the index.html in /src/static and declare the React mount tag as a simple div :
{% highlight Html %}
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="/css/main.css">
  </head>
  <body>
    <div id="app" class="container"></div>

    <script src="js/bundle.js"></script>
  </body>
</html>
{% endhighlight %}
Note : we include the "bundle.js" script that will be generated with webpack.

* In order to generate the bundle, we declare a file "/src/main/js/index.js" that will import the root component of our app, here Activities :
{% highlight Javascript %}
import Activities from './Activities.jsx';
{% endhighlight %}
Note : Webpack will use this file as an entrypoint from which to pack all the imports.

* Then declare "/webpack.config.js"  :
{% highlight Javascript %}
var path = require('path');
var webpack = require('webpack');

module.exports = {
  devtool : 'cheap-module-source-map',
  entry: './src/main/js/index.js',
  output: { path: path.join(__dirname, 'target/react-portlet/js'),
	    filename: 'bundle.js'},

  module: {
    loaders: [
      {
        test: /.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react']
        }
      }
    ]
  },

  plugins:[
  new webpack.DefinePlugin({
    'process.env':{
      'NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    }
  })]
};
{% endhighlight %}
Here we declare file "index.js" just created before.
Then we define the ouput folder of the bundle.js. This folder is corresponding to maven target dir (it will be usefull later)
Then we define the babel-loader, which takes over the transpilation part.
Define Plugin is just transmitting NODE_ENV variable to loader parser, in order to prune DEV code in React lib at build time.

* Before we run the app, our static files need to be copied to target dir as well, it can be done with scripts in "/package.json" :
{% highlight json %}
"scripts": {
  "copy": "cp -R src/static/* target/static & cp -R src/main/webapp/css target/static"
}
{% endhighlight %}
Note : in a real project, you should consider a library like gulp to externalize complex build tasks and be OS independant!

To call the script :
{% highlight shell %}
npm run copy
{% endhighlight %}

* Next we create the express http server in the file /server.js<br>
Express will manage our standalone mode : it will serve static files (css, js, html) and proxy api requests to static files
{% highlight Javascript %}
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var port       = 3000;  			      // set our port

// REGISTER STATIC FILES -------------------------------
app.use(express.static(__dirname+"/target/static/"));
app.use(express.static(__dirname+"/target/react-portlet/"));

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

router.get('/v1/social/activities', function(req, res) {
    res.set('content-type','application/json; charset=utf8')
    res.sendFile(__dirname+"/target/static/api/activities.json");
});

router.get('/avatar.png', function(req, res) {
    res.sendFile(__dirname+"/target/static/avatar.png");
});

// REGISTER OUR ROUTES -------------------------------
app.use('/rest/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
{% endhighlight %}
Note: you have to record real api responses in static files before (here you can pick in source project).

* Before starting the server, we also want to start webpack in "watch mode" in order to be able to build again on any change. Add a "watch" script with the following commands in /package.json :
{% highlight json %}
"scripts": {
  ...
  "watch": "npm run copy && node node_modules/webpack/bin/webpack.js --progress --colors --watch -d"
}
{% endhighlight %}

Now just type :
{% highlight shell %}
npm run watch
{% endhighlight %}
You should see something like this :
{% highlight shell %}
Hash: 0aed17830ca00bbed3fd
Version: webpack 1.13.2
Time: 4640ms
        Asset     Size  Chunks             Chunk Names
    bundle.js  1.22 MB       0  [emitted]  main
bundle.js.map  1.43 MB       0  [emitted]  main
    + 278 hidden modules
{% endhighlight %}
Look at the size... don't worry it is a not optimized yet !<br>
The map file will map source lines from the generated bundle code to the original es2015 file. It will be downloaded by browser only when you open the debugger !
Note : static files are not watched, you have to restart server. We could improve that by writing a simple gulp script for example, and add it to start script.

* Now start the server
{% highlight shell %}
npm start
{% endhighlight %}
and enjoy the result at <a>http://localhost:3000</a>. It should look like this :
![My helpful screenshot](/assets/screenshot-localhost-3000.png)

* When you're ready to release, you can add the following script in /package.json :
{% highlight javascript %}
"scripts": {
  ...
  "release": "export NODE_ENV=production && webpack -p"
}
{% endhighlight %}
So we set NODE_ENV=production in order to disable React dev mode (it helps a lot, be its a lot slower), and started webpack with optimizers.<br>
After optimization, the bundle will be 3 times smaller:
{% highlight shell %}
Hash: 958d20ab7b77c17c6474
Version: webpack 1.13.2
Time: 8955ms
        Asset       Size  Chunks             Chunk Names
    bundle.js     418 kB       0  [emitted]  main
bundle.js.map  219 bytes       0  [emitted]  main
    + 278 hidden modules
{% endhighlight %}
Note : did you notice few warnings from the optimizer ? Well, library all not always cleaned :)<br>
Important : optimized bundle should not be too big (< 1 Mo), so for large app you can look at webpack's code splitting feature.<br>
Note : you can still debug in original files in production, as map file is also updated !

You're done for that part ! You could use this app outside Exoplatform but you'll have to adapt the proxy routes in server.js to exo backend (easy!) and deal with sso authentication (actually the hard part !)

## Portlet Integration

* To get started, you can look at the source code here : https://github.com/exo-samples/docs-samples/tree/4.3.x/portlet/js. It's a simple javax Portlet that forward to an index.jsp (the view part of the portlet).

* modify index.jsp and only declare a html fragment with "app" mount point :
{% highlight jsp %}
<div class='react-portlet'>
  <div id="app" class="container"></div>
</div>
{% endhighlight %}

* open webapp/WEB-INF/gatein-resources.xml to declare both the bundle.js, as a JS module, and the main.css stylesheet :
{% highlight xml %}
<portlet>
  <name>reactsample</name>
  <module>
    <script>
      <path>/js/bundle.js</path>
    </script>
  </module>
</portlet>

<portlet-skin>
  <application-name>react-portlet</application-name>
  <portlet-name>reactsample</portlet-name>
  <skin-name>Default</skin-name>
  <css-path>/css/main.css</css-path>
</portlet-skin>
{% endhighlight %}
Note : These modules will be automatically loaded by Exoplatform when loading portlet.<br>
There are two main module styles in javascript : AMD and CommonJS. When transpiling ES2015 to ES5, babel replaces imports with CommonJS style. As Exo uses AMD modules it will automatically adapt them. But some libraries require manual adaptation, it would be the case of React if we had to load it apart from the bundle.js.


* now the build part. When we build the portlet, it would be interesting to 1) install JS dependencies and 2) do webpack release. The maven exec plugin will do the job. In the ""/pom.xml":
{% highlight xml %}
<plugins>
  <plugin>
    <groupId>org.codehaus.mojo</groupId>
    <artifactId>exec-maven-plugin</artifactId>
    <version>1.5.0</version>
    <executions>
      <execution>
        <id>npm install</id>
        <phase>generate-resources</phase>
        <goals>
          <goal>exec</goal>
        </goals>
        <configuration>
          <executable>npm</executable>
          <arguments>
            <argument>install</argument>
          </arguments>
        </configuration>
      </execution>
      <execution>
      <id>npm release</id>
      <phase>generate-resources</phase>
      <goals>
        <goal>exec</goal>
      </goals>
      <configuration>
      <executable>npm</executable>
        <arguments>
          <argument>run</argument>
          <argument>${webpack.release}</argument>
        </arguments>
      </configuration>
      </execution>
    </executions>
  </plugin>
</plugins>
{% endhighlight %}
Then simply type :
{% highlight shell %}
mvn clean install
{% endhighlight %}
This will build in dev mode (webpack.release=release-debug)<br>
Just add a profile to build in production mode (set webpack.release=release), so :
{% highlight shell %}
mvn clean install -Pproduction
{% endhighlight %}

# Incompatibility with the gatein minifier

* You'll quickly notice that Non-minified version of React cant bear with gatein minifier (Uses the google closure minifier)! <br>
Actually the only way to disable gatein minifier is running exo in dev mode... not great :)
But there's weird thing : when you minify your bundle with "webpack -p", gatein minifier works !
So the simplest solution is to use the minified version of our bundle.js with exo normal mode, and Non-minified in exo dev mode !
But there's a bad news : you will loose the source mapping because of the double-minification :(
* another solution would be to disable minifier on some libs, and let us build and supply the minified and map files.
Actually you can override the UIPortalApplication.gtmpl script in portal module, filter js paths and remove the "-min" when you need...but it's tricky :)
It would be great if exo/gatein come with a parameter in module definition !
* I've heard about <a href="http://www.webjars.org/">webjars</a>, it's probably a more elegant way. Have to look at it in the future:)


# Deploying

Those who are used to exo can skip this part !

* Requirements : have an exo account, and a JDK 8 installed.
* Then <a href="https://community.exoplatform.com/portal/intranet/downloads">Download</a> the latest community edition of Exo (4.3+), unzip and launch start_eXo script.
* Simply copy the target/react-portlet.war in webapps dir and wait for deployment.
* Log into exo and create a "test" site
* Go to the site, edit the page layout and add the portlet. <br>
You should see something very similar to standalone mode, but its now dynamic (you must have created some activities before)

# Note on docker

* sorry, it doesn't work in an exo container, unless starting it in debug mode i have to look into it

# Sharing common modules :

* When you're developing several portlets it's legitimate to reuse some libs (like React), You may already know that gatein allow you to share modules.
* Before that, edit webpack.config.js, we have to tell webpack to gather React, ReactDOM and moment libs in another bundle, that we're calling the "vendor" bundle :
{% highlight Javascript %}
entry: {
  bundle:'./src/main/js/index.js',
  'vendor-bundle': [
    'react',
    'react-dom',
    'moment'
  ]
}
...
plugins:[
 ...
  new webpack.optimize.CommonsChunkPlugin({
    name: 'vendor-bundle',
    filename: 'vendor-bundle.js',
    minChunks: Infinity
  })
]
{% endhighlight %}
Note : Take a look at chunking. It's a powerfull way to optimize web app first load!

* After rebuilding, you'll see the new size of your bundle !
{% highlight shell %}
Hash: 837db454da54d24ded16
Version: webpack 1.13.2
Time: 6187ms
               Asset     Size  Chunks             Chunk Names
           bundle.js  7.13 kB       0  [emitted]  bundle
    vendor-bundle.js  1.21 MB       1  [emitted]  vendor-bundle
       bundle.js.map  3.69 kB       0  [emitted]  bundle
vendor-bundle.js.map  1.44 MB       1  [emitted]  vendor-bundle
   [0] multi vendor-bundle 52 bytes {1} [built]
    + 278 hidden modules
{% endhighlight %}


* Then declare vendor-bundle.js as a shared module. To keep things simple, we declare it in our portlet, otherwise, you could package it into another war :
{% highlight xml %}
<module>
    <name>vendor</name>
    <script>
      <path>/js/vendor-bundle.js</path>
    </script>
</module>

<portlet>
  <name>reactsample</name>
  <module>
    <script>
      <path>/js/bundle.js</path>
    </script>
    <depends>
      <module>vendor</module>
  </depends>
  </module>
</portlet>
{% endhighlight %}

* Now when you look at the <a href="http://localhost:8080/portal/scripts/4.3.0/PORTLET/react-portlet:reactsample.js">reactsample.js</a> resource downloaded by portlet, it now depends on the shared module :
{% highlight Javascript %}
define('PORTLET/react-portlet/reactsample', ["SHARED/vendor"], function(vendor) {
  ...
{% endhighlight %}


## Conclusion

* We've learned how to set up a standalone JS app based on React and built with a nodejs/npm/es2015//babel/webpack stack. There's a lot of choice here and you could replace some of elements of the stack : npm vs bower, es2015 vs typescript, webpack vs browserify ... each has pros and cons you should be aware of before choosing.
* We've learned how to siply integrate npm and maven to next build a portlet on top of standalone app.
* Unfortunately, exo gatein minifier hates your react code :) even if there's a work around, gatein should really permits lib exclusion from minifier.
* Last words : On a real project you'll have to deal with unit testing.<be>
Just for the record, we're currently using <a href="https://mochajs.org/">Mocha</a> to write tests, <a href="http://phantomjs.org/">Phantomjs</a> as a runtime platform and Istanbul as a coverage tool.
In order to manage complex build tasks you should use a lib like Gulp or Grunt.
