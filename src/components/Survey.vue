<template>
  <!-- Spinner -->
  <div v-if="loading" class="loading">
  Loading survey &#8230;
  </div>

  <progress class="progress" :value="percentComplete" max="100" id="surveyprogress"></progress>
  <small>{{percentComplete}}% complete</small>

  <p>{{{text | simpleMarkdown}}}</p>

  <form>
    <div v-if="textfields.length>0">
      <div v-for="item in textfields" class="form-group">
        <label for="'tf' + $index">{{item.label}}</label>
        <input id="'tf' + $index" type="text" v-model="answers[$index+textAnswerIdx]" :default="item.default">
      </div>
    </div>
    <div v-if="numberfields.length>0">
      <div v-for="item in numberfields" class="form-group">
        <label for="'nf' + $index">{{item.label}}</label>
        <input id="'nf' + $index" type="number" number v-model="answers[$index+textAnswerIdx]" :min="item.min || 0" :max="item.max || 10" :value="item.default || item.min || 1">
      </div>
    </div>
    <div v-if="checkboxes.length>0" class="row">
      <div v-for="item in checkboxes" class="col-sm-6 form-check">
        <toggle-box type="check" :label="item.label" :checked="answers[$index]" v-on:click="this.answers.$set($index, !this.answers[$index])"></toggle-box>
      </div>
    </div>
    <div v-if="radioboxes.length>0" class="row">
      <div v-for="item in radioboxes" class="col-sm-6 form-check">
        <toggle-box type="radio" :label="item.label" :checked="answers[checkboxes.length] == $index" v-on:click="answers.$set(checkboxes.length, $index)"></toggle-box>
      </div>
    </div>
  </form>
  <div class="row">
    <div class="col-sm-6">
      <button type="button" class="btn btn-secondary" v-on:click="advancePage(-1)"
        :disabled="!canGoBack">
        <i class="fa fa-arrow-left" aria-hidden></i>
        Back
      </button>
    </div>
    <div class="col-sm-6">
      <button type="button" class="btn btn-primary" v-on:click="advancePage(1)"
        :disabled="!canGoNext">
        Next
        <i class="fa fa-arrow-right" aria-hidden></i>
      </button>
    </div>
  </div>
</template>

<script>
import ToggleBox from './togglebox'

// Generic utility function that returns true, if the first object is a subset of the second object
function isSubset (subset, superset) {
  return !(_.some(subset, (value, key) => !(_.has(superset, key) && superset[key] === value)))
}

export default {
  components: {ToggleBox},
  data () {
    return {
      loading: true,  // show the dimmer?
      survey: {title: '', forms: []},     // The complete survey
      state: {idx: -1, answers: []},      // The current state of the survey
                                          // This is also the result

      // The elements of the current form
      text: '',     // Current form text
      checkboxes: [],
      radioboxes: [],
      textfields: [],
      numberfields: [],
      answers: []       // Answers to the questions of the current form
    }
  },
  computed: {
    // If the answers array contains radio boxes, this is theindex of the selection
    // Note: As this is always identical to this.checkboxes.length, this function is
    // not needed. It is only here to make the code a bit more readable
    radioAnswerIdx () { return this.checkboxes.length },

    // If the answers array contains text answers, this is the first index of them
    textAnswerIdx () {
      return this.radioAnswerIdx + (this.radioboxes.length > 0 ? 1 : 0)
    },

    // If the answers array contains number answers, this is the first index of them
    numberAnswerIdx () {
      return this.textAnswerIdx + this.textfields.length
    },

    canGoBack () { return !this.loading && this.state.idx > 0 },

    canGoNext () {
      return !this.loading && this.state.idx < this.survey.forms.length - 1 &&      // there is a next page
      (this.radioboxes.length === 0 || this.answers[this.checkboxes.length] !== -1) // AND all mandatory fields are answered
    },

    percentComplete () { return Math.ceil(this.state.idx * 100 / (this.survey.forms.length - 1)) }
  },
  methods: {

    // dir = +1: go to next page whose precondition is met
    // dir = -1: go to previous page whose precondition is met
    // dir =  0: stay on this page, if its precondition is met else go to the next page whose precondition is met
    advancePage (dir) {
      // Local function that determines if the precondition of the
      // form with index idx is currently fulfilled
      var preConditionOkay = (idx) => {
        if (!_.has(this, 'survey')) console.log('uh oh something odd happened :-(')

        // if the given form has no precondition or if there is
        // no such form, return true
        if (!_.has(this.survey, 'forms[' + idx + '].pre')) return true

        const pre = this.survey.forms[idx].pre

        // Evaluate the precondition(s):
        // For an array, the precondition is matched if any of the objects is completely contained in the state
        return _.isArray(pre) ? _.some(pre, (conjunction) => isSubset(conjunction, this.state)) : isSubset(pre, this.state)
      }

      let idx = this.state.idx + dir

      // if the idx is to be changed (which is always except at the first page, when this function is called dir = 0), save the old answers to the state and evaluate the "set"-clauses of the controls to update the state
      if (dir) {
        this.state.answers.$set(this.state.idx, this.answers.length === 1 ? this.answers[0] : this.answers)

        // Execute the variable assignments encoded in the "set" directives
        let assignments = {}

        // Assign variables for the textfields
        _.forEach(this.textfields, (textfield, index) => {
          if (_.has(textfield, 'set')) {
            assignments[textfield.set] = this.answers[index + this.textAnswerIdx]
          }
        })

        // Assign variables for the textfields
        _.forEach(this.numberfields, (numberfield, index) => {
          if (_.has(numberfield, 'set')) {
            assignments[numberfield.set] = this.answers[index + this.numberAnswerIdx]
          }
        })

        // Assign variables for the selection of the radio button
        if (this.radioboxes.length > 0 && _.has(this.radioboxes[this.answers[this.radioAnswerIdx]], 'set')) {
          _.extend(assignments, this.radioboxes[this.answers[this.radioAnswerIdx]].set)
        }

        this.state = _.extend(this.state, assignments)
      } else {
        dir = 1
      }

      // as long as the precondition of idx is not met, advance to
      // the next one
      // Initialize the form
      while (!preConditionOkay(idx)) {
        // The question is not asked, so set the answer to -1
        // Note: This will also delete anything that may have been
        // answered here in the past (when the precondition was asked)
        if (dir === 1) this.state.answers.$set(idx, -1)
        idx += dir
      }

      if (idx > this.survey.forms.length) { idx = this.survey.forms.length - 1 }
      if (idx < 0) { idx = 0 }

      // Go to the page and fill in values
      this.state.idx = idx
      const form = this.survey.forms[idx]
      this.text = form.prompt
      this.checkboxes = form.check || []
      this.radioboxes = form.radio || []
      this.textfields = form.text || []
      this.numberfields = form.number || []
      this.answers = _.fill(new Array(this.checkboxes.length), false)
      if (this.radioboxes.length > 0) { this.answers.$set(this.checkboxes.length, -1) }
      if (this.textfields.length > 0) { this.answers = _.extend(this.answers, _.map(form.text, (textfield) => textfield.default)) }
    }
  },

  created () {
    const source = this.$route.query.source

    if (_.isUndefined(source) || !_.isString(source) || source === '') {
      this.text = '= Error\nNo survey was specified.'
      this.loading = false
      return
    }

    // TODO: Load the last state and go to the first unanswered question
    // Load the form,  got to first question
    $.get(source)
    .done((data) => {
      // Manually fill in all relevant fields
      this.survey = {title: data.title || '', forms: data.forms}

      // set initial state
      // TODO: Load it
      this.state.idx = 0

      this.advancePage(0)
    })
    .fail(() => {
      this.text = '= Error\nUnfortunately, there was an error loading the survey. Please verify that the link that you clicked on was valid and that the server that is supposed to serve the survey data works.'
    })
    .always(() => {
      // At this point, the form has been filled with data,
      // either from the survey, or with an error message.
      // Either way, we can hide the dimmer and show the content.
      this.loading = false
    })
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1 {
  color: #42b983;
}
</style>


<!-- Spinner code taken from https://codepen.io/MattIn4D/pen/LiKFC //-->
<style>
/* Absolute Center Spinner */
.loading {
  position: fixed;
  z-index: 999;
  height: 2em;
  width: 2em;
  overflow: show;
  margin: auto;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}

/* Transparent Overlay */
.loading:before {
  content: '';
  display: block;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.3);
}

/* :not(:required) hides these rules from IE9 and below */
.loading:not(:required) {
  /* hide "loading..." text */
  font: 0/0 a;
  color: transparent;
  text-shadow: none;
  background-color: transparent;
  border: 0;
}

.loading:not(:required):after {
  content: '';
  display: block;
  font-size: 10px;
  width: 1em;
  height: 1em;
  margin-top: -0.5em;
  -webkit-animation: spinner 1500ms infinite linear;
  -moz-animation: spinner 1500ms infinite linear;
  -ms-animation: spinner 1500ms infinite linear;
  -o-animation: spinner 1500ms infinite linear;
  animation: spinner 1500ms infinite linear;
  border-radius: 0.5em;
  -webkit-box-shadow: rgba(0, 0, 0, 0.75) 1.5em 0 0 0, rgba(0, 0, 0, 0.75) 1.1em 1.1em 0 0, rgba(0, 0, 0, 0.75) 0 1.5em 0 0, rgba(0, 0, 0, 0.75) -1.1em 1.1em 0 0, rgba(0, 0, 0, 0.5) -1.5em 0 0 0, rgba(0, 0, 0, 0.5) -1.1em -1.1em 0 0, rgba(0, 0, 0, 0.75) 0 -1.5em 0 0, rgba(0, 0, 0, 0.75) 1.1em -1.1em 0 0;
  box-shadow: rgba(0, 0, 0, 0.75) 1.5em 0 0 0, rgba(0, 0, 0, 0.75) 1.1em 1.1em 0 0, rgba(0, 0, 0, 0.75) 0 1.5em 0 0, rgba(0, 0, 0, 0.75) -1.1em 1.1em 0 0, rgba(0, 0, 0, 0.75) -1.5em 0 0 0, rgba(0, 0, 0, 0.75) -1.1em -1.1em 0 0, rgba(0, 0, 0, 0.75) 0 -1.5em 0 0, rgba(0, 0, 0, 0.75) 1.1em -1.1em 0 0;
}

/* Animation */

@-webkit-keyframes spinner {
  0% {
    -webkit-transform: rotate(0deg);
    -moz-transform: rotate(0deg);
    -ms-transform: rotate(0deg);
    -o-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    -moz-transform: rotate(360deg);
    -ms-transform: rotate(360deg);
    -o-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
@-moz-keyframes spinner {
  0% {
    -webkit-transform: rotate(0deg);
    -moz-transform: rotate(0deg);
    -ms-transform: rotate(0deg);
    -o-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    -moz-transform: rotate(360deg);
    -ms-transform: rotate(360deg);
    -o-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
@-o-keyframes spinner {
  0% {
    -webkit-transform: rotate(0deg);
    -moz-transform: rotate(0deg);
    -ms-transform: rotate(0deg);
    -o-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    -moz-transform: rotate(360deg);
    -ms-transform: rotate(360deg);
    -o-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
@keyframes spinner {
  0% {
    -webkit-transform: rotate(0deg);
    -moz-transform: rotate(0deg);
    -ms-transform: rotate(0deg);
    -o-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    -moz-transform: rotate(360deg);
    -ms-transform: rotate(360deg);
    -o-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
</style>
