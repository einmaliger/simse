<template>
  <div class="ui segment">
    <!-- Spinner -->
    <div class="ui inverted dimmer" v-bind:class="{'active': loading}">
      <div class="ui text loader">Loading Survey</div>
    </div>

    <div class="ui progress" data-percent="74"><div class="bar"></div></div>
    <div class="label">{{state.idx}} of {{survey.forms.length-1}} ({{percentComplete}}) forms complete</div>


    <p>{{{text | simpleMarkdown}}}</p>

    <div class="ui two column grid container">
      <div v-if="textfields.length>0" class="one column row">
        <div v-for="item in textfields" class="column">
          {{item.label}}
          <input v-model="answers[$index+textAnswerIdx]" :default="item.default">
        </div>
      </div>
      <div v-if="checkboxes.length>0" class="row">
        <div v-for="item in checkboxes" class="column">
          <toggle-box type="check" :label="item.label" :checked="answers[$index]" v-on:click="this.answers.$set($index, !this.answers[$index])"></toggle-box>
        </div>
      </div>
      <div v-if="radioboxes.length>0" class="row">
        <div v-for="item in radioboxes" class="column">
          <toggle-box type="radio" :label="item.label" :checked="answers[checkboxes.length] == $index" v-on:click="answers.$set(checkboxes.length, $index)"></toggle-box>
        </div>
      </div>
    </div>
    <div class="ui two column grid">
      <div class="left floated column">
        <button class="ui left labeled icon button" v-on:click="advancePage(-1)" v-bind:class="{'disabled': !canGoBack}">
          <i class="left arrow icon"></i>
          Back
        </button>
      </div>
      <div class="right floated column">
        <button class="ui right labeled icon button" v-on:click="advancePage(1)" v-bind:class="{'disabled': !canGoNext}" >
          <i class="right arrow icon"></i>
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import ToggleBox from './togglebox'

// for an array, the precondition is matched if any of the objects is completely contained in the state
function isSubset (subset, superset) {
  return !(_.some(subset, (value, key) => !(_.has(superset, key) && superset[key] === value)))
}

export default {
  components: {ToggleBox},
  props: {
    // An url that is passed to $.get to retrieve the survey in the form of a JSON string
    source: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      loading: true,  // show the dimmer?
      survey: {title: '', forms: []},     // The complete survey
      state: {idx: -1, answers: []},

      // The elements of the current form
      text: '',     // Current form text
      checkboxes: [],
      radioboxes: [],
      textfields: [],
      answers: []       // Answers to the questions of the current form
    }
  },
  computed: {
    // If the answers array contains text answers, this is the first index of them
    textAnswerIdx () {
      return this.checkboxes.length + (this.radioboxes.length > 0 ? 1 : 0)
    },
    canGoBack () { return !this.loading && this.state.idx > 0 },
    canGoNext () {
      return !this.loading && this.state.idx < this.survey.forms.length - 1 &&      // there is a next page
      (this.radioboxes.length === 0 || this.answers[this.checkboxes.length] !== -1) // AND all mandatory fields are answered
    },
    percentComplete () { return '' + Math.ceil(this.state.idx * 100 / (this.survey.forms.length - 1)) + '%' }
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

        // Evaluate the precondition(s)
        return _.isArray(pre) ? _.some(pre, (conjunction) => isSubset(conjunction, this.state)) : isSubset(pre, this.state)
      }

      let idx = this.state.idx + dir

      // if the idx is to be changed (which is always except at the first page), save the old answers to the state
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

        // Assign variables for the selection of the radio button
        if (this.radioboxes.length > 0 && _.has(this.radioboxes[this.answers[this.checkboxes.length]], 'set')) {
          _.extend(assignments, this.radioboxes[this.answers[this.checkboxes.length]].set)
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
      this.answers = _.fill(new Array(this.checkboxes.length), false)
      if (this.radioboxes.length > 0) { this.answers.$set(this.checkboxes.length, -1) }
      if (this.textfields.length > 0) { this.answers = _.extend(this.answers, _.map(form.text, (textfield) => textfield.default)) }
    }
  },
  created () {
    // Load the form,  got to first question
    // TODO: Load the last state and go to the first unanswered question
    $.get(this.source)
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
