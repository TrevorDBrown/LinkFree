/*
*   LinkFreePlus - an open source interpretation of Linktree.
*   (c)2022 Trevor D. Brown. Distributed under MIT License.
*   Original Linkfree source: (c)2019-2021 MichaelBarney. Distributed under Apache License 2.0.
*
*   redirects.js - generates a redirect page!
*/

const cheerio = require('cheerio');
const fs = require('fs');
const { title } = require('process');
var linkfree = require('./linkfree');

const redirectsConfigFilePath = "./src/private/redirects.json";

function searchForRedirect(redirectPath, callback){
    fs.readFile(redirectsConfigFilePath, (error, data) => {
        if (!error){
            var redirectsJSONFull = JSON.parse(data.toString());
            
            redirectJSONEntry = redirectsJSONFull.filter((entry) => {
                return entry.redirectPath == redirectPath;
            });

            if (redirectJSONEntry.length > 0){
                return callback(null, redirectJSONEntry[0]);
            }else{
                var errorMessage = "Error - path " + redirectPath + " not found.";
                return callback(errorMessage, null);
            }

        }else{
            return callback(error, null);
        }
    });
}

var generateRedirect = function generateRedirect(redirectPath, callback){
    searchForRedirect(redirectPath, (error, redirectJSON) => {
        if (!error){
            const $ = cheerio.load('');

            var headTag = $("head");
            var bodyTag = $("body");

            var titleTag = $("<title>");
            titleTag.append(redirectJSON.redirectName);
            headTag.append(titleTag);
        
            var redirectMetaTag = $("<meta>");
            var redirectMetaTagContent = redirectJSON.redirectDelay + "; url='" + redirectJSON.redirectHref + "'";
            
            redirectMetaTag.attr("http-equiv", "Refresh");
            redirectMetaTag.attr("content", redirectMetaTagContent);
        
            headTag.append(redirectMetaTag);
            var redirectTextTag = $("<p>");
        
            if (redirectJSON.redirectText){
                redirectTextTag.append(redirectJSON.redirectText);
                redirectTextTag.append("You will be redirected in " + redirectJSON.redirectDelay + " seconds...");
                bodyTag.append(redirectTextTag);
            }else {
                bodyTag.append("Redirecting...");
            }

            linkfree.generateAnalyticsTags((error, headTags, bodyTags) => {
                if (!error){
                    headTags.forEach(tag => {
                        headTag.append(tag);
                    });
        
                    bodyTags.forEach(tag => {
                        bodyTag.append(tag);
                    });
    
                    callback(null, $.html());
                }else{
                    callback(null, $.html());
                }
            });

        }else{
            return callback(error, null);
        }
    });
};

var areCoreFilesPresent = function areCoreFilesPresent(callback){
    var isRedirectsJSONPresent = false;

    fs.stat(redirectsConfigFilePath, (error, redirectsStats) => {
        if (!error){
            isRedirectsJSONPresent = true;
        }else{
            isRedirectsJSONPresent = false;
        }

        return callback(null, isRedirectsJSONPresent);

    });
};

module.exports.generateRedirect = generateRedirect;
module.exports.areCoreFilesPresent = areCoreFilesPresent;