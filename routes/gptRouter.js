const router = require('express').Router();
const gptCtrl = require('../controllers/gptCtrl');

router.post('/completions', gptCtrl.completions);

module.exports = router;
