const index = (req, res) => {
    res.render('index', { titulo: 'Servicios de emergencia' });
};

module.exports = { index };