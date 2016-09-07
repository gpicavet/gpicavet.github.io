---
layout: post
title:  "Getting started with ReactJS and Exoplatform portlet development"
date:   2016-09-06 17:38:41 +0200
categories: jekyll update
---

Here is the first post of -i hope- many posts dedicated to web development !

I would like to share a feedback on Exoplatform portal development recently achieved through my job.

Exoplatform comes with a portlet framework called Juzu to build interactive client-side UI. While many developers in my organization masterized several frameworks, they were not very comfortable with it. But thanks to exoplatform design, portlet does not require a specific technology, so We decided to develop frontend with ReactJS.
If you dont know <a href="https://facebook.github.io/react/">ReactJS</a>, it is a cool javascript/nodejs library that makes it easy to develop Web UI thanks to a component-based model. Easy because there's only few concepts to learn, compared with AngularJS another popular framework.
Though Javascript is cool for simple projects, it would become painful in enterprise if you dont have the right tools. Fortunately the platform has gained maturity since the last years and you're no more a man vs wild !

This article focus on a simple ReactJS component that display the portal activity stream. We will see how to set up an efficient and robust development environment, and how it integrates with portlet.

Project sources are available <a href="https://github.com/gpicavet/react-portlet">in my repo</a>


In order to efficiently manage JS library dependencies, we will use nodejs and npm. We'll use maven to build and package the portlet part.

In order to reach the robust part, we have to choose a strongly type language. That's the purpose of several language like coffeescript, typescript, ES2015, which also come with a bunch of syntax improvement. But the common problem is browser support. In order to work with all browsers, we'll have to "transpile" our code to vanilla JS. ReactJS also comes with a syntax called JSX which mix JS and HTML tags, so we'll have to transpile it as well. Babel will be a good guy for that task, and we'll use this time ES2015.

One last thing before we start : If you dont have one, it's a good way to look at a lightweight and opensource IDE that works well with JS : <a href="https://atom.io/">Atom</a>.

* Now you can install Node (which comes with npm) on your system : https://nodejs.org/en/download/

* Create a directory named "react-portlet" and generate a basic package.json file :
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

* Now you can see the result at http://localhost:8080


* We are ready to start Portlet Part ! We will use the standard java API. Actually I will not detail portlet definition as you can get a sample project here : https://github.com/exo-samples/docs-samples/tree/4.3.x/portlet/js/src/main/webapp
We have to declare the bundle in gatein-resources.xml
Add an index.jsp that do the same thing as index.html
And we now want to build the JS bundle with maven. A simple way is to call webpack in an exec plugin :


* If you want to declare React and other libs as Exo Resources, how to tell webpack to exclude them from dist ? simply declare them as external library in config :
