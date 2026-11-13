const Categoria = require('../models/categoria.model');

const index = async (req, res) => {
    try {
        const categorias = await Categoria.getAll();
        res.render('categorias/index', { categorias });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener las categorías');
    }
};

const show = async (req, res) => {
    try {
        const categoria = await Categoria.getById(req.params.id);
        if (!categoria) {
            return res.status(404).send('Categoría no encontrada');
        }
        res.render('categorias/show', { categoria });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener el detalle de la categoría');
    }
};

const createForm = (req, res) => {
    res.render('categorias/create', { error: null, categoria: {} });
};

const store = async (req, res) => {
    const name = (req.body.name || '').trim();
    const description = (req.body.description || '').trim();

    if (!name) {
        return res.status(400).render('categorias/create', {
            error: 'El nombre de la categoría es obligatorio.',
            categoria: { name, description }
        });
    }

    try {
        await Categoria.create({ name, description });
        res.redirect('/categorias');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al guardar la categoría');
    }
};

const editForm = async (req, res) => {
    try {
        const categoria = await Categoria.getById(req.params.id);
        if (!categoria) {
            return res.status(404).send('Categoría no encontrada');
        }
        res.render('categorias/edit', { categoria, error: null });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar la categoría');
    }
};

const update = async (req, res) => {
    const { id } = req.params;
    const name = (req.body.name || '').trim();
    const description = (req.body.description || '').trim();

    if (!name) {
        return res.status(400).render('categorias/edit', {
            categoria: { id, name, description },
            error: 'El nombre de la categoría es obligatorio.'
        });
    }

    try {
        await Categoria.update(id, { name, description });
        res.redirect('/categorias');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al actualizar la categoría');
    }
};

const deleteForm = async (req, res) => {
    try {
        const categoria = await Categoria.getById(req.params.id);
        if (!categoria) {
            return res.status(404).send('Categoría no encontrada');
        }
        res.render('categorias/delete', { categoria });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar la confirmación');
    }
};

const destroy = async (req, res) => {
    try {
        await Categoria.remove(req.params.id);
        res.redirect('/categorias');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al eliminar la categoría');
    }
};

module.exports = {
    index,
    show,
    createForm,
    store,
    editForm,
    update,
    deleteForm,
    destroy
};