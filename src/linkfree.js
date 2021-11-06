/*
*   LinkFreePlus - an open source interpretation of Linktree.
*   (c)2021 Trevor D. Brown. Distributed under MIT License.
*   Original Linkfree source: (c)2019-2021 MichaelBarney. Distributed under Apache License 2.0.
*
*   linkfree.js - generates your link page!
*/

const cheerio = require('cheerio');
const fs = require('fs');

var themesConfig = require('./themes.json');
var defaultTheme = themesConfig.defaultTheme;

var linkfreeConfigFilePath = './src/linkfree.json';

function parseLinks(linkfreeConfig, callback){
    sortedLinkList = linkfreeConfig.links.sort((a,b) => {
        var returnValue = 0;

        if (a.linkPosition > b.linkPosition){
            returnValue = 1;
        }
        if (a.linkPosition < b.linkPosition){
            returnValue = -1;
        }

        if (returnValue === 0){
            if (a.linkName > b.linkName){
                returnValue = 1;
            }else{
                returnValue = -1;
            }
        }

        return returnValue;
    });

    callback(null, sortedLinkList);

}

function getTheme(useDefault, linkfreeConfig, callback){

    var requestedTheme;
    var themeSettings;

    if (useDefault){
        themeSettings = defaultTheme;
    }else{
        requestedTheme = linkfreeConfig.theme;
        themeSettings = themesConfig.themes.filter((theme) => {
            return theme.themeName === requestedTheme;
        })[0];
    }

    if (themeSettings && themeSettings.available){
        var styleFilePath = "./src/" + themesConfig.themesDirectory + themeSettings.themeName + "/" + themeSettings.css;

        fs.readFile(styleFilePath, (error, content) => {
            if (!error){
                return callback(null, content.toString());
            }else{
                getTheme(true, linkfreeConfig, (error, content) => {
                    return callback(null, content.toString());
                });
            }
        });
    }else{
        getTheme(true, linkfreeConfig, (error, content) => {
            return callback(null, content.toString());
        });
    }
}


function generatePageContent(linkfreeConfig, links, callback){
    const $ = cheerio.load('');
    var headTag = $("head");
    
    const viewportMetaTag = $("<meta>");
    viewportMetaTag.attr("name", "viewport");
    viewportMetaTag.attr("content", "width=device-width, initial-scale=1");

    const charsetMetaTag = $("<meta>");
    charsetMetaTag.attr("charset", "UTF-8");

    var titleTag = $("<title>");
    titleTag.append(linkfreeConfig.displayName + " | Linkfree");

    getTheme(false, linkfreeConfig, (error, themeCSSContent) => {
        var styleTag = $("<style>");
        
        if (!error){
            styleTag.append(themeCSSContent);
        }

        headTag.append(viewportMetaTag);
        headTag.append(charsetMetaTag);
        headTag.append(titleTag);
        headTag.append(styleTag);

        var bodyTag = $("body");
    
        var linksTrayDivTag = $("<div>");
        linksTrayDivTag.attr("id", "linkfree-link-tray");

        var linksDivTag = $("<div>");
        linksDivTag.attr("id", "links");
    
        links.forEach(link => {
            if (!link.hide){
                var linkTag = $("<a>");
                linkTag.attr("class", "link");
                linkTag.attr("href", link.linkHref);
    
                if (link.newWindow){
                    linkTag.attr("target", "_blank");
                }
    
                linkTag.append(link.linkName);
    
                if (link.inLinkTray){
                    linksTrayDivTag.append(linkTag);
                }else{
                    linksDivTag.append(linkTag);
                }
            }
        });

        if (linkfreeConfig.linkTrayOnTop){
            bodyTag.append(linksTrayDivTag);
            bodyTag.append(linksDivTag);
        }else{
            bodyTag.append(linksDivTag);
            bodyTag.append(linksTrayDivTag);
        }
    
        callback(null, $.html());

    });
}

var generateLinkPage = function generateLinkPage(callback){
    fs.readFile(linkfreeConfigFilePath, (error, linkfreeConfigFileContent) => {
        var linkfreeConfig = JSON.parse(linkfreeConfigFileContent.toString());

        if (!error){
            parseLinks(linkfreeConfig, (error, linkList) => {
                if (!error){
                    generatePageContent(linkfreeConfig, linkList, (error, page) => {
                        if (!error){
                            callback(null, page);
                        }else{
                            callback(error, "An error occurred.");
                        }
                    });
        
                }else{
                    callback(error, "An error occurred.");
                }
            });
        }else{
            callback(error, "An error occurred.");
        }
    });
}

module.exports.generateLinkPage = generateLinkPage;