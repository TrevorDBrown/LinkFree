/*
*   LinkFreePlus - an open source interpretation of Linktree.
*   (c)2021-2022 Trevor D. Brown. Distributed under MIT License.
*   Original Linkfree source: (c)2019-2021 MichaelBarney. Distributed under Apache License 2.0.
*
*   linkfree.js - generates your link page!
*/

const cheerio = require('cheerio');
const fs = require('fs');

var themesConfigFilePath = './src/config/themes.json';
var linkFreeConfigFilePath = './src/private/linkfree.json';
var analyticsConfigFilePath = './src/private/analytics.json';

function getLinkGroupDivID (linkGroup){
    var linkGroupDivID = ""

    if (linkGroup.linkGroupName == "Tray"){
        linkGroupDivID = "links-tray"
    }else{
        linkGroupDivID = "linkgroup-" + linkGroup.linkGroupName.replace(/ /g, '-').toLowerCase();
    }

    return linkGroupDivID;
}

function getLinkIconClass(linkType, linkThemes, callback){
    var linkClass = linkThemes.find((linkTheme) => {
        return linkTheme.linkType === linkType;
    });

    if (linkClass){
        return callback(null, linkClass.class, null);
    }else{
        linkClass = linkThemes.find((linkTheme) => {
            return linkTheme.linkType === "web";
        });

        return callback(true, null, linkClass.class);
    }
}

function getLinkInstance(link, linkGroup){
    return link.linkGroups.find((linkInstanceGroup) => {
        return linkInstanceGroup.linkGroupName === linkGroup.linkGroupName;
    });
}

function generateSpecialGroups(callback){
    var specialGroups = []

    // TODO: consider putting these into another JSON file? 
    var linkTrayLinkGroup = {
        "linkGroupName": "Tray",
        "showLinkGroupName": false,
        "useLinkIcons": true,
        "linkGroupPosition": 0,
        "linkGroupEnabled": true
    };

    var unsortedLinkGroup = {
        "linkGroupName": "Unsorted",
        "showLinkGroupName": false,
        "useLinkIcons": false,
        "linkGroupPosition": 0,
        "linkGroupEnabled": true
    };

    specialGroups.push(unsortedLinkGroup);
    specialGroups.push(linkTrayLinkGroup);

    return callback(null, specialGroups);
}

function parseLinkGroups(linkFreeConfig, callback){

    generateSpecialGroups((error, specialGroups) => {
        var sortedGroupsList = linkFreeConfig.linkGroups.sort((a,b) => {
            var returnValue = 0;
    
            if (a.linkGroupPosition > b.linkGroupPosition){
                returnValue = 1;
            }
            if (a.linkGroupPosition < b.linkGroupPosition){
                returnValue = -1;
            }
    
            if (returnValue === 0){
                if (a.linkGroupName > b.linkGroupName){
                    returnValue = 1;
                }else{
                    returnValue = -1;
                }
            }

            return returnValue;
        });
        
        if (linkFreeConfig.linkGroupsAboveUnsorted){
            sortedGroupsList.push(specialGroups.find(specialGroup => {
                return specialGroup.linkGroupName === "Unsorted";
            }));
        }else{
            sortedGroupsList.unshift(specialGroups.find(specialGroup => {
                return specialGroup.linkGroupName === "Unsorted";
            }));
        }

        if (linkFreeConfig.linkTrayOnTop){
            sortedGroupsList.unshift(specialGroups.find(specialGroup => {
                return specialGroup.linkGroupName === "Tray";
            }));
        }else{
            sortedGroupsList.push(specialGroups.find(specialGroup => {
                return specialGroup.linkGroupName === "Tray";
            }));
        }

        return callback(null, sortedGroupsList);
    });

}

function parseLinks(linkList, linkGroup, callback){

    sortedLinkList = linkList.sort((a,b) => {
        var linkAInstance = getLinkInstance(a, linkGroup);
        var linkBInstance = getLinkInstance(b, linkGroup);

        var returnValue = 0;

        if (linkAInstance.linkPosition > linkBInstance.linkPosition){
            returnValue = 1;
        }
        if (linkAInstance.linkPosition < linkBInstance.linkPosition){
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

    return callback(null, sortedLinkList);

}

function displayLinkTextOrIcon(linkFreeConfig, linkGroup, callback){
    linkGroupConfig = linkFreeConfig.linkGroups.find((linkGroupInstance) => {
        return linkGroupInstance.linkGroupName === linkGroup.linkGroupName;
    });

    return callback(null, linkGroupConfig.useLinkIcons)
}

function getLinkListForGroup(linkFreeConfig, linkGroup, callback){
    linksForGroup = linkFreeConfig.links.filter((link) => {
        return link.linkGroups.find(linkGroupInstance => {
            return linkGroupInstance.linkGroupName === linkGroup.linkGroupName;
        });
    });

    parseLinks(linksForGroup, linkGroup, (error, sortedLinkList) => {
        if (!error){
            return callback(null, sortedLinkList)
        }else{
            return callback(error, null);
        }
    });
}

function generateLinks(linkFreeConfig, themesConfig, linkGroups, $, callback){

    // Sort the links by their groups.
    linkGroups.forEach(linkGroup => {
        // Find all links in the config associated with this group.
        getLinkListForGroup(linkFreeConfig, linkGroup, (error, linkList) => {
            var linkGroupDivID = "#" + getLinkGroupDivID(linkGroup); // Results in: linkgroup-group-name (or links-tray)

            var linkGroupDiv = $(linkGroupDivID);

            if (!error){
                linkList.forEach(link => {

                    if (link.enabled){
                        // Prepare the base link
                        var linkTag = $("<a>");
                        linkTag.attr("href", link.linkHref);
            
                        if (link.newWindow){
                            linkTag.attr("target", "_blank");
                        }

                        linkTag.attr("class", "link");

                        linkGroupInstance = link.linkGroups.find((linkGroupInstance) => {
                            return linkGroupInstance.linkGroupName === linkGroup.linkGroupName;
                        });
            
                        if (linkGroupInstance.show){
                            var linkTagInstance = linkTag.clone();
        
                            displayLinkTextOrIcon(linkFreeConfig, linkGroup, (error, displayAsIcon) => {
                                if (displayAsIcon){
                                    linkTagInstance.addClass("link-icon");
                                    
                                    getLinkIconClass(link.linkType, themesConfig.linkThemes, (error, linkClass, defaultLinkClass) => {
                                        var linkTrayLinkTextTag = $("<i>");
                
                                        if (!error){
                                            linkTrayLinkTextTag.addClass(linkClass);
                                        }else{
                                            linkTrayLinkTextTag.addClass(defaultLinkClass);
                                        }
                
                                        linkTagInstance.append(linkTrayLinkTextTag);
                                        linkGroupDiv.append(linkTagInstance);
                                    });        
                                }else{
                                    linkTagInstance.append(link.linkName);
                                    linkGroupDiv.append(linkTagInstance);
                                }
                            });
                        }
                        
                    }
                });
            }else{
                console.log(error);
            }
        });
    });

    return callback(null, $);
}

function getTheme(useDefault, linkFreeConfig, themesConfig, callback){

    var requestedTheme;
    var themeSettings;

    if (useDefault){
        themeSettings = themesConfig.defaultTheme;;
    }else{
        requestedTheme = linkFreeConfig.theme;
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
                getTheme(true, linkFreeConfig, themesConfig, (error, content) => {
                    return callback(null, content.toString());
                });
            }
        });
    }else{
        getTheme(true, linkFreeConfig, themesConfig, (error, content) => {
            return callback(null, content.toString());
        });
    }
}

function generatePageContent(linkFreeConfig, linkGroups, themesConfig, callback){
    const $ = cheerio.load('');
    var headTag = $("head");
    
    const viewportMetaTag = $("<meta>");
    viewportMetaTag.attr("name", "viewport");
    viewportMetaTag.attr("content", "width=device-width, initial-scale=1");

    const charsetMetaTag = $("<meta>");
    charsetMetaTag.attr("charset", "UTF-8");

    var titleTag = $("<title>");
    titleTag.append(linkFreeConfig.displayName + " | LinkFree");

    var faCSSTag = $("<link>");
    faCSSTag.attr("rel", "stylesheet");
    faCSSTag.attr("type", "text/css");
    faCSSTag.attr("href", "./fa/css/all.min.css");

    var faJSTag = $("<script>");
    faJSTag.attr("type", "application/javascript");
    faJSTag.attr("src", "./fa/js/all.min.js");
    
    getTheme(false, linkFreeConfig, themesConfig, (error, themeCSSContent) => {
        var styleTag = $("<style>");

        var linksTrayDivCSS = `
            #linkfree-profile, #links-tray {
                width: 100%;
                text-align: center;
                display: inline-block;
            }

            #links-tray > .link, .link-icon {
                display: inline-block;
                margin: 5px; 
                text-align: center;
                background-color: transparent;
                border-color: transparent;
                color: #ffffff;
                mix-blend-mode: difference;
                font-size: 50px;
            }

            #links-tray > .link:hover, .link.link-icon:hover {
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

        // Metadata
        headTag.append(viewportMetaTag);
        headTag.append(charsetMetaTag);
        headTag.append(titleTag);

        // Theme Data
        headTag.append(styleTag);
        
        // Font Awesome
        headTag.append(faCSSTag);
        headTag.append(faJSTag);
        
        // Begin preparing body content.
        var bodyTag = $("body");

        // Profile Information
        var profileInfoDivTag = $("<div>");
        profileInfoDivTag.attr("id", "linkfree-profile");

        var profilePictureTag = $("<img>");
        profilePictureTag.attr("id", "linkfree-profile-picture");

        var profileNameTag = $("<h1>");
        profileNameTag.attr("id", "linkfree-profile-name");

        var profileTaglineTag = $("<h4>");
        profileTaglineTag.attr("id", "linkfree-profile-tagline");

        // Profile Picture
        if (linkFreeConfig.profilePicture){
            profilePictureTag.attr("src", linkFreeConfig.profilePicture);
            profileInfoDivTag.append(profilePictureTag);
        }

        // Display Name
        if (linkFreeConfig.displayName){
            profileNameTag.append(linkFreeConfig.displayName);
            profileInfoDivTag.append(profileNameTag);
        }

        // Tagline/Description
        if (linkFreeConfig.tagline){
            profileTaglineTag.append(linkFreeConfig.tagline);
            profileInfoDivTag.append(profileTaglineTag);
        }

        // Append Profile Information to Body
        if (linkFreeConfig.profilePicture || linkFreeConfig.displayName || linkFreeConfig.tagline){
            bodyTag.append(profileInfoDivTag);
        }

        var linksTrayDiv = $("<div>");
        linksTrayDiv.attr("id", "links-tray");

        var linksDiv = $("<div>");
        linksDiv.attr("id", "links");

        // Add the link groups to the page...
        linkGroups.forEach(linkGroup => {
            var newLinkGroup = $("<div>");
            var newLinkGroupID = "";

            if (linkGroup.linkGroupName != "Tray"){
                newLinkGroupID = getLinkGroupDivID(linkGroup);   // Results in: linkgroup-group-name
                newLinkGroup.attr("id", newLinkGroupID);
                newLinkGroup.addClass("link-group");

                if (linkGroup.showLinkGroupName){
                    var newLinkGroupNameTextTag = $("<span>");
                    newLinkGroupNameTextTag.addClass("linkgroup-title");

                    newLinkGroupNameTextTag.append(linkGroup.linkGroupName);
                    newLinkGroup.append(newLinkGroupNameTextTag);
                }

                linksDiv.append(newLinkGroup);
            }

        });

        if (linkFreeConfig.linkTrayOnTop){
            bodyTag.append(linksTrayDiv);
            bodyTag.append(linksDiv);
        }else{
            bodyTag.append(linksDiv);
            bodyTag.append(linksTrayDiv);
        }

        generateLinks(linkFreeConfig, themesConfig, linkGroups, $, (error, $) => {
            generateAnalyticsTags((error, headTags, bodyTags) => {
                if (!error){
                    headTags.forEach(tag => {
                        headTag.append(tag);
                    });
        
                    bodyTags.forEach(tag => {
                        bodyTag.append(tag);
                    });
    
                    return callback(null, $.html());
                }else{
                    return callback(null, $.html());
                }
            });
        });
    });
}

var generateLinkPage = function generateLinkPage(callback){
    fs.readFile(linkFreeConfigFilePath, (error, linkFreeConfigFileContent) => {
        var linkFreeConfig = JSON.parse(linkFreeConfigFileContent.toString());

        if (!error){
            parseLinkGroups(linkFreeConfig, (error, linkGroupList) => {

                if (!error){
                    fs.readFile(themesConfigFilePath, (error, themesConfigFileContent) => {
                        
                        if (!error){
                            var themesConfig = JSON.parse(themesConfigFileContent.toString());
                            
                            generatePageContent(linkFreeConfig, linkGroupList, themesConfig, (error, page) => {
                                if (!error){
                                    return callback(null, page);
                                }else{
                                    return callback(error, "An error occurred.");
                                }
                            });

                        }else{
                            return callback(error, "An error occurred.");
                        }
                    });
                }else{
                    return callback(error, "An error occurred.");
                }
            });
        }else{
            return callback(error, "An error occurred.");
        }
    });
}

var areCoreFilesPresent = function areCoreFilesPresent(callback){
    var isThemesJSONPresent = false;
    var isLinkFreeJSONPresent = false;

    fs.stat(themesConfigFilePath, (error, themesStats) => {
        if (!error){
            isThemesJSONPresent = true;
        }else{
            isThemesJSONPresent = false;
        }

        fs.stat(linkFreeConfigFilePath, (error, linkfreeStats) => {
            if (!error){
                isLinkFreeJSONPresent = true;
            }else{
                isLinkFreeJSONPresent = false;
            }

            return callback(null, isThemesJSONPresent, isLinkFreeJSONPresent);
        });
    });

}

function generateAnalyticsTags(callback){
    var headTags = []
    var bodyTags = []
    const $ = cheerio.load('');

    fs.stat(analyticsConfigFilePath, (error, stats) => {
        if (!error){
            fs.readFile(analyticsConfigFilePath, (error, analyticsConfigFileContent) => {
                if (!error){
                    analyticsConfigFileContent = JSON.parse(analyticsConfigFileContent.toString());
                    if (analyticsConfigFileContent.tags){
                        analyticsConfigFileContent.tags.forEach(tag => {
                            var tagType = "<" + tag.tagType + ">";
                            var newTag = $(tagType);

                            tag.attributes.forEach(attribute => {
                                newTag.attr(attribute.attributeName, attribute.attributeValue);
                            });

                            newTag.append(tag.tagContent);

                            if (tag.parentTag == "head"){
                                headTags.push(newTag);
                            }
                            else if (tag.parentTag == "body"){
                                bodyTags.push(newTag);
                            }
                        });

                        return callback(null, headTags, bodyTags);

                    }else{
                        return callback(null, headTags, bodyTags)
                    }
                }else{
                    return callback(error, headTags, bodyTags);
                }
            });
        }else{
            return callback(error, headTags, bodyTags);
        }
    });
}

module.exports.generateLinkPage = generateLinkPage;
module.exports.areCoreFilesPresent = areCoreFilesPresent;
module.exports.generateAnalyticsTags = generateAnalyticsTags;