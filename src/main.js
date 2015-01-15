var whatAreTheySaying = (function ($, window, chrome) {

    var log = function () {
        try {
            var i;
            for (i = 0; i < arguments.length; i++) {
                console.log(arguments[i]);
            }
        } catch (e) {}
    }

    var flatten = function (arrays) {
        return Array.prototype.concat.apply([], arrays)
    };

    var addResults = function (name, url) {
        $('#linksToComments').append("<li> <a target='_blank' href='" + url + "' >" + name + "</a></li>");
    };

    var clearResults = function () {
        $('#linksToComments').html("");
    };

    var currentUrl = function (findFunction) {
        chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
            var url = tabs[0].url;

            findFunction(url);
        });
    }

    var hackerNewsParser = function (data) {
        log('hackernews', data);

        var buildLink = function (id) {
            return "https://news.ycombinator.com/item?id=" + id
        };

        var posts = data.hits.map(function (hit) {
            return {
                url: buildLink(hit.objectID),
                popularity: hit.points
            }
        });

        log('returning hn', posts);

        return posts;
    };

    var reeditNewsParser = function (result) {
        log('reedit', result);

        var buildLink = function (permLink) {
            return "http://www.reddit.com/" + permLink
        };

        var results = $.isArray(result) ? result : [result];

        var children = flatten(results.reduce(function (acc, curr, ind) {
            acc.push(curr.data.children);
            return acc;
        }, [])).filter(function (e) {
            return e.data["permalink"];
        });

        var posts = children.map(function (e) {
            return {
                url: buildLink(e.data.permalink),
                popularity: e.data.num_comments
            }
        });

        log('returning rd', posts);

        return posts;
    };

    var providers = [
        {name: "Hacker News", searchUrl: "https://hn.algolia.com/api/v1/search?query=", parser: hackerNewsParser},
        {name: "Reedit", searchUrl: "http://www.reddit.com/search.json?q=", parser: reeditNewsParser}
    ];

    var intComparator = function (e1, e2) {
        return e1 - e2
    };

    var find = function (url) {

        log('trying to load');

        var encodedSearchedUrl = window.encodeURIComponent(url);

        clearResults();

        providers.map(function (provider) {
            log('query: ' + provider.searchUrl + encodedSearchedUrl);
            $.getJSON(provider.searchUrl + encodedSearchedUrl, function (data) {
                provider.parser(data).sort(intComparator).forEach(function (post) {
                    log('Post:', post);
                    addResults(provider.name + "(" + post.popularity + ")", post.url);
                });
            });
        });

    }

    return {
        start: function () {
            currentUrl(find);
        }
    };

})(jQuery, window, chrome);


document.addEventListener('DOMContentLoaded', function () {
    whatAreTheySaying.start();
});
