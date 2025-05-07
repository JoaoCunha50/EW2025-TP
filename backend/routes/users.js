var express = require('express');
var router = express.Router();
var User = require('../controllers/usersController');
var auth = require('../middleware/auth');

/* GET users listing - apenas para admin */
router.get('/', 
  auth.isAuthenticated,
  auth.isAdmin,
  function(req, res, next) {
    User.list()
      .then(data => res.jsonp(data))
      .catch(erro => res.status(500).jsonp(erro));
});

router.post('/', function(req, res, next) {
  console.log(req.body);
  User.createUser(req.body)
    .then(data => res.status(200).jsonp(data))
    .catch(erro => res.status(500).jsonp(erro));
});

router.get('/:email', 
  auth.isAuthenticated, 
  function(req, res, next) {
    User.findByEmail(req.params.email)
      .then(data => {
        if (!data) {
          return res.status(404).jsonp({ message: 'utilizador não encontrado' });
        }
        res.jsonp(data);
      })
      .catch(erro => res.status(500).jsonp(erro));
});

router.delete('/:email', 
  auth.isAuthenticated,
  function(req, res, next) {
    if (req.user.role === 'admin' || req.user.email === req.params.email) {
      User.removeUser(req.params.email)
        .then(data => {
          if (!data) {
            return res.status(404).jsonp({ message: 'utilizador não encontrado' });
          }
          res.jsonp({ message: 'utilizador removido com sucesso' });
        })
        .catch(erro => res.status(500).jsonp(erro));
    } else {
      res.status(403).jsonp({ message: 'Permissão negada' });
    }
});

router.put('/:email', 
  auth.isAuthenticated,
  function(req, res, next) {
    if (req.user.role === 'admin' || req.user.email === req.params.email) {
      User.updateUser(req.params.email, req.body)
        .then(data => {
          if (!data) {
            return res.status(404).jsonp({ message: 'utilizador não encontrado' });
          }
          res.jsonp(data);
        })
        .catch(erro => res.status(500).jsonp(erro));
    } else {
      res.status(403).jsonp({ message: 'Permissão negada' });
    }
});

module.exports = router;