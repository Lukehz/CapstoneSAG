const verificarAutenticacion = (role) => {
    return (req, res, next) => {
        if (!req.session.usuario) {
            return res.status(401).json({ message: 'Acceso no autorizado' });
        }
        if (role && req.session.usuario.role !== role) {
            return res.status(403).json({ message: 'Acceso denegado' });
        }
        next();
    };
};

module.exports = {
    verificarAutenticacion,
};
