const mongoose = require('mongoose')

const RecomecoSchema = new mongoose.Schema({
  ocorrencia:   String,
  tecnicas:     [{ label: String, value: String }],
  locais:       [String],
  disciplinas:  [{ label: String, value: String }]
})

module.exports = mongoose.model('Recomeco', RecomecoSchema)
