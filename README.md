# ng-bablic

## Translate your Angular (2+) app online.

This module connects your angular app, that was integrated with i18n (AOT) to a Bablic account, which lets you edit and add translations using Bablic's Visual Editor and other translation management tools.


## Installation

Install the cli globally, or use npx

    npm install -g ng-bablic
    ng-bablic
    
Or use npx

    npx ng-bablic
    
## Register new website

Register new website in Bablic (name must be unique) with original language code.

    ng-bablic init <website-name> <original-language>
    
    ng-bablic init mytestwebsite en

## Open Translation Editor

This collects strings from your Angular i18n app, builds your app, and sends to Bablic to generate a translateble preview

    ng-bablic open-editor <website-name>
    
Follow the instructions to open the website

## Get Translation File

After translation was editted in Bablic, and published, use this command to get the translations into a Xliff file that can be used to build your Angular app with.

    ng-bablic create-translation <website-name> <translated-language>
    
    ng-bablic create-translation mytestwebsite es
    
## Generate translateble preview yourself

If Open Editor command is not working properly (usually due to some domain limitations), you can build your own translateable preview app, deploy it to some URL, and use Bablic to edit it.

Use this command to generate the translateable preview bundle.

    ng-bablic create-editor <website-name>
