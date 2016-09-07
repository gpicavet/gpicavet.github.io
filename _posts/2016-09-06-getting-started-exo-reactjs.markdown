---
layout: post
title:  "Getting started with ReactJS and Exoplatform portlet development"
date:   2016-09-06 17:38:41 +0200
categories: jekyll update
---

Here is the first post of -i hope- many posts dedicated to web development !

In this article I would like to share a feedback on Exoplatform portal development i'm doing through my job : you'll learn how to set up a simple reactjs/nodejs development stack, to first build a standalone app, and then package that app in a portlet.

But how did we get to React :) ? Exoplatform comes with a portlet framework called Juzu to build interactive client-side UI. While many developers in my organization masterized several frameworks, they were not very comfortable with it. At that time my office was heavily promoting ReactJS...Beside that, Exoplatform portlet does not require a specific technology to build portlet and you can bring yours !
If you dont know React, take a look at https://facebook.github.io/react/ first !

In order to efficiently manage JS library dependencies, we will use nodejs and npm. We'll then use maven to build and package the portlet part.

Though Javascript is cool for simple projects, javascript is not java : it's more painful to build robust javascript mainly because of its lack of a static, strongly type system. Fortunately some standards has emerged from the mess since a few years !
You can now use languages like coffeescript, typescript, ES2015, which also come with syntax improvements. But, except es2015 which is future standard, these languages would not execute in browser, and for es2015 it's not supported evewhere. ReactJS also comes with a syntax called JSX which mix JS and HTML tags, so we'll have to transpile it as well. Babel will be a good guy for that task, and we'll use this time ES2015.

It's time to open your IDE, If you dont have one try <a href="https://atom.io/">Atom</a>. It is lightweight and opensource and works well with JS. Dont forget to install JSX plugin !

# the nodejs stack and standalone application

* As said, the stack is based on Node. First Install it on your system : https://nodejs.org/en/download/. It will come with npm, that will allow us to install js packages (like maven).

* Create a directory named "react-portlet" and generate a starting package.json file :
{% highlight shell %}
npm init
{% endhighlight %}
Let the default values for this time :)

* Next install React lib as a runtime dependency :
{% highlight shell %}
npm install --save react@15.3.1 react-dom@15.3.1
{% endhighlight %}

* Install the babel transpilers as dev dependency :
{% highlight shell %}
npm install --save-dev babel-loader babel-core babel-preset-es2015 babel-preset-react
{% endhighlight %}

* We will need the webpack library in order to gather all our JS modules in a dist file, and to do some "hot rebuild".
We'll also install the express Http server, in order to quickly test our app in standalone mode.
{% highlight shell %}
npm install –save-dev webpack express
{% endhighlight %}

So here we are, package.json has been updated, and node dependencies installed in "node_modules" directory.

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

* Now lets start with the React component. Create a file named "Activities.jsx" in /src/main/js :
{% highlight Javascript %}
import React from 'react';
import ReactDOM from 'react-dom';

class Activities extends React.Component {

  constructor(props) {
    super(props);
    this.state = {activities:[]};
  }

  componentDidMount() {
    fetch("/rest/private/api/social/v1-alpha3/portal/activity_stream/feedByTimestamp.json?limit=5&sinceTime=12345&number_of_comments=5&number_of_likes=5").then(
      (res) => {
        return res.json();
      }
    ).then((json) => {
       this.setState(json);
    })
  }

  render() {
    var list = this.state.activities.map( (act) => {
      var html = {__html:act.title};
      return <div key={act.id} className="item-container">
              <div className="item">
                <div className="header">
                  <h2>{act.posterIdentity.profile.fullName}</h2>
                  <date>{new Date(act.postedTime).toString()}</date>
                </div>
                <div dangerouslySetInnerHTML={html}/>
              </div>
             </div>
    });
    return <div>{list}</div>;
  }
}

ReactDOM.render(<Activities/>, document.getElementById('app'));
{% endhighlight %}

So we are using the ES6/ES2015 syntax with class inheritance. The React lifecycle is simple : init the state in constructor, mounting a component to DOM, fetch data from API and render.
Doing fetch in componentDidMount is safest way because of asynchronous update.
React is actually no more than a transform from a state to the DOM. Whenever state is modified, render method is called and check what part of the DOM has to be updated.
A note about state initialization : in standalone mode, we want to proxy the api uri to a static json file. See the server.js for that.
Did you Notice the weird attribute "dangerouslySetInnerHTML" ? React is xss proof, but sometimes you have to inject preformated html code. Do it if html has been sanitized server side :)

* Create a index.html in /src/static and declare the React mount tag as a simple div :
{% highlight Html %}
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="/css/main.css">
  </head>
  <body>
    <div id="app"></div>

    <script src="js/bundle.js"></script>
  </body>
</html>
{% endhighlight %}
We also load script of generated bundle.js. Path is relative to server root.

* In order to make webpack grabs all js/jsx modules, declare a file "index.js" in /src/main/js  :
{% highlight Javascript %}
import Hello from './Activities.jsx';
{% endhighlight %}
It will create a final "bundle.js" in the directory of your choice. But we want it in the target directory generated by maven
Finally add the script in index.html :

* declare a minimum webpack config "webpack.config.js" in /, that will resolve the imports with babel-loader and generate a bundle.js in target dir :
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
  }
};
{% endhighlight %}

* To build the app, open package.json and add a node "install" that will chain the following commands :
It will simply copy our static resources in target/
{% highlight json %}
"scripts": {
  "install": "mkdir -p target/static & cp -R src/static/* target/static & cp -R src/main/webapp/css target/static"
}
{% endhighlight %}
Note : in a real project, you should use a build library like gulp to externalize complex build tasks
{% highlight shell %}
npm install
{% endhighlight %}

* Next we create a server.js in /, that will allow to test in standalone mode :
This will serve static files (css, js, html) and proxy api to a mock.
{% highlight Javascript %}
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var port       = 8080;  			      // set our port

// REGISTER STATIC FILES -------------------------------
app.use(express.static(__dirname+"/target/static/"));
app.use(express.static(__dirname+"/target/react-portlet/"));

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

router.get('/social/v1-alpha3/portal/activity_stream/feedByTimestamp.json', function(req, res) {
    res.set('content-type','application/json; charset=utf8')
    res.sendFile(__dirname+"/target/static/api/feedByTimestamp.json");
});

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
app.use('/rest/private/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
{% endhighlight %}

* To start the app, add a node "start" with the following commands :
{% highlight json %}
"scripts": {
  ...
  "start": "webpack --watch & node server.js"
}
{% endhighlight %}
It will start webpack in "watch mode" (ie it automatically rebuilds after a resource modification), and the express server
{% highlight shell %}
npm start
{% endhighlight %}
You should see something like this :
{% highlight shell %}
Hash: 25c3e3b136aa3745a9f9
Version: webpack 1.13.2
Time: 4068ms
        Asset    Size  Chunks             Chunk Names
    bundle.js  742 kB       0  [emitted]  main
bundle.js.map  861 kB       0  [emitted]  main
    + 173 hidden modules
{% endhighlight %}
Look at the size... don't worry it is a not optimized yet !
The map file will map source lines from the generated bundle code to the original es2015 file ! It will be downloaded by browser when you click in console.

* To see the result : http://localhost:8080

* When you're ready to release, you can add the following part in webpack config in order to generate a lighter file (and to disable React dev mode):
{% highlight javascript %}
plugins: [
  new webpack.DefinePlugin({
    'process.env': {
      'NODE_ENV': JSON.stringify('production')
    }
  })
]
{% endhighlight %}
Note : you can still debug in original files as map file is also updated.

# Portlet Integration

OK we will now package the component in a Portlet.

* To get started, you can pick resources in the sample available here : https://github.com/exo-samples/docs-samples/tree/4.3.x/portlet/js. It's a simple javax Portlet that forward to an index.jsp (the view of the portlet).

* index.jsp will be very similar to index.html :
{% highlight jsp %}
<div class='react-portlet'>
  <h2>The React Portlet</h2>
  <div id="app"></div>
</div>
{% endhighlight %}

* But as it's an html fragment, you dont include scripts and let exo load js and css. Instead we declare the bundle.js and main.css in the gatein-resources.xml as js modules :
{% highlight xml %}
<portlet>
  <name>react-portlet</name>
  <module>
    <script>
      <path>/js/bundle.js</path>
    </script>
  </module>
</portlet>
<portlet-skin>
  <css-path>/css/main.css</css-path>
</portlet-skin>
{% endhighlight %}

* now the build part. When we build the portlet with maven, we also want webpack to build the JS. A simple way is to call webpack inside an exec plugin in the pom.xml:
{% highlight shell %}
mvn clean install
{% endhighlight %}

* To initialize the npm packages on a clean project with maven, dont forget to call "npm install".
But we can better define a profile "init" that will exec the command automatically :
{% highlight shell %}
mvn clean install -Pinit
{% endhighlight %}

* To deploy on exo, simply copy the target/react-portlet.war in webapps dir.
Note : you can use Docker to easily get and run the latest exo distribution :
{% highlight shell %}
docker run -p 8080:8080 --name=exo exoplatform/exo-community:latest
{% endhighlight %}
Then copy the war to the running container and wait for deployment :
{% highlight shell %}
docker cp target/react-portlet.war exo:/opt/exo/current/webapps
{% endhighlight %}

* Log to exo and create a "test" site

* Go to the site, edit page layout and add the portlet. You should see that result :

# Going further :

* When you have several portlet, you'll want to share React lib. Simply declare it as a module in a theme extension.
Then you'll have to tell webpack to exclude React from dist and provided as JS module. Simply declare it as external library in config :
{% highlight javascript %}
external
{
    externals: {
        "react": "react"
    }
}
{% endhighlight %}

* The stack can be expanded with unit-test lib. As an example, we were using Mocha to write tests, Phantomjs as a runtime platform and Istanbul as a coverage tool.
