/*
*   LinkFreePlus - an open source interpretation of Linktree.
*   (c)2021 Trevor D. Brown. Distributed under MIT License.
*   Original Linkfree source: (c)2019-2021 MichaelBarney. Distributed under Apache License 2.0.
*
*   linkfree.js - generates your link page!
*/

const cheerio = require('cheerio');
const fs = require('fs');

var linkfreeConfigFilePath = './src/linkfree.json';
var themesConfigFilePath = './src/themes.json';

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

function getTheme(useDefault, linkfreeConfig, themesConfig, callback){

    var requestedTheme;
    var themeSettings;

    if (useDefault){
        themeSettings = themesConfig.defaultTheme;;
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
                getTheme(true, linkfreeConfig, themesConfig, (error, content) => {
                    return callback(null, content.toString());
                });
            }
        });
    }else{
        getTheme(true, linkfreeConfig, themesConfig, (error, content) => {
            return callback(null, content.toString());
        });
    }
}

function getLinkTrayLinkClass(linkType, linkThemes, callback){
    var linkClass = linkThemes.filter((linkTheme) => {
        return linkTheme.linkType === linkType;
    })[0];

    if (linkClass){
        callback(null, linkClass.class, null);
    }else{
        linkClass = linkThemes.filter((linkTheme) => {
            return linkTheme.linkType === "web";
        })[0];

        callback(true, null, linkClass.class);
    }
}


function generatePageContent(linkfreeConfig, links, themesConfig, callback){
    const $ = cheerio.load('');
    var headTag = $("head");
    
    const viewportMetaTag = $("<meta>");
    viewportMetaTag.attr("name", "viewport");
    viewportMetaTag.attr("content", "width=device-width, initial-scale=1");

    const charsetMetaTag = $("<meta>");
    charsetMetaTag.attr("charset", "UTF-8");

    var titleTag = $("<title>");
    titleTag.append(linkfreeConfig.displayName + " | Linkfree");

    var faCSSTag = $("<link>");
    faCSSTag.attr("rel", "stylesheet");
    faCSSTag.attr("type", "text/css");
    faCSSTag.attr("href", "./fa/css/all.min.css");

    var faJSTag = $("<script>");
    faJSTag.attr("type", "application/javascript");
    faJSTag.attr("src", "./fa/js/all.min.js");


    getTheme(false, linkfreeConfig, themesConfig, (error, themeCSSContent) => {
        var styleTag = $("<style>");

        var linksTrayDivCSS = `
            #linkfree-profile, #links-tray{
                width: 100%;
                text-align: center;
                display: inline-block;
            }

            #links-tray > .link {
                display: inline-block;
                margin: 5px; 
                text-align: center;
                background-color: transparent;
                border-color: transparent;
                color: #ffffff;
                mix-blend-mode: difference;
                font-size: 50px;
            }

            #links-tray > .link:hover {
                opacity: 0.5;
            }

            #linkfree-profile-picture{
                border-radius: 50%;
                width: 110px;
                height: 110px;
            }
            
            #linkfree-profile-name, #linkfree-profile-tagline{
                color: #ffffff;
                mix-blend-mode: difference;
                font-family: var(--font);
                margin: 5px;
            }

        `;
        
        if (!error){
            styleTag.append(themeCSSContent);
            styleTag.append(linksTrayDivCSS);
        }

        headTag.append(viewportMetaTag);
        headTag.append(charsetMetaTag);
        headTag.append(titleTag);
        headTag.append(styleTag);
        headTag.append(faCSSTag);
        headTag.append(faJSTag);

        var bodyTag = $("body");

        var profileInfoDivTag = $("<div>");
        profileInfoDivTag.attr("id", "linkfree-profile");

        var profilePictureTag = $("<img>");
        profilePictureTag.attr("id", "linkfree-profile-picture");

        var profileNameTag = $("<h1>");
        profileNameTag.attr("id", "linkfree-profile-name");

        var profileTaglineTag = $("<h4>");
        profileTaglineTag.attr("id", "linkfree-profile-tagline");

        if (linkfreeConfig.profilePicture){
            profilePictureTag.attr("src", linkfreeConfig.profilePicture);
            profileInfoDivTag.append(profilePictureTag);
        }

        if (linkfreeConfig.displayName){
            profileNameTag.append(linkfreeConfig.displayName);
            profileInfoDivTag.append(profileNameTag);
        }

        if (linkfreeConfig.tagline){
            profileTaglineTag.append(linkfreeConfig.tagline);
            profileInfoDivTag.append(profileTaglineTag);
        }

        if (linkfreeConfig.profilePicture || linkfreeConfig.displayName || linkfreeConfig.tagline){
            bodyTag.append(profileInfoDivTag);
        }

        var linksTrayDivTag = $("<div>");
        linksTrayDivTag.attr("id", "links-tray");
    
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
    
                if (link.inLinkTray){
                    getLinkTrayLinkClass(link.linkType, themesConfig.linkThemes, (error, linkClass, defaultLinkClass) => {
                        var linkTrayLinkTextTag = $("<i>");

                        if (!error){
                            linkTrayLinkTextTag.addClass(linkClass);
                        }else{
                            linkTrayLinkTextTag.addClass(defaultLinkClass);
                        }

                        linkTag.append(linkTrayLinkTextTag);
                        linksTrayDivTag.append(linkTag);
                    });
                }else{
                    linkTag.append(link.linkName);
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
                    fs.readFile(themesConfigFilePath, (error, themesConfigFileContent) => {
                        if (!error){
                            var themesConfig = JSON.parse(themesConfigFileContent.toString());
                            
                            generatePageContent(linkfreeConfig, linkList, themesConfig, (error, page) => {
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
        }else{
            callback(error, "An error occurred.");
        }
    });
}

module.exports.generateLinkPage = generateLinkPage;