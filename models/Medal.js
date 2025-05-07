// backend/models/Medal.js
const mongoose = require('mongoose');

const medalSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:     { type: String, enum: ['gold', 'silver', 'bronze'], required: true },
  weekStart:{ type: Date, default: () => {
                // semana começa na segunda-feira dessa data
                const d = new Date();
                const day = d.getDay(); // 0=Domingo,1=Segunda...
                const diff = (day + 6) % 7; 
                d.setDate(d.getDate() - diff);
                d.setHours(0,0,0,0);
                return d;
             }}
});

module.exports = mongoose.model('Medal', medalSchema);
