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

* Next install the React libs, plus moment to deal with date format later :
{% highlight shell %}
npm install --save react@15.3.1 react-dom@15.3.1 moment
{% endhighlight %}
Note : react has a core part and a specific lib to render to DOM

* Install the babel transpilers as dev dependency :
{% highlight shell %}
npm install --save-dev babel-loader babel-core babel-preset-es2015 babel-preset-react
{% endhighlight %}

* We will need the webpack library in order to gather all our JS modules in a dist file, and to do some "hot rebuild".
We'll also install the express Http server, in order to quickly test our app in standalone mode.
{% highlight shell %}
npm install –save-dev webpack express
{% endhighlight %}

At this point, package.json has been updated (with --save), and node dependencies installed in "node_modules" directory.
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

* Now we can create a first React component "Activities" that will fetch the activities json and convert it to html. But in order to use the modularity of react, lets also create a child Component "Activity" to render the activity.
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
    fetch("/rest/api/social/v1-alpha3/portal/activity_stream/feedByTimestamp.json?limit=5&number_of_comments=5&number_of_likes=5",
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

ReactDOM.render(<Activities/>, document.getElementById('app'));
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
      var html = {__html:this.props.title};
      return (
          <li>
              <img src={this.props.posterIdentity.profile.avatarUrl} />
              <div className="block">
                <div className="header">
                  <strong>{this.props.posterIdentity.profile.fullName}</strong>
                  <br/>
                  Posted : <span>{moment(this.props.postedTime).fromNow()}</span>
                </div>
                <div dangerouslySetInnerHTML={html}/>
              </div>
             </li>);
  }

}
{% endhighlight %}

We are using the ES6/ES2015 syntax with class inheritance. The React lifecycle is simple : init the state in constructor, mounting a component to DOM, fetch data from API and render.
Doing fetch in componentDidMount is safest way because of asynchronous update.<br>
React is actually no more than a transform from a state to the DOM. Whenever state is modified, render method is called and check what part of the DOM has to be updated.
A note about state initialization : in standalone mode, we want to proxy the api uri to a static json file. See the server.js for that.<br>
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
    <div id="app" class="container"></div>

    <script src="js/bundle.js"></script>
  </body>
</html>
{% endhighlight %}
We also load script of generated bundle.js. Path is relative to server root.

* In order to make webpack grabs all js/jsx modules, declare a file "index.js" in /src/main/js  :
{% highlight Javascript %}
import Activities from './Activities.jsx';
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
var port       = 3000;  			      // set our port

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
app.use('/rest/api', router);

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
It will start webpack in "watch mode" (ie it automatically rebuilds after a resource modification), and the express server. Now type :
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

* To see the result : <a>http://localhost:3000</a>. It should be something like this :
![My helpful screenshot](/assets/screenshot-localhost-3000.png)

* When you're ready to release, you can add the following part in webpack config in order to disable React dev mode :
{% highlight javascript %}
plugins: [
  new webpack.DefinePlugin({
    'process.env': {
      'NODE_ENV': JSON.stringify('production')
    }
  })
]
{% endhighlight %}
You'll have to launch a webpack with production mode as well :
{% highlight shell %}
webpack -p
{% endhighlight %}
Note : you can still debug in original files as map file is also updated.

# Portlet Integration

* To get started, you can pick resources in the sample available here : https://github.com/exo-samples/docs-samples/tree/4.3.x/portlet/js. It's a simple javax Portlet that forward to an index.jsp (the view of the portlet).

* index.jsp will be very similar to index.html :
{% highlight jsp %}
<div class='react-portlet'>
  <div id="app"></div>
</div>
{% endhighlight %}

* open webapp/WEB-INF/gatein-resources.xml to declare the bundle.js as a js modules, and the stylesheet main.css :
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
Note : there are two main module styles in javascript : AMD and CommonJS. When transpiling ES2015 to ES5, babel replaces imports with CommonJS style. As Exo uses AMD modules it will automatically adapt them. But some libraries will require some manual adaptation.


* now the build part. When we build the portlet, it would be interesting to also build the JS. A simple way is to call webpack inside an exec plugin in the pom.xml:
{% highlight xml %}
<plugins>
  <plugin>
    <groupId>org.codehaus.mojo</groupId>
    <artifactId>exec-maven-plugin</artifactId>
    <version>1.5.0</version>
    <executions>
      <execution>
        <phase>generate-resources</phase>
        <goals>
          <goal>exec</goal>
        </goals>
      </execution>
    </executions>
    <configuration>
      <executable>webpack</executable>
      <arguments>
        <argument>${webpack.args}</argument>
      </arguments>
    </configuration>
  </plugin>
</plugins>
{% endhighlight %}
Then simply type :
{% highlight shell %}
mvn clean install
{% endhighlight %}
To build in production mode (webpack -p):
{% highlight shell %}
mvn clean install -Pproduction
{% endhighlight %}

* dont forget to call "npm install" on a clean project to install npm dependencies .
But you'd better integrate to maven in an "init" profile for example :
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
* Go to the site, edit the page layout and add the portlet. <br>
You should see something very similar to standalone mode, but its now dynamic (you must have some activities in your stream!) :

# Going further :

* When you have several portlets, you'll want to declare React as a gatein shared module. You can simply declare it as a module in a theme extension.
Then you'll have to tell webpack to exclude React from the bundle, that's the role of "externals" in config :
{% highlight javascript %}
external
{
    externals: {
        "react": "react"
    }
}
{% endhighlight %}

* The stack can be expanded with unit-test lib. As an example, we were using Mocha to write tests, Phantomjs as a runtime platform and Istanbul as a coverage tool.
