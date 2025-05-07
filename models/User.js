const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: String, required: true, unique: true },  // Índice único
  photo: { type: String, default: 'uploads/semperfil.jpg'},   // Caso não tenha foto, será esta a foto,
  email: { type: String, required: true, unique: true },    // Índice único
  password: { type: String, required: true },
  role: { type: String, default: "user" },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
