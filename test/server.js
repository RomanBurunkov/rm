
const express = require('express');

const app = express();
app.use('/', express.static(__dirname + '/public'));
app.use('/rm', express.static(__dirname + '/../source'));
app.listen(3000, () => console.log('RM test server app listening on port 3000!'));

