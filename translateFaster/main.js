var {
    run,
    Item,
    utils,
    ICONS,
    workflow,
    actionHandler
} = require('alfred-workflow-nodejs');

var request = require('request');
var _ = require('underscore');

var language = utils.envVars.get('language');
var languageTo = utils.envVars.get('languageTo');

var icon = {
    yandex: "yandex.png",
    languageTo: `${languageTo}.png`
};

workflow.setName("alfred-workflow-translateFaster");

// TODO: smart search;
// TODO: dnk-alfred-node;
// TODO: underscore -> lodash;
// TODO: add phrase;
// TODO: add lingvo;
// TODO: add ms;
// TODO: add lingv;
// TODO: add ru->en

utils.SUB_ACTION_SEPARATOR = " — ";

var {exec} = require('child_process');

function callback (error, response, body) {
    var {text} = JSON.parse(body);

    text.forEach(function(item, index){
        var item = new Item({
            arg: item,
            icon: icon.yandex,
            title: item,
            valid: true
        });
        workflow.addItem(item);
        workflow.feedback();
    })
}

function yandexTranslate(query, configs) {
    request({
        url: 'https://translate.yandex.net/api/v1.5/tr.json/translate',

        qs: {
            key: utils.envVars.get('yandexApiKey'),
            text: transform(query, configs),
            lang: this.dir
        }
    }, _.throttle(callback, 1000));
}

function capitalize(string) {
    return string && (string.charAt(0).toUpperCase() + string.slice(1));
}

function transform(query, configs = []) {
    if (configs.indexOf("u") !== -1) {
        return query.toUpperCase();
    }
    if (configs.indexOf("l") !== -1) {
        return query.toLowerCase();
    }
    if (configs.indexOf("c") !== -1) {
        return capitalize(query);
    }
    return query;
}

(function main() {

    actionHandler.onAction("yandex", yandexTranslate.bind({dir: `${languageTo}-${language}`}));

    actionHandler.onAction("translate", function(query) {
        var configs = [];
        query = query.replace(/\s*[-](\S+)/g, function(pattern, a) {
            configs.push(a);
            return "";
        });

        if (configs.indexOf("y") !== -1) {
            yandexTranslate.bind({dir: `${language}-${languageTo}`})(query, configs);
            return;
        }

        var filePath = utils.envVars.get(`filePath`);

        exec(`grep -i '${query}' ${filePath}`, function(a, query, c){
            var suggestions = query.split(/\n+/g);

            suggestions.forEach(function(item){
                var query = item.split('.');
                var arg = transform(query[0], configs);
                var title = arg.replace(/[ ]/g, '␣');
                var subtitle = item.replace(/[^.]*./, '');
                var item = new Item({
                    arg: arg,
                    icon: icon.languageTo,
                    valid: true,
                    title: title,
                    subtitle: subtitle,
                    hasSubItems: true,

                    data: {
                        configs: configs,
                        subtitle: subtitle
                    }
                });

                workflow.addItem(item);
            });
            workflow.feedback();
        });
    });

    actionHandler.onMenuItemSelected("translate", function(query, title, {subtitle, configs}) {
        query = query.split(/\s+/);
        title = title.replace(/␣/g, ' ');

        query.forEach(function(item){
            title = title.replace('%', item);
        });

        title = transform(title, configs);

        var item = new Item({
            arg: title,
            valid: true,
            title: title,
            subtitle: subtitle
        });

        workflow.addItem(item);
        workflow.feedback();
    });

    run();
})();
