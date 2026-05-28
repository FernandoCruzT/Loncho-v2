const { Router }                       = require('express');
const { register, login, updatePerfil } = require('../controllers/auth.controller');
const { verifyToken }                   = require('../middleware/auth.middleware');

const router = Router();

router.post('/register', register);
router.post('/login',    login);
router.put('/perfil',    verifyToken, updatePerfil);

module.exports = router;
