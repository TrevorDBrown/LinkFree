# LinkFreePlus

A free and open source alternative to LinkTree (and other link service providers)! Based on [Linkfree](https://github.com/michaelbarney/Linkfree) by [Michael Barney](https://github.com/MichaelBarney).

## What is LinkFreePlus?

LinkFreePlus does the same exact thing as LinkFree, but enhances the experience by making LinkFree pages dynamic. This allows you to change your themes on the fly (if you decide to do so).

## What are the benefits?

Just like LinkFree, when compared to other solutions, LinkFreePlus is fully customizable and open source!

- No pesky third party logos.
- Add your custom colors, images and fonts.
- Use full custom analytics and metrics platforms* (see [How to see analytics and other stats?](#how-to-see-analytics-and-other-stats) for more information.)
- Create your own template or use one made by the community!

## How to use?

To utilize LinkFreePlus, do the following:

1. Clone [this repository](https://github.com/TrevorDBrown/LinkFreePlus).
2. Run the following commands:

    ```sh
    cd [Location of cloned repository]
    npm install .
    cd src/
    [Editor of your choice] linkfree.json
    ```

3. Modify the linkfree.json file with your name, a tagline (optional), any links you would like to display, and the theme you would like to use. Refer to themes.json to get the list of compatible themes, the link "themes" (i.e. icons for link, if link is indicated as a "link tray" link.)
4. Configure app.js to use the specific port you would like to use.
5. Set up your web server environment as you desire.
6. Set up your domain name as you desire.
7. Run the following command:

    ```sh
    node .
    ```

8. Enjoy!

## How to see analytics and other stats?

Analytics tools have yet to be integrated into this solution. If you would like to see a particular analytics service be integrated, please file an issue with the "enhancement" tag.

## How to contribute?

There are a few different ways you can contribute. You can make changes to the [core LinkFree project](https://github.com/michaelbarney/Linkfree), make changes to [LinkFreePlus](https://github.com/TrevorDBrown/LinkFreePlus), create new LinkFree templates, suggest/implement new features (via Issues and Pull Requests, respectively) or simply fork and share your own LinkFreePlus!

### Creating Themes

A new theme (referred to as a "template" in LinkFree) is a theme that has a distinctive structure or style when compared to previous templates.

Currently, all themes with a basic style.css structure are compatible with LinkFree and LinkFreePlus. However, support for more advanced themes (i.e. incorporating JavaScript, TypeScript, or other languages) will hopefully come soon.

To submit a new theme, please make a pull request with your theme in the "src/themes" directory.
