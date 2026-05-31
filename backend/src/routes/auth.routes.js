const { Router }                                                                               = require('express');
const { register, login, verificarEmail, verificarCodigo, reenviarCodigo, updatePerfil, eliminarCuenta } = require('../controllers/auth.controller');
const { verifyToken }                                                                         = require('../middleware/auth.middleware');

const router = Router();

router.post('/register',         register);
router.post('/login',            login);
router.get('/verificar',         verificarEmail);
router.post('/verificar-codigo', verificarCodigo);
router.post('/reenviar-codigo',  reenviarCodigo);
router.put('/perfil',            verifyToken, updatePerfil);
router.delete('/cuenta',         verifyToken, eliminarCuenta);

module.exports = router;
