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
      .then(data => res.jsonp(data.filter(user => user.role !== 'admin')))
      .catch(erro => res.status(500).jsonp(erro));
});

router.post('/', function(req, res, next) {
  User.createUser(req.body)
    .then(data => res.status(200).jsonp(data))
    .catch(erro => {console.error(erro); res.status(500).jsonp(erro)});
});

router.get('/:email', 
  auth.isAuthenticated,
  auth.isAdmin, 
  function(req, res, next) {
    User.findByEmail(req.params.email)
      .then(data => {
        if (!data) {
          console.error('utilizador não encontrado');
          return res.status(404).jsonp({ message: 'utilizador não encontrado' });
        }
        res.jsonp(data);
      })
      .catch(erro =>{ console.error(erro); res.status(500).jsonp(erro)});
});

router.delete('/:email', 
  auth.isAuthenticated,
  auth.isAdmin,
  function(req, res, next) {
      User.removeUser(req.params.email)
        .then(data => {
          if (!data) {
            return res.status(404).jsonp({ message: 'utilizador não encontrado' });
          }
          res.status(200).jsonp({ message: 'utilizador removido com sucesso' });
        })
        .catch(erro => {res.status(500).jsonp(erro); console.error(erro);});
    });

router.put('/:email', 
  auth.isAuthenticated,
  auth.isAdmin,
  function(req, res, next) {
      User.updateUser(req.body.email, req.body)
        .then(data => {
          if (!data) {
            return res.status(404).jsonp({ message: 'utilizador não encontrado' });
          }
          res.status(201).jsonp(data);
        })
        .catch(erro => {res.status(500).jsonp(erro); console.error(erro);});
  });

module.exports = router;