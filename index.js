require('dotenv').config({ quiet: true });
const path = require('path');
const express = require('express');
const layout = require('express-ejs-layouts');
const methodOverride = require('method-override');

const mainRouter = require('./src/routes/main.router');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));
app.use(layout);
app.set('layout', 'layouts/layouts');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

app.use('/', mainRouter);

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});