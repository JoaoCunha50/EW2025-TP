const express = require('express');
const router = express.Router();
const User = require('../../controllers/usersController');
const { generateToken } = require('./token');

router.post('/login', async (req, res) => {
  try {
    const user = await User.findByEmail(req.body.email);
    if (!user) {
      return res.status(404).json({ error: 'Email ou password inválidos' });
    }

    const isValid = await user.comparePassword(req.body.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Email ou password inválidos' });
    }

    const token = generateToken(user);
    console.log(`Utilizador autenticado: ${user.email}`);
    res.status(200).json({
      token,
      email: user.email,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao autenticar utilizador', error: error.message });
  }
});

module.exports = router;
