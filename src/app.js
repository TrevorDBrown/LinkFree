/*
*   LinkFreePlus - an open source interpretation of Linktree.
*   (c)2021-2022 Trevor D. Brown. Distributed under MIT License.
*   Original Linkfree source: (c)2019-2021 MichaelBarney. Distributed under Apache License 2.0.
*
*   app.js - application entry point.
*/

const express = require('express');
const app = express();

const linkfree = require('./linkfree');
const redirects = require('./redirects');

app.use('/fa/', express.static(__dirname + "./../node_modules/@fortawesome/fontawesome-free/"));
app.use('/js/', express.static(__dirname + "/js/"));
app.use('/css/', express.static(__dirname + "/css/"));
app.use('/images/', [express.static(__dirname + "/images/"), express.static(__dirname + "/private/images/")]);

// Endpoints
app.get('/', (req, res, next) => {
    linkfree.areCoreFilesPresent((error, isThemesJSONPresent, isLinkfreeJSONPresent, isLinkGroupsJSONPresent, isGlobalCSSFilePresent) => {
        if (isThemesJSONPresent && isLinkfreeJSONPresent && isLinkGroupsJSONPresent && isGlobalCSSFilePresent){
            // All core files are present. Continue processing...
            linkfree.generateLinkPage((error, pageContent) => {          
                if (!error){
                    res.status(200).send(pageContent);
                }else{
                    res.status(500).send(pageContent);
                }
            });
        }else{
            // One or more core files are missing...
            var errorResponse = "<p>Error - missing core files: <br /><br />";

            if (!isThemesJSONPresent){
                errorResponse += "themes.json <br />";
            }

            if (!isLinkfreeJSONPresent){
                errorResponse += "linkfree.json <br />";
            }

            if (!isLinkGroupsJSONPresent){
                errorResponse += "linkgroups.json <br />";
            }

            if (!isGlobalCSSFilePresent){
                errorResponse += "global.css";
            }
            
            errorResponse += "<br />Please contact the site administrator for assistance.</p>";

            res.status(500).send(errorResponse);
        }
    });

});

app.get('/:redirectPath', (req, res, next) => {
    redirects.areCoreFilesPresent((error, isRedirectsJSONPresent) => {
        if (isRedirectsJSONPresent){
            // All core files are present. Continue processing...
            redirects.generateRedirect(req.params.redirectPath, (error, pageContent) => {
                if (!error){
                    res.status(200).send(pageContent);
                }else{
                    res.redirect("/");
                }
            });
        }else{
            // One or more core files are missing...
            var errorResponse = "<p>Error - missing core files: <br /><br />";

            if (!isRedirectsJSONPresent){
                errorResponse += "redirects.json <br />";
            }

            errorResponse += "<br />Please contact the site administrator for assistance.</p>";

            res.status(500).send(errorResponse);
        }
    });
});

// Port for server (defined in environmental variable LF_PORT, or default to port 3000)
const port = process.env.LF_PORT || 3000;

app.listen(port, () => {
    console.log(`Linkfree instance running at: http://localhost:${port}`);
});