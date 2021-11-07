/*
*   LinkFreePlus - an open source interpretation of Linktree.
*   (c)2021 Trevor D. Brown. Distributed under MIT License.
*   Original Linkfree source: (c)2019-2021 MichaelBarney. Distributed under Apache License 2.0.
*
*   app.js - application entry point.
*/

const express = require('express');
const app = express();

const linkfree = require('./linkfree');

app.use('/fa/', express.static(__dirname + "./../node_modules/@fortawesome/fontawesome-free/"));
app.use('/images/', express.static(__dirname + "/images/"));
app.use('/js/', express.static(__dirname + "/js/"));
app.use('/css/', express.static(__dirname + "/css/"));

// Endpoints
app.get('/', (req, res) => {
    linkfree.generateLinkPage((error, pageContent) => {
        if (!error){
            res.status(200).send(pageContent);
        }else{
            res.status(500).send(pageContent);
        }
    });
});

// Port for server (defined in environmental variable LF_PORT, or default to port 3000)
const port = process.env.LF_PORT || 3000;

app.listen(port, () => {
    console.log(`Linkfree instance running at: http://localhost:${port}`);
});