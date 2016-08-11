import 'bootstrap/dist/css/bootstrap.css'
import 'font-awesome/css/font-awesome.css'
import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App'
import Hello from './components/Hello'
import Survey from './components/Survey'

// very simple markdown to html converter. Tries to output correct HTML by not allowing many kinds of nesting.
// Specifically, the order of nesting matters. For example '**//nesting//**'' works, but '//**nesting**//' doesn't.
// This helps because it will deal nicely with bad markdown like '**//nesting**//' (which will become
// '<strong>//nesting</strong>//')
Vue.filter('simpleMarkdown', function (markdown) {
  // TODO: To support some kinds of markdown (like lists), we should first split the string into lines,
  // and then work on each line separately. Later, when rejoining, empty lines should be replaced by
  // </p><p>
  return '<p>' +
    _.escape(markdown)

    // Note that we remove \n\n, so using '= ', etc. in the last line of a paragraph does not work
    .replace('\n\n', '</p><p>')

    // Headers
    .replace(/== ([^<>]*?)\n/g, '<h2>$1</h2>')
    .replace(/= ([^<>]*?)\n/g, '<h1>$1</h1>')

    // Text decoration
    .replace(/\*\*([^<>]*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\/\/([^<>]*?)\/\//g, '<em>$1</em>') +
    '</p>'
})

Vue.use(VueRouter)

var router = new VueRouter()

router.map({
  '/': {
    component: Hello
  },
  '/survey': {
    component: Survey
  }
})

const initialized = false

router.beforeEach(function ({to, next, redirect}) {
  if (!initialized && !_.startsWith(to.path, '/survey')) {
    redirect('/survey?source=/static/intro.json')
  } else {
    next()
  }
})

router.start(App, 'body')
