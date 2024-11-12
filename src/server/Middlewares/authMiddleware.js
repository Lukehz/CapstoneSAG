const verificarAutenticacion = (roles) => {
    return (req, res, next) => {
        if (!req.session.usuario) {
            return res.status(401).json({ message: 'Acceso no autorizado' });
        }
        if (roles && !roles.includes(req.session.usuario.role)) {
            return res.status(403).json({ message: 'Acceso denegado' });
        }
        next();
    };
};

module.exports = {
    verificarAutenticacion,
};
