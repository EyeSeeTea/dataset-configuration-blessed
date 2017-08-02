/*

    Groups tabs dynamically in dhis-web-dataentry on form load. You usually use this content
    script as a custom Javascript in the <Custom JS/CSS> app.

    Requirements:
        - Dataset sections must have hierarchical names: "SECTION@THEME@GROUP".

    Actions:
        - Sections are grouped into a single tab.
        - Themes without a section are grouped as collapsible elements.
        - Groups within a theme are grouped.
*/

(function() {

var _ = window._.noConflict();

_.mixin({
    transpose: function(list) {
        return _.zip.apply(_, list);
    },

    inGroupsOf: function(source, n) {
        var dest = [];
        while(source.length) {
          dest.push(source.splice(0, n))
        }
        return dest;
    },

    cartesianProduct: function(args) {
        return _.reduce(args, function(a, b) {
            return _.flatten(_.map(a, function(x) {
                return _.map(b, function(y) { return x.concat([y]); });
            }), true);
        }, [[]]);
    },

    groupConsecutiveBy: function(xs, mapper) {
        mapper = mapper || _.identity;
        var reducer = (acc, x) => {
            if (_.isEmpty(acc)) {
                return acc.concat([[x]]);
            } else {
                var last = _.last(acc);
                if (_.isEqual(mapper(_.last(last)), mapper(x))) {
                    last.push(x);
                    return acc;
                } else {
                    return acc.concat([[x]]);
                }
            }
        };
        return _(xs).reduce(reducer, []);
    },
});

var loadCss = function(url) {
    $("<link/>", {
        rel: "stylesheet",
        type: "text/css",
        href: url,
    }).appendTo(document.head);
};

var loadJs = function(url, cb) {
    $.getScript(url, cb);
};

var emptyField = "__undefined";

var separator = "@";

var getTag = function(el, name) {
    var idx = {section: 0, theme: 1, group: 2}[name];
    return $(el).text().split(separator)[idx] || emptyField;
};

var getTabContents = function(tab) {
    return $("#" + $(tab).attr("aria-controls"));
};

var getThemeHeader = function(title, target) {
    return (
        $("<div/>").addClass("panel-heading").attr({"data-target": "#" + target, "data-toggle": "collapse"}).append(
            $("<h5/>").addClass("panel-title accordion-toggle").append(
                $("<a/>").addClass("nrc-panel-title").text(title)
            )
        )
    );
};

var processGroupedTab = function(tabsByTheme, sectionName) {
    var groupedContents =
        $("<ul/>").addClass("list-unstyled").append(
            _.map(tabsByTheme, (tabsByGroup, themeName) => {
                var hasThemeHeader = _.size(tabsByTheme) > 1;
                var themeNameTitle = themeName !== emptyField ? themeName : "Default";
                var subsectionKey = (sectionName + "-" + themeName).replace(/ /g, "");

                return $("<li/>").addClass("panel panel-default").append(
                    hasThemeHeader ? getThemeHeader(themeNameTitle, subsectionKey) : $("<span/>"),
                    $("<div/>").attr("id", subsectionKey).addClass("panel-collapse collapse in").append(
                        _.map(tabsByGroup, (elementsInGroup, groupName) => {
                            var showGroupTitle = _.size(tabsByGroup) > 1 && groupName !== emptyField;

                            return $("<div/>").append(
                                showGroupTitle ? $("<h4/>").text(groupName) : $("<span/>"),
                                $("<div/>").append(_.map(elementsInGroup, (tab) => {
                                    return getTabContents(tab).html();
                                }))
                            );
                        })
                    )
                );
            })
        );

    var tabs = _($("#tabs li").toArray())
        .select(el => $(el).text().split(separator)[0] === sectionName);
    var mainTab = $(tabs[0]);

    getTabContents(mainTab).html(groupedContents);
    mainTab.find("a").text(sectionName);
    $(tabs.slice(1)).remove();
};

var getGroupedTabs = function() {
    return _.chain($("#tabs li").toArray())
        .groupBy(el => getTag(el, "section"))
        .map((elementInSection, sectionName) => {
            var tabsByTheme = _.chain(elementInSection)
                .groupBy(el => getTag(el, "theme"))
                .map((elementsInTheme, themeName) => {
                    var tabsByGroup = _.groupBy(elementsInTheme, el => getTag(el, "group"));
                    return [themeName, tabsByGroup];
                })
                .object()
                .value();
            return [sectionName, tabsByTheme];
        })
        .object()
        .value();
};

var groupSubsections = function() {
    _.each(getGroupedTabs(), processGroupedTab);
};

var hideGreyedColumns = function() {
    $(".sectionTable").not(".floatThead-table").get().map($).forEach(table => {
        var nColumns = table.find("tbody tr:nth-child(1) td input").size();
        var tdInputs = table.find("tbody tr td input").get();
        var rows = _.chain(tdInputs).inGroupsOf(nColumns).value();
        var columns = _.transpose(rows);
        var disabledColumnIndexes = _.chain(columns)
            .map((inputs, idx) => _.all(inputs, input => input.disabled) ? idx : null)
            .reject(x => x === null)
            .value();

        var categoryOptionsList = _(table.find("thead tr"))
            .map(tr => _.uniq(_.map($(tr).find("th"), th => $(th).text().trim())))
        var allProducts =_.cartesianProduct(categoryOptionsList);
        var products = _.chain(_.range(allProducts.length))
            .difference(disabledColumnIndexes).map(idx => allProducts[idx]).value();
        var categoryRows = _(_.range(categoryOptionsList.length)).map(categoryIndex => {
            var groups = _(products).groupConsecutiveBy(xs => xs[categoryIndex]);
            return _.map(groups, group => {
                var label = group[0][categoryIndex];
                var colspan = group.length;
                return $("<th />").attr({colspan: colspan, scope: "col"})
                    .append($("<span />", {align: "center"}).text(label))
            });
        });

        // Replace headers
        categoryRows.forEach((row, rowIndex) => {
            var tr = table.find("thead tr:nth-child(" + (rowIndex + 1) + ")");
            tr.find("th").remove()
            tr.append(row);
        });

        // Hide disabled columns for values (it's an inplace operation, take indexes in reverse order)
        _.chain(disabledColumnIndexes).reverse().each(disabledColumnIndex => {
            // Offset nth-child by 1 (css counts start at 1) and 1 (skip dataElement name) = 2
            var selector = "tbody tr td:nth-child(" + (disabledColumnIndex + 2) + ")";
            table.find(selector).hide();
        });
    })
};

var applyChangesToForm = function() {
    groupSubsections();
    hideGreyedColumns();
};

var init = function() {
    var contentDiv = $("#contentDiv");
    var isDataEntryPage = window.dhis2 && window.dhis2.de &&
        window.dhis2.de.updateIndicators && contentDiv.length > 0;
    console.log("CustomJS debug: ", contentDiv.length, !!isDataEntryPage);

    if (isDataEntryPage) {
        console.log("CustomJS: isDataEntryPage");
        
        $(document).on( "dhis2.de.event.formLoaded", applyChangesToForm);
        loadJs("../dhis-web-commons/bootstrap/js/bootstrap.min.js");
        loadCss("../dhis-web-commons/bootstrap/css/bootstrap.min.css");
    }
};

var safeInit = function() {
    try {
        console.log("CustomJS: init");
        return init();
    } catch(err) {
        console.error("CustomJS error: ", err);
    }
}

$(safeInit);

})();